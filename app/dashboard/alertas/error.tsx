"use client";

import { texts } from "@/lib/texts";

export default function AlertasError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-white p-8 text-center dark:border-red-900/60 dark:bg-slate-900">
      <h1 className="text-lg font-bold text-red-900 dark:text-red-300">{texts.dashboard.alerts.errorTitle}</h1>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
      >
        {texts.dashboard.alerts.retry}
      </button>
    </div>
  );
}
