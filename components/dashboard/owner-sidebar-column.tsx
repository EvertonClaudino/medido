import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Bell,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { getAdjacentMonthKey, type DashboardCalendarDay } from "@/lib/dashboard-utils";

export interface SidebarCalendarCell extends DashboardCalendarDay {
  hasTask: boolean;
  hasDeadline: boolean;
  hasVisit: boolean;
}

export interface SidebarAgendaVisit {
  id: string;
  time: string;
  clientId: string;
  clientName: string;
  address: string;
  assigneeName: string | null;
}

export interface SidebarTaskItem {
  id: string;
  title: string;
  projectName?: string;
  priority: "high" | "medium" | "low";
  completed?: boolean;
}

export interface SidebarNotificationItem {
  id: string;
  title: string;
  timeAgo: string;
  type: "success" | "info" | "warning" | "alert";
}

interface OwnerSidebarColumnProps {
  tasks: SidebarTaskItem[];
  notifications: SidebarNotificationItem[];
  monthLabel: string;
  /** Mês apresentado no calendário, no formato YYYY-MM */
  monthKey: string;
  /** Dia selecionado no calendário, no formato YYYY-MM-DD */
  selectedDate?: string;
  calendarCells: SidebarCalendarCell[];
  /** Dia apresentado na agenda (null quando o mês apresentado não inclui hoje e nenhum dia foi escolhido) */
  agendaLabel: string | null;
  agendaVisits: SidebarAgendaVisit[];
}

export function OwnerSidebarColumn({
  tasks,
  notifications,
  monthLabel,
  monthKey,
  selectedDate,
  calendarCells,
  agendaLabel,
  agendaVisits,
}: OwnerSidebarColumnProps) {
  const previousMonthHref = `/dashboard?mes=${getAdjacentMonthKey(monthKey, -1)}`;
  const nextMonthHref = `/dashboard?mes=${getAdjacentMonthKey(monthKey, 1)}`;

  return (
    <div className="space-y-4">
      {/* 1. Mini Calendário Operacional */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
            <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Calendário</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">{monthLabel}</span>
            <div className="flex items-center">
              <Link
                href={previousMonthHref}
                scroll={false}
                className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={nextMonthHref}
                scroll={false}
                className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Mês seguinte"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Grelha do Calendário */}
        <div className="mt-3">
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-600 dark:text-slate-400 pb-1.5">
            <span>SEG</span>
            <span>TER</span>
            <span>QUA</span>
            <span>QUI</span>
            <span>SEX</span>
            <span>SÁB</span>
            <span>DOM</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-700 dark:text-slate-300">
            {/* Azul: visita agendada · Verde: tarefas com prazo · Vermelho: conclusão prevista de obra */}
            {calendarCells.map((cell) => {
              const isSelected = cell.dateKey === selectedDate;
              const labelParts = [
                cell.hasVisit ? "visita agendada" : null,
                cell.hasTask ? "tarefas com prazo" : null,
                cell.hasDeadline ? "conclusão de obra prevista" : null,
              ].filter(Boolean);

              return (
                <Link
                  key={cell.dateKey}
                  href={`/dashboard?mes=${monthKey}&dia=${cell.dateKey}`}
                  scroll={false}
                  aria-label={labelParts.length > 0 ? `${cell.dayNumber}: ${labelParts.join(", ")}` : undefined}
                  aria-current={cell.isToday ? "date" : undefined}
                  className={`relative flex h-7 items-center justify-center rounded-md transition-colors ${
                    cell.isToday
                      ? "bg-blue-600 font-bold text-white shadow-xs"
                      : isSelected
                      ? "bg-blue-50 font-bold text-blue-700 ring-1 ring-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  } ${cell.isCurrentMonth ? "" : "text-slate-300 dark:text-slate-600"}`}
                >
                  <span>{cell.dayNumber}</span>
                  {!cell.isToday && (
                    <span className="absolute bottom-0.5 flex gap-0.5">
                      {cell.hasVisit && <span className="h-1 w-1 rounded-full bg-blue-500" />}
                      {cell.hasTask && <span className="h-1 w-1 rounded-full bg-emerald-500" />}
                      {cell.hasDeadline && <span className="h-1 w-1 rounded-full bg-rose-500" />}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Visitas</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Tarefas</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />Fim de obra</span>
          </div>
        </div>

        {/* Agenda de visitas do dia */}
        {agendaLabel && (
          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{agendaLabel}</h3>
            {agendaVisits.length === 0 ? (
              <p className="mt-1.5 text-[11px] text-slate-400">Sem visitas agendadas.</p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {agendaVisits.map((visit) => (
                  <li key={visit.id}>
                    <Link
                      href={`/dashboard/clientes/${visit.clientId}`}
                      className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-2.5 py-2 text-xs transition hover:border-blue-200 hover:bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                    >
                      <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300">{visit.time}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-900 dark:text-white">Visita · {visit.clientName}</span>
                        <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {visit.address}
                          {visit.assigneeName ? ` · ${visit.assigneeName}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 2. As Minhas Tarefas (Tarefas Prioritárias) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tarefas Prioritárias</span>
          </div>
          <Link
            href="/dashboard/tarefas"
            className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
          >
            <span>Ver Todas</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-3 space-y-2.5">
          {tasks.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">Sem tarefas pendentes.</p>
          )}
          {tasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              className="group flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 transition hover:bg-white hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:hover:border-slate-700"
            >
              <div className="flex items-start gap-2 min-w-0">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400"
                  defaultChecked={task.completed}
                />
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {task.title}
                  </h3>
                  {task.projectName && (
                    <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {task.projectName}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  task.priority === "high"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                    : task.priority === "medium"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                }`}
              >
                {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Notificações do Sistema */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
            <Bell className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Notificações</span>
          </div>
          <Link
            href="/dashboard/notificacoes"
            className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
          >
            <span>Ver Todas</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-3 space-y-2.5">
          {notifications.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">Sem notificações recentes.</p>
          )}
          {notifications.slice(0, 4).map((n) => (
            <div key={n.id} className="flex items-start gap-2.5 text-xs">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  n.type === "success"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : n.type === "alert"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                }`}
              >
                {n.type === "alert" ? (
                  <ShieldAlert className="h-2.5 w-2.5" />
                ) : (
                  <CheckCircle2 className="h-2.5 w-2.5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-slate-800 dark:text-slate-200 font-medium text-[11px]">
                  {n.title}
                </p>
                <span className="text-[10px] text-slate-400">{n.timeAgo}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
