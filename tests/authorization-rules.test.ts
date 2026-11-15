import assert from "node:assert";
import {
  createWorkLogAction,
  reviewWorkLogAction,
  inviteUserAction,
  assignUserToProjectAction,
  removeUserFromProjectAction,
  updateProjectAction,
  createTaskAction,
  updateTaskStatusAction,
} from "@/app/dashboard/actions";
import { prisma } from "@/lib/prisma";
import { __setMockUser } from "@/lib/auth";

/**
 * Suite de Testes de Autorização invocando as Server Actions REAIS
 */

function setTestUser(user: Parameters<typeof __setMockUser>[0]) {
  __setMockUser(user);
}

async function runRealActionTests() {
  console.log("=== EXECUTANDO TESTES COM AS SERVER ACTIONS REAIS ===\n");
  let passed = 0;

  // Obter empresas e utilizadores reais ou criar contexto na BD
  const companyA = await prisma.company.findFirst({ where: { nif: "501234567" } });
  if (!companyA) {
    throw new Error("Empresa principal do seed não encontrada na base de dados.");
  }

  // Criar ou obter uma segunda empresa B para testar isolamento multi-tenant
  const companyB = await prisma.company.upsert({
    where: { nif: "509999999" },
    update: {},
    create: {
      name: "Construtora B, Lda.",
      nif: "509999999",
    },
  });

  const fullCompanyA = {
    id: companyA.id,
    name: companyA.name,
    nif: companyA.nif,
    address: companyA.address,
    phone: companyA.phone,
    createdAt: companyA.createdAt,
    updatedAt: companyA.updatedAt,
  };

  const fullCompanyB = {
    id: companyB.id,
    name: companyB.name,
    nif: companyB.nif,
    address: companyB.address,
    phone: companyB.phone,
    createdAt: companyB.createdAt,
    updatedAt: companyB.updatedAt,
  };

  // Obter utilizadores da empresa A
  const ownerAUser = await prisma.user.findFirst({ where: { companyId: companyA.id, role: "OWNER" } });
  const foremanAUser = await prisma.user.findFirst({ where: { companyId: companyA.id, role: "FOREMAN" } });
  const workerAUser = await prisma.user.findFirst({ where: { companyId: companyA.id, role: "WORKER" } });
  const projectChiado = await prisma.project.findFirst({ where: { companyId: companyA.id } });

  if (!ownerAUser || !foremanAUser || !workerAUser || !projectChiado) {
    throw new Error("Dados de teste de seed incompletos na BD.");
  }

  // Criar utilizador de outra empresa B
  const ownerBUser = await prisma.user.upsert({
    where: { email: "dono_empresa_b@teste.pt" },
    update: { companyId: companyB.id, role: "OWNER", status: "ACTIVE" },
    create: {
      name: "Dono Empresa B",
      email: "dono_empresa_b@teste.pt",
      password: "HashPassword123!",
      role: "OWNER",
      status: "ACTIVE",
      companyId: companyB.id,
    },
  });

  // Criar um segundo encarregado na Empresa A mas NÃO atribuído à obra Chiado
  const unassignedForeman = await prisma.user.upsert({
    where: { email: "encarregado_sem_obra@medido.pt" },
    update: { companyId: companyA.id, role: "FOREMAN", status: "ACTIVE" },
    create: {
      name: "Encarregado Sem Obra",
      email: "encarregado_sem_obra@medido.pt",
      password: "HashPassword123!",
      role: "FOREMAN",
      status: "ACTIVE",
      companyId: companyA.id,
    },
  });

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
    const inactiveUser = await prisma.user.upsert({
      where: { email: "inativo_empresa_a@medido.pt" },
      update: { status: "INACTIVE" },
      create: {
        name: "Inativo A",
        email: "inativo_empresa_a@medido.pt",
        password: "HashPassword123!",
        role: "WORKER",
        status: "INACTIVE",
        companyId: companyA.id,
      },
    });

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
    const inactiveUser = await prisma.user.upsert({
      where: { email: "inativo-task@construtora-silva.pt" },
      update: { status: "INACTIVE" },
      create: {
        companyId: companyA.id,
        email: "inativo-task@construtora-silva.pt",
        name: "Trabalhador Inativo",
        role: "WORKER",
        status: "INACTIVE",
        password: "HashPassword123!",
      },
    });

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

  console.log(`\n🎉 Todos os ${passed} testes das Server Actions reais passaram com sucesso!`);
}

runRealActionTests()
  .catch((err) => {
    console.error("Falha nos testes:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
