"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Bell,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

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
  selectedDate?: string;
  monthLabel?: string;
}

export function OwnerSidebarColumn({
  tasks,
  notifications,
  monthLabel = "Maio 2026",
}: OwnerSidebarColumnProps) {
  const [selectedDay, setSelectedDay] = useState(20);

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const startDayOffset = 4; // Começa na Sexta-feira para ilustração de Maio

  // Exemplos de tarefas padrão caso a BD tenha poucas
  const displayTasks = tasks.length > 0 ? tasks : [
    { id: "1", title: "Revisão de Medições e RFI #245", projectName: "Reabilitação Chiado", priority: "high" as const },
    { id: "2", title: "Aprovar Requisição de Cimento", projectName: "Moradia Cascais", priority: "medium" as const },
    { id: "3", title: "Vistoria Técnica de Segurança", projectName: "Edifício Chiado", priority: "medium" as const },
    { id: "4", title: "Relatório Semanal de Avanço", projectName: "Moradia Cascais", priority: "low" as const },
  ];

  const displayNotifications = notifications.length > 0 ? notifications : [
    { id: "n1", title: "Ordem de Compra #PO-8891 validada", timeAgo: "10:45", type: "success" as const },
    { id: "n2", title: "Registo diário de Chiado recebido", timeAgo: "09:30", type: "info" as const },
    { id: "n3", title: "Submissão de horas por Manuel Silva", timeAgo: "08:15", type: "info" as const },
    { id: "n4", title: "Atraso previsto na entrega de aço", timeAgo: "Ontem", type: "alert" as const },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Mini Calendário Operacional */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            <span>Calendário</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-800">{monthLabel}</span>
            <div className="flex items-center">
              <button
                type="button"
                className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Mês seguinte"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Grelha do Calendário */}
        <div className="mt-3">
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-600 pb-1.5">
            <span>SEG</span>
            <span>TER</span>
            <span>QUA</span>
            <span>QUI</span>
            <span>SEX</span>
            <span>SÁB</span>
            <span>DOM</span>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
            {/* Espaços em branco antes do dia 1 */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <span key={`empty-${i}`} className="text-slate-300 text-[11px] p-1">
                {27 + i}
              </span>
            ))}
            {daysInMonth.map((day) => {
              const isSelected = day === selectedDay;
              const hasEvents = [6, 12, 20, 24, 28].includes(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex flex-col items-center justify-center rounded-full p-1 text-xs font-semibold transition ${
                    isSelected
                      ? "bg-blue-600 text-white font-bold shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{day}</span>
                  {hasEvents && !isSelected && (
                    <span className="h-1 w-1 rounded-full bg-blue-600 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. As Minhas Tarefas (Tarefas Prioritárias) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Tarefas Prioritárias</span>
          </div>
          <Link
            href="/dashboard/tarefas"
            className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-700 hover:text-blue-900"
          >
            <span>Ver Todas</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-3 space-y-2.5">
          {displayTasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              className="group flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 transition hover:bg-white hover:border-slate-200"
            >
              <div className="flex items-start gap-2 min-w-0">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                  defaultChecked={task.completed}
                />
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    {task.title}
                  </h3>
                  {task.projectName && (
                    <p className="truncate text-[10px] text-slate-500 font-medium">
                      {task.projectName}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  task.priority === "high"
                    ? "bg-rose-100 text-rose-700"
                    : task.priority === "medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Notificações do Sistema */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
            <Bell className="h-3.5 w-3.5 text-blue-600" />
            <span>Notificações</span>
          </div>
          <Link
            href="/dashboard/notificacoes"
            className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-700 hover:text-blue-900"
          >
            <span>Ver Todas</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-3 space-y-2.5">
          {displayNotifications.slice(0, 4).map((n) => (
            <div key={n.id} className="flex items-start gap-2.5 text-xs">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  n.type === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : n.type === "alert"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {n.type === "alert" ? (
                  <ShieldAlert className="h-2.5 w-2.5" />
                ) : (
                  <CheckCircle2 className="h-2.5 w-2.5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-slate-800 font-medium text-[11px]">
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
