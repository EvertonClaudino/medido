import assert from "node:assert";
import {
  getGreetingForLisbon,
  getPeriodDateRanges,
  calculateVariation,
} from "../lib/dashboard-utils";

{
  assert.strictEqual(getGreetingForLisbon(new Date("2026-11-09T08:30:00Z")), "Bom dia");
  assert.strictEqual(getGreetingForLisbon(new Date("2026-11-09T15:00:00Z")), "Boa tarde");
  assert.strictEqual(getGreetingForLisbon(new Date("2026-11-09T21:00:00Z")), "Boa noite");
}

{
  assert.strictEqual(calculateVariation(10, 0), null);
  assert.strictEqual(calculateVariation(0, 0), null);
  assert.strictEqual(calculateVariation(15, 10), 50);
  assert.strictEqual(calculateVariation(10, 20), -50);
}

{
  const ref = new Date("2026-11-09T14:30:00Z");
  const todayRanges = getPeriodDateRanges("today", ref);
  assert.strictEqual(todayRanges.currentStart.getDate(), 9);
  assert.strictEqual(todayRanges.previousStart.getDate(), 8);

  const weekRanges = getPeriodDateRanges("thisWeek", ref);
  assert.strictEqual(weekRanges.currentStart.getDay(), 1);
  assert.strictEqual(weekRanges.currentEnd.getDay(), 0);

  const monthRanges = getPeriodDateRanges("thisMonth", ref);
  assert.strictEqual(monthRanges.currentStart.getDate(), 1);
  assert.strictEqual(monthRanges.currentStart.getMonth(), 10);
  assert.strictEqual(monthRanges.previousStart.getMonth(), 9);
}

console.log("✔ Métricas do dashboard: saudação, variação e intervalos verificados.");
