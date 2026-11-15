import { PrismaClient, Role, UserStatus, ProjectStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.warn("⚠️ O seed está bloqueado em ambiente de produção (NODE_ENV=production).");
    process.exit(0);
  }

  console.log("A iniciar seed...");

  // Criar empresa inicial
  const company = await prisma.company.upsert({
    where: { nif: "501234567" },
    update: {},
    create: {
      name: "Medido Engenharia & Construção, Lda.",
      nif: "501234567",
    },
  });

  const passwordHash = await bcrypt.hash("Medido123!", 10);

  // 1. Dono da Empresa
  const owner = await prisma.user.upsert({
    where: { email: "dono@medido.pt" },
    update: { companyId: company.id, role: Role.OWNER, status: UserStatus.ACTIVE },
    create: {
      name: "Carlos Ferreira",
      email: "dono@medido.pt",
      password: passwordHash,
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
      companyId: company.id,
    },
  });

  // 2. Encarregado de Obra
  const foreman = await prisma.user.upsert({
    where: { email: "encarregado@medido.pt" },
    update: { companyId: company.id, role: Role.FOREMAN, status: UserStatus.ACTIVE },
    create: {
      name: "Manuel Silva",
      email: "encarregado@medido.pt",
      password: passwordHash,
      role: Role.FOREMAN,
      status: UserStatus.ACTIVE,
      companyId: company.id,
    },
  });

  // 3. Funcionário / Operacional
  const worker = await prisma.user.upsert({
    where: { email: "funcionario@medido.pt" },
    update: { companyId: company.id, role: Role.WORKER, status: UserStatus.ACTIVE },
    create: {
      name: "João Santos",
      email: "funcionario@medido.pt",
      password: passwordHash,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      companyId: company.id,
    },
  });

  // 4. Obras de Exemplo
  const project1 = await prisma.project.upsert({
    where: { id: "proj_reabilitacao_chiado" },
    update: {},
    create: {
      id: "proj_reabilitacao_chiado",
      companyId: company.id,
      name: "Reabilitação Edifício Chiado",
      code: "OBRA-2026-01",
      clientName: "Imobiliária Lusitana, S.A.",
      address: "Rua Garrett 42, Lisboa",
      budget: 185000.0,
      status: ProjectStatus.ACTIVE,
      startDate: new Date("2026-02-01"),
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: "proj_moradia_cascais" },
    update: {},
    create: {
      id: "proj_moradia_cascais",
      companyId: company.id,
      name: "Construção de Moradia Unifamiliar",
      code: "OBRA-2026-02",
      clientName: "Dr. Miguel Resende",
      address: "Quinta da Marinha, Cascais",
      budget: 420000.0,
      status: ProjectStatus.ACTIVE,
      startDate: new Date("2026-03-15"),
    },
  });

  // Atribuir encarregado à obra do Chiado
  await prisma.projectAssignment.upsert({
    where: {
      projectId_userId: {
        projectId: project1.id,
        userId: foreman.id,
      },
    },
    update: {},
    create: {
      projectId: project1.id,
      userId: foreman.id,
      isLead: true,
    },
  });

  // Atribuir funcionário à mesma obra
  await prisma.projectAssignment.upsert({
    where: {
      projectId_userId: {
        projectId: project1.id,
        userId: worker.id,
      },
    },
    update: {},
    create: {
      projectId: project1.id,
      userId: worker.id,
      isLead: false,
    },
  });

  console.log("Seed concluído com sucesso com empresas, utilizadores e obras!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
