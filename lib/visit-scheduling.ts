/**
 * Regras puras de agendamento de visitas (sem acesso à base de dados):
 * durações permitidas, deteção de sobreposição na agenda do responsável e agenda por dia.
 */
import { getLisbonDateKey } from "@/lib/dashboard-utils";

export const VISIT_DURATION_OPTIONS = [30, 60, 90, 120, 180, 240] as const;
export const DEFAULT_VISIT_DURATION = 60;
export const AGENDA_DAYS = 14;

export function isValidVisitDuration(minutes: number): boolean {
  return (VISIT_DURATION_OPTIONS as readonly number[]).includes(minutes);
}

export function visitEnd(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60_000);
}

export interface BusySlot {
  id: string;
  start: Date;
  end: Date;
}

/** Primeira marcação que se sobrepõe ao intervalo [start, end) (encostadas não contam). */
export function findVisitConflict(
  busy: readonly BusySlot[],
  start: Date,
  end: Date,
  ignoreId?: string
): BusySlot | null {
  return (
    busy.find((slot) => slot.id !== ignoreId && slot.start < end && start < slot.end) ?? null
  );
}

/** Soma dias a uma data civil YYYY-MM-DD. */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export interface AgendaVisitInput {
  id: string;
  start: Date;
  durationMinutes: number;
  clientName: string;
  address: string;
}

export interface AgendaTaskInput {
  id: string;
  title: string;
  dueDate: Date;
}

export interface AgendaDay {
  dateKey: string;
  visits: { id: string; startIso: string; endIso: string; clientName: string; address: string }[];
  tasks: { id: string; title: string; dueIso: string }[];
}

/** Agenda de N dias a partir de startDateKey (dias civis de Europe/Lisbon), ordenada por hora. */
export function buildAgendaDays(
  startDateKey: string,
  days: number,
  visits: readonly AgendaVisitInput[],
  tasks: readonly AgendaTaskInput[]
): AgendaDay[] {
  const agenda: AgendaDay[] = Array.from({ length: days }, (_, index) => ({
    dateKey: addDaysToDateKey(startDateKey, index),
    visits: [],
    tasks: [],
  }));
  const byKey = new Map(agenda.map((day) => [day.dateKey, day]));

  for (const visit of [...visits].sort((a, b) => a.start.getTime() - b.start.getTime())) {
    byKey.get(getLisbonDateKey(visit.start))?.visits.push({
      id: visit.id,
      startIso: visit.start.toISOString(),
      endIso: visitEnd(visit.start, visit.durationMinutes).toISOString(),
      clientName: visit.clientName,
      address: visit.address,
    });
  }
  for (const task of [...tasks].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())) {
    byKey.get(getLisbonDateKey(task.dueDate))?.tasks.push({
      id: task.id,
      title: task.title,
      dueIso: task.dueDate.toISOString(),
    });
  }
  return agenda;
}
