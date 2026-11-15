import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TasksView } from "./TasksView";
import { PlusCircleIcon } from "@/components/icons";

export default async function TarefasPage() {
  const user = await requireUser();
  const isOwner = user.role === "OWNER";

  // Obter tarefas de acordo com a política de acesso:
  // OWNER vê todas as da empresa; FOREMAN e WORKER veem apenas as atribuídas a si.
  const tasks = await prisma.task.findMany({
    where: {
      companyId: user.companyId,
      ...(isOwner ? {} : { assignedToId: user.id }),
    },
    orderBy: [
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      dueDate: true,
      createdAt: true,
      project: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const canCreate = user.role === "OWNER" || user.role === "FOREMAN";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isOwner ? "Tarefas da Empresa" : "As Minhas Tarefas"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isOwner
              ? "Atribua e acompanhe tarefas, visitas técnicas e diligências em curso."
              : "Consulte e assinale a conclusão das suas tarefas atribuídas."}
          </p>
        </div>

        {canCreate && (
          <Link
            href="/dashboard/tarefas/nova"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-500 transition"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Nova Tarefa
          </Link>
        )}
      </div>

      {/* Conteúdo: Calendário Mensal e Lista Agrupada */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800">
            Sem tarefas registadas
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {canCreate
              ? "Crie uma nova tarefa para a equipa (ex.: visita técnica, entrega de materiais)."
              : "Não tem tarefas atribuídas de momento."}
          </p>
          {canCreate && (
            <Link
              href="/dashboard/tarefas/nova"
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Criar Tarefa
            </Link>
          )}
        </div>
      ) : (
        <TasksView
          tasks={tasks}
          currentUserId={user.id}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}
