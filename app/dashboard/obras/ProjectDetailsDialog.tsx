"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Building2,
  MapPin,
  HardHat,
  Users,
  CheckCircle2,
  ClockAlert,
  Edit,
  ExternalLink,
  ListTodo,
  AlertTriangle,
  PlayCircle,
} from "lucide-react";
import type { ProjectItemData } from "./ObrasView";

interface ProjectDetailsDialogProps {
  project: ProjectItemData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectDetailsDialog({
  project,
  open,
  onOpenChange,
}: ProjectDetailsDialogProps) {
  if (!project) return null;

  const hasForeman = project.foremen.length > 0;
  const clientName = project.client?.name || project.clientName || "Não especificado";

  let statusBadge = "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]";
  let statusLabel = "Em Curso";
  let progressBarColor = "bg-[#2563EB]";
  let StatusIcon = PlayCircle;

  if (project.isDelayed) {
    statusBadge = "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
    statusLabel = "Em Atraso";
    progressBarColor = "bg-[#DC2626]";
    StatusIcon = ClockAlert;
  } else if (project.status === "COMPLETED" || project.status === "ARCHIVED") {
    statusBadge = "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]";
    statusLabel = project.status === "COMPLETED" ? "Concluída" : "Arquivada";
    progressBarColor = "bg-[#16A34A]";
    StatusIcon = project.status === "COMPLETED" ? CheckCircle2 : Building2;
  }

  const hasTasks = project.totalTasksCount > 0;
  const tasksProgressLabel = hasTasks
    ? `Tarefas concluídas ${project.completedTasksCount} de ${project.totalTasksCount}`
    : "Sem tarefas";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden sm:max-w-3xl">
        {/* Cabeçalho Fixo do Modal — Botão X sempre visível */}
        <div className="p-4 sm:p-6 pb-4 border-b border-slate-100 bg-white shrink-0 pr-12 dark:border-slate-800 dark:bg-slate-900">
          <DialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {project.code && (
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded dark:text-blue-300 dark:bg-blue-950/40">
                        {project.code}
                      </span>
                    )}
                    {project.serviceType && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {project.serviceType}
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 mt-1 dark:text-white">
                    {project.name}
                  </DialogTitle>
                </div>
              </div>

              {/* Estado com Ícone + Texto */}
              <div className="flex items-center gap-2 mt-1 sm:mt-0">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusBadge}`}
                >
                  <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{statusLabel}</span>
                </span>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Corpo com Scroll Suave */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs focus:outline-none">
          {/* Alerta de Atraso se aplicável */}
          {project.isDelayed && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 font-semibold dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <ClockAlert className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>Esta obra ultrapassou a data limite prevista de conclusão.</span>
            </div>
          )}

          {/* Grelha de Métricas Principais (4 Blocos) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Orçamento */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Orçamento Previsto
              </span>
              <span className="font-mono text-sm font-black text-slate-900 block truncate dark:text-white">
                {project.budget !== null && project.budget !== undefined
                  ? new Intl.NumberFormat("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    }).format(project.budget)
                  : "Não definido"}
              </span>
            </div>

            {/* Progresso de Tarefas: rótulo Tarefas concluídas X de Y / Sem tarefas */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <span
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 truncate dark:text-slate-400"
                title={tasksProgressLabel}
              >
                {tasksProgressLabel}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {hasTasks || project.status === "COMPLETED"
                    ? `${project.progressPercentage}%`
                    : "0%"}
                </span>
                {hasTasks && (
                  <span className="text-[10px] text-slate-400">
                    ({project.completedTasksCount}/{project.totalTasksCount})
                  </span>
                )}
              </div>
            </div>

            {/* Prazo */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Data Limite
              </span>
              <span
                className={`text-xs font-bold block truncate ${
                  project.isDelayed ? "text-rose-600 dark:text-rose-400" : project.endDate ? "text-slate-800 dark:text-slate-100" : "text-slate-400 font-normal"
                }`}
              >
                {project.endDate
                  ? new Intl.DateTimeFormat("pt-PT", {
                      timeZone: "Europe/Lisbon",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(project.endDate))
                  : "Sem prazo"}
              </span>
            </div>

            {/* Registos Diários */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Apontamentos Diários
              </span>
              <span className="text-sm font-black text-slate-900 block truncate dark:text-white">
                {project.workLogsCount} registos
              </span>
            </div>
          </div>

          {/* Barra de Progresso Real */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {hasTasks ? "Execução das Tarefas da Obra" : "Execução da Obra (sem tarefas associadas)"}
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{project.progressPercentage}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                style={{ width: `${project.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Secção Bipartida: Localização / Cliente e Equipa da Obra */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Informações Comerciais e Localização */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>Estaleiro & Cliente</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Localização do Estaleiro:</span>
                  <span className="font-semibold text-slate-800 block dark:text-slate-100">
                    {project.address || "Localização não especificada"}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Cliente Dono de Obra:</span>
                  <span className="font-bold text-slate-900 text-sm block dark:text-white">{clientName}</span>
                  {project.client?.nif && (
                    <span className="text-[11px] text-slate-500 block dark:text-slate-400">NIF: {project.client.nif}</span>
                  )}
                  {project.client?.address && (
                    <span className="text-[11px] text-slate-500 block dark:text-slate-400">Sede: {project.client.address}</span>
                  )}
                </div>

                {(project.startDate || project.endDate) && (
                  <div className="border-t border-slate-100 pt-2 flex items-center gap-4 text-[11px] dark:border-slate-800">
                    {project.startDate && (
                      <div>
                        <span className="text-slate-400 block text-[10px]">Data Início:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {new Intl.DateTimeFormat("pt-PT", {
                            timeZone: "Europe/Lisbon",
                            dateStyle: "short",
                          }).format(new Date(project.startDate))}
                        </span>
                      </div>
                    )}
                    {project.endDate && (
                      <div>
                        <span className="text-slate-400 block text-[10px]">Data Conclusão:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {new Intl.DateTimeFormat("pt-PT", {
                            timeZone: "Europe/Lisbon",
                            dateStyle: "short",
                          }).format(new Date(project.endDate))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Equipa de Obra (Encarregados e Trabalhadores) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <HardHat className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Equipa da Obra</span>
                </div>
                <Link
                  href={`/dashboard/obras/${project.id}/equipa`}
                  className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-400"
                >
                  <span>Gerir Equipa</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                {/* Encarregados */}
                <div>
                  <span className="text-slate-400 text-[10px] block mb-1">Encarregado(s) Responsável(eis):</span>
                  {hasForeman ? (
                    <div className="flex flex-wrap gap-1.5">
                      {project.foremen.map((f) => (
                        <span
                          key={f.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200/80 px-2 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                        >
                          <HardHat className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          <span>{f.name}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Nenhum encarregado atribuído</span>
                  )}
                </div>

                {/* Trabalhadores */}
                <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block mb-1">
                    Trabalhadores Alocados ({project.workersCount}):
                  </span>
                  {project.workers && project.workers.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {project.workers.map((w) => (
                        <span
                          key={w.id}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <Users className="h-2.5 w-2.5 text-slate-400" />
                          <span>{w.name}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Nenhum trabalhador associado ainda</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Tarefas Recentes da Obra */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <ListTodo className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span>Tarefas Associadas ({project.totalTasksCount})</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold flex-wrap justify-end">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded dark:text-emerald-300 dark:bg-emerald-950/40">
                  {project.completedTasksCount} Concluídas
                </span>
                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded dark:text-amber-300 dark:bg-amber-950/40">
                  {project.pendingTasksCount} Pendentes
                </span>
                {project.delayedTasksCount > 0 && (
                  <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded dark:text-rose-300 dark:bg-rose-950/40">
                    {project.delayedTasksCount} Atrasadas
                  </span>
                )}
              </div>
            </div>

            {project.tasks && project.tasks.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto rounded-lg border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                {project.tasks.map((task) => {
                  const isTaskDelayed =
                    task.status === "PENDING" &&
                    task.dueDate !== null &&
                    new Date(task.dueDate) < new Date();

                  return (
                    <div key={task.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        {task.status === "COMPLETED" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : isTaskDelayed ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0 dark:border-slate-700" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            task.status === "COMPLETED" ? "line-through text-slate-400" : "font-medium text-slate-800 dark:text-slate-100"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      {task.dueDate && (
                        <span
                          className={`text-[10px] font-mono shrink-0 ${
                            isTaskDelayed ? "font-bold text-rose-600 dark:text-rose-400" : "text-slate-400"
                          }`}
                        >
                          {new Intl.DateTimeFormat("pt-PT", {
                            timeZone: "Europe/Lisbon",
                            dateStyle: "short",
                          }).format(new Date(task.dueDate))}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-4 text-xs text-slate-400 italic">
                Nenhuma tarefa registada nesta obra.
              </p>
            )}
          </div>
        </div>

        {/* Rodapé Fixo com Ações — Áreas mínimas de toque de 44px e Foco Visível */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 p-4 sm:p-6 pt-3 pb-4 border-t border-slate-100 bg-slate-50/70 shrink-0 dark:border-slate-800 dark:bg-slate-800/40">
          <DialogClose asChild>
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 transition active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Fechar
            </button>
          </DialogClose>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Link
              href={`/dashboard/obras/${project.id}/equipa`}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 transition shadow-2xs active:scale-[0.98] dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/40"
            >
              <HardHat className="h-4 w-4" />
              <span>Gerir Equipa</span>
            </Link>

            <Link
              href={`/dashboard/obras/${project.id}/editar`}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition shadow-xs active:scale-[0.98]"
            >
              <Edit className="h-4 w-4" />
              <span>Editar Obra</span>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

