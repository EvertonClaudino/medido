import { Role, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { __setMockUser } from "@/lib/auth";

/**
 * Empresas de teste isoladas para as suites que invocam Server Actions reais.
 * Cada suite cria as suas empresas (com sufixo único) e apaga-as no fim, sem depender
 * do seed nem deixar dados na base de dados de desenvolvimento.
 */

// Hash bcrypt fixo (palavra-passe irrelevante: os testes não fazem login)
const TEST_PASSWORD_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.3v3K1wQ6Vb0FZ6S3YzXo7m1QnN2a";

export const TEST_EMAIL_DOMAIN = "test.medido.invalid";

export function assertTestDatabase() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Os testes de integração recusam-se a correr com NODE_ENV=production.");
  }
}

export function uniqueRunId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function testEmail(label: string, runId: string) {
  return `${label}.${runId}@${TEST_EMAIL_DOMAIN}`;
}

export async function createTestUser(
  companyId: string,
  role: Role,
  label: string,
  runId: string,
  status: UserStatus = UserStatus.ACTIVE
) {
  return prisma.user.create({
    data: {
      companyId,
      role,
      status,
      name: `Teste ${label}`,
      email: testEmail(label, runId),
      password: TEST_PASSWORD_HASH,
    },
  });
}

/** Empresa com Dono, Encarregado (responsável da obra), Funcionário (na obra) e uma obra ativa. */
export async function createTestTenant(label: string) {
  assertTestDatabase();
  const runId = uniqueRunId();
  const company = await prisma.company.create({ data: { name: `TESTE ${label} ${runId}` } });
  const owner = await createTestUser(company.id, Role.OWNER, `dono-${label}`, runId);
  const foreman = await createTestUser(company.id, Role.FOREMAN, `encarregado-${label}`, runId);
  const worker = await createTestUser(company.id, Role.WORKER, `funcionario-${label}`, runId);
  const project = await prisma.project.create({
    data: {
      companyId: company.id,
      name: `Obra de Teste ${label}`,
      assignments: {
        create: [
          { userId: foreman.id, isLead: true },
          { userId: worker.id, isLead: false },
        ],
      },
    },
  });
  return { runId, company, owner, foreman, worker, project };
}

export type TestTenant = Awaited<ReturnType<typeof createTestTenant>>;

/** Formato esperado por __setMockUser (utilizador + empresa). */
export function asSessionUser(
  user: { id: string; name: string; email: string; role: Role; status: UserStatus; mustChangePassword: boolean; companyId: string; createdAt: Date; updatedAt: Date },
  company: { id: string; name: string; nif: string | null; address: string | null; phone: string | null; createdAt: Date; updatedAt: Date }
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    companyId: user.companyId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    company: {
      id: company.id,
      name: company.name,
      nif: company.nif,
      address: company.address,
      phone: company.phone,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    },
  };
}

/** Apaga tudo o que pertence às empresas indicadas, respeitando as chaves estrangeiras. */
export async function destroyTestTenants(companyIds: string[]) {
  __setMockUser(null);
  const where = { companyId: { in: companyIds } };
  await prisma.$transaction([
    prisma.workLogMeasurement.deleteMany({ where }),
    prisma.workLog.deleteMany({ where }),
    prisma.task.deleteMany({ where }),
    prisma.clientActivity.deleteMany({ where }),
    prisma.budget.deleteMany({ where }),
    prisma.visitRequest.deleteMany({ where }),
    prisma.project.deleteMany({ where }),
    prisma.client.deleteMany({ where }),
    prisma.user.deleteMany({ where }),
    prisma.company.deleteMany({ where: { id: { in: companyIds } } }),
  ]);
}
