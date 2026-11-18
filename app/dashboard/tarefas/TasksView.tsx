"use client";

import { useState } from "react";
import { TaskItem } from "./TaskItem";

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  dueDate: Date | string | null;
  createdAt: Date | string;
  project: { id: string; name: string; code: string | null } | null;
  assignedTo: { id: string; name: string; role: string };
  createdBy: { id: string; name: string };
}

interface TasksViewProps {
  tasks: TaskData[];
  currentUserId: string;
  isOwner: boolean;
}

export function TasksView({
  tasks,
  currentUserId,
  isOwner,
}: TasksViewProps) {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Navegação do Calendário Mensal
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-11
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Navegação de mês
  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDateKey(null);
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDateKey(null);
  }

  function handleToday() {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateKey(null);
  }

  // Nome do mês em PT-PT
  const monthName = new Intl.DateTimeFormat("pt-PT", {
    month: "long",
    year: "numeric",
  }).format(new Date(currentYear, currentMonth, 1));
  const capitalizedMonthName =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Mapear tarefas por dia no formato "YYYY-MM-DD"
  // Fuso Europe/Lisbon
  const tasksByDay: Record<string, TaskData[]> = {};
  const tasksWithoutDueDate: TaskData[] = [];

  tasks.forEach((task) => {
    if (!task.dueDate) {
      tasksWithoutDueDate.push(task);
      return;
    }
    const d = new Date(task.dueDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${day}`;

    if (!tasksByDay[key]) {
      tasksByDay[key] = [];
    }
    tasksByDay[key].push(task);
  });

  // Construir a grelha de dias do mês atual (Segunda-feira a Domingo)
  // Dias da semana: Seg=0, Ter=1, Qua=2, Qui=3, Sex=4, Sab=5, Dom=6
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // getDay() retorna 0 para Domingo, 1 para Segunda...
  // Ajuste para começar na Segunda-feira (Seg=0, Dom=6)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const calendarDays: Array<{
    dayNumber: number;
    dateKey: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    tasks: TaskData[];
  }> = [];

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;

  // Preenchimento de dias do mês anterior
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevMonth = currentMonth === 0 ? 12 : currentMonth;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const key = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(
      dayNum
    ).padStart(2, "0")}`;
    calendarDays.push({
      dayNumber: dayNum,
      dateKey: key,
      isCurrentMonth: false,
      isToday: key === todayStr,
      tasks: tasksByDay[key] || [],
    });
  }

  // Dias do mês atual
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const key = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    calendarDays.push({
      dayNumber: day,
      dateKey: key,
      isCurrentMonth: true,
      isToday: key === todayStr,
      tasks: tasksByDay[key] || [],
    });
  }

  // Preenchimento de dias do mês seguinte até completar múltiplos de 7 (grelha completa)
  const remainingCells = 7 - (calendarDays.length % 7);
  if (remainingCells < 7) {
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonth = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const key = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      calendarDays.push({
        dayNumber: day,
        dateKey: key,
        isCurrentMonth: false,
        isToday: key === todayStr,
        tasks: tasksByDay[key] || [],
      });
    }
  }

  // Tarefas para o dia selecionado (modal/painel de detalhe do dia)
  const selectedDayTasks = selectedDateKey ? tasksByDay[selectedDateKey] || [] : [];
  const selectedDateFormatted = selectedDateKey
    ? new Intl.DateTimeFormat("pt-PT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(selectedDateKey + "T12:00:00"))
    : "";

  // Dados para a Vista em Lista tradicional
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const completedOrCancelledTasks = tasks.filter((t) => t.status !== "PENDING");

  const overdueTasks = pendingTasks.filter(
    (t) => t.dueDate !== null && new Date(t.dueDate) < startOfToday
  );
  const todayTasks = pendingTasks.filter(
    (t) =>
      t.dueDate !== null &&
      new Date(t.dueDate) >= startOfToday &&
      new Date(t.dueDate) <= endOfToday
  );
  const upcomingTasks = pendingTasks.filter(
    (t) => t.dueDate === null || new Date(t.dueDate) > endOfToday
  );

  return (
    <div className="space-y-5">
      {/* Barra de Controlo: Alternador Vista Calendário / Lista + Navegação de Mês */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
        {/* Alternador de Vista */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold dark:border-slate-800 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
              viewMode === "calendar"
                ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <svg
              className="h-4 w-4"
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
            <span>Calendário Mensal</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
              viewMode === "list"
                ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            <span>Lista Agrupada</span>
          </button>
        </div>

        {/* Controlos do Mês (apenas no modo calendário) */}
        {viewMode === "calendar" && (
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <h2 className="text-sm font-bold text-slate-900 min-w-36 dark:text-white">
              {capitalizedMonthName}
            </h2>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToday}
                className="rounded-sm border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Mês anterior"
                className="rounded-sm border border-slate-200 p-1 text-slate-600 hover:bg-slate-50 transition dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Mês seguinte"
                className="rounded-sm border border-slate-200 p-1 text-slate-600 hover:bg-slate-50 transition dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. MODO: CALENDÁRIO MENSAL */}
      {/* ========================================================================= */}
      {viewMode === "calendar" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            {/* Cabeçalho dos dias da semana (Segunda a Domingo) */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 py-2.5 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span className="text-amber-800 dark:text-amber-300">Sáb</span>
              <span className="text-amber-800 dark:text-amber-300">Dom</span>
            </div>

            {/* Grelha dos dias */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
              {calendarDays.map((calDay, idx) => {
                const pendingCount = calDay.tasks.filter((t) => t.status === "PENDING").length;
                const completedCount = calDay.tasks.filter((t) => t.status === "COMPLETED").length;
                const isSelected = selectedDateKey === calDay.dateKey;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (calDay.tasks.length > 0) {
                        setSelectedDateKey(calDay.dateKey);
                      }
                    }}
                    className={`min-h-24 sm:min-h-28 p-1.5 sm:p-2 transition flex flex-col justify-between ${
                      !calDay.isCurrentMonth
                        ? "bg-slate-50/60 text-slate-400 dark:bg-slate-800/40"
                        : "bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    } ${calDay.tasks.length > 0 ? "cursor-pointer hover:bg-amber-50/50" : ""} ${
                      isSelected ? "ring-2 ring-amber-500 bg-amber-50/30 dark:bg-amber-950/40" : ""
                    }`}
                  >
                    {/* Topo do dia: número e indicador de hoje */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold flex h-6 w-6 items-center justify-center rounded-full ${
                          calDay.isToday
                            ? "bg-amber-600 text-white font-bold"
                            : ""
                        }`}
                      >
                        {calDay.dayNumber}
                      </span>

                      {/* Contador total no telemóvel */}
                      {calDay.tasks.length > 0 && (
                        <span className="sm:hidden text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {calDay.tasks.length}
                        </span>
                      )}
                    </div>

                    {/* Lista compacta de tarefas no dia (ecrãs desktop/tablet) */}
                    <div className="hidden sm:flex flex-col gap-1 mt-1 flex-1 overflow-hidden">
                      {calDay.tasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight ${
                            task.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 line-through opacity-75 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : task.status === "CANCELLED"
                              ? "bg-slate-100 text-slate-500 line-through dark:bg-slate-800 dark:text-slate-400"
                              : "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-900/60"
                          }`}
                          title={`${task.title} (${task.assignedTo.name})`}
                        >
                          {task.title}
                        </div>
                      ))}

                      {calDay.tasks.length > 3 && (
                        <span className="text-[10px] font-semibold text-slate-500 pl-1 dark:text-slate-400">
                          +{calDay.tasks.length - 3} mais
                        </span>
                      )}
                    </div>

                    {/* Resumo de bolinhas no mobile */}
                    <div className="sm:hidden flex items-center gap-1 mt-1">
                      {pendingCount > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      )}
                      {completedCount > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secção de Tarefas Sem Data Limite (se existirem) */}
          {tasksWithoutDueDate.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Tarefas Gerais Sem Data Limite ({tasksWithoutDueDate.length})
                </h3>
              </div>
              <div className="space-y-2">
                {tasksWithoutDueDate.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Painel de Tarefas do Dia Selecionado */}
          {selectedDateKey && (
            <div className="rounded-xl border-2 border-amber-400 bg-white p-5 shadow-xs space-y-4 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Tarefas do Dia
                  </span>
                  <h3 className="text-base font-bold text-slate-900 capitalize dark:text-white">
                    {selectedDateFormatted}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDateKey(null)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Fechar
                </button>
              </div>

              <div className="space-y-2">
                {selectedDayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODO: LISTA AGRUPADA (Atrasadas, Hoje, Próximas) */}
      {/* ========================================================================= */}
      {viewMode === "list" && (
        <div className="space-y-8">
          {/* Atrasadas */}
          {overdueTasks.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-red-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                  Atrasadas ({overdueTasks.length})
                </h2>
              </div>
              <div className="space-y-2">
                {overdueTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Hoje */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Hoje ({todayTasks.length})
              </h2>
            </div>
            {todayTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                Nenhuma tarefa com prazo para hoje.
              </p>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Próximas */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Próximas & Sem Data ({upcomingTasks.length})
              </h2>
            </div>
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                Sem outras tarefas pendentes.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Concluídas / Canceladas */}
          {completedOrCancelledTasks.length > 0 && (
            <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                  <span>Concluídas e Canceladas ({completedOrCancelledTasks.length})</span>
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <div className="mt-3 space-y-2">
                  {completedOrCancelledTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      currentUserId={currentUserId}
                      isOwner={isOwner}
                    />
                  ))}
                </div>
              </details>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
