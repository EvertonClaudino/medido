import assert from "node:assert/strict";
import test from "node:test";
import {
  addDaysToDateKey,
  buildAgendaDays,
  findVisitConflict,
  isValidVisitDuration,
  visitEnd,
} from "./visit-scheduling";

const at = (iso: string) => new Date(iso);

test("deteta sobreposição de visitas; visitas encostadas não contam", () => {
  const busy = [{ id: "v1", start: at("2026-11-20T09:00:00Z"), end: at("2026-11-20T10:00:00Z") }];

  assert.equal(findVisitConflict(busy, at("2026-11-20T09:30:00Z"), at("2026-11-20T10:30:00Z"))?.id, "v1");
  assert.equal(findVisitConflict(busy, at("2026-11-20T08:00:00Z"), at("2026-11-20T11:00:00Z"))?.id, "v1");
  assert.equal(findVisitConflict(busy, at("2026-11-20T10:00:00Z"), at("2026-11-20T11:00:00Z")), null);
  assert.equal(findVisitConflict(busy, at("2026-11-20T08:00:00Z"), at("2026-11-20T09:00:00Z")), null);
});

test("ao reagendar, a própria visita é ignorada", () => {
  const busy = [{ id: "v1", start: at("2026-11-20T09:00:00Z"), end: at("2026-11-20T10:00:00Z") }];
  assert.equal(findVisitConflict(busy, at("2026-11-20T09:30:00Z"), at("2026-11-20T10:30:00Z"), "v1"), null);
});

test("durações permitidas e fim da visita", () => {
  assert.equal(isValidVisitDuration(60), true);
  assert.equal(isValidVisitDuration(45), false);
  assert.equal(visitEnd(at("2026-11-20T09:00:00Z"), 90).toISOString(), "2026-11-20T10:30:00.000Z");
});

test("soma dias a datas civis, incluindo mudança de mês e de hora", () => {
  assert.equal(addDaysToDateKey("2026-10-24", 2), "2026-10-26");
  assert.equal(addDaysToDateKey("2026-11-30", 1), "2026-12-01");
});

test("agenda por dia civil de Lisboa, ordenada por hora, ignora fora do intervalo", () => {
  const days = buildAgendaDays(
    "2026-07-14",
    3,
    [
      { id: "late", start: at("2026-07-15T15:00:00Z"), durationMinutes: 60, clientName: "B", address: "Rua B" },
      { id: "early", start: at("2026-07-15T08:00:00Z"), durationMinutes: 30, clientName: "A", address: "Rua A" },
      // 23:30 UTC de 16/07 já é 17/07 em Lisboa (UTC+1): fora do intervalo de 3 dias
      { id: "outside", start: at("2026-07-16T23:30:00Z"), durationMinutes: 60, clientName: "C", address: "Rua C" },
    ],
    [{ id: "t1", title: "Encomendar material", dueDate: at("2026-07-14T16:59:00Z") }]
  );

  assert.deepEqual(days.map((d) => d.dateKey), ["2026-07-14", "2026-07-15", "2026-07-16"]);
  assert.deepEqual(days[1].visits.map((v) => v.id), ["early", "late"]);
  assert.equal(days[1].visits[0].endIso, "2026-07-15T08:30:00.000Z");
  assert.equal(days[2].visits.length, 0);
  assert.equal(days[0].tasks[0].title, "Encomendar material");
});
