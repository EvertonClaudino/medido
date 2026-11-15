/**
 * Utilitários puros para métricas, períodos, alertas e formatação do Dashboard.
 * Sem dependências diretas de base de dados para garantir testabilidade.
 */

export type DashboardPeriod = "today" | "thisWeek" | "thisMonth" | "lastMonth";

export interface DashboardCalendarDay {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function getLisbonDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getLisbonMonthKey(date = new Date()): string {
  return getLisbonDateKey(date).slice(0, 7);
}

export function getLisbonStartOfDay(date: Date): Date {
  const dateKey = getLisbonDateKey(date);
  const [year, month, day] = dateKey.split("-").map(Number);
  const wallTime = Date.UTC(year, month - 1, day);
  const guess = new Date(wallTime);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(guess);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const observedWallTime = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  return new Date(wallTime + wallTime - observedWallTime);
}

export function isDashboardMonthKey(value: string | undefined): value is string {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= 1900 && year <= 9999;
}

export function isDashboardDateKey(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getAdjacentMonthKey(monthKey: string, offset: -1 | 1): string {
  if (!isDashboardMonthKey(monthKey)) {
    throw new RangeError("Invalid dashboard month key.");
  }
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getMonthCalendarDays(
  monthKey: string,
  todayKey: string
): DashboardCalendarDay[] {
  if (!isDashboardMonthKey(monthKey) || !isDashboardDateKey(todayKey)) {
    throw new RangeError("Invalid dashboard month key.");
  }

  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const startOffset = (monthStart.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cellCount = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, 1 - startOffset + index));
    const dateKey = date.toISOString().slice(0, 10);
    return {
      dateKey,
      dayNumber: date.getUTCDate(),
      isCurrentMonth: dateKey.slice(0, 7) === monthKey,
      isToday: dateKey === todayKey,
    };
  });
}

export interface PeriodDates {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

/**
 * Retorna a saudação baseada na hora atual no fuso Europe/Lisbon.
 */
export function getGreetingForLisbon(date = new Date()): "Bom dia" | "Boa tarde" | "Boa noite" {
  const parts = new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);

  const hourPart = parts.find((p) => p.type === "hour");
  const hour = hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();

  if (hour >= 6 && hour < 13) {
    return "Bom dia";
  }
  if (hour >= 13 && hour < 20) {
    return "Boa tarde";
  }
  return "Boa noite";
}

/**
 * Converte data para o início do dia no fuso Europe/Lisbon (00:00:00.000).
 */
export function startOfDayLisbon(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calcula os limites temporais de início e fim para o período corrente e período homólogo anterior.
 */
export function getPeriodDateRanges(period: DashboardPeriod, referenceDate = new Date()): PeriodDates {
  const now = new Date(referenceDate);

  if (period === "today") {
    const currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 1);
    const previousEnd = new Date(currentEnd);
    previousEnd.setDate(previousEnd.getDate() - 1);

    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  if (period === "thisWeek") {
    // Semana começa na segunda-feira
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const previousStart = new Date(monday);
    previousStart.setDate(previousStart.getDate() - 7);
    const previousEnd = new Date(sunday);
    previousEnd.setDate(previousEnd.getDate() - 7);

    return { currentStart: monday, currentEnd: sunday, previousStart, previousEnd };
  }

  if (period === "thisMonth") {
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  // lastMonth
  const currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const currentEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const previousStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
  const previousEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);

  return { currentStart, currentEnd, previousStart, previousEnd };
}

/**
 * Calcula variação percentual entre valor atual e valor do período anterior.
 * Se o anterior for 0, retorna null (indicando "—").
 */
export function calculateVariation(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  const diff = current - previous;
  return (diff / previous) * 100;
}

/**
 * Retorna os limites das últimas 8 semanas (começando na 2ª feira) para o gráfico.
 */
export function getLast8WeeksRanges(now = new Date()): Array<{ weekLabel: string; start: Date; end: Date }> {
  const weeks: Array<{ weekLabel: string; start: Date; end: Date }> = [];
  const current = new Date(now);

  for (let i = 7; i >= 0; i--) {
    const targetDate = new Date(current);
    targetDate.setDate(current.getDate() - i * 7);

    const day = targetDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(targetDate);
    start.setDate(targetDate.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    // Formatar rótulo com dia/mês de início
    const label = `${start.getDate()}/${start.getMonth() + 1}`;
    weeks.push({ weekLabel: label, start, end });
  }

  return weeks;
}

/**
 * Formatação de moeda e números em formato português (PT-PT).
 */
export function formatPtNumber(val: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("pt-PT", options).format(val);
}

export function formatPtDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

