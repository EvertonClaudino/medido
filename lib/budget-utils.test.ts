import assert from "node:assert/strict";
import test from "node:test";
import { VisitStatus } from "@prisma/client";
import {
  calculateBudgetTotals,
  canTransitionVisitStatus,
  formatBudgetAmount,
  parseLisbonDateTime,
} from "./budget-utils";

test("calcula IVA por linha e total com arredondamento a cêntimos", () => {
  const totals = calculateBudgetTotals([
    { description: "Serviço A", quantity: 1.5, unit: "m2", unitPrice: 10, vatRate: 23 },
    { description: "Serviço B", quantity: 1, unit: "un", unitPrice: 5.55, vatRate: 6 },
  ]);

  assert.deepEqual(totals, {
    netCents: 2055,
    vatCents: 378,
    grossCents: 2433,
    lines: [
      { netCents: 1500, vatCents: 345, grossCents: 1845 },
      { netCents: 555, vatCents: 33, grossCents: 588 },
    ],
  });
});

test("permite apenas o fluxo de visita acordado e cancelamento", () => {
  assert.equal(canTransitionVisitStatus(VisitStatus.REQUESTED, VisitStatus.SCHEDULED), true);
  assert.equal(canTransitionVisitStatus(VisitStatus.SCHEDULED, VisitStatus.COMPLETED), true);
  assert.equal(canTransitionVisitStatus(VisitStatus.REQUESTED, VisitStatus.COMPLETED), false);
  assert.equal(canTransitionVisitStatus(VisitStatus.CANCELLED, VisitStatus.SCHEDULED), false);
});

test("formata montantes em euros em PT-PT", () => {
  assert.match(formatBudgetAmount(123456), /1234,56\s*€/);
});

test("interpreta horários de visita no fuso Europe/Lisbon e rejeita a hora inexistente", () => {
  assert.equal(parseLisbonDateTime("2026-07-01T10:00")?.toISOString(), "2026-07-01T09:00:00.000Z");
  assert.equal(parseLisbonDateTime("2026-01-01T10:00")?.toISOString(), "2026-01-01T10:00:00.000Z");
  assert.equal(parseLisbonDateTime("2026-03-29T01:30"), null);
});
