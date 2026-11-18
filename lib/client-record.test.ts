import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClientTimeline,
  computeClientStage,
  readSnapshotStatus,
  type TimelineLabels,
} from "./client-record";

const labels: TimelineLabels = {
  clientCreated: "Cliente registado",
  activityTitles: { CALL: "Chamada", EMAIL: "Email", MEETING: "Reunião", NOTE: "Nota" },
  visitRequested: (address) => `Pedido · ${address}`,
  visitScheduled: (date) => `Agendada ${date}`,
  visitCompleted: "Visita realizada",
  visitCancelled: "Visita cancelada",
  budgetCreated: (name, amount) => `Orçamento ${name} ${amount}`,
  budgetStatusChanged: (name, status) => `${name} → ${status}`,
  budgetStatuses: {
    DRAFT: "Rascunho",
    SENT: "Enviado",
    NEGOTIATION: "Negociação",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    CANCELLED: "Cancelado",
  },
  projectCreated: (label) => `Obra ${label}`,
  formatDateTime: (date) => date.toISOString(),
};

test("etapa comercial: contacto quando não há visitas, orçamentos nem obras", () => {
  assert.equal(computeClientStage({ visits: [], budgets: [], projects: [] }), "CONTACT");
});

test("etapa comercial: visitas canceladas e orçamentos fechados não contam", () => {
  assert.equal(
    computeClientStage({
      visits: [{ status: "CANCELLED" }],
      budgets: [{ status: "REJECTED" }, { status: "CANCELLED" }],
      projects: [{ status: "ARCHIVED" }],
    }),
    "CONTACT"
  );
});

test("etapa comercial: prioridade obra > negociação > orçamento > visita", () => {
  assert.equal(computeClientStage({ visits: [{ status: "SCHEDULED" }], budgets: [], projects: [] }), "VISIT");
  assert.equal(
    computeClientStage({ visits: [{ status: "COMPLETED" }], budgets: [{ status: "SENT" }], projects: [] }),
    "BUDGET"
  );
  assert.equal(
    computeClientStage({ visits: [], budgets: [{ status: "DRAFT" }, { status: "NEGOTIATION" }], projects: [] }),
    "NEGOTIATION"
  );
  assert.equal(
    computeClientStage({ visits: [], budgets: [{ status: "NEGOTIATION" }], projects: [{ status: "COMPLETED" }] }),
    "PROJECT"
  );
});

test("histórico: visita agendada no futuro vai para 'próximas'; passado ordenado do mais recente", () => {
  const now = new Date("2026-11-17T12:00:00.000Z");
  const { upcoming, past } = buildClientTimeline(
    {
      client: { id: "c1", createdAt: new Date("2026-11-01T09:00:00.000Z") },
      activities: [
        {
          id: "a1",
          type: "CALL",
          description: "Pediu orçamento",
          occurredAt: new Date("2026-11-02T10:00:00.000Z"),
          authorName: "Carlos",
        },
      ],
      visits: [
        {
          id: "v1",
          status: "SCHEDULED",
          requestedAddress: "Rua A",
          scheduledAt: new Date("2026-11-20T09:00:00.000Z"),
          createdAt: new Date("2026-11-03T10:00:00.000Z"),
          updatedAt: new Date("2026-11-03T10:00:00.000Z"),
        },
        {
          id: "v2",
          status: "CANCELLED",
          requestedAddress: "Rua B",
          scheduledAt: null,
          createdAt: new Date("2026-11-04T10:00:00.000Z"),
          updatedAt: new Date("2026-11-05T10:00:00.000Z"),
        },
      ],
      budgets: [
        {
          id: "b1",
          projectName: "Cozinha",
          createdAt: new Date("2026-11-06T10:00:00.000Z"),
          grossLabel: "1 000,00 €",
          statusChanges: [{ revisionNumber: 2, status: "SENT", createdAt: new Date("2026-11-07T10:00:00.000Z") }],
        },
      ],
      projects: [{ id: "p1", name: "Cozinha", code: "OBR-2026-001", createdAt: new Date("2026-11-08T10:00:00.000Z") }],
    },
    labels,
    now
  );

  assert.deepEqual(upcoming.map((e) => e.id), ["visit-scheduled-v1"]);
  assert.deepEqual(
    past.map((e) => e.id),
    [
      "project-p1",
      "budget-status-b1-2",
      "budget-created-b1",
      "visit-cancelled-v2",
      "visit-requested-v2",
      "visit-requested-v1",
      "activity-a1",
      "client-c1",
    ]
  );
  assert.equal(past[0].title, "Obra OBR-2026-001 · Cozinha");
  assert.equal(past[1].tone, "info");
  assert.equal(past.find((e) => e.id === "activity-a1")?.authorName, "Carlos");
  assert.equal(past.find((e) => e.id === "budget-created-b1")?.href, "/dashboard/orcamentos/b1");
});

test("histórico: visita agendada que já passou fica no histórico", () => {
  const { upcoming, past } = buildClientTimeline(
    {
      client: { id: "c1", createdAt: new Date("2026-11-01T09:00:00.000Z") },
      activities: [],
      visits: [
        {
          id: "v1",
          status: "SCHEDULED",
          requestedAddress: "Rua A",
          scheduledAt: new Date("2026-11-10T09:00:00.000Z"),
          createdAt: new Date("2026-11-03T10:00:00.000Z"),
          updatedAt: new Date("2026-11-03T10:00:00.000Z"),
        },
      ],
      budgets: [],
      projects: [],
    },
    labels,
    new Date("2026-11-17T12:00:00.000Z")
  );
  assert.equal(upcoming.length, 0);
  assert.equal(past[0].id, "visit-scheduled-v1");
});

test("lê o estado do snapshot da revisão de forma segura", () => {
  assert.equal(readSnapshotStatus({ status: "APPROVED", items: [] }), "APPROVED");
  assert.equal(readSnapshotStatus({ status: "INVALIDO" }), null);
  assert.equal(readSnapshotStatus(null), null);
  assert.equal(readSnapshotStatus("APPROVED"), null);
});
