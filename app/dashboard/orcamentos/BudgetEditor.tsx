"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBudgetAction, updateBudgetAction } from "./actions";
import { calculateBudgetTotals, formatBudgetAmount, type BudgetLineInput } from "@/lib/budget-utils";
import { texts } from "@/lib/texts";

export interface BudgetFormLine {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
}

interface BudgetEditorProps {
  mode: "create" | "edit";
  visitRequestId?: string;
  budgetId?: string;
  initialProjectName: string;
  initialWorkAddress: string;
  initialNotes: string;
  initialItems?: BudgetFormLine[];
}

const emptyLine: BudgetFormLine = {
  description: "",
  quantity: "1",
  unit: "un",
  unitPrice: "",
  vatRate: "",
};

export default function BudgetEditor(props: BudgetEditorProps) {
  const [lines, setLines] = useState<BudgetFormLine[]>(props.initialItems?.length ? props.initialItems : [{ ...emptyLine }]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const labels = texts.dashboard.budgets;

  const totals = useMemo(() => {
    if (lines.some((line) => (
      !line.description.trim() ||
      !line.quantity ||
      !line.unit.trim() ||
      line.unitPrice === "" ||
      line.vatRate === "" ||
      !Number.isFinite(Number(line.quantity)) ||
      !Number.isFinite(Number(line.unitPrice)) ||
      !Number.isFinite(Number(line.vatRate)) ||
      Number(line.quantity) <= 0 ||
      Number(line.unitPrice) < 0 ||
      Number(line.vatRate) < 0 ||
      Number(line.vatRate) > 100
    ))) {
      return null;
    }

    const items: BudgetLineInput[] = lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unit: line.unit,
      unitPrice: Number(line.unitPrice),
      vatRate: Number(line.vatRate),
    }));
    return calculateBudgetTotals(items);
  }, [lines]);

  function updateLine(index: number, field: keyof BudgetFormLine, value: string) {
    setLines((current) => current.map((line, lineIndex) =>
      lineIndex === index ? { ...line, [field]: value } : line
    ));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set("itemCount", String(lines.length));
    startTransition(async () => {
      const result = props.mode === "create" && props.visitRequestId
        ? await createBudgetAction(props.visitRequestId, formData)
        : props.mode === "edit" && props.budgetId
          ? await updateBudgetAction(props.budgetId, formData)
          : { error: labels.missingId };

      if ("error" in result) {
        setError(result.error ?? labels.error);
        return;
      }
      if ("budgetId" in result) {
        router.push(`/dashboard/orcamentos/${result.budgetId}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:grid-cols-2">
        <Field
          label={labels.projectName}
          name="projectName"
          defaultValue={props.initialProjectName}
          required
        />
        <Field
          label={labels.workAddress}
          name="workAddress"
          defaultValue={props.initialWorkAddress}
          required
        />
        <div className="sm:col-span-2">
          <label htmlFor="budget-notes" className="block text-xs font-semibold text-slate-700">
            {labels.notes}
          </label>
          <textarea
            id="budget-notes"
            name="notes"
            rows={3}
            maxLength={2000}
            defaultValue={props.initialNotes}
            className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          />
        </div>
      </div>

      <section aria-labelledby="budget-lines-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="budget-lines-heading" className="text-base font-bold text-slate-900">{labels.lines}</h2>
          <button
            type="button"
            onClick={() => setLines((current) => [...current, { ...emptyLine }])}
            disabled={lines.length >= 100}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:opacity-50"
          >
            {labels.addLine}
          </button>
        </div>

        {lines.map((line, index) => (
          <fieldset key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-6">
            <legend className="px-1 text-xs font-semibold text-slate-600">{labels.line(index + 1)}</legend>
            <div className="sm:col-span-2 lg:col-span-2">
              <label htmlFor={`line-${index}-description`} className="block text-xs font-semibold text-slate-700">
                {labels.itemDescription}
              </label>
              <input
                id={`line-${index}-description`}
                name={`item-${index}-description`}
                value={line.description}
                onChange={(event) => updateLine(index, "description", event.target.value)}
                maxLength={200}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
              />
            </div>
            <NumberField
              label={labels.quantity}
              name={`item-${index}-quantity`}
              value={line.quantity}
              onChange={(value) => updateLine(index, "quantity", value)}
              min="0.001"
              step="0.001"
            />
            <div>
              <label htmlFor={`line-${index}-unit`} className="block text-xs font-semibold text-slate-700">
                {labels.unit}
              </label>
              <input
                id={`line-${index}-unit`}
                name={`item-${index}-unit`}
                value={line.unit}
                onChange={(event) => updateLine(index, "unit", event.target.value)}
                maxLength={20}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
              />
            </div>
            <NumberField
              label={labels.unitPrice}
              name={`item-${index}-unitPrice`}
              value={line.unitPrice}
              onChange={(value) => updateLine(index, "unitPrice", value)}
              min="0"
              step="0.01"
            />
            <NumberField
              label={labels.vatRate}
              name={`item-${index}-vatRate`}
              value={line.vatRate}
              onChange={(value) => updateLine(index, "vatRate", value)}
              min="0"
              max="100"
              step="0.01"
            />
            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}
                className="justify-self-start text-xs font-semibold text-red-800 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 sm:col-span-2 lg:col-span-6"
              >
                {labels.removeLine}
              </button>
            )}
          </fieldset>
        ))}
      </section>

      {totals && (
        <div className="ml-auto grid max-w-sm gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <Total label={labels.net} cents={totals.netCents} />
          <Total label={labels.vat} cents={totals.vatCents} />
          <Total label={labels.gross} cents={totals.grossCents} emphasized />
        </div>
      )}

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:opacity-60"
        >
          {isPending ? labels.saving : props.mode === "edit" ? labels.saveChanges : labels.save}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          {labels.cancel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold text-slate-700">{label}</label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        maxLength={300}
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
      />
    </div>
  );
}

function NumberField({
  label,
  name,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  min: string;
  max?: string;
  step: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold text-slate-700">{label}</label>
      <input
        id={name}
        name={name}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        min={min}
        max={max}
        step={step}
        required
        className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
      />
    </div>
  );
}

function Total({
  label,
  cents,
  emphasized = false,
}: {
  label: string;
  cents: number;
  emphasized?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${emphasized ? "border-t border-slate-200 pt-2 font-bold text-slate-900" : "text-slate-600"}`}>
      <span>{label}</span>
      <span>{formatBudgetAmount(cents)}</span>
    </div>
  );
}
