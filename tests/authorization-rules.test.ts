import assert from "node:assert";
import {
  createProjectAction,
  createWorkLogAction,
  reviewWorkLogAction,
  inviteUserAction,
  assignUserToProjectAction,
  removeUserFromProjectAction,
  updateProjectAction,
  createTaskAction,
  updateTaskStatusAction,
} from "@/app/dashboard/actions";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { __setMockUser } from "@/lib/auth";
import { createTestTenant, createTestUser, destroyTestTenants, type TestTenant } from "./helpers/test-tenant";

/**
 * Suite de Testes de Autorização invocando as Server Actions REAIS.
 * Usa duas empresas de teste isoladas (A e B), apagadas por completo no fim.
 */

function setTestUser(user: Parameters<typeof __setMockUser>[0]) {
  __setMockUser(user);
}

async function runRealActionTests(tenantA: TestTenant, tenantB: TestTenant) {
  console.log("=== EXECUTANDO TESTES COM AS SERVER ACTIONS REAIS ===\n");
  let passed = 0;
  const runId = tenantA.runId;

  const companyA = tenantA.company;
  const companyB = tenantB.company;
  const fullCompanyA = companyA;
  const fullCompanyB = companyB;

  const ownerAUser = tenantA.owner;
  const foremanAUser = tenantA.foreman;
  const workerAUser = tenantA.worker;
  const projectChiado = tenantA.project;
  const ownerBUser = tenantB.owner;

  // Segundo encarregado na Empresa A, NÃO atribuído à obra
  const unassignedForeman = await createTestUser(companyA.id, Role.FOREMAN, "encarregado-sem-obra", runId);

  // -------------------------------------------------------------------------
  // TESTE 1: Encarregado NÃO cria registo em obra onde NÃO está atribuído
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...unassignedForeman,
      company: fullCompanyA,
    });

    const formData = new FormData();
    formData.set("projectId", projectChiado.id);
    formData.set("workDate", "2026-11-08");
    formData.set("hours", "8");

    const res = await createWorkLogAction(formData);
    assert.strictEqual(
      res?.error,
      "Não está atribuído a esta obra. Apenas pode registar trabalho em obras designadas."
    );
    passed++;
    console.log("✔ Teste 1: createWorkLogAction rejeita Encarregado não atribuído à obra");
  }

  // -------------------------------------------------------------------------
  // TESTE 2: Funcionário cria registo com sucesso na obra onde ESTÁ atribuído
  // -------------------------------------------------------------------------
  let createdLogId = "";
  {
    setTestUser({
      ...workerAUser,
      company: fullCompanyA,
    });

    const formData = new FormData();
    formData.set("projectId", projectChiado.id);
    formData.set("workDate", "2026-11-08");
    formData.set("hours", "7.5");
    formData.set("description", "Trabalhos de assentamento cerâmico");

    const res = await createWorkLogAction(formData);
    assert.strictEqual(res?.success, true);

    const log = await prisma.workLog.findFirst({
      where: { authorId: workerAUser.id, projectId: projectChiado.id },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(log);
    createdLogId = log.id;
    passed++;
    console.log("✔ Teste 2: createWorkLogAction permite registo a Funcionário com ProjectAssignment");
  }

  // -------------------------------------------------------------------------
  // TESTE 3: Encarregado NÃO valida registo de obra onde NÃO é o responsável (isLead)
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...unassignedForeman,
      company: fullCompanyA,
    });

    const res = await reviewWorkLogAction(createdLogId, "VALIDATED");
    assert.strictEqual(
      res?.error,
      "Não tem permissão para validar registos de obras onde não é o responsável."
    );
    passed++;
    console.log("✔ Teste 3: reviewWorkLogAction bloqueia Encarregado que não seja isLead da obra");
  }

  // -------------------------------------------------------------------------
  // TESTE 4: NINGUÉM pode validar ou rejeitar o seu próprio registo
  // -------------------------------------------------------------------------
  {
    // Criar um registo pelo Encarregado responsável na sua própria obra
    setTestUser({
      ...foremanAUser,
      company: fullCompanyA,
    });

    const formData = new FormData();
    formData.set("projectId", projectChiado.id);
    formData.set("workDate", "2026-11-08");
    formData.set("hours", "8");
    formData.set("description", "Coordenação de estaleiro");
    await createWorkLogAction(formData);

    const ownLog = await prisma.workLog.findFirst({
      where: { authorId: foremanAUser.id, projectId: projectChiado.id },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(ownLog);

    // O Encarregado tenta validar o seu próprio registo
    const ownReviewRes = await reviewWorkLogAction(ownLog.id, "VALIDATED");
    assert.strictEqual(
      ownReviewRes?.error,
      "Não pode aprovar ou rejeitar os seus próprios registos de trabalho."
    );
    passed++;
    console.log("✔ Teste 4: reviewWorkLogAction impede validação do próprio registo");
  }

  // -------------------------------------------------------------------------
  // TESTE 5: Dono pode validar registo de terceiros com sucesso
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...ownerAUser,
      company: fullCompanyA,
    });

    const res = await reviewWorkLogAction(createdLogId, "VALIDATED");
    assert.strictEqual(res?.success, true);
    passed++;
    console.log("✔ Teste 5: reviewWorkLogAction permite ao Dono validar registos de outros");
  }

  // -------------------------------------------------------------------------
  // TESTE 6: Isolamento Multi-Tenant: Utilizador da Empresa B não acede a logs da Empresa A
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...ownerBUser,
      company: fullCompanyB,
    });

    const res = await reviewWorkLogAction(createdLogId, "VALIDATED");
    assert.strictEqual(res?.error, "Registo não encontrado ou inacessível.");
    passed++;
    console.log("✔ Teste 6: reviewWorkLogAction bloqueia acesso cruzado entre empresas (Multi-Tenant)");
  }

  // -------------------------------------------------------------------------
  // TESTE 7: Convite com geração de password segura e bloqueio de criação de OWNER
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...ownerAUser,
      company: fullCompanyA,
    });

    const formOwner = new FormData();
    formOwner.set("name", "Invasor");
    formOwner.set("email", "invasor@teste.pt");
    formOwner.set("role", "OWNER");

    const resOwner = await inviteUserAction(formOwner);
    assert.ok(resOwner?.error);
    assert.ok(resOwner.error.includes("FOREMAN") || resOwner.error.includes("não autorizado"));

    const formWorker = new FormData();
    const uniqueEmail = `novo_worker_${Date.now()}@teste.pt`;
    formWorker.set("name", "Novo Operador");
    formWorker.set("email", uniqueEmail);
    formWorker.set("role", "WORKER");

    const resWorker = await inviteUserAction(formWorker);
    assert.strictEqual(resWorker?.success, true);
    assert.ok(resWorker?.temporaryPassword);
    assert.ok(resWorker.temporaryPassword.length >= 8);
    passed++;
    console.log("✔ Teste 7: inviteUserAction gera palavra-passe temporária e rejeita perfil OWNER");
  }

  // -------------------------------------------------------------------------
  // TESTE 8: Utilizador desativado perde o acesso
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...workerAUser,
      status: "INACTIVE",
      company: fullCompanyA,
    });

    await assert.rejects(async () => {
      const formData = new FormData();
      formData.set("projectId", projectChiado.id);
      formData.set("workDate", "2026-11-08");
      formData.set("hours", "8");
      await createWorkLogAction(formData);
    }, /NEXT_REDIRECT/);
    passed++;
    console.log("✔ Teste 8: Utilizador INACTIVE é redirecionado/bloqueado em requireUser()");
  }

  // -------------------------------------------------------------------------
  // TESTE 9: Alocação - Utilizador de outra empresa é rejeitado
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...ownerAUser,
      company: fullCompanyA,
    });

    const res = await assignUserToProjectAction(projectChiado.id, ownerBUser.id, false);
    assert.strictEqual(res?.error, "Utilizador não encontrado ou inativo.");
    passed++;
    console.log("✔ Teste 9: assignUserToProjectAction rejeita utilizador de outra empresa");
  }

  // -------------------------------------------------------------------------
  // TESTE 10: Alocação - Utilizador inativo da mesma empresa é rejeitado
  // -------------------------------------------------------------------------
  {
    const inactiveUser = await createTestUser(companyA.id, Role.WORKER, "inativo-alocacao", runId, "INACTIVE");

    setTestUser({
      ...ownerAUser,
      company: fullCompanyA,
    });

    const res = await assignUserToProjectAction(projectChiado.id, inactiveUser.id, false);
    assert.strictEqual(res?.error, "Utilizador não encontrado ou inativo.");
    passed++;
    console.log("✔ Teste 10: assignUserToProjectAction rejeita utilizador inativo");
  }

  // -------------------------------------------------------------------------
  // TESTE 11: Alocação - FOREMAN a tentar atribuir outro FOREMAN é rejeitado
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...foremanAUser,
      company: fullCompanyA,
    });

    const res = await assignUserToProjectAction(projectChiado.id, unassignedForeman.id, false);
    assert.strictEqual(
      res?.error,
      "O Encarregado apenas pode alocar trabalhadores operacionais (WORKER) à obra."
    );
    passed++;
    console.log("✔ Teste 11: FOREMAN a atribuir outro FOREMAN é rejeitado");
  }

  // -------------------------------------------------------------------------
  // TESTE 12: Alocação - FOREMAN em obra alheia (onde não é isLead) é rejeitado
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...unassignedForeman,
      company: fullCompanyA,
    });

    const res = await assignUserToProjectAction(projectChiado.id, workerAUser.id, false);
    assert.strictEqual(res?.error, "Não tem permissão para gerir esta obra.");
    passed++;
    console.log("✔ Teste 12: FOREMAN em obra alheia (não isLead) é rejeitado");
  }

  // -------------------------------------------------------------------------
  // TESTE 13: Remoção - Impedir remover o único responsável (isLead) da obra
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...ownerAUser,
      company: fullCompanyA,
    });

    // projectChiado tem apenas foremanAUser como isLead
    const res = await removeUserFromProjectAction(projectChiado.id, foremanAUser.id);
    assert.strictEqual(
      res?.error,
      "Não pode remover o único responsável da obra. Atribua outro encarregado primeiro."
    );
    passed++;
    console.log("✔ Teste 13: removeUserFromProjectAction impede remover o único responsável da obra");
  }

  // -------------------------------------------------------------------------
  // TESTE 14: updateProjectAction usa isolamento por companyId
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...ownerBUser,
      company: fullCompanyB,
    });

    const form = new FormData();
    form.set("name", "Obra Invadida");
    const res = await updateProjectAction(projectChiado.id, form);
    assert.strictEqual(res?.error, "Obra não encontrada.");
    passed++;
    console.log("✔ Teste 14: updateProjectAction não permite editar obra de outra empresa");
  }

  // -------------------------------------------------------------------------
  // TESTE 15: mustChangePassword - requireUser() bloqueia e redireciona para /dashboard/perfil
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...workerAUser,
      mustChangePassword: true,
      company: fullCompanyA,
    });

    await assert.rejects(async () => {
      const formData = new FormData();
      formData.set("projectId", projectChiado.id);
      formData.set("workDate", "2026-11-08");
      formData.set("hours", "8");
      await createWorkLogAction(formData);
    }, (err: unknown) => {
      return String(err).includes("password_change_required") || String(err).includes("NEXT_REDIRECT");
    });
    passed++;
    console.log("✔ Teste 15: requireUser() redireciona para /dashboard/perfil se mustChangePassword estiver ativo");
  }

  // -------------------------------------------------------------------------
  // TESTE 16: FOREMAN e WORKER não acedem ao componente/dados do OwnerDashboard
  // -------------------------------------------------------------------------
  {
    const OwnerDashboard = (await import("@/app/dashboard/owner-dashboard")).default;

    // Testar com FOREMAN
    setTestUser({
      ...foremanAUser,
      company: fullCompanyA,
    });

    await assert.rejects(async () => {
      await OwnerDashboard({});
    }, (err: unknown) => {
      return String(err).includes("unauthorized") || String(err).includes("NEXT_REDIRECT");
    });

    // Testar com WORKER
    setTestUser({
      ...workerAUser,
      company: fullCompanyA,
    });

    await assert.rejects(async () => {
      await OwnerDashboard({});
    }, (err: unknown) => {
      return String(err).includes("unauthorized") || String(err).includes("NEXT_REDIRECT");
    });

    passed++;
    console.log("✔ Teste 16: OwnerDashboard bloqueia acesso a FOREMAN e WORKER (requireRole([Role.OWNER]))");
  }

  // -------------------------------------------------------------------------
  // TESTE 17: OWNER cria tarefa (com ou sem obra) para utilizador ativo
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...ownerAUser,
      company: fullCompanyA,
    });

    const formData = new FormData();
    formData.set("title", "Visita Técnica Preliminar");
    formData.set("assignedToId", foremanAUser.id);
    formData.set("dueDate", "2026-11-20T10:00");

    const res = await createTaskAction(formData);
    assert.strictEqual(res.success, true);

    const taskCreated = await prisma.task.findFirst({
      where: { title: "Visita Técnica Preliminar", companyId: companyA.id },
    });
    assert.ok(taskCreated);
    assert.strictEqual(taskCreated.assignedToId, foremanAUser.id);
    assert.strictEqual(taskCreated.projectId, null);
    assert.strictEqual(taskCreated.status, "PENDING");

    passed++;
    console.log("✔ Teste 17: OWNER cria tarefa sem projectId para utilizador ativo");
  }

  // -------------------------------------------------------------------------
  // TESTE 18: FOREMAN cria tarefa para WORKER atribuído à sua obra
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...foremanAUser,
      company: fullCompanyA,
    });

    const formData = new FormData();
    formData.set("title", "Verificar cofragem no piso 2");
    formData.set("assignedToId", workerAUser.id);
    formData.set("projectId", projectChiado.id);

    const res = await createTaskAction(formData);
    assert.strictEqual(res.success, true);

    const taskCreated = await prisma.task.findFirst({
      where: { title: "Verificar cofragem no piso 2", companyId: companyA.id },
    });
    assert.ok(taskCreated);
    assert.strictEqual(taskCreated.assignedToId, workerAUser.id);
    assert.strictEqual(taskCreated.projectId, projectChiado.id);

    passed++;
    console.log("✔ Teste 18: FOREMAN cria tarefa para WORKER da sua obra com sucesso");
  }

  // -------------------------------------------------------------------------
  // TESTE 19: FOREMAN falha ao criar tarefa para utilizador fora da sua obra ou sem projectId
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...foremanAUser,
      company: fullCompanyA,
    });

    // Sem projectId
    const formDataNoProject = new FormData();
    formDataNoProject.set("title", "Tarefa Geral Inválida");
    formDataNoProject.set("assignedToId", workerAUser.id);

    const resNoProject = await createTaskAction(formDataNoProject);
    assert.ok(resNoProject?.error);

    // Obra de outra empresa
    const projectB = await prisma.project.create({
      data: {
        companyId: companyB.id,
        name: "Obra Outra Empresa",
        status: "ACTIVE",
      },
    });

    const formDataOtherProject = new FormData();
    formDataOtherProject.set("title", "Tarefa em Obra Alheia");
    formDataOtherProject.set("assignedToId", workerAUser.id);
    formDataOtherProject.set("projectId", projectB.id);

    const resOtherProject = await createTaskAction(formDataOtherProject);
    assert.ok(resOtherProject?.error);

    passed++;
    console.log("✔ Teste 19: FOREMAN é impedido de criar tarefa sem obra ou em obra onde não é encarregado");
  }

  // -------------------------------------------------------------------------
  // TESTE 20: Atribuição a utilizador de outra empresa ou inativo é recusada
  // -------------------------------------------------------------------------
  {
    setTestUser({
      ...ownerAUser,
      company: fullCompanyA,
    });

    // Utilizador de outra empresa (ownerBUser)
    const formDataOtherCompany = new FormData();
    formDataOtherCompany.set("title", "Tarefa Empresa Cruzada");
    formDataOtherCompany.set("assignedToId", ownerBUser.id);

    const resCrossCompany = await createTaskAction(formDataOtherCompany);
    assert.ok(resCrossCompany?.error);

    // Utilizador inativo
    const inactiveUser = await createTestUser(companyA.id, Role.WORKER, "inativo-tarefa", runId, "INACTIVE");

    const formDataInactive = new FormData();
    formDataInactive.set("title", "Tarefa para Inativo");
    formDataInactive.set("assignedToId", inactiveUser.id);

    const resInactive = await createTaskAction(formDataInactive);
    assert.ok(resInactive?.error);

    passed++;
    console.log("✔ Teste 20: Atribuição de tarefa a utilizador de outra empresa ou inativo é recusada");
  }

  // -------------------------------------------------------------------------
  // TESTE 21: Atribuído altera estado (PENDING <-> COMPLETED); não-atribuído é recusado
  // -------------------------------------------------------------------------
  {
    // Criar tarefa atribuída a workerA
    const testTask = await prisma.task.create({
      data: {
        companyId: companyA.id,
        createdById: ownerAUser.id,
        assignedToId: workerAUser.id,
        title: "Pintar rodapé sala 1",
        status: "PENDING",
      },
    });

    // Outro utilizador sem relação tenta alterar: recusa
    setTestUser({
      ...unassignedForeman,
      company: fullCompanyA,
    });

    const resUnauthorized = await updateTaskStatusAction(testTask.id, "COMPLETED");
    assert.ok(resUnauthorized?.error);

    // O utilizador atribuído (workerA) completa a tarefa: sucesso
    setTestUser({
      ...workerAUser,
      company: fullCompanyA,
    });

    const resComplete = await updateTaskStatusAction(testTask.id, "COMPLETED");
    assert.strictEqual(resComplete.success, true);

    // O utilizador atribuído reabre a tarefa (volta a PENDING): sucesso
    const resReopen = await updateTaskStatusAction(testTask.id, "PENDING");
    assert.strictEqual(resReopen.success, true);

    passed++;
    console.log("✔ Teste 21: Atribuído pode concluir e reabrir tarefa; terceiros sem permissão são recusados");
  }

  // -------------------------------------------------------------------------
  // TESTE 22: Só OWNER ou criador pode cancelar tarefa; atribuído não cancela
  // -------------------------------------------------------------------------
  {
    const cancelTask = await prisma.task.create({
      data: {
        companyId: companyA.id,
        createdById: ownerAUser.id,
        assignedToId: workerAUser.id,
        title: "Instalar calha técnica",
        status: "PENDING",
      },
    });

    // workerA (atribuído) tenta cancelar: recusa
    setTestUser({
      ...workerAUser,
      company: fullCompanyA,
    });

    const resWorkerCancel = await updateTaskStatusAction(cancelTask.id, "CANCELLED");
    assert.ok(resWorkerCancel?.error);

    // owner cancela: sucesso
    setTestUser({
      ...ownerAUser,
      company: fullCompanyA,
    });

    const resOwnerCancel = await updateTaskStatusAction(cancelTask.id, "CANCELLED");
    assert.strictEqual(resOwnerCancel.success, true);

    passed++;
    console.log("✔ Teste 22: Só OWNER ou criador pode cancelar tarefa; atribuído é recusado");
  }

  // -------------------------------------------------------------------------
  // TESTE 23: Tarefa CANCELLED não pode ter transição para COMPLETED ou PENDING
  // -------------------------------------------------------------------------
  {
    const cancelledTask = await prisma.task.create({
      data: {
        companyId: companyA.id,
        createdById: ownerAUser.id,
        assignedToId: workerAUser.id,
        title: "Tarefa já cancelada",
        status: "CANCELLED",
      },
    });

    setTestUser({
      ...ownerAUser,
      company: fullCompanyA,
    });

    const resTryComplete = await updateTaskStatusAction(cancelledTask.id, "COMPLETED");
    assert.ok(resTryComplete?.error);

    const resTryReopen = await updateTaskStatusAction(cancelledTask.id, "PENDING");
    assert.ok(resTryReopen?.error);

    passed++;
    console.log("✔ Teste 23: Transições a partir do estado CANCELLED são estritamente recusadas");
  }

  // -------------------------------------------------------------------------
  // TESTE 24: Utilizador de outra empresa não consegue aceder/alterar tarefa (isolamento multi-tenant)
  // -------------------------------------------------------------------------
  {
    const companyATask = await prisma.task.create({
      data: {
        companyId: companyA.id,
        createdById: ownerAUser.id,
        assignedToId: workerAUser.id,
        title: "Tarefa Privada Empresa A",
        status: "PENDING",
      },
    });

    // Utilizador da Empresa B tenta alterar tarefa da Empresa A
    setTestUser({
      ...ownerBUser,
      company: fullCompanyB,
    });

    const resCrossUpdate = await updateTaskStatusAction(companyATask.id, "COMPLETED");
    assert.ok(resCrossUpdate?.error);

    passed++;
    console.log("✔ Teste 24: Utilizador de outra empresa tem acesso recusado (isolamento multi-tenant)");
  }

  // -------------------------------------------------------------------------
  // TESTE 25: Não é possível criar obra ligada a cliente de outra empresa
  // -------------------------------------------------------------------------
  {
    const companyAClient = await prisma.client.create({
      data: { companyId: companyA.id, name: "Cliente Privado Empresa A", nif: "999888777" },
    });

    setTestUser({
      ...ownerBUser,
      company: fullCompanyB,
    });

    const projectName = `Obra Cruzada ${Date.now()}`;
    const formData = new FormData();
    formData.set("name", projectName);
    formData.set("clientId", companyAClient.id);
    formData.set("clientName", "Nome qualquer");

    try {
      const res = await createProjectAction(formData);
      assert.ok(res?.error, "Devia recusar cliente de outra empresa");

      const leaked = await prisma.project.count({ where: { name: projectName } });
      assert.strictEqual(leaked, 0);
    } finally {
      await prisma.client.delete({ where: { id: companyAClient.id } });
    }

    passed++;
    console.log("✔ Teste 25: Obra não pode ser ligada a cliente de outra empresa (isolamento multi-tenant)");
  }

  // -------------------------------------------------------------------------
  // TESTE 26: Não é possível despromover o único responsável através da alocação (upsert)
  // -------------------------------------------------------------------------
  {
    setTestUser({ ...ownerAUser, company: fullCompanyA });

    const leadsBefore = await prisma.projectAssignment.count({ where: { projectId: projectChiado.id, isLead: true } });
    assert.strictEqual(leadsBefore, 1, "A obra Chiado devia ter exatamente um responsável no seed");

    const res = await assignUserToProjectAction(projectChiado.id, foremanAUser.id, false);
    assert.ok(res?.error, "Devia recusar retirar o único responsável");

    const stillLead = await prisma.projectAssignment.findUnique({
      where: { projectId_userId: { projectId: projectChiado.id, userId: foremanAUser.id } },
      select: { isLead: true },
    });
    assert.strictEqual(stillLead?.isLead, true);

    passed++;
    console.log("✔ Teste 26: assignUserToProjectAction não deixa a obra sem responsável");
  }

  // -------------------------------------------------------------------------
  // TESTE 27: Tarefa concluída não pode ser cancelada; estado inválido é recusado
  // -------------------------------------------------------------------------
  {
    const completedTask = await prisma.task.create({
      data: {
        companyId: companyA.id,
        createdById: ownerAUser.id,
        assignedToId: workerAUser.id,
        title: "Tarefa Concluída Teste 27",
        status: "COMPLETED",
      },
    });

    setTestUser({ ...ownerAUser, company: fullCompanyA });

    try {
      const resCancel = await updateTaskStatusAction(completedTask.id, "CANCELLED");
      assert.ok(resCancel?.error, "COMPLETED -> CANCELLED devia ser recusado");

      const resInvalid = await updateTaskStatusAction(completedTask.id, "ARCHIVED" as unknown as "PENDING");
      assert.ok(resInvalid?.error, "Estado inválido devia ser recusado");

      const after = await prisma.task.findUnique({ where: { id: completedTask.id }, select: { status: true } });
      assert.strictEqual(after?.status, "COMPLETED");
    } finally {
      await prisma.task.delete({ where: { id: completedTask.id } });
    }

    passed++;
    console.log("✔ Teste 27: Máquina de estados de tarefas validada em runtime (só PENDING -> CANCELLED)");
  }

  // -------------------------------------------------------------------------
  // TESTE 28: Revisão de registo recusa estado inválido e motivo demasiado longo
  // -------------------------------------------------------------------------
  {
    setTestUser({ ...ownerAUser, company: fullCompanyA });

    const pendingLog = await prisma.workLog.create({
      data: {
        companyId: companyA.id,
        projectId: projectChiado.id,
        authorId: workerAUser.id,
        workDate: new Date("2026-11-10T00:00:00.000Z"),
        hours: 4,
        status: "PENDING",
      },
    });

    try {
      const resInvalid = await reviewWorkLogAction(pendingLog.id, "PENDING" as unknown as "VALIDATED");
      assert.ok(resInvalid?.error, "Estado PENDING não é uma decisão de revisão válida");

      const resLong = await reviewWorkLogAction(pendingLog.id, "REJECTED", "x".repeat(501));
      assert.ok(resLong?.error, "Motivo com mais de 500 carateres devia ser recusado");

      const after = await prisma.workLog.findUnique({ where: { id: pendingLog.id }, select: { status: true } });
      assert.strictEqual(after?.status, "PENDING");
    } finally {
      await prisma.workLog.delete({ where: { id: pendingLog.id } });
    }

    passed++;
    console.log("✔ Teste 28: reviewWorkLogAction valida estado e motivo em runtime");
  }

  // -------------------------------------------------------------------------
  // TESTE 29: Data limite da tarefa é interpretada no fuso Europe/Lisbon
  // -------------------------------------------------------------------------
  {
    setTestUser({ ...ownerAUser, company: fullCompanyA });

    const title = `Tarefa Fuso ${Date.now()}`;
    const formData = new FormData();
    formData.set("title", title);
    formData.set("assignedToId", workerAUser.id);
    formData.set("dueDate", "2026-07-15T10:00"); // Verão: Lisboa = UTC+1

    const res = await createTaskAction(formData);
    assert.ok(res?.success, res?.error);

    const created = await prisma.task.findFirst({ where: { title }, select: { id: true, dueDate: true } });
    try {
      assert.strictEqual(created?.dueDate?.toISOString(), "2026-07-15T09:00:00.000Z");

      const invalid = new FormData();
      invalid.set("title", `${title} inválida`);
      invalid.set("assignedToId", workerAUser.id);
      invalid.set("dueDate", "2026-02-31T10:00");
      const resInvalid = await createTaskAction(invalid);
      assert.ok(resInvalid?.error, "Data inexistente devia ser recusada");
    } finally {
      if (created) await prisma.task.delete({ where: { id: created.id } });
    }

    passed++;
    console.log("✔ Teste 29: Data limite de tarefa convertida a partir de Europe/Lisbon");
  }

  // -------------------------------------------------------------------------
  // TESTE 30: Editar obra grava o cliente associado e recusa cliente de outra empresa
  // -------------------------------------------------------------------------
  {
    const editableProject = await prisma.project.create({
      data: { companyId: companyA.id, name: `Obra Editável ${Date.now()}` },
    });
    const ownClient = await prisma.client.create({ data: { companyId: companyA.id, name: "Cliente Próprio A" } });
    const foreignClient = await prisma.client.create({ data: { companyId: companyB.id, name: "Cliente Empresa B" } });

    setTestUser({ ...ownerAUser, company: fullCompanyA });

    try {
      const valid = new FormData();
      valid.set("name", editableProject.name);
      valid.set("clientId", ownClient.id);
      valid.set("budget", "1234.56");
      const resValid = await updateProjectAction(editableProject.id, valid);
      assert.ok(resValid?.success, resValid?.error);

      const saved = await prisma.project.findUnique({
        where: { id: editableProject.id },
        select: { clientId: true, clientName: true, budget: true },
      });
      assert.strictEqual(saved?.clientId, ownClient.id);
      assert.strictEqual(saved?.clientName, "Cliente Próprio A");
      assert.strictEqual(saved?.budget?.toString(), "1234.56");

      const foreign = new FormData();
      foreign.set("name", editableProject.name);
      foreign.set("clientId", foreignClient.id);
      const resForeign = await updateProjectAction(editableProject.id, foreign);
      assert.ok(resForeign?.error, "Cliente de outra empresa devia ser recusado");

      const afterForeign = await prisma.project.findUnique({ where: { id: editableProject.id }, select: { clientId: true } });
      assert.strictEqual(afterForeign?.clientId, ownClient.id);
    } finally {
      await prisma.project.delete({ where: { id: editableProject.id } });
      await prisma.client.deleteMany({ where: { id: { in: [ownClient.id, foreignClient.id] } } });
    }

    passed++;
    console.log("✔ Teste 30: updateProjectAction grava cliente (validado por empresa) e orçamento em Decimal");
  }

  console.log(`\n🎉 Todos os ${passed} testes das Server Actions reais passaram com sucesso!`);
}

async function main() {
  const tenantA = await createTestTenant("a");
  const tenantB = await createTestTenant("b");
  try {
    await runRealActionTests(tenantA, tenantB);
  } catch (err) {
    console.error("Falha nos testes:", err);
    process.exitCode = 1;
  } finally {
    await destroyTestTenants([tenantA.company.id, tenantB.company.id]);
    await prisma.$disconnect();
  }
}

main();
