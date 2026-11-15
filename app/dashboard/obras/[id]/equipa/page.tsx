import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assignUserToProjectAction, removeUserFromProjectAction } from "@/app/dashboard/actions";

export default async function EquipaObraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole([Role.OWNER]);

  const project = await prisma.project.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, status: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) {
    redirect("/dashboard/obras");
  }

  // Utilizadores da empresa não atribuídos a esta obra
  const assignedIds = project.assignments.map((a) => a.userId);
  const availableUsers = await prisma.user.findMany({
    where: {
      companyId: user.companyId,
      status: "ACTIVE",
      role: { not: Role.OWNER },
      id: { notIn: assignedIds },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });

  async function handleAssign(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const isLead = formData.get("isLead") === "true";
    await assignUserToProjectAction(id, userId, isLead);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/obras"
          className="text-xs text-slate-500 hover:text-slate-900 underline"
        >
          ← Voltar a Obras
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Equipa da Obra
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Obra:{" "}
          <span className="font-semibold">{project.name}</span>
          {project.code && (
            <span className="ml-2 font-mono text-slate-400">
              {project.code}
            </span>
          )}
        </p>
      </div>

      {/* Adicionar membro */}
      {availableUsers.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-bold text-slate-900">
            Adicionar à Equipa
          </h2>
          <form action={handleAssign} className="flex flex-wrap gap-3 text-xs">
            <select
              name="userId"
              required
              className="flex-1 rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden"
            >
              <option value="">Selecione um colaborador…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} —{" "}
                  {u.role === "FOREMAN" ? "Encarregado" : "Funcionário"}
                </option>
              ))}
            </select>
            <select
              name="isLead"
              className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden"
            >
              <option value="false">Colaborador</option>
              <option value="true">Encarregado Responsável</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-4 py-2.5 font-semibold text-white hover:bg-amber-500"
            >
              Adicionar
            </button>
          </form>
        </div>
      )}

      {/* Lista de membros */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">
            Membros Atribuídos ({project.assignments.length})
          </h2>
        </div>

        {project.assignments.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-500">
            Nenhum colaborador atribuído a esta obra.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {project.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between px-6 py-4 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {assignment.user.name}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {assignment.user.email}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {assignment.isLead ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Responsável
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      Colaborador
                    </span>
                  )}

                  <form
                    action={async () => {
                      "use server";
                      await removeUserFromProjectAction(id, assignment.userId);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-[11px] font-semibold text-slate-500 hover:text-red-700 underline"
                    >
                      Remover
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
