"use client";

import { useState, useTransition } from "react";
import { BudgetStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { updateBudgetStatusAction } from "./actions";
import { texts } from "@/lib/texts";
import BudgetApprovalDialog, {
  type BudgetApprovalClientData,
  type BudgetApprovalItemData,
} from "./BudgetApprovalDialog";

interface BudgetStatusControlProps {
  budgetId: string;
  currentStatus: BudgetStatus;
  projectName?: string;
  workAddress?: string;
  notes?: string | null;
  client?: BudgetApprovalClientData;
  items?: BudgetApprovalItemData[];
  revisionNumber?: number;
  updatedAtIso?: string;
}

export default function BudgetStatusControl({
  budgetId,
  currentStatus,
  projectName = "",
  workAddress = "",
  notes = null,
  client = { id: "", name: "" },
  items = [],
  revisionNumber = 0,
  updatedAtIso = new Date().toISOString(),
}: BudgetStatusControlProps) {
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const labels = texts.dashboard.budgets;
  const statuses = Object.values(BudgetStatus);

  function handleStatusSelect(nextStatus: BudgetStatus) {
    if (nextStatus === currentStatus) return;

    if (nextStatus === BudgetStatus.APPROVED) {
      // Abrir o diálogo de pré-visualização e confirmação (sem window.confirm)
      setStatus(BudgetStatus.APPROVED);
      setShowApprovalDialog(true);
      return;
    }

    setStatus(nextStatus);
  }

  function save() {
    if (status === currentStatus) return;

    if (status === BudgetStatus.APPROVED) {
      // Disparar o diálogo de pré-visualização em vez de salvar diretamente
      setShowApprovalDialog(true);
      return;
    }

    if (
      status === BudgetStatus.CANCELLED &&
      !window.confirm(labels.cancelConfirmation)
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateBudgetStatusAction(budgetId, status);
      if ("error" in result) {
        setError(result.error ?? labels.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {labels.status}
          <select
            value={status}
            onChange={(event) => {
              const nextStatus = statuses.find((value) => value === event.target.value);
              if (nextStatus) handleStatusSelect(nextStatus);
            }}
            className="mt-1 block rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          >
            {statuses.map((value) => (
              <option key={value} value={value}>{labels.statuses[value]}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={save}
          disabled={isPending || status === currentStatus}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:opacity-50"
        >
          {isPending ? labels.updating : labels.updateStatus}
        </button>

        {currentStatus !== BudgetStatus.APPROVED && (
          <button
            type="button"
            onClick={() => {
              setStatus(BudgetStatus.APPROVED);
              setShowApprovalDialog(true);
            }}
            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 shadow-2xs transition"
          >
            Aprovar Orçamento
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-red-800 dark:text-red-400">{error}</p>}

      {/* Diálogo de Pré-visualização e Aprovação */}
      <BudgetApprovalDialog
        open={showApprovalDialog}
        onOpenChange={(open) => {
          setShowApprovalDialog(open);
          if (!open && status === BudgetStatus.APPROVED && currentStatus !== BudgetStatus.APPROVED) {
            setStatus(currentStatus);
          }
        }}
        budgetId={budgetId}
        projectName={projectName}
        workAddress={workAddress}
        notes={notes}
        client={client}
        items={items}
        revisionNumber={revisionNumber}
        updatedAtIso={updatedAtIso}
        onSuccess={() => {
          router.push("/dashboard/obras");
          router.refresh();
        }}
      />
    </div>
  );
}
