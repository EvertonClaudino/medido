import assert from "node:assert";
import { prisma } from "@/lib/prisma";
import { __setMockUser } from "@/lib/auth";
import { createClientActivityAction } from "@/app/dashboard/clientes/actions";
import {
  createVisitRequestAction,
  getVisitAgendaAction,
  updateVisitStatusAction,
} from "@/app/dashboard/visitas/actions";
import { createBudgetAction } from "@/app/dashboard/orcamentos/actions";
import { asSessionUser, createTestTenant, destroyTestTenants } from "./helpers/test-tenant";

/**
 * Ficha do cliente (decisão 022): interações, marcação de visita com data e
 * orçamento com visita opcional, invocando as Server Actions reais contra a BD de desenvolvimento.
 * Todos os registos criados são removidos no fim.
 */

function budgetForm(projectName: string) {
  const formData = new FormData();
  formData.set("projectName", projectName);
  formData.set("workAddress", "Rua dos Testes, 10, Lisboa");
  formData.set("notes", "");
  formData.set("itemCount", "1");
  formData.set("item-0-description", "Demolição de paredes");
  formData.set("item-0-quantity", "2");
  formData.set("item-0-unit", "m2");
  formData.set("item-0-unitPrice", "50");
  formData.set("item-0-vatRate", "23");
  return formData;
}

async function run() {
  let passed = 0;
  const tenantA = await createTestTenant("ficha-a");
  const tenantB = await createTestTenant("ficha-b");
  const company = tenantA.company;
  const companyB = tenantB.company;
  const owner = tenantA.owner;

  __setMockUser(asSessionUser(owner, company));

  const suffix = Date.now();
  const client = await prisma.client.create({ data: { companyId: company.id, name: `Cliente Ficha ${suffix}` } });
  const otherClient = await prisma.client.create({ data: { companyId: company.id, name: `Outro Cliente ${suffix}` } });
  const foreignClient = await prisma.client.create({ data: { companyId: companyB.id, name: `Cliente B ${suffix}` } });

  try {
    // 1. Interação registada no cliente; cliente de outra empresa e data futura recusados
    {
      const valid = new FormData();
      valid.set("type", "CALL");
      valid.set("description", "Ligou a pedir orçamento para a cozinha.");
      valid.set("occurredAt", "2026-11-10T15:30");
      const res = await createClientActivityAction(client.id, valid);
      assert.ok("success" in res, JSON.stringify(res));

      const saved = await prisma.clientActivity.findFirst({ where: { clientId: client.id } });
      assert.strictEqual(saved?.type, "CALL");
      assert.strictEqual(saved?.occurredAt.toISOString(), "2026-11-10T15:30:00.000Z"); // Inverno: Lisboa = UTC

      const foreign = await createClientActivityAction(foreignClient.id, valid);
      assert.ok("error" in foreign, "Cliente de outra empresa devia ser recusado");

      const future = new FormData();
      future.set("type", "NOTE");
      future.set("description", "Nota com data futura");
      future.set("occurredAt", "2030-01-01T10:00");
      assert.ok("error" in (await createClientActivityAction(client.id, future)));

      const invalidType = new FormData();
      invalidType.set("type", "SMS");
      invalidType.set("description", "Tipo inválido");
      assert.ok("error" in (await createClientActivityAction(client.id, invalidType)));

      passed++;
      console.log("✔ Interações: registo no cliente, isolamento por empresa, sem datas futuras nem tipos inválidos");
    }

    // 2. Marcar visita com data e responsável fica logo agendada (hora de Lisboa)
    let visitId = "";
    const visitForm = (scheduledAt: string, assignedToId: string, durationMinutes = "60") => {
      const formData = new FormData();
      formData.set("clientId", client.id);
      formData.set("requestedAddress", "Rua dos Testes, 10, Lisboa");
      formData.set("scheduledAt", scheduledAt);
      formData.set("assignedToId", assignedToId);
      formData.set("durationMinutes", durationMinutes);
      return formData;
    };
    {
      const withoutAssignee = await createVisitRequestAction(visitForm("2026-07-15T10:00", ""));
      assert.ok("error" in withoutAssignee, "Agendar sem responsável devia ser recusado");

      const res = await createVisitRequestAction(visitForm("2026-07-15T10:00", owner.id, "90")); // Verão: Lisboa = UTC+1
      assert.ok("success" in res, JSON.stringify(res));

      const visit = await prisma.visitRequest.findFirst({ where: { clientId: client.id } });
      assert.strictEqual(visit?.status, "SCHEDULED");
      assert.strictEqual(visit?.scheduledAt?.toISOString(), "2026-07-15T09:00:00.000Z");
      assert.strictEqual(visit?.assignedToId, owner.id);
      assert.strictEqual(visit?.durationMinutes, 90);
      visitId = visit!.id;

      passed++;
      console.log("✔ Visitas: marcação com responsável e duração fica agendada no fuso Europe/Lisbon");
    }

    // 2b. Agenda do responsável: sobreposição recusada, horário encostado aceite, reagendamento ignora a própria visita
    {
      const overlap = await createVisitRequestAction(visitForm("2026-07-15T11:00", owner.id)); // 10:00–11:30 ocupado
      assert.ok("error" in overlap, "Sobreposição na agenda devia ser recusada");

      const adjacent = await createVisitRequestAction(visitForm("2026-07-15T11:30", owner.id));
      assert.ok("success" in adjacent, JSON.stringify(adjacent));

      const reschedule = new FormData();
      reschedule.set("status", "SCHEDULED");
      reschedule.set("scheduledAt", "2026-07-15T09:30");
      reschedule.set("assignedToId", owner.id);
      reschedule.set("durationMinutes", "60");
      const rescheduled = await updateVisitStatusAction(visitId, reschedule);
      assert.ok("success" in rescheduled, JSON.stringify(rescheduled));

      const foreignAssignee = await prisma.user.findFirst({ where: { companyId: companyB.id } });
      if (foreignAssignee) {
        const res = await createVisitRequestAction(visitForm("2026-07-16T10:00", foreignAssignee.id));
        assert.ok("error" in res, "Responsável de outra empresa devia ser recusado");
      }

      const agenda = await getVisitAgendaAction(owner.id, "2026-07-14");
      assert.ok("days" in agenda);
      const day = agenda.days.find((d) => d.dateKey === "2026-07-15");
      assert.strictEqual(day?.visits.length, 2);
      assert.strictEqual(day?.visits[0].startIso, "2026-07-15T08:30:00.000Z");

      // Deixa apenas a visita principal para os testes seguintes
      await prisma.visitRequest.deleteMany({ where: { clientId: client.id, id: { not: visitId } } });

      passed++;
      console.log("✔ Agenda: conflitos recusados, reagendamento e responsável validado por empresa");
    }

    // 3. Orçamento sem visita
    {
      const res = await createBudgetAction({ clientId: client.id }, budgetForm(`Sem Visita ${suffix}`));
      assert.ok("success" in res, JSON.stringify(res));
      const budget = await prisma.budget.findUnique({ where: { id: (res as { budgetId: string }).budgetId } });
      assert.strictEqual(budget?.visitRequestId, null);
      assert.strictEqual(budget?.clientId, client.id);

      passed++;
      console.log("✔ Orçamentos: criação sem visita associada");
    }

    // 4. Visita ainda não realizada, de outro cliente ou cliente de outra empresa são recusados
    {
      const notCompleted = await createBudgetAction({ clientId: client.id, visitRequestId: visitId }, budgetForm("X"));
      assert.ok("error" in notCompleted, "Visita não realizada devia ser recusada");

      await prisma.visitRequest.update({ where: { id: visitId }, data: { status: "COMPLETED" } });
      const wrongClient = await createBudgetAction({ clientId: otherClient.id, visitRequestId: visitId }, budgetForm("X"));
      assert.ok("error" in wrongClient, "Visita de outro cliente devia ser recusada");

      const foreign = await createBudgetAction({ clientId: foreignClient.id }, budgetForm("X"));
      assert.ok("error" in foreign, "Cliente de outra empresa devia ser recusado");

      const withVisit = await createBudgetAction({ clientId: client.id, visitRequestId: visitId }, budgetForm(`Com Visita ${suffix}`));
      assert.ok("success" in withVisit, JSON.stringify(withVisit));

      const duplicate = await createBudgetAction({ clientId: client.id, visitRequestId: visitId }, budgetForm("X"));
      assert.ok("error" in duplicate, "A mesma visita não pode ter dois orçamentos");

      passed++;
      console.log("✔ Orçamentos: visita validada (realizada, do mesmo cliente, sem orçamento) e isolamento por empresa");
    }

    console.log(`\n🎉 Todos os ${passed} testes da ficha do cliente passaram.`);
  } finally {
    await destroyTestTenants([company.id, companyB.id]);
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error("Falha nos testes:", error);
  process.exit(1);
});
