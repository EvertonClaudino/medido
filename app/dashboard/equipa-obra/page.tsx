import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export default async function EquipaObraPage() {
  const user = await requireRole([Role.FOREMAN]);

  // Buscar as obras do encarregado e os membros alocados
  const assignments = await prisma.projectAssignment.findMany({
    where: { userId: user.id },
    include: {
      project: {
        include: {
          assignments: {
            include: {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Equipa das Obras (Leitura)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Colaboradores operacionais associados às frentes de trabalho sob a sua
          coordenação.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          Sem obras atribuídas.
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900">
                Obra: {a.project.name}
              </h2>
              <div className="divide-y divide-slate-100">
                {a.project.assignments.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {member.user.name}
                      </span>
                      <span className="ml-2 font-mono text-[11px] text-slate-500">
                        {member.user.email}
                      </span>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        member.user.role === "FOREMAN"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {member.user.role === "FOREMAN"
                        ? "Encarregado"
                        : "Funcionário"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

