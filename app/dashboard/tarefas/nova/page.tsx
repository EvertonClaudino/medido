import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Role } from "@prisma/client";
import { createTaskAction } from "@/app/dashboard/actions";
import { redirect } from "next/navigation";

export default async function NovaTarefaPage() {
  const user = await requireRole([Role.OWNER, Role.FOREMAN]);
  const isOwner = user.role === Role.OWNER;

  // Carregar utilizadores e obras elegíveis consoante o perfil
  let assignableUsers: { id: string; name: string; role: Role }[] = [];
  let availableProjects: { id: string; name: string; code: string | null }[] = [];

  if (isOwner) {
    // OWNER pode atribuir a qualquer FOREMAN ou WORKER ativo da empresa
    assignableUsers = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        status: "ACTIVE",
        role: { in: [Role.FOREMAN, Role.WORKER] },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });

    // OWNER pode associar a qualquer obra da empresa (ou nenhuma)
    availableProjects = await prisma.project.findMany({
      where: { companyId: user.companyId, status: "ACTIVE" },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
  } else {
    // FOREMAN:
    // 1. Obras onde é encarregado responsável (isLead: true)
    availableProjects = await prisma.project.findMany({
      where: {
        companyId: user.companyId,
        status: "ACTIVE",
        assignments: {
          some: {
            userId: user.id,
            isLead: true,
          },
        },
      },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });

    const leadProjectIds = availableProjects.map((p) => p.id);

    // 2. Apenas WORKER ativos atribuídos a essas obras
    if (leadProjectIds.length > 0) {
      assignableUsers = await prisma.user.findMany({
        where: {
          companyId: user.companyId,
          status: "ACTIVE",
          role: Role.WORKER,
          assignments: {
            some: {
              projectId: { in: leadProjectIds },
            },
          },
        },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      });
    }
  }

  async function handleCreate(formData: FormData) {
    "use server";
    const res = await createTaskAction(formData);
    if (res?.success) {
      redirect("/dashboard/tarefas");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Criar Nova Tarefa
          </h1>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            {isOwner
              ? "Defina uma tarefa para encarregados ou funcionários (visitas técnicas, verificações, etc.)."
              : "Atribua uma tarefa aos trabalhadores das suas obras sob responsabilidade."}
          </p>
        </div>
        <Link
          href="/dashboard/tarefas"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          Cancelar
        </Link>
      </div>

      <form
        action={handleCreate}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Título da Tarefa *
          </label>
          <input
            name="title"
            type="text"
            required
            placeholder="Ex.: Visita técnica preliminar, verificação de cimento"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Descrição / Instruções Detalhadas
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Descreva o que deve ser inspecionado ou realizado..."
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Atribuir a *
            </label>
            <select
              name="assignedToId"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="" disabled>
                Selecione um colaborador...
              </option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === "FOREMAN" ? "Encarregado" : "Funcionário"})
                </option>
              ))}
            </select>
            {assignableUsers.length === 0 && (
              <p className="mt-1 text-[11px] text-red-500">
                Não existem colaboradores elegíveis disponíveis.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Obra Associada {isOwner ? "(Opcional)" : "*"}
            </label>
            <select
              name="projectId"
              required={!isOwner}
              defaultValue=""
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">
                {isOwner ? "Sem obra (Geral / Pré-obra)" : "Selecione a obra..."}
              </option>
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Data e Hora Limite (Opcional - Fuso Europe/Lisbon)
          </label>
          <input
            name="dueDate"
            type="datetime-local"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:text-white"
          />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Deixe em branco caso a tarefa não tenha uma data limite estrita.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/dashboard/tarefas"
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={assignableUsers.length === 0}
            className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition"
          >
            Criar Tarefa
          </button>
        </div>
      </form>
    </div>
  );
}

