"use server";

import { requireUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Silencia em contexto fora do Next.js Request (ex: testes automatizados)
  }
}
import { MeasureUnit, ProjectStatus, Role, WorkLogStatus, TaskStatus } from "@prisma/client";

// ==========================================
// ESQUEMAS DE VALIDAÇÃO — CLIENTES
// ==========================================

const clientSchema = z.object({
  name: z.string().min(1, "O nome do cliente é obrigatório.").max(150),
  nif: z.string().max(20).optional(),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  notes: z.string().max(2000).optional(),
});

export async function createClientAction(formData: FormData) {
  const user = await requireRole([Role.OWNER]);

  const rawData = {
    name: formData.get("name"),
    nif: formData.get("nif") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
  };

  const parsed = clientSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError = parsed.error.flatten().fieldErrors;
    const msg = Object.values(firstError).flat()[0] ?? "Dados inválidos.";
    return { error: msg };
  }

  const { name, nif, email, phone, address, notes } = parsed.data;

  await prisma.client.create({
    data: {
      companyId: user.companyId,
      name,
      nif: nif || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
    },
  });

  safeRevalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const user = await requireRole([Role.OWNER]);

  // Verificar que o cliente pertence à empresa
  const existing = await prisma.client.findFirst({
    where: { id: clientId, companyId: user.companyId },
    select: { id: true },
  });
  if (!existing) return { error: "Cliente não encontrado ou inacessível." };

  const rawData = {
    name: formData.get("name"),
    nif: formData.get("nif") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
  };

  const parsed = clientSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError2 = parsed.error.flatten().fieldErrors;
    const msg2 = Object.values(firstError2).flat()[0] ?? "Dados inválidos.";
    return { error: msg2 };
  }

  const { name, nif, email, phone, address, notes } = parsed.data;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      nif: nif || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
    },
  });

  safeRevalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function deleteClientAction(clientId: string) {
  const user = await requireRole([Role.OWNER]);

  const existing = await prisma.client.findFirst({
    where: { id: clientId, companyId: user.companyId },
    select: {
      id: true,
      _count: {
        select: {
          projects: true,
          visitRequests: true,
          budgets: true,
        },
      },
    },
  });
  if (!existing) return { error: "Cliente não encontrado ou inacessível." };
  if (
    existing._count.projects > 0 ||
    existing._count.visitRequests > 0 ||
    existing._count.budgets > 0
  ) {
    return { error: "Não é possível eliminar um cliente com obras, visitas ou orçamentos associados." };
  }

  await prisma.client.delete({ where: { id: clientId } });

  safeRevalidatePath("/dashboard/clientes");
  return { success: true };
}

import { projectSchema } from "@/lib/validations/project";
import { getNextProjectCode } from "@/lib/project-utils";

// ==========================================
// 1. AÇÕES DE OBRAS (DONO)
// ==========================================

export async function createProjectAction(formData: FormData) {
  const user = await requireRole([Role.OWNER]);

  const rawData = {
    name: formData.get("name"),
    code: formData.get("code") || undefined,
    serviceType: formData.get("serviceType") || undefined,
    clientId: formData.get("clientId") || undefined,
    clientName: formData.get("clientName") || undefined,
    address: formData.get("address") || undefined,
    budget: formData.get("budget") || undefined,
    foremanId: formData.get("foremanId") || undefined,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  };

  const parsed = projectSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos. Verifique os campos preenchidos.";
    return { error: firstError };
  }

  const {
    name,
    code,
    serviceType,
    clientId,
    clientName,
    address,
    budget,
    foremanId,
    startDate,
    endDate,
  } = parsed.data;

  // Validação: se foremanId foi fornecido, garantir que pertence à empresa e é FOREMAN
  if (foremanId) {
    const foreman = await prisma.user.findFirst({
      where: {
        id: foremanId,
        companyId: user.companyId,
        role: Role.FOREMAN,
        status: "ACTIVE",
      },
    });
    if (!foreman) {
      return { error: "O encarregado selecionado é inválido ou não pertence à empresa." };
    }
  }

  // Se o clientId foi fornecido, buscar o nome do cliente se clientName estiver em branco
  let resolvedClientName = clientName;
  if (clientId && !resolvedClientName) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, companyId: user.companyId },
      select: { name: true },
    });
    if (client) {
      resolvedClientName = client.name;
    }
  }

  const isAutoCode = !code?.trim();
  const year = new Date().getFullYear();
  const MAX_ATTEMPTS = 5;
  let project = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const finalCode = isAutoCode
      ? await getNextProjectCode(user.companyId, year, attempt)
      : code!.trim();

    try {
      project = await prisma.project.create({
        data: {
          companyId: user.companyId,
          clientId: clientId || null,
          name,
          code: finalCode,
          serviceType: serviceType || null,
          clientName: resolvedClientName || null,
          address: address || null,
          budget: budget || null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status: ProjectStatus.ACTIVE,
        },
      });
      break;
    } catch (err: unknown) {
      const isUniqueConstraint =
        (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") ||
        (err instanceof Error && (err.message.includes("Unique constraint failed") || err.message.includes("P2002")));

      if (isUniqueConstraint) {
        if (!isAutoCode) {
          return { error: "Já existe uma obra com este código na empresa." };
        }
        // Em código automático, tenta com o próximo número sequencial
        continue;
      }
      throw err;
    }
  }

  if (!project) {
    return { error: "Já existe uma obra com este código na empresa." };
  }

  if (foremanId) {
    await prisma.projectAssignment.create({
      data: {
        projectId: project.id,
        userId: foremanId,
        isLead: true,
      },
    });
  }

  safeRevalidatePath("/dashboard/obras");
  safeRevalidatePath("/dashboard");
  return { success: true };
}

export async function archiveProjectAction(projectId: string) {
  const user = await requireRole([Role.OWNER]);

  await prisma.project.updateMany({
    where: { id: projectId, companyId: user.companyId },
    data: { status: ProjectStatus.ARCHIVED },
  });

  safeRevalidatePath("/dashboard/obras");
  safeRevalidatePath("/dashboard");
  return { success: true };
}

// ==========================================
// 2. AÇÕES DE EQUIPA (DONO)
// ==========================================

const teamInviteSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(100),
  email: z.string().email("Email inválido").max(254),
  role: z.enum(["FOREMAN", "WORKER"]), // Nunca permite convidar como OWNER
  specialty: z.string().trim().max(100, "A especialidade não pode ter mais de 100 carateres.").optional(),
  temporaryPassword: z
    .string()
    .min(8, "A palavra-passe temporária tem de ter pelo menos 8 carateres.")
    .regex(/[A-Z]/, "A palavra-passe temporária tem de ter pelo menos uma letra maiúscula.")
    .regex(/[0-9]/, "A palavra-passe temporária tem de ter pelo menos um número.")
    .optional(),
});

export async function inviteUserAction(formData: FormData) {
  const user = await requireRole([Role.OWNER]);
  const bcrypt = await import("bcryptjs");
  const crypto = await import("crypto");

  const parsed = teamInviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    specialty: formData.get("specialty") || undefined,
    temporaryPassword: formData.get("temporaryPassword") || undefined,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Por favor, preencha todos os campos corretamente.";
    return { error: firstIssue };
  }

  const { name, email, role, specialty, temporaryPassword: customPassword } = parsed.data;

  // Regra (c): Garantia explícita em código que nunca cria OWNER
  if (role !== "FOREMAN" && role !== "WORKER") {
    return { error: "Perfil não autorizado para convite." };
  }

  // Se o Dono não forneceu uma senha forte, gera uma temporária aleatória segura de 12 carateres
  const tempPassword =
    customPassword ||
    `Medido!${crypto.randomBytes(4).toString("hex")}${Math.floor(10 + Math.random() * 90)}`;

  const hashedPassword = await bcrypt.default.hash(tempPassword, 10);

  try {
    await prisma.user.create({
      data: {
        companyId: user.companyId,
        name,
        email: email.toLowerCase().trim(),
        role: role as Role,
        specialty: specialty?.trim() || null,
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    safeRevalidatePath("/dashboard/equipa");
    return { success: true, temporaryPassword: tempPassword };
  } catch {
    return { error: "Este endereço de email já se encontra registado." };
  }
}

export async function updateUserSpecialtyAction(userId: string, specialty: string) {
  const user = await requireRole([Role.OWNER]);

  const target = await prisma.user.findFirst({
    where: { id: userId, companyId: user.companyId },
    select: { id: true },
  });
  if (!target) return { error: "Utilizador não encontrado." };

  const cleanSpecialty = specialty.trim().slice(0, 100);

  await prisma.user.update({
    where: { id: userId },
    data: { specialty: cleanSpecialty || null },
  });

  safeRevalidatePath("/dashboard/equipa");
  return { success: true };
}

export async function toggleUserStatusAction(userId: string, currentStatus: string) {
  const user = await requireRole([Role.OWNER]);

  // Regra (d): Owner não se pode desativar a si próprio
  if (user.id === userId) {
    return { error: "Não pode desativar o seu próprio perfil." };
  }

  // Regra (d): Garantir que a empresa não fica sem Owner ativo
  const targetUser = await prisma.user.findFirst({
    where: { id: userId, companyId: user.companyId },
  });

  if (!targetUser) {
    return { error: "Utilizador não encontrado." };
  }

  if (targetUser.role === Role.OWNER && currentStatus === "ACTIVE") {
    const activeOwnersCount = await prisma.user.count({
      where: {
        companyId: user.companyId,
        role: Role.OWNER,
        status: "ACTIVE",
      },
    });
    if (activeOwnersCount <= 1) {
      return { error: "A empresa tem de ter pelo menos um Dono ativo." };
    }
  }

  const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  await prisma.user.updateMany({
    where: { id: userId, companyId: user.companyId },
    data: { status: newStatus },
  });

  safeRevalidatePath("/dashboard/equipa");
  return { success: true };
}

// ==========================================
// 3. AÇÕES DE REGISTOS DE TRABALHO
// ==========================================

const measurementSchema = z.object({
  description: z.string().min(2, "Descrição da medição obrigatória.").max(200),
  quantity: z
    .coerce
    .number()
    .positive("A quantidade tem de ser maior que zero.")
    .max(999999.999, "Quantidade demasiado elevada."),
  unit: z.nativeEnum(MeasureUnit),
});

const workLogSchema = z
  .object({
    projectId: z.string().min(1, "Selecione uma obra."),
    workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
    hours: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : v),
        z.coerce
          .number()
          .min(0.25, "Mínimo de 0,25 horas.")
          .max(24, "Máximo de 24 horas.")
          .refine((h) => Math.round(h * 4) / 4 === h, "As horas têm de ser múltiplos de 0,25.")
          .optional()
      ),
    description: z.string().max(1000).optional(),
    measurements: z.array(measurementSchema).max(20, "Máximo de 20 medições por registo.").default([]),
  })
  .refine(
    (data) => data.hours !== undefined || data.measurements.length > 0,
    { message: "Tem de preencher as horas trabalhadas ou pelo menos uma medição." }
  );

export async function createWorkLogAction(formData: FormData) {
  const user = await requireUser();

  // Extrair medições da form (formato: measurement_N_field)
  const measurements: { description: string; quantity: string; unit: string }[] = [];
  let i = 0;
  while (formData.get(`measurement_${i}_description`) !== null) {
    measurements.push({
      description: formData.get(`measurement_${i}_description`) as string,
      quantity: formData.get(`measurement_${i}_quantity`) as string,
      unit: formData.get(`measurement_${i}_unit`) as string,
    });
    i++;
  }

  const parsed = workLogSchema.safeParse({
    projectId: formData.get("projectId") || "",
    workDate: formData.get("workDate") || "",
    hours: formData.get("hours") || undefined,
    description: formData.get("description") || undefined,
    measurements,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return { error: firstIssue };
  }

  const { projectId, workDate, hours, description, measurements: validMeasurements } = parsed.data;

  // Garantir que a obra pertence à empresa
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: user.companyId, status: "ACTIVE" },
  });

  if (!project) {
    return { error: "Obra inválida ou inacessível." };
  }

  // Verificação de atribuição à obra:
  // Se for WORKER ou FOREMAN, só pode criar registos se estiver atribuído à obra
  if (user.role === Role.WORKER || user.role === Role.FOREMAN) {
    const assignment = await prisma.projectAssignment.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });

    if (!assignment) {
      return { error: "Não está atribuído a esta obra. Apenas pode registar trabalho em obras designadas." };
    }
  }

  await prisma.workLog.create({
    data: {
      companyId: user.companyId,
      projectId,
      authorId: user.id,
      workDate: new Date(workDate),
      hours: hours !== undefined ? hours : null,
      description: description || null,
      status: WorkLogStatus.PENDING,
      measurements: {
        create: validMeasurements.map((m) => ({
          companyId: user.companyId,
          description: m.description,
          quantity: m.quantity,
          unit: m.unit,
        })),
      },
    },
  });

  safeRevalidatePath("/dashboard/os-meus-registos");
  safeRevalidatePath("/dashboard/validar-registos");
  safeRevalidatePath("/dashboard");
  return { success: true };
}

// Edição de registo próprio pendente (apenas no próprio registo e obra autorizada)
export async function editWorkLogAction(logId: string, formData: FormData) {
  const user = await requireUser();

  // Só pode editar o seu próprio registo e só se estiver PENDING
  const existing = await prisma.workLog.findFirst({
    where: { id: logId, authorId: user.id, companyId: user.companyId },
  });

  if (!existing) {
    return { error: "Registo não encontrado." };
  }

  if (existing.status !== WorkLogStatus.PENDING) {
    return { error: "Apenas pode editar registos que ainda estejam pendentes." };
  }

  // Permitir opcionalmente mudar de obra se fornecido projectId, mas revalidando a atribuição
  const requestedProjectId = (formData.get("projectId") as string) || existing.projectId;

  const targetProject = await prisma.project.findFirst({
    where: { id: requestedProjectId, companyId: user.companyId, status: "ACTIVE" },
  });

  if (!targetProject) {
    return { error: "Obra inválida ou inacessível." };
  }

  // Revalidação de atribuição na edição (se for WORKER ou FOREMAN)
  if (user.role === Role.WORKER || user.role === Role.FOREMAN) {
    const assignment = await prisma.projectAssignment.findUnique({
      where: { projectId_userId: { projectId: requestedProjectId, userId: user.id } },
    });

    if (!assignment) {
      return { error: "Não está atribuído a esta obra. Não é possível alocar registos a obras não autorizadas." };
    }
  }

  const measurements: { description: string; quantity: string; unit: string }[] = [];
  let i = 0;
  while (formData.get(`measurement_${i}_description`) !== null) {
    measurements.push({
      description: formData.get(`measurement_${i}_description`) as string,
      quantity: formData.get(`measurement_${i}_quantity`) as string,
      unit: formData.get(`measurement_${i}_unit`) as string,
    });
    i++;
  }

  const parsed = workLogSchema.safeParse({
    projectId: requestedProjectId,
    workDate: formData.get("workDate") || "",
    hours: formData.get("hours") || undefined,
    description: formData.get("description") || undefined,
    measurements,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return { error: firstIssue };
  }

  const { workDate, hours, description, measurements: validMeasurements } = parsed.data;

  // Substituir medições em transação
  await prisma.$transaction([
    prisma.workLogMeasurement.deleteMany({ where: { workLogId: logId } }),
    prisma.workLog.update({
      where: { id: logId },
      data: {
        projectId: requestedProjectId,
        workDate: new Date(workDate),
        hours: hours !== undefined ? hours : null,
        description: description || null,
        measurements: {
          create: validMeasurements.map((m) => ({
            companyId: user.companyId,
            description: m.description,
            quantity: m.quantity,
            unit: m.unit,
          })),
        },
      },
    }),
  ]);

  safeRevalidatePath("/dashboard/os-meus-registos");
  safeRevalidatePath("/dashboard/validar-registos");
  return { success: true };
}

export async function reviewWorkLogAction(
  logId: string,
  status: "VALIDATED" | "REJECTED",
  rejectionReason?: string
) {
  const user = await requireRole([Role.OWNER, Role.FOREMAN]);

  // Rejeição exige motivo
  if (status === "REJECTED" && (!rejectionReason || rejectionReason.trim().length < 3)) {
    return { error: "Para rejeitar um registo é obrigatório indicar o motivo." };
  }

  // Buscar o registo para verificar posse e autorização
  const log = await prisma.workLog.findFirst({
    where: { id: logId, companyId: user.companyId },
    include: { project: true },
  });

  if (!log) {
    return { error: "Registo não encontrado ou inacessível." };
  }

  if (log.status !== WorkLogStatus.PENDING) {
    return { error: "Este registo já foi validado ou rejeitado." };
  }

  // Regra de Integridade: Ninguém pode validar ou rejeitar o seu próprio registo
  if (log.authorId === user.id) {
    return { error: "Não pode aprovar ou rejeitar os seus próprios registos de trabalho." };
  }

  // Regra (a): Se for FOREMAN, só pode validar se for o Encarregado responsável pela obra
  if (user.role === Role.FOREMAN) {
    const isResponsible = await prisma.projectAssignment.findFirst({
      where: {
        projectId: log.projectId,
        userId: user.id,
        isLead: true,
      },
    });

    if (!isResponsible) {
      return { error: "Não tem permissão para validar registos de obras onde não é o responsável." };
    }
  }

  await prisma.workLog.update({
    where: { id: logId },
    data: {
      status,
      reviewedById: user.id,
      reviewedAt: new Date(),
      rejectionReason: status === "REJECTED" ? rejectionReason!.trim() : null,
    },
  });

  safeRevalidatePath("/dashboard/validar-registos");
  safeRevalidatePath("/dashboard/registos");
  safeRevalidatePath("/dashboard");
  return { success: true };
}

// ==========================================
// 4. AÇÕES DE DEFINIÇÕES DA EMPRESA (DONO)
// ==========================================

export async function updateCompanyAction(formData: FormData) {
  const user = await requireRole([Role.OWNER]);

  const name = formData.get("name") as string;
  const nif = formData.get("nif") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;

  if (!name || name.trim().length < 2) {
    return { error: "O nome da empresa é obrigatório." };
  }

  await prisma.company.update({
    where: { id: user.companyId },
    data: {
      name,
      nif: nif ? nif.trim() : null,
      address: address ? address.trim() : null,
      phone: phone ? phone.trim() : null,
    },
  });

  safeRevalidatePath("/dashboard/definicoes");
  safeRevalidatePath("/dashboard");
  return { success: true };
}

// ==========================================
// 5. AÇÕES DE EDIÇÃO DE OBRAS (DONO)
// ==========================================

export async function updateProjectAction(projectId: string, formData: FormData) {
  const user = await requireRole([Role.OWNER]);

  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: user.companyId },
    select: {
      id: true,
      name: true,
      clientId: true,
      startDate: true,
      endDate: true,
      quote: { select: { id: true } },
    },
  });

  if (!project) {
    return { error: "Obra não encontrada." };
  }

  const rawData = {
    name: formData.get("name") || project.name,
    code: formData.get("code") || undefined,
    serviceType: formData.get("serviceType") || undefined,
    clientId: formData.get("clientId") || project.clientId || undefined,
    clientName: formData.get("clientName") || undefined,
    address: formData.get("address") || undefined,
    budget: formData.get("budget") || undefined,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  };

  const parsed = projectSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await prisma.project.update({
      where: { id: projectId, companyId: user.companyId },
      data: project.quote
        ? {
            code: parsed.data.code?.trim() || null,
            serviceType: parsed.data.serviceType || null,
            startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
            endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
          }
        : {
            name: parsed.data.name,
            code: parsed.data.code?.trim() || null,
            serviceType: parsed.data.serviceType || null,
            clientName: parsed.data.clientName || null,
            address: parsed.data.address || null,
            budget: parsed.data.budget || null,
            startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
            endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
          },
    });
  } catch (err: unknown) {
    const isUniqueConstraint =
      (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") ||
      (err instanceof Error && (err.message.includes("Unique constraint failed") || err.message.includes("P2002")));

    if (isUniqueConstraint) {
      return { error: "Já existe uma obra com este código na empresa." };
    }
    throw err;
  }

  safeRevalidatePath("/dashboard/obras");
  return { success: true };
}

// ==========================================
// 6. AÇÕES DE ALOCAÇÃO A OBRAS
// ==========================================

export async function assignUserToProjectAction(projectId: string, userId: string, isLead: boolean) {
  const user = await requireRole([Role.OWNER, Role.FOREMAN]);

  // Verificar que a obra pertence à empresa
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: user.companyId, status: "ACTIVE" },
  });

  if (!project) {
    return { error: "Obra não encontrada ou inacessível." };
  }

  // FOREMAN só pode gerir obras onde é isLead
  if (user.role === Role.FOREMAN) {
    const leadAssignment = await prisma.projectAssignment.findFirst({
      where: { projectId, userId: user.id, isLead: true },
    });
    if (!leadAssignment) {
      return { error: "Não tem permissão para gerir esta obra." };
    }
    // (a) FOREMAN nunca define isLead
    if (isLead) {
      return { error: "Apenas o Dono da empresa pode atribuir encarregados." };
    }
  }

  // (a) Verificar que o utilizador alvo pertence à mesma empresa e está ATIVO
  const targetUser = await prisma.user.findFirst({
    where: { id: userId, companyId: user.companyId, status: "ACTIVE" },
  });

  if (!targetUser) {
    return { error: "Utilizador não encontrado ou inativo." };
  }

  // (a) FOREMAN só atribui WORKER (nunca FOREMAN ou OWNER)
  if (user.role === Role.FOREMAN && targetUser.role !== Role.WORKER) {
    return { error: "O Encarregado apenas pode alocar trabalhadores operacionais (WORKER) à obra." };
  }

  // OWNER ao atribuir como isLead=true, o utilizador tem de ser FOREMAN
  if (isLead && targetUser.role !== Role.FOREMAN) {
    return { error: "Apenas um Encarregado pode ser atribuído como responsável da obra." };
  }

  // (b) Restrição única (projectId, userId) através de upsert
  await prisma.projectAssignment.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId, isLead },
    update: { isLead },
  });

  safeRevalidatePath("/dashboard/obras");
  safeRevalidatePath(`/dashboard/obras/${projectId}/equipa`);
  safeRevalidatePath("/dashboard/as-minhas-obras");
  safeRevalidatePath("/dashboard/equipa-obra");
  return { success: true };
}

export async function removeUserFromProjectAction(projectId: string, userId: string) {
  const user = await requireRole([Role.OWNER, Role.FOREMAN]);

  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: user.companyId },
  });

  if (!project) {
    return { error: "Obra não encontrada." };
  }

  const assignmentToRemove = await prisma.projectAssignment.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (!assignmentToRemove) {
    return { error: "Colaborador não está atribuído a esta obra." };
  }

  if (user.role === Role.FOREMAN) {
    const leadAssignment = await prisma.projectAssignment.findFirst({
      where: { projectId, userId: user.id, isLead: true },
    });
    if (!leadAssignment) {
      return { error: "Não tem permissão para gerir esta obra." };
    }
    // FOREMAN não pode remover o isLead (a si mesmo ou outro encarregado)
    if (assignmentToRemove.isLead) {
      return { error: "Apenas o Dono da empresa pode remover o encarregado responsável." };
    }
  }

  // (c) Obra nunca fica sem responsável: se estivermos a remover um isLead, verificar se sobra outro
  if (assignmentToRemove.isLead) {
    const otherLeads = await prisma.projectAssignment.count({
      where: { projectId, isLead: true, userId: { not: userId } },
    });
    if (otherLeads === 0) {
      return { error: "Não pode remover o único responsável da obra. Atribua outro encarregado primeiro." };
    }
  }

  // (d) deleteMany garantindo project.companyId
  await prisma.projectAssignment.deleteMany({
    where: {
      projectId,
      userId,
      project: { companyId: user.companyId },
    },
  });

  safeRevalidatePath("/dashboard/obras");
  safeRevalidatePath(`/dashboard/obras/${projectId}/equipa`);
  safeRevalidatePath("/dashboard/as-minhas-obras");
  safeRevalidatePath("/dashboard/equipa-obra");
  return { success: true };
}

// ==========================================
// 7. AÇÕES DE PERFIL E PALAVRA-PASSE
// ==========================================

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "A palavra-passe atual é obrigatória."),
  newPassword: z
    .string()
    .min(8, "A nova palavra-passe tem de ter pelo menos 8 carateres.")
    .regex(/[A-Z]/, "A nova palavra-passe tem de ter pelo menos uma letra maiúscula.")
    .regex(/[0-9]/, "A nova palavra-passe tem de ter pelo menos um número."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "A confirmação da palavra-passe não coincide.",
  path: ["confirmPassword"],
});

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser({ allowMustChangePassword: true });
  const bcrypt = await import("bcryptjs");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { currentPassword, newPassword } = parsed.data;

  // Obter palavra-passe atual da BD
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  if (!dbUser) {
    return { error: "Utilizador não encontrado." };
  }

  const isCurrentValid = await bcrypt.default.compare(currentPassword, dbUser.password);
  if (!isCurrentValid) {
    return { error: "A palavra-passe atual está incorreta." };
  }

  const hashedPassword = await bcrypt.default.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
  });

  safeRevalidatePath("/dashboard/perfil");
  safeRevalidatePath("/dashboard");
  return { success: true };
}

// ==========================================
// 8. REENVIO DE REGISTOS REJEITADOS
// ==========================================

export async function resubmitWorkLogAction(logId: string) {
  const user = await requireUser();

  const log = await prisma.workLog.findFirst({
    where: { id: logId, authorId: user.id, companyId: user.companyId },
  });

  if (!log) {
    return { error: "Registo não encontrado ou inacessível." };
  }

  if (log.status !== WorkLogStatus.REJECTED) {
    return { error: "Apenas registos rejeitados podem ser reenviados para validação." };
  }

  await prisma.workLog.update({
    where: { id: logId },
    data: {
      status: WorkLogStatus.PENDING,
      rejectionReason: null,
      reviewedById: null,
      reviewedAt: null,
    },
  });

  safeRevalidatePath("/dashboard/os-meus-registos");
  safeRevalidatePath("/dashboard/validar-registos");
  safeRevalidatePath("/dashboard");
  return { success: true };
}

// ==========================================
// 9. AÇÕES DO MÓDULO DE TAREFAS
// ==========================================

const createTaskSchema = z.object({
  title: z.string().min(2, "O título da tarefa é obrigatório.").max(120),
  description: z.string().max(1000).optional(),
  assignedToId: z.string().min(1, "Selecione o colaborador a quem atribuir a tarefa."),
  projectId: z.string().optional(),
  dueDate: z.string().optional(), // Pode ser YYYY-MM-DD ou YYYY-MM-DDTHH:mm
});

export async function createTaskAction(formData: FormData) {
  const user = await requireRole([Role.OWNER, Role.FOREMAN]);

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    assignedToId: formData.get("assignedToId"),
    projectId: formData.get("projectId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  };

  const parsed = createTaskSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { title, description, assignedToId, projectId, dueDate: rawDueDate } = parsed.data;

  // 1. Validar utilizador atribuído (mesma empresa e ATIVO)
  const targetUser = await prisma.user.findFirst({
    where: {
      id: assignedToId,
      companyId: user.companyId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      role: true,
      status: true,
      companyId: true,
    },
  });

  if (!targetUser) {
    return { error: "Colaborador não encontrado ou inativo." };
  }

  // 2. Se projectId fornecido, validar que pertence à mesma empresa e está ativa
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: user.companyId,
        status: "ACTIVE",
      },
      select: { id: true, companyId: true },
    });

    if (!project) {
      return { error: "Obra inválida ou inacessível." };
    }
  }

  // 3. Regras de criação para FOREMAN:
  // Só pode atribuir a WORKER ativos das suas obras onde é isLead
  if (user.role === Role.FOREMAN) {
    if (targetUser.role !== Role.WORKER) {
      return { error: "O Encarregado apenas pode atribuir tarefas a funcionários operacionais (WORKER)." };
    }

    if (!projectId) {
      return { error: "O Encarregado tem de associar a tarefa a uma das suas obras." };
    }

    // Verificar se o FOREMAN é isLead nesta obra
    const foremanLead = await prisma.projectAssignment.findFirst({
      where: {
        projectId,
        userId: user.id,
        isLead: true,
      },
      select: { id: true },
    });

    if (!foremanLead) {
      return { error: "Não tem permissão para criar tarefas em obras onde não é o encarregado responsável." };
    }

    // Verificar se o WORKER alvo está atribuído a esta obra
    const workerAssigned = await prisma.projectAssignment.findFirst({
      where: {
        projectId,
        userId: targetUser.id,
      },
      select: { id: true },
    });

    if (!workerAssigned) {
      return { error: "O funcionário selecionado não está atribuído a esta obra." };
    }
  }

  // Converter dueDate se fornecida
  let parsedDueDate: Date | null = null;
  if (rawDueDate && rawDueDate.trim().length > 0) {
    const d = new Date(rawDueDate);
    if (!isNaN(d.getTime())) {
      parsedDueDate = d;
    }
  }

  await prisma.task.create({
    data: {
      companyId: user.companyId,
      createdById: user.id,
      assignedToId: targetUser.id,
      projectId: projectId || null,
      title,
      description: description || null,
      dueDate: parsedDueDate,
      status: TaskStatus.PENDING,
    },
  });

  safeRevalidatePath("/dashboard/tarefas");
  safeRevalidatePath("/dashboard");
  return { success: true };
}

export async function updateTaskStatusAction(
  taskId: string,
  newStatus: "PENDING" | "COMPLETED" | "CANCELLED"
) {
  const user = await requireUser();

  // Buscar tarefa garantindo isolamento por companyId
  const task = await prisma.task.findFirst({
    where: { id: taskId, companyId: user.companyId },
    select: {
      id: true,
      status: true,
      createdById: true,
      assignedToId: true,
      companyId: true,
    },
  });

  if (!task) {
    return { error: "Tarefa não encontrada ou inacessível." };
  }

  // Regra de transição: Tarefas CANCELLED não podem ser alteradas
  if (task.status === TaskStatus.CANCELLED) {
    return { error: "Uma tarefa cancelada não pode ser alterada." };
  }

  // Regras de cancelamento: só OWNER ou o próprio criador da tarefa
  if (newStatus === "CANCELLED") {
    if (user.role !== Role.OWNER && task.createdById !== user.id) {
      return { error: "Apenas o Dono ou o criador da tarefa podem cancelar a tarefa." };
    }
  }

  // Regras para PENDING ou COMPLETED:
  // Se for o utilizador atribuído, pode alternar entre PENDING e COMPLETED
  // OWNER pode alterar qualquer tarefa da empresa
  if (newStatus === "PENDING" || newStatus === "COMPLETED") {
    const isAssignee = task.assignedToId === user.id;
    const isOwner = user.role === Role.OWNER;
    const isCreator = task.createdById === user.id;

    if (!isAssignee && !isOwner && !isCreator) {
      return { error: "Não tem permissão para alterar o estado desta tarefa." };
    }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus as TaskStatus },
  });

  safeRevalidatePath("/dashboard/tarefas");
  safeRevalidatePath("/dashboard");
  return { success: true };
}






