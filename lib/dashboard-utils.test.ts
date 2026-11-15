import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdjacentMonthKey,
  getLisbonDateKey,
  getLisbonStartOfDay,
  getMonthCalendarDays,
  isDashboardDateKey,
} from "./dashboard-utils";

test("constrói semanas completas de segunda a domingo, incluindo fevereiro bissexto", () => {
  const november = getMonthCalendarDays("2026-11", "2026-11-11");
  assert.equal(november.length, 42);
  assert.equal(november[0].dateKey, "2026-10-26");
  assert.equal(november[16].dateKey, "2026-11-11");
  assert.equal(november[16].isToday, true);

  const february = getMonthCalendarDays("2024-02", "2024-02-29");
  assert.equal(february.length, 35);
  assert.ok(february.some((day) => day.dateKey === "2024-02-29" && day.isCurrentMonth));
});

test("navega meses e valida datas de calendário", () => {
  assert.equal(getAdjacentMonthKey("2026-01", -1), "2025-12");
  assert.equal(getAdjacentMonthKey("2026-12", 1), "2027-01");
  assert.equal(isDashboardDateKey("2024-02-29"), true);
  assert.equal(isDashboardDateKey("2025-02-29"), false);
  assert.throws(() => getMonthCalendarDays("2026-13", "2026-11-11"), RangeError);
});

test("calcula a data civil do calendário em Europe/Lisbon", () => {
  assert.equal(getLisbonDateKey(new Date("2026-06-30T22:59:00Z")), "2026-06-30");
  assert.equal(getLisbonDateKey(new Date("2026-06-30T23:00:00Z")), "2026-07-01");
});

test("calcula o início do dia em Europe/Lisbon antes de filtrar obras em atraso", () => {
  assert.equal(
    getLisbonStartOfDay(new Date("2026-07-01T10:00:00Z")).toISOString(),
    "2026-06-30T23:00:00.000Z"
  );
  assert.equal(
    getLisbonStartOfDay(new Date("2026-01-01T10:00:00Z")).toISOString(),
    "2026-01-01T00:00:00.000Z"
  );
});
