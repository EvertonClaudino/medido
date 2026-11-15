import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export default async function TodosRegistosPage() {
  const user = await requireRole([Role.OWNER]);

  const logs = await prisma.workLog.findMany({
    where: { companyId: user.companyId },
    orderBy: { workDate: "desc" },
    include: {
      author: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
      measurements: true,
    },
  });

  // Calcular totais separados por unidade (NUNCA somar unidades diferentes)
  const totalHours = logs.reduce(
    (acc, log) => acc + (log.hours ? Number(log.hours) : 0),
    0
  );

  const unitTotals: Record<string, number> = {
    M: 0,
    M2: 0,
    M3: 0,
    UN: 0,
    KG: 0,
  };

  logs.forEach((log) => {
    log.measurements.forEach((m) => {
      if (unitTotals[m.unit] !== undefined) {
        unitTotals[m.unit] += Number(m.quantity);
      }
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Registos de Trabalho & Medições
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Visão consolidada de todas as horas e medições registadas em todas as
          obras da empresa.
        </p>
      </div>

      {/* Cartões de Totais Segregados por Unidade */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Horas
          </span>
          <div className="mt-1 font-mono text-xl font-black text-slate-900">
            {totalHours.toFixed(1)}h
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Metros lineares (M)
          </span>
          <div className="mt-1 font-mono text-xl font-black text-amber-700">
            {unitTotals.M.toFixed(2)} m
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Área (M²)
          </span>
          <div className="mt-1 font-mono text-xl font-black text-amber-700">
            {unitTotals.M2.toFixed(2)} m²
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Volume (M³)
          </span>
          <div className="mt-1 font-mono text-xl font-black text-amber-700">
            {unitTotals.M3.toFixed(2)} m³
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Unidades (UN)
          </span>
          <div className="mt-1 font-mono text-xl font-black text-amber-700">
            {unitTotals.UN.toFixed(0)} un
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Peso (KG)
          </span>
          <div className="mt-1 font-mono text-xl font-black text-amber-700">
            {unitTotals.KG.toFixed(1)} kg
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Ainda não existem registos de trabalho submetidos na empresa.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Colaborador</th>
                  <th className="px-5 py-3">Obra</th>
                  <th className="px-5 py-3">Horas</th>
                  <th className="px-5 py-3">Medições Realizadas</th>
                  <th className="px-5 py-3">Descrição dos Trabalhos</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Revisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 align-top">
                    <td className="px-5 py-3 font-medium text-slate-700 whitespace-nowrap">
                      {new Date(log.workDate).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {log.author.name}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {log.project.name}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {log.hours ? `${Number(log.hours)}h` : "-"}
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      {log.measurements.length === 0 ? (
                        <span className="text-slate-400 text-[11px]">-</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {log.measurements.map((m) => (
                            <span
                              key={m.id}
                              className="inline-block rounded-sm bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] text-amber-900"
                            >
                              <strong>{m.description}:</strong>{" "}
                              {Number(m.quantity)} {m.unit}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 max-w-xs">
                      {log.description || "-"}
                      {log.rejectionReason && (
                        <div className="mt-1 text-[10px] text-red-700 bg-red-50 p-1 rounded-sm">
                          Rejeitado: {log.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
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
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {log.reviewedBy ? log.reviewedBy.name : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
