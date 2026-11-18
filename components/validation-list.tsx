"use client";

import { useState } from "react";
import { CheckCircleIcon, XCircleIcon } from "@/components/icons";

interface Measurement {
  id: string;
  description: string;
  quantity: number | string;
  unit: string;
}

interface LogItem {
  id: string;
  workDate: string;
  hours: number | string | null;
  description: string | null;
  status: "PENDING" | "VALIDATED" | "REJECTED";
  rejectionReason: string | null;
  author: { id: string; name: string };
  project: { id: string; name: string };
  measurements: Measurement[];
}

export function ValidationList({
  logs,
  onReviewAction,
}: {
  logs: LogItem[];
  onReviewAction: (
    logId: string,
    status: "VALIDATED" | "REJECTED",
    rejectionReason?: string
  ) => Promise<{ error?: string; success?: boolean } | void>;
}) {
  const [rejectingLogId, setRejectingLogId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleApprove(logId: string) {
    setErrorMsg(null);
    setSubmittingId(logId);
    const res = await onReviewAction(logId, "VALIDATED");
    setSubmittingId(null);
    if (res && "error" in res && res.error) {
      setErrorMsg(res.error);
    }
  }

  async function handleReject(logId: string) {
    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMsg("O motivo de rejeição tem de ter pelo menos 3 caracteres.");
      return;
    }
    setErrorMsg(null);
    setSubmittingId(logId);
    const res = await onReviewAction(logId, "REJECTED", reason.trim());
    setSubmittingId(null);
    if (res && "error" in res && res.error) {
      setErrorMsg(res.error);
    } else {
      setRejectingLogId(null);
      setReason("");
    }
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Não existem registos de trabalho submetidos para as suas obras.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60">
          {errorMsg}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
        {logs.map((log) => (
          <div key={log.id} className="p-4 sm:p-5 text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900 text-sm dark:text-white">
                  {log.author.name}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {log.project.name}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {new Date(log.workDate).toLocaleDateString("pt-PT")}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {log.hours ? (
                  <span className="font-mono font-bold text-sm text-slate-900 bg-amber-50 border border-amber-200 rounded-sm px-2 py-0.5 dark:text-white dark:bg-amber-950/40 dark:border-amber-900/60">
                    {Number(log.hours)}h
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Sem horas</span>
                )}

                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    log.status === "VALIDATED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : log.status === "REJECTED"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  }`}
                >
                  {log.status === "VALIDATED"
                    ? "Validado"
                    : log.status === "REJECTED"
                    ? "Rejeitado"
                    : "Pendente"}
                </span>
              </div>
            </div>

            {log.description && (
              <p className="text-slate-600 bg-slate-50 rounded-lg p-2.5 dark:text-slate-400 dark:bg-slate-800/50">
                {log.description}
              </p>
            )}

            {/* Medições do registo */}
            {log.measurements.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Medições associadas ({log.measurements.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {log.measurements.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                      <span className="text-slate-700 font-medium truncate mr-2 dark:text-slate-300">
                        {m.description}
                      </span>
                      <span className="font-mono font-bold text-amber-900 whitespace-nowrap bg-amber-50 px-1.5 py-0.5 rounded-sm text-[11px] dark:text-amber-300 dark:bg-amber-950/40">
                        {Number(m.quantity)} {m.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {log.rejectionReason && (
              <div className="rounded-lg bg-red-50 p-2 text-red-800 text-[11px] border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60">
                <strong>Motivo de rejeição:</strong> {log.rejectionReason}
              </div>
            )}

            {/* Ações de validação se PENDING */}
            {log.status === "PENDING" && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2 dark:border-slate-800">
                {rejectingLogId === log.id ? (
                  <div className="w-full space-y-2 rounded-xl bg-red-50/50 p-3 border border-red-100 dark:bg-red-950/40 dark:border-red-900/60">
                    <label className="block text-[11px] font-bold text-red-900 dark:text-red-300">
                      Motivo obrigatório de rejeição:
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ex.: Quantidades não correspondem ao medido em obra"
                      className="w-full rounded-lg border border-red-300 p-2 text-xs text-slate-900 bg-white focus:outline-hidden dark:border-red-900/60 dark:text-white dark:bg-slate-900"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingLogId(null);
                          setReason("");
                        }}
                        className="rounded-sm px-2.5 py-1 text-slate-600 hover:bg-slate-200 dark:text-slate-400"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={submittingId === log.id}
                        onClick={() => handleReject(log.id)}
                        className="rounded-sm bg-red-600 px-3 py-1 font-bold text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        Confirmar Rejeição
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={submittingId === log.id}
                      onClick={() => handleApprove(log.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-500 active:scale-95 transition disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Validar
                    </button>
                    <button
                      type="button"
                      disabled={submittingId === log.id}
                      onClick={() => {
                        setRejectingLogId(log.id);
                        setReason("");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-bold text-red-700 hover:bg-red-100 active:scale-95 transition disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Rejeitar...
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

