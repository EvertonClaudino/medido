import assert from "node:assert/strict";
import test from "node:test";
import { Role, ProjectStatus } from "@prisma/client";
import { __setMockUser } from "@/lib/auth";
import ObrasPage from "@/app/dashboard/obras/page";
import AsMinhasObrasPage from "@/app/dashboard/as-minhas-obras/page";
import { createProjectAction, updateProjectAction } from "@/app/dashboard/actions";
import { projectSchema } from "@/lib/validations/project";
import {
  calculateProjectProgress,
  isProjectDelayed,
} from "@/lib/project-utils";
import { prisma } from "@/lib/prisma";
import { getLisbonStartOfDay } from "@/lib/dashboard-utils";

function mockUser(role: Role) {
  const timestamp = new Date();
  return {
    id: `test-user-${role.toLowerCase()}`,
    name: `Utilizador ${role}`,
    email: `${role.toLowerCase()}@construtora.test`,
    role,
    status: "ACTIVE" as const,
    mustChangePassword: false,
    companyId: "company-test-123",
    createdAt: timestamp,
    updatedAt: timestamp,
    company: {
      id: "company-test-123",
      name: "Construtora Teste, Lda.",
      nif: "501234567",
      address: "Rua Central, Lisboa",
      phone: "+351 912345678",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
}

test("1. Autorização: FOREMAN e WORKER não acedem a ObrasPage (não recebem orçamento nem dados do cliente)", async () => {
  for (const role of [Role.FOREMAN, Role.WORKER]) {
    __setMockUser(mockUser(role));
    await assert.rejects(
      async () => {
        await ObrasPage();
      },
      (error: unknown) => {
        const isRedirect =
          error instanceof Error && error.message.includes("NEXT_REDIRECT");
        return isRedirect;
      },
      `Utilizador com role ${role} deveria ser redirecionado/bloqueado em ObrasPage`
    );
  }
});

test("2. Autorização: WORKER não acede a AsMinhasObrasPage", async () => {
  __setMockUser(mockUser(Role.WORKER));
  await assert.rejects(
    async () => {
      await AsMinhasObrasPage();
    },
    (error: unknown) => {
      const isRedirect =
        error instanceof Error && error.message.includes("NEXT_REDIRECT");
      return isRedirect;
    },
    "WORKER deve ser impedido de aceder a AsMinhasObrasPage"
  );
});

test("3. Validação Zod (projectSchema): data de conclusão não pode ser anterior à data de início", () => {
  // Caso inválido: conclusão anterior ao início
  const invalidDates = projectSchema.safeParse({
    name: "Edifício Lisboa",
    startDate: "2026-11-20",
    endDate: "2026-11-10",
  });
  assert.strictEqual(invalidDates.success, false);
  if (!invalidDates.success) {
    const issue = invalidDates.error.issues.find((i) => i.path.includes("endDate"));
    assert.ok(issue, "Deve emitir issue no campo endDate");
    assert.strictEqual(
      issue?.message,
      "A data de conclusão não pode ser anterior à data de início."
    );
  }

  // Caso válido: conclusão posterior ao início
  const validDates = projectSchema.safeParse({
    name: "Edifício Lisboa",
    startDate: "2026-11-10",
    endDate: "2026-11-20",
  });
  assert.strictEqual(validDates.success, true);

  // Caso válido: mesma data de início e conclusão (trabalho de 1 dia)
  const sameDay = projectSchema.safeParse({
    name: "Reparação de Pavimento",
    startDate: "2026-11-15",
    endDate: "2026-11-15",
  });
  assert.strictEqual(sameDay.success, true);

  // Caso válido: sem datas preenchidas (datas são opcionais)
  const noDates = projectSchema.safeParse({
    name: "Obra Sem Prazos Definidos",
  });
  assert.strictEqual(noDates.success, true);
});

test("4. Unicidade de código: código duplicado na mesma empresa é recusado", async () => {
  const originalCreate = prisma.project.create;

  try {
    // Simula que a base de dados disparou o erro P2002 de Unique Constraint em (companyId, code)
    prisma.project.create = (async () => {
      const err = new Error("Unique constraint failed on the constraint: projects_companyId_code_key");
      (err as unknown as { code: string }).code = "P2002";
      throw err;
    }) as unknown as typeof prisma.project.create;

    __setMockUser(mockUser(Role.OWNER));

    const formData = new FormData();
    formData.set("name", "Nova Obra com Código Conflituoso");
    formData.set("code", "OBR-2026-001");

    const result = await createProjectAction(formData);
    assert.ok(result?.error, "Deveria retornar erro de código duplicado");
    assert.strictEqual(
      result?.error,
      "Já existe uma obra com este código na empresa."
    );
  } finally {
    prisma.project.create = originalCreate;
  }
});

test("5. Regra de negócio: 'Progresso geral' e cálculo do estado 'Em Atraso' (funções puras em lib/project-utils)", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  const startOfToday = getLisbonStartOfDay(now);

  // Obra Ativa com data de conclusão expirada (ontem) -> Em Atraso
  const expiredEndDate = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  assert.strictEqual(
    isProjectDelayed({ status: ProjectStatus.ACTIVE, endDate: expiredEndDate }, now),
    true
  );

  // Obra Ativa com data de conclusão hoje -> NÃO está em atraso (termina hoje)
  const todayEndDate = new Date(startOfToday.getTime() + 2 * 60 * 60 * 1000);
  assert.strictEqual(
    isProjectDelayed({ status: ProjectStatus.ACTIVE, endDate: todayEndDate }, now),
    false
  );

  // Obra Concluída mesmo com prazo ultrapassado -> NÃO está em atraso
  assert.strictEqual(
    isProjectDelayed({ status: ProjectStatus.COMPLETED, endDate: expiredEndDate }, now),
    false
  );

  // Obra sem data de conclusão definida -> NÃO está em atraso
  assert.strictEqual(
    isProjectDelayed({ status: ProjectStatus.ACTIVE, endDate: null }, now),
    false
  );

  // Progresso baseado em tarefas: 3 de 4 concluídas = 75%
  assert.strictEqual(calculateProjectProgress(4, 3, ProjectStatus.ACTIVE), 75);

  // Sem tarefas: 0% se ACTIVE, 100% se COMPLETED
  assert.strictEqual(calculateProjectProgress(0, 0, ProjectStatus.ACTIVE), 0);
  assert.strictEqual(calculateProjectProgress(0, 0, ProjectStatus.COMPLETED), 100);
});

test("6. updateProjectAction usa o mesmo projectSchema (recusa datas inválidas e código duplicado)", async () => {
  __setMockUser(mockUser(Role.OWNER));

  const originalFindFirst = prisma.project.findFirst;
  const originalUpdate = prisma.project.update;

  try {
    prisma.project.findFirst = (async () => ({
      id: "proj_123",
      name: "Obra Existente",
      clientId: "cli_1",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2026-11-30"),
      quote: null,
    })) as unknown as typeof prisma.project.findFirst;

    // 1. Datas inválidas (endDate < startDate)
    const formInvalidDates = new FormData();
    formInvalidDates.set("name", "Obra com datas trocadas");
    formInvalidDates.set("startDate", "2026-11-20");
    formInvalidDates.set("endDate", "2026-11-10");

    const resInvalidDates = await updateProjectAction("proj_123", formInvalidDates);
    assert.strictEqual(
      resInvalidDates?.error,
      "A data de conclusão não pode ser anterior à data de início."
    );

    // 2. Erro P2002 de código duplicado
    prisma.project.update = (async () => {
      const err = new Error("Unique constraint failed on the fields: (`companyId`,`code`)");
      (err as unknown as { code: string }).code = "P2002";
      throw err;
    }) as unknown as typeof prisma.project.update;

    const formDuplicateCode = new FormData();
    formDuplicateCode.set("name", "Obra com código duplicado");
    formDuplicateCode.set("code", "OBR-2026-001");

    const resDuplicate = await updateProjectAction("proj_123", formDuplicateCode);
    assert.strictEqual(
      resDuplicate?.error,
      "Já existe uma obra com este código na empresa."
    );
  } finally {
    prisma.project.findFirst = originalFindFirst;
    prisma.project.update = originalUpdate;
  }
});
