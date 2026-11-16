import { ProjectStatus } from "@prisma/client";
import { getLisbonStartOfDay } from "@/lib/dashboard-utils";
import { prisma } from "@/lib/prisma";

/**
 * Calcula a percentagem de progresso de uma obra estritamente com base nas tarefas.
 * Se houver tarefas: arredonda a percentagem de tarefas concluídas.
 * Se não houver tarefas: devolve 100% se a obra estiver concluída, ou 0% caso contrário.
 */
export function calculateProjectProgress(
  totalTasksCount: number,
  completedTasksCount: number,
  status: ProjectStatus | string
): number {
  if (totalTasksCount > 0) {
    return Math.round((completedTasksCount / totalTasksCount) * 100);
  }
  return status === ProjectStatus.COMPLETED ? 100 : 0;
}

/**
 * Avalia se uma obra se encontra no estado "Em Atraso".
 * Regras estritas:
 * 1. O estado da obra tem de ser ACTIVE.
 * 2. Tem de possuir uma data limite (endDate) definida.
 * 3. A data limite tem de ser estritamente anterior ao início do dia civil corrente no fuso Europe/Lisbon.
 */
export function isProjectDelayed(
  project: {
    status: ProjectStatus | string;
    endDate: Date | string | null;
  },
  now: Date = new Date()
): boolean {
  if (project.status !== ProjectStatus.ACTIVE || !project.endDate) {
    return false;
  }

  const startOfToday = getLisbonStartOfDay(now);
  const endDate = new Date(project.endDate);

  return endDate < startOfToday;
}

/**
 * Gera o próximo código de obra sequencial no formato OBR-YYYY-NNN para uma empresa.
 * Não depende de contagem (count): analisa todas as obras do ano corrente na empresa,
 * extrai o maior número sequencial existente e soma 1 (mais eventual offset de tentativa).
 */
export async function getNextProjectCode(
  companyId: string,
  year: number = new Date().getFullYear(),
  offset: number = 0
): Promise<string> {
  const prefix = `OBR-${year}-`;

  const existingProjects = await prisma.project.findMany({
    where: {
      companyId,
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

  const nextNumber = maxSeq + 1 + offset;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

