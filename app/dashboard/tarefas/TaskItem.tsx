"use client";

import { useTransition } from "react";
import { updateTaskStatusAction } from "@/app/dashboard/actions";

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    dueDate: Date | string | null;
    project: { id: string; name: string; code: string | null } | null;
    assignedTo: { id: string; name: string; role: string };
    createdBy: { id: string; name: string };
  };
  currentUserId: string;
  isOwner: boolean;
}

export function TaskItem({ task, currentUserId, isOwner }: TaskItemProps) {
  const [isPending, startTransition] = useTransition();

  const isAssignee = task.assignedTo.id === currentUserId;
  const canToggle = (isAssignee || isOwner) && task.status !== "CANCELLED";
  const canCancel = isOwner && task.status === "PENDING";

  const formattedDueDate = task.dueDate
    ? new Intl.DateTimeFormat("pt-PT", {
        timeZone: "Europe/Lisbon",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(task.dueDate))
    : null;

  function handleToggleStatus() {
    if (!canToggle) return;
    const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    startTransition(async () => {
      await updateTaskStatusAction(task.id, nextStatus);
    });
  }

  function handleCancel() {
    if (!canCancel) return;
    if (!confirm("Tem a certeza de que pretende cancelar esta tarefa?")) return;
    startTransition(async () => {
      await updateTaskStatusAction(task.id, "CANCELLED");
    });
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
        task.status === "COMPLETED"
          ? "bg-slate-50 border-slate-200 opacity-75"
          : task.status === "CANCELLED"
          ? "bg-slate-50 border-slate-200 opacity-60 line-through"
          : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {canToggle ? (
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={isPending}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
              task.status === "COMPLETED"
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "border-slate-300 hover:border-amber-600 bg-white"
            } ${isPending ? "opacity-50 cursor-wait" : ""}`}
            aria-label={
              task.status === "COMPLETED"
                ? "Marcar como pendente"
                : "Marcar como concluída"
            }
          >
            {task.status === "COMPLETED" && (
              <svg
                className="h-3.5 w-3.5 stroke-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        ) : (
          <div
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
              task.status === "COMPLETED"
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "border-slate-300 bg-slate-100"
            }`}
          >
            {task.status === "COMPLETED" && (
              <svg
                className="h-3.5 w-3.5 stroke-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`text-sm font-semibold text-slate-900 ${
                task.status === "COMPLETED" ? "line-through text-slate-500" : ""
              }`}
            >
              {task.title}
            </h4>

            {task.project && (
              <span className="inline-flex items-center rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                {task.project.name}
              </span>
            )}

            {task.status === "CANCELLED" && (
              <span className="inline-flex items-center rounded-sm bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                Cancelada
              </span>
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-slate-600 whitespace-pre-wrap">
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            {isOwner && (
              <span>
                Atribuído a:{" "}
                <strong className="font-semibold text-slate-700">
                  {task.assignedTo.name}
                </strong>
              </span>
            )}
            <span>
              Criado por:{" "}
              <span className="text-slate-600">{task.createdBy.name}</span>
            </span>
            {formattedDueDate && (
              <span className="inline-flex items-center gap-1">
                <span>Prazo:</span>
                <strong className="font-medium text-slate-700">
                  {formattedDueDate}
                </strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {canCancel && (
        <div className="flex items-center self-end sm:self-center">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-sm border border-slate-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
