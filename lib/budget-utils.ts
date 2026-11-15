import { VisitStatus } from "@prisma/client";

export interface BudgetLineInput {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

export interface BudgetLineTotals {
  netCents: number;
  vatCents: number;
  grossCents: number;
}

export interface BudgetTotals extends BudgetLineTotals {
  lines: BudgetLineTotals[];
}

const visitStatusTransitions: Record<VisitStatus, readonly VisitStatus[]> = {
  REQUESTED: [VisitStatus.SCHEDULED, VisitStatus.CANCELLED],
  SCHEDULED: [VisitStatus.COMPLETED, VisitStatus.CANCELLED],
  COMPLETED: [VisitStatus.CANCELLED],
  CANCELLED: [],
};

export function calculateBudgetTotals(items: readonly BudgetLineInput[]): BudgetTotals {
  const lines = items.map((item) => {
    const quantityMilli = BigInt(Math.round(item.quantity * 1000));
    const unitPriceCents = BigInt(Math.round(item.unitPrice * 100));
    const vatBasisPoints = BigInt(Math.round(item.vatRate * 100));
    const netCents = Number(
      (quantityMilli * unitPriceCents + BigInt(500)) / BigInt(1000)
    );
    const vatCents = Number(
      (BigInt(netCents) * vatBasisPoints + BigInt(5000)) / BigInt(10000)
    );

    return {
      netCents,
      vatCents,
      grossCents: netCents + vatCents,
    };
  });

  return lines.reduce<BudgetTotals>(
    (totals, line) => ({
      netCents: totals.netCents + line.netCents,
      vatCents: totals.vatCents + line.vatCents,
      grossCents: totals.grossCents + line.grossCents,
      lines: [...totals.lines, line],
    }),
    { netCents: 0, vatCents: 0, grossCents: 0, lines: [] }
  );
}

export function canTransitionVisitStatus(
  current: VisitStatus,
  next: VisitStatus
): boolean {
  return visitStatusTransitions[current].includes(next);
}

export function formatBudgetAmount(cents: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function parseLisbonDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const requested = match.slice(1).map(Number);
  const [year, month, day, hour, minute] = requested;
  const requestedUtc = Date.UTC(year, month - 1, day, hour, minute);
  const checkDate = new Date(requestedUtc);

  if (
    checkDate.getUTCFullYear() !== year ||
    checkDate.getUTCMonth() !== month - 1 ||
    checkDate.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  let candidate = new Date(requestedUtc);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = formatter.formatToParts(candidate);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, Number(part.value)])
    );
    const representedUtc = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute
    );
    const difference = requestedUtc - representedUtc;
    if (difference === 0) break;
    candidate = new Date(candidate.getTime() + difference);
  }

  const finalParts = formatter.formatToParts(candidate);
  const finalValues = Object.fromEntries(
    finalParts.map((part) => [part.type, Number(part.value)])
  );
  const actual = [
    finalValues.year,
    finalValues.month,
    finalValues.day,
    finalValues.hour,
    finalValues.minute,
  ];

  return actual.every((part, index) => part === requested[index]) ? candidate : null;
}
