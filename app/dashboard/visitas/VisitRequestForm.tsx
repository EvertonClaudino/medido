"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVisitRequestAction } from "./actions";
import { texts } from "@/lib/texts";

interface ClientOption {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
}

export default function VisitRequestForm({ clients }: { clients: ClientOption[] }) {
  const [clientId, setClientId] = useState("");
  const [requestedAddress, setRequestedAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createVisitRequestAction(formData);
      if ("error" in result) {
        setError(result.error ?? texts.dashboard.visits.error);
        return;
      }
      formRef.current?.reset();
      setClientId("");
      setRequestedAddress("");
      router.refresh();
    });
  }

  const selectedClient = clients.find((client) => client.id === clientId);

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <h2 className="text-sm font-bold text-slate-900">{texts.dashboard.visits.newVisit}</h2>
      <div>
        <label htmlFor="clientId" className="block text-xs font-semibold text-slate-700">
          {texts.dashboard.visits.client}
        </label>
        <select
          id="clientId"
          name="clientId"
          value={clientId}
          onChange={(event) => {
            const nextId = event.target.value;
            setClientId(nextId);
            setRequestedAddress(clients.find((client) => client.id === nextId)?.address ?? "");
          }}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          <option value="">{texts.dashboard.visits.newClient}</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedClient && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={texts.dashboard.visits.clientName} name="clientName" required />
          <Field label={texts.dashboard.visits.clientPhone} name="clientPhone" type="tel" required />
          <div className="sm:col-span-2">
            <Field label={texts.dashboard.visits.clientAddress} name="clientAddress" required />
          </div>
        </div>
      )}

      <Field
        label={texts.dashboard.visits.siteAddress}
        name="requestedAddress"
        value={requestedAddress}
        onChange={setRequestedAddress}
        required
      />
      <div>
        <label htmlFor="visit-notes" className="block text-xs font-semibold text-slate-700">
          {texts.dashboard.visits.notes}
        </label>
        <textarea
          id="visit-notes"
          name="notes"
          rows={3}
          maxLength={2000}
          className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        />
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:opacity-60"
      >
        {isPending ? texts.dashboard.visits.saving : texts.dashboard.visits.create}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        maxLength={300}
        className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
      />
    </div>
  );
}
