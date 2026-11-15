import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircleIcon } from "@/components/icons";

export default async function OsMeusRegistosPage() {
  const user = await requireUser();

  const logs = await prisma.workLog.findMany({
    where: { authorId: user.id },
    orderBy: { workDate: "desc" },
    include: {
      project: true,
      reviewedBy: true,
      measurements: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Os Meus Registos de Trabalho
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Histórico e estado de validação dos seus apontamentos diários e medições.
          </p>
        </div>

        <Link
          href="/dashboard/novo-registo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-500"
        >
          <PlusCircleIcon className="h-4 w-4" />
          Novo Registo
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Ainda não submeteu nenhum registo de trabalho.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col p-4 sm:px-6 text-xs gap-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {log.project.name}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-slate-500">
                      {new Date(log.workDate).toLocaleDateString("pt-PT")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {log.hours ? (
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {Number(log.hours)}h
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Só medições</span>
                    )}

                    <span
                      className={`rounded px-2.5 py-1 text-[10px] font-bold ${
                        log.status === "VALIDATED"
                          ? "bg-emerald-100 text-emerald-800"
                          : log.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
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
                  <p className="text-slate-600">{log.description}</p>
                )}

                {/* Medições associadas */}
                {log.measurements.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {log.measurements.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] text-amber-900 font-medium"
                      >
                        {m.description}: {Number(m.quantity)} {m.unit}
                      </span>
                    ))}
                  </div>
                )}

                {log.rejectionReason && (
                  <div className="rounded-lg bg-red-50 p-2.5 text-red-800 text-[11px] border border-red-200 mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <strong>Motivo de rejeição:</strong> {log.rejectionReason}
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        const { resubmitWorkLogAction } = await import("@/app/dashboard/actions");
                        await resubmitWorkLogAction(log.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-sm bg-red-700 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-red-800 shadow-xs"
                      >
                        Reenviar para Validação
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
