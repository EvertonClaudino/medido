import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export default async function AsMinhasObrasPage() {
  const user = await requireRole([Role.FOREMAN]);

  const assignments = await prisma.projectAssignment.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      project: {
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          clientName: true,
          assignments: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const projects = assignments.map((a) => a.project);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          As Minhas Obras
        </h1>
        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
          Empreitadas onde está atribuído como Encarregado de Obra responsável.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Não tem obras atribuídas de momento. Fale com a direção da empresa.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p) => {
            const workers = p.assignments.filter((a) => a.user.role === "WORKER");

            return (
              <div
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{p.name}</h2>
                    {p.code && (
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {p.code}
                      </span>
                    )}
                  </div>
                  <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Ativa
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 dark:text-slate-400">
                  <div>
                    <span className="font-medium text-slate-400">Morada:</span>{" "}
                    {p.address || "Localização a definir"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-400">Cliente:</span>{" "}
                    {p.clientName || "Não especificado"}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-800 mb-2 dark:text-slate-100">
                    Equipa de Campo Alocada ({workers.length})
                  </div>
                  {workers.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Nenhum trabalhador associado ainda a esta obra.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {workers.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between text-xs rounded-sm bg-slate-50 p-2 dark:bg-slate-800/50"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {w.user.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono dark:text-slate-400">
                            {w.user.email}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

