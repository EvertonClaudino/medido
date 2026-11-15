import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { inviteUserAction, toggleUserStatusAction } from "../actions";
import { PlusCircleIcon } from "@/components/icons";

export default async function EquipaPage() {
  const user = await requireRole([Role.OWNER]);

  const team = await prisma.user.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  async function handleInvite(formData: FormData) {
    "use server";
    await inviteUserAction(formData);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gestão da Equipa & Acessos
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Adicione encarregados e colaboradores operacionais à sua empresa.
        </p>
      </div>

      {/* Formulário de Novo Membro */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">
          Convidar Novo Utilizador
        </h2>
        <form action={handleInvite} className="grid gap-3 sm:grid-cols-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-slate-700">
              Nome Completo *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ex.: Rui Oliveira"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-700">
              Email *
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="rui@empresa.pt"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-700">
              Perfil de Acesso *
            </label>
            <select
              name="role"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-amber-500 focus:outline-hidden bg-white"
            >
              <option value="WORKER">Funcionário (Tarefas de campo)</option>
              <option value="FOREMAN">Encarregado (Gestão de obra)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Convidar
            </button>
          </div>
        </form>
      </div>

      {/* Lista da Equipa */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">
            Colaboradores ({team.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {team.map((member) => {
            async function handleToggle() {
              "use server";
              await toggleUserStatusAction(member.id, member.status);
            }

            return (
              <div
                key={member.id}
                className="flex items-center justify-between px-6 py-4 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{member.name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    {member.email}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      member.role === "OWNER"
                        ? "bg-purple-100 text-purple-800"
                        : member.role === "FOREMAN"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {member.role === "OWNER"
                      ? "Dono"
                      : member.role === "FOREMAN"
                      ? "Encarregado"
                      : "Funcionário"}
                  </span>

                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      member.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {member.status === "ACTIVE" ? "Ativo" : "Inativo"}
                  </span>

                  {member.role !== "OWNER" && (
                    <form action={handleToggle}>
                      <button
                        type="submit"
                        className="text-[11px] font-semibold text-slate-600 hover:text-red-700 underline"
                      >
                        {member.status === "ACTIVE" ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
