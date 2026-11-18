"use server";

import {
  BudgetRevisionType,
  BudgetStatus,
  Prisma,
  ProjectStatus,
  Role,
  VisitStatus,
} from "@prisma/client";
import { safeRevalidatePath } from "@/lib/revalidate";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBudgetTotals, type BudgetLineInput } from "@/lib/budget-utils";
import { texts } from "@/lib/texts";

function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const decimalInput = (maxDecimals: number) =>
  z
    .string()
    .trim()
    .regex(new RegExp(`^\\d+(?:[.,]\\d{1,${maxDecimals}})?$`), "Indique um número válido.")
    .transform((value) => Number(value.replace(",", ".")))
    .refine(Number.isFinite, "Indique um número válido.");

const budgetLineSchema = z.object({
  description: z.string().trim().min(2, "A descrição da linha é obrigatória.").max(200),
  quantity: decimalInput(3).pipe(z.number().gt(0, "A quantidade tem de ser superior a zero.").max(100000)),
  unit: z.string().trim().min(1, "Indique a unidade.").max(20),
  unitPrice: decimalInput(2).pipe(z.number().min(0).max(100000)),
  vatRate: decimalInput(2).pipe(z.number().min(0).max(100)),
});

const budgetContentSchema = z.object({
  projectName: z.string().trim().min(2, "Indique o nome da obra.").max(120),
  workAddress: z.string().trim().min(3, "Indique a morada da obra.").max(300),
  notes: z.string().trim().max(2000),
  items: z.array(budgetLineSchema).min(1, "Adicione pelo menos uma linha.").max(100),
});

function parseBudgetContent(formData: FormData) {
  const count = Number(formText(formData, "itemCount"));
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    return { error: "O orçamento tem de conter entre 1 e 100 linhas." } as const;
  }

  const items = Array.from({ length: count }, (_, index) => ({
    description: formText(formData, `item-${index}-description`),
    quantity: formText(formData, `item-${index}-quantity`),
    unit: formText(formData, `item-${index}-unit`),
    unitPrice: formText(formData, `item-${index}-unitPrice`),
    vatRate: formText(formData, `item-${index}-vatRate`),
  }));
  const parsed = budgetContentSchema.safeParse({
    projectName: formText(formData, "projectName"),
    workAddress: formText(formData, "workAddress"),
    notes: formText(formData, "notes"),
    items,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? texts.dashboard.budgets.error } as const;
  }

  return { data: parsed.data } as const;
}

function budgetSnapshot(
  status: BudgetStatus,
  projectName: string,
  workAddress: string,
  notes: string | null,
  items: readonly BudgetLineInput[]
): Prisma.InputJsonObject {
  return {
    status,
    projectName,
    workAddress,
    notes: notes ?? "",
    items: items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
    })),
  };
}

function toBudgetLineInput(item: {
  description: string;
  quantity: Prisma.Decimal;
  unit: string;
  unitPrice: Prisma.Decimal;
  vatRate: Prisma.Decimal;
}): BudgetLineInput {
  return {
    description: item.description,
    quantity: Number(item.quantity),
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    vatRate: Number(item.vatRate),
  };
}

function revalidateBudgetPaths() {
  safeRevalidatePath("/dashboard/clientes");
  safeRevalidatePath("/dashboard/orcamentos");
  safeRevalidatePath("/dashboard/obras");
  safeRevalidatePath("/dashboard");
}

/**
 * Cria um orçamento para um cliente. A visita é opcional (decisão 022); quando indicada,
 * tem de pertencer ao mesmo cliente, estar realizada e ainda não ter orçamento.
 */
export async function createBudgetAction(
  target: { clientId: string; visitRequestId?: string | null },
  formData: FormData
) {
  const user = await requireRole([Role.OWNER]);
  const parsed = parseBudgetContent(formData);
  if ("error" in parsed) return parsed;

  const { projectName, workAddress, notes, items } = parsed.data;
  const budgetLines: BudgetLineInput[] = items;
  const result = await prisma.$transaction(async (transaction) => {
    const client = await transaction.client.findFirst({
      where: { id: target.clientId, companyId: user.companyId },
      select: { id: true },
    });
    if (!client) return { error: "Cliente não encontrado ou inacessível." } as const;

    let visitRequestId: string | null = null;
    if (target.visitRequestId) {
      const visit = await transaction.visitRequest.findFirst({
        where: {
          id: target.visitRequestId,
          companyId: user.companyId,
          clientId: client.id,
          status: VisitStatus.COMPLETED,
          budget: null,
        },
        select: { id: true },
      });
      if (!visit) return { error: texts.dashboard.budgets.missingVisit } as const;
      visitRequestId = visit.id;
    }

    const snapshot = budgetSnapshot(BudgetStatus.DRAFT, projectName, workAddress, notes || null, budgetLines);
    const budget = await transaction.budget.create({
      data: {
        companyId: user.companyId,
        clientId: client.id,
        visitRequestId,
        projectName,
        workAddress,
        notes: notes || null,
        createdById: user.id,
        items: {
          create: items.map((item, position) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            position,
          })),
        },
        revisions: {
          create: {
            revisionNumber: 1,
            type: BudgetRevisionType.CREATED,
            snapshot,
            editorId: user.id,
          },
        },
      },
      select: { id: true },
    });
    return { budgetId: budget.id, clientId: client.id } as const;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if ("error" in result) return { error: result.error };

  revalidateBudgetPaths();
  safeRevalidatePath(`/dashboard/clientes/${result.clientId}`);
  return { success: true, budgetId: result.budgetId };
}

export async function updateBudgetAction(budgetId: string, formData: FormData) {
  const user = await requireRole([Role.OWNER]);
  const parsed = parseBudgetContent(formData);
  if ("error" in parsed) return parsed;

  const { projectName, workAddress, notes, items } = parsed.data;
  const result = await prisma.$transaction(async (transaction) => {
    const budget = await transaction.budget.findFirst({
      where: { id: budgetId, companyId: user.companyId },
      select: {
        id: true,
        projectId: true,
        clientId: true,
        status: true,
        items: {
          select: {
            description: true,
            quantity: true,
            unit: true,
            unitPrice: true,
            vatRate: true,
          },
        },
        client: { select: { name: true } },
      },
    });
    if (!budget) return { error: "Orçamento não encontrado." };

    const latestRevision = await transaction.budgetRevision.aggregate({
      where: { budgetId: budget.id },
      _max: { revisionNumber: true },
    });
    const revisionNumber = (latestRevision._max.revisionNumber ?? 0) + 1;
    await transaction.budgetItem.deleteMany({ where: { budgetId: budget.id } });
    await transaction.budget.update({
      where: { id: budget.id },
      data: {
        projectName,
        workAddress,
        notes: notes || null,
        items: {
          create: items.map((item, position) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            position,
          })),
        },
      },
    });

    const newLines: BudgetLineInput[] = items;
    const totals = calculateBudgetTotals(newLines);
    if (budget.projectId) {
      const updatedProject = await transaction.project.updateMany({
        where: { id: budget.projectId, companyId: user.companyId },
        data: {
          name: projectName,
          clientId: budget.clientId,
          clientName: budget.client.name,
          address: workAddress,
          budget: new Prisma.Decimal(totals.grossCents).div(100),
        },
      });
      if (updatedProject.count !== 1) {
        throw new Error("Não foi possível sincronizar o orçamento com a obra associada.");
      }
    }

    await transaction.budgetRevision.create({
      data: {
        budgetId: budget.id,
        revisionNumber,
        type: BudgetRevisionType.CONTENT_EDIT,
        snapshot: budgetSnapshot(budget.status, projectName, workAddress, notes || null, newLines),
        editorId: user.id,
      },
    });
    return { success: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  if ("error" in result) return result;
  revalidateBudgetPaths();
  return { success: true };
}

const budgetStatusSchema = z.nativeEnum(BudgetStatus);

const approveBudgetSchema = z.object({
  budgetId: z.string().trim().min(1, "Identificador de orçamento inválido."),
  expectedRevisionNumber: z.number().int().nonnegative("Número de revisão inválido."),
  expectedUpdatedAt: z.string().trim().min(1, "Carimbo de data/hora de revisão inválido."),
  confirmedProjectName: z.string().trim().min(2, "Indique o nome da obra.").max(120),
  confirmedAddress: z.string().trim().min(3, "A localização da obra tem de ter pelo menos 3 caracteres.").max(300),
  locationConfirmed: z.literal(true, {
    errorMap: () => ({ message: "Tem de confirmar expressamente a localização da obra." }),
  }),
});

export type ApproveBudgetInput = z.infer<typeof approveBudgetSchema>;

export async function approveBudgetAndCreateProjectAction(input: ApproveBudgetInput) {
  const user = await requireRole([Role.OWNER]);

  const parsed = approveBudgetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados de aprovação inválidos." };
  }

  const {
    budgetId,
    expectedRevisionNumber,
    expectedUpdatedAt,
    confirmedProjectName,
    confirmedAddress,
  } = parsed.data;

  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        // 1. Obter o orçamento com garantia multi-tenant
        const budget = await transaction.budget.findFirst({
          where: { id: budgetId, companyId: user.companyId },
          select: {
            id: true,
            clientId: true,
            projectId: true,
            status: true,
            projectName: true,
            workAddress: true,
            notes: true,
            updatedAt: true,
            client: { select: { id: true, name: true } },
            project: { select: { id: true, code: true, status: true } },
            items: {
              select: {
                description: true,
                quantity: true,
                unit: true,
                unitPrice: true,
                vatRate: true,
              },
            },
          },
        });

        if (!budget) {
          return { error: "Orçamento não encontrado ou sem permissão de acesso." } as const;
        }

        // Idempotência: se já está APPROVED e tem obra associada ativa
        if (budget.status === BudgetStatus.APPROVED && budget.projectId && budget.project?.status === ProjectStatus.ACTIVE) {
          return { success: true, projectId: budget.projectId, alreadyApproved: true } as const;
        }

        // 2. Verificar a última revisão registada para garantir OCC (Optimistic Concurrency Control)
        const latestRevision = await transaction.budgetRevision.aggregate({
          where: { budgetId: budget.id },
          _max: { revisionNumber: true },
        });
        const currentRevisionNumber = latestRevision._max.revisionNumber ?? 0;

        // Se a revisão for diferente daquela que o utilizador viu no modal:
        if (
          currentRevisionNumber !== expectedRevisionNumber ||
          budget.updatedAt.toISOString() !== expectedUpdatedAt
        ) {
          return {
            error: "O orçamento foi alterado desde que abriu a pré-visualização. Por favor, atualize os dados e reveja novamente antes de aprovar.",
            code: "REVISION_MISMATCH",
          } as const;
        }

        // 3. Validar se o estado atual permite aprovação
        if (budget.status === BudgetStatus.REJECTED) {
          return { error: "Um orçamento rejeitado não pode ser aprovado diretamente. Altere para rascunho primeiro." } as const;
        }

        const nextRevisionNumber = currentRevisionNumber + 1;
        const budgetLines = budget.items.map(toBudgetLineInput);
        const totals = calculateBudgetTotals(budgetLines);
        let finalProjectId = budget.projectId;

        // 4. Criação ou Reativação da Obra
        if (budget.projectId) {
          // Reaprovação de obra existente (ex: orçamento anteriormente cancelado que arquivou a obra)
          const updatedProject = await transaction.project.updateMany({
            where: { id: budget.projectId, companyId: user.companyId },
            data: {
              status: ProjectStatus.ACTIVE,
              name: confirmedProjectName,
              address: confirmedAddress,
              budget: new Prisma.Decimal(totals.grossCents).div(100),
              clientId: budget.clientId,
              clientName: budget.client.name,
            },
          });
          if (updatedProject.count !== 1) {
            throw new Error("A obra associada ao orçamento não pertence à empresa ou não foi encontrada.");
          }
        } else {
          // Primeira aprovação: calcular código OBR-YYYY-NNN com segurança dentro da transação
          const now = new Date();
          const currentYear = now.getFullYear();
          const prefix = `OBR-${currentYear}-`;

          const existingProjects = await transaction.project.findMany({
            where: {
              companyId: user.companyId,
              code: { startsWith: prefix },
            },
            select: { code: true },
          });

          let maxSeq = 0;
          for (const p of existingProjects) {
            if (p.code) {
              const parts = p.code.split("-");
              if (parts.length >= 3) {
                const seq = parseInt(parts[2], 10);
                if (!Number.isNaN(seq) && seq > maxSeq) {
                  maxSeq = seq;
                }
              }
            }
          }
          const nextCode = `OBR-${currentYear}-${String(maxSeq + 1).padStart(3, "0")}`;

          // Criar nova obra com status ACTIVE, sem equipa atribuída
          const newProject = await transaction.project.create({
            data: {
              companyId: user.companyId,
              clientId: budget.clientId,
              clientName: budget.client.name,
              name: confirmedProjectName,
              code: nextCode,
              address: confirmedAddress,
              budget: new Prisma.Decimal(totals.grossCents).div(100),
              status: ProjectStatus.ACTIVE,
            },
            select: { id: true },
          });

          finalProjectId = newProject.id;
        }

        // 5. Atualizar o estado do Budget para APPROVED e vincular o projectId
        const updatedBudget = await transaction.budget.updateMany({
          where: {
            id: budget.id,
            companyId: user.companyId,
            status: budget.status,
          },
          data: {
            status: BudgetStatus.APPROVED,
            projectId: finalProjectId,
            projectName: confirmedProjectName,
            workAddress: confirmedAddress,
          },
        });

        if (updatedBudget.count !== 1) {
          throw new Error("O estado do orçamento foi modificado concorrentemente. Por favor, tente novamente.");
        }

        // 6. Criar nova revisão com snapshot completo
        await transaction.budgetRevision.create({
          data: {
            budgetId: budget.id,
            revisionNumber: nextRevisionNumber,
            type: BudgetRevisionType.STATUS_CHANGE,
            snapshot: budgetSnapshot(
              BudgetStatus.APPROVED,
              confirmedProjectName,
              confirmedAddress,
              budget.notes,
              budgetLines
            ),
            editorId: user.id,
          },
        });

        return { success: true, projectId: finalProjectId } as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if ("error" in result) return result;
    revalidateBudgetPaths();
    return result;
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        return {
          error: "Ocorreu uma colisão de operações simultâneas na base de dados. Por favor, tente novamente.",
        };
      }
      if (error.code === "P2002") {
        return {
          error: "Já existe uma obra registada com este identificador único.",
        };
      }
    }
    const message = error instanceof Error ? error.message : "Erro desconhecido ao aprovar orçamento.";
    return { error: message };
  }
}

export async function updateBudgetStatusAction(budgetId: string, statusValue: string) {
  const user = await requireRole([Role.OWNER]);
  const parsedStatus = budgetStatusSchema.safeParse(statusValue);
  if (!parsedStatus.success) return { error: "Estado de orçamento inválido." };

  const result = await prisma.$transaction(async (transaction) => {
    const budget = await transaction.budget.findFirst({
      where: { id: budgetId, companyId: user.companyId },
      select: {
        id: true,
        clientId: true,
        projectId: true,
        status: true,
        projectName: true,
        workAddress: true,
        notes: true,
        client: { select: { name: true } },
        items: {
          select: {
            description: true,
            quantity: true,
            unit: true,
            unitPrice: true,
            vatRate: true,
          },
        },
      },
    });
    if (!budget) return { error: "Orçamento não encontrado." } as const;
    if (budget.status === parsedStatus.data) return { error: "O orçamento já tem esse estado." } as const;

    const latestRevision = await transaction.budgetRevision.aggregate({
      where: { budgetId: budget.id },
      _max: { revisionNumber: true },
    });
    const revisionNumber = (latestRevision._max.revisionNumber ?? 0) + 1;
    const nextStatus = parsedStatus.data;
    const budgetLines = budget.items.map(toBudgetLineInput);
    const totals = calculateBudgetTotals(budgetLines);
    let projectId = budget.projectId;

    if (nextStatus === BudgetStatus.APPROVED) {
      if (projectId) {
        const updatedProject = await transaction.project.updateMany({
          where: { id: projectId, companyId: user.companyId },
          data: { status: ProjectStatus.ACTIVE },
        });
        if (updatedProject.count !== 1) {
          throw new Error("A obra associada ao orçamento não pertence à empresa.");
        }
      } else {
        const project = await transaction.project.create({
          data: {
            companyId: user.companyId,
            clientId: budget.clientId,
            name: budget.projectName,
            clientName: budget.client.name,
            address: budget.workAddress,
            budget: new Prisma.Decimal(totals.grossCents).div(100),
            status: ProjectStatus.ACTIVE,
          },
          select: { id: true },
        });
        projectId = project.id;
      }
    } else if (nextStatus === BudgetStatus.CANCELLED && projectId) {
      const archivedProject = await transaction.project.updateMany({
        where: { id: projectId, companyId: user.companyId },
        data: { status: ProjectStatus.ARCHIVED },
      });
      if (archivedProject.count !== 1) {
        throw new Error("A obra associada ao orçamento não pertence à empresa.");
      }
    }

    const updatedBudget = await transaction.budget.updateMany({
      where: { id: budget.id, companyId: user.companyId, status: budget.status },
      data: { status: nextStatus, projectId },
    });
    if (updatedBudget.count !== 1) {
      throw new Error("O estado do orçamento foi alterado entretanto. Atualize a página.");
    }

    await transaction.budgetRevision.create({
      data: {
        budgetId: budget.id,
        revisionNumber,
        type: BudgetRevisionType.STATUS_CHANGE,
        snapshot: budgetSnapshot(
          nextStatus,
          budget.projectName,
          budget.workAddress,
          budget.notes,
          budgetLines
        ),
        editorId: user.id,
      },
    });
    return { success: true } as const;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  if ("error" in result) return result;
  revalidateBudgetPaths();
  return result;
}
