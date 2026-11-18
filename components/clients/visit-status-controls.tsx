"use client";

import { useState, useTransition } from "react";
import { VisitStatus } from "@prisma/client";
import { updateVisitStatusAction } from "./actions";
import { texts } from "@/lib/texts";

export default function VisitStatusControls({
  visitRequestId,
  status,
}: {
  visitRequestId: string;
  status: VisitStatus;
}) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const labels = texts.dashboard.visits;

  function update(nextStatus: VisitStatus) {
    if (
      nextStatus === VisitStatus.CANCELLED &&
      !window.confirm(labels.cancelConfirmation)
    ) {
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("status", nextStatus);
    formData.set("scheduledAt", scheduledAt);
    startTransition(async () => {
      const result = await updateVisitStatusAction(visitRequestId, formData);
      if ("error" in result) setError(result.error ?? labels.error);
    });
  }

  if (status === VisitStatus.CANCELLED) return null;

  return (
    <div className="flex flex-col items-start gap-2">
      {status === VisitStatus.REQUESTED && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-slate-700">
            {labels.scheduledAt}
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="mt-1 block rounded-md border border-slate-300 p-2 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
            />
          </label>
          <button
            type="button"
            disabled={isPending}
            onClick={() => update(VisitStatus.SCHEDULED)}
            className="rounded-md bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
          >
            {labels.schedule}
          </button>
        </div>
      )}
      {status === VisitStatus.SCHEDULED && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => update(VisitStatus.COMPLETED)}
          className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {labels.complete}
        </button>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() => update(VisitStatus.CANCELLED)}
        className="rounded-md border border-red-300 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
      >
        {labels.cancel}
      </button>
      {error && <p role="alert" className="text-xs text-red-800">{error}</p>}
    </div>
  );
}
