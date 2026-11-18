"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, MapPin } from "lucide-react";
import { getVisitAgendaAction } from "@/app/dashboard/visitas/actions";
import { parseLisbonDateTime } from "@/lib/budget-utils";
import {
  DEFAULT_VISIT_DURATION,
  VISIT_DURATION_OPTIONS,
  findVisitConflict,
  visitEnd,
  type AgendaDay,
} from "@/lib/visit-scheduling";
import { texts } from "@/lib/texts";

export interface VisitAssigneeOption {
  id: string;
  name: string;
  role: "OWNER" | "FOREMAN";
}

interface VisitSchedulingFieldsProps {
  assignees: VisitAssigneeOption[];
  /** Data civil de hoje em Europe/Lisbon (YYYY-MM-DD), calculada no servidor */
  todayKey: string;
  defaultAssigneeId?: string | null;
  defaultDurationMinutes?: number;
  /** Data/hora atual da visita (reagendamento), em hora de parede de Lisboa */
  defaultDate?: string;
  defaultTime?: string;
  /** Visita a ignorar na verificação de sobreposição (a própria, ao reagendar) */
  ignoreVisitId?: string;
  dateRequired?: boolean;
}

const labels = texts.dashboard.visits;

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white";
const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300";

const timeFormatter = new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", hour: "2-digit", minute: "2-digit" });
const weekdayFormatter = new Intl.DateTimeFormat("pt-PT", { timeZone: "UTC", weekday: "short" });
const dayLabelFormatter = new Intl.DateTimeFormat("pt-PT", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });

/**
 * Campos de agendamento de visita com a agenda do responsável (próximos 14 dias).
 * Envia no formulário: assignedToId, scheduledAt (YYYY-MM-DDTHH:mm, Lisboa) e durationMinutes.
 */
export function VisitSchedulingFields({
  assignees,
  todayKey,
  defaultAssigneeId,
  defaultDurationMinutes = DEFAULT_VISIT_DURATION,
  defaultDate = "",
  defaultTime = "",
  ignoreVisitId,
  dateRequired = false,
}: VisitSchedulingFieldsProps) {
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId ?? "");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [duration, setDuration] = useState(defaultDurationMinutes);
  const [agenda, setAgenda] = useState<AgendaDay[] | null>(null);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();

  function fetchAgenda(nextAssigneeId: string) {
    startLoading(async () => {
      const result = await getVisitAgendaAction(nextAssigneeId, todayKey);
      if ("error" in result) setAgendaError(result.error);
      else setAgenda(result.days);
    });
  }

  function changeAssignee(nextAssigneeId: string) {
    setAssigneeId(nextAssigneeId);
    setAgenda(null);
    setAgendaError(null);
    if (nextAssigneeId) fetchAgenda(nextAssigneeId);
  }

  // Reagendamento: carrega a agenda do responsável atual ao abrir
  useEffect(() => {
    if (defaultAssigneeId) fetchAgenda(defaultAssigneeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao montar
  }, []);

  const selectedDay = agenda?.find((day) => day.dateKey === date) ?? null;
  const assignee = assignees.find((a) => a.id === assigneeId);
  const scheduledAt = date && time ? `${date}T${time}` : "";

  // Pré-visualização de sobreposição com a agenda carregada
  const preview = useMemo(() => {
    if (!scheduledAt || !selectedDay) return null;
    const start = parseLisbonDateTime(scheduledAt);
    if (!start) return null;
    const busy = selectedDay.visits.map((v) => ({ id: v.id, start: new Date(v.startIso), end: new Date(v.endIso) }));
    return findVisitConflict(busy, start, visitEnd(start, duration), ignoreVisitId) ? "conflict" : "free";
  }, [scheduledAt, selectedDay, duration, ignoreVisitId]);

  return (
    <div className="min-w-0 space-y-3">
      <input type="hidden" name="scheduledAt" value={scheduledAt} />

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label htmlFor="visit-assignee" className={labelClass}>
            {labels.assignee}
            {dateRequired && " *"}
          </label>
          <select
            id="visit-assignee"
            name="assignedToId"
            value={assigneeId}
            required={dateRequired}
            onChange={(event) => changeAssignee(event.target.value)}
            className={inputClass}
          >
            <option value="">{labels.noAssignee}</option>
            {assignees.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} · {option.role === "OWNER" ? "Dono" : "Encarregado"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="visit-duration" className={labelClass}>{labels.duration}</label>
          <select
            id="visit-duration"
            name="durationMinutes"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className={inputClass}
          >
            {VISIT_DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {labels.durationOption(minutes)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Agenda do responsável */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
        {!assigneeId ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{labels.chooseAssigneeHint}</p>
        ) : isLoading || (!agenda && !agendaError) ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400" role="status">{labels.agendaLoading}</p>
        ) : agendaError ? (
          <p className="text-[11px] text-red-700 dark:text-red-400" role="alert">{agendaError}</p>
        ) : (
          agenda && (
            <>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{labels.agendaTitle(assignee?.name ?? "")}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{labels.agendaHint}</p>
              <div className="-mx-1 mt-2 flex gap-1 overflow-x-auto px-1 pb-1" role="listbox" aria-label={labels.date}>
                {agenda.map((day) => {
                  const dayDate = new Date(`${day.dateKey}T12:00:00.000Z`);
                  const isSelected = day.dateKey === date;
                  const isWeekend = [0, 6].includes(dayDate.getUTCDay());
                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => setDate(day.dateKey)}
                      className={`flex min-h-[52px] w-11 shrink-0 flex-col items-center justify-center rounded-lg border text-[10px] font-semibold transition ${
                        isSelected
                          ? "border-amber-500 bg-amber-500 text-slate-950"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
                      } ${isWeekend && !isSelected ? "opacity-60" : ""}`}
                    >
                      <span className="uppercase">{weekdayFormatter.format(dayDate).replace(".", "").slice(0, 3)}</span>
                      <span className="text-sm font-black">{dayDate.getUTCDate()}</span>
                      <span className="flex h-1.5 gap-0.5">
                        {day.visits.slice(0, 3).map((v) => (
                          <span key={v.id} className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-slate-950" : "bg-blue-500"}`} />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedDay && (
                <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {dayLabelFormatter.format(new Date(`${selectedDay.dateKey}T12:00:00.000Z`)).replace(/^\p{L}/u, (c) => c.toUpperCase())}
                  </p>
                  {selectedDay.visits.length === 0 && selectedDay.tasks.length === 0 ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      {labels.agendaFree}
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {selectedDay.visits.map((v) => (
                        <li
                          key={v.id}
                          className={`flex items-start gap-2 rounded-md px-2 py-1 text-[11px] ${
                            v.id === ignoreVisitId
                              ? "bg-slate-100 text-slate-500 line-through dark:bg-slate-800 dark:text-slate-500"
                              : "bg-blue-50 text-slate-800 dark:bg-blue-950/40 dark:text-slate-200"
                          }`}
                        >
                          <span className="shrink-0 font-mono font-bold text-blue-700 dark:text-blue-300">
                            {timeFormatter.format(new Date(v.startIso))}–{timeFormatter.format(new Date(v.endIso))}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{v.clientName}</span>
                            <span className="flex items-center gap-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                              <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                              {v.address}
                            </span>
                          </span>
                        </li>
                      ))}
                      {selectedDay.tasks.map((t) => (
                        <li key={t.id} className="flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-slate-700 dark:bg-emerald-950/30 dark:text-slate-300">
                          <ClipboardList className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          <span className="truncate">{labels.agendaTask} · {t.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="visit-date" className={labelClass}>
            {labels.date}
            {dateRequired && " *"}
          </label>
          <input
            id="visit-date"
            type="date"
            value={date}
            min={todayKey}
            required={dateRequired || Boolean(time)}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="visit-time" className={labelClass}>
            {labels.time}
            {dateRequired && " *"}
          </label>
          <input
            id="visit-time"
            type="time"
            step={900}
            value={time}
            required={dateRequired || Boolean(date)}
            onChange={(event) => setTime(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {preview && (
        <p
          role="status"
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
            preview === "conflict"
              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
        >
          {preview === "conflict" ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {preview === "conflict" ? labels.conflictPreview : labels.freePreview}
        </p>
      )}
    </div>
  );
}
