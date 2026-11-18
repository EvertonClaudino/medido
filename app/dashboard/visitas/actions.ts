"use server";

import { Prisma, Role, TaskStatus, UserStatus, VisitStatus } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeRevalidatePath } from "@/lib/revalidate";
import { canTransitionVisitStatus, parseLisbonDateTime } from "@/lib/budget-utils";
import { getLisbonStartOfDay, isDashboardDateKey } from "@/lib/dashboard-utils";
import {
  AGENDA_DAYS,
  DEFAULT_VISIT_DURATION,
  VISIT_DURATION_OPTIONS,
  addDaysToDateKey,
  buildAgendaDays,
  findVisitConflict,
  isValidVisitDuration,
  visitEnd,
  type AgendaDay,
} from "@/lib/visit-scheduling";
import { texts } from "@/lib/texts";

type Tx = Prisma.TransactionClient;

const MAX_DURATION = Math.max(...VISIT_DURATION_OPTIONS);
const VISIT_ASSIGNEE_ROLES: Role[] = [Role.FOREMAN, Role.OWNER];

const timeFormatter = new Intl.DateTimeFormat("pt-PT", {
  timeZone: "Europe/Lisbon",
  hour: "2-digit",
  minute: "2-digit",
});

function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const durationField = z.coerce
  .number()
  .int()
  .refine(isValidVisitDuration, "Selecione uma duração válida para a visita.");

/** Responsável ativo da empresa (encarregado ou Dono). */
async function findAssignee(tx: Tx, companyId: string, assigneeId: string) {
  return tx.user.findFirst({
    where: { id: assigneeId, companyId, status: UserStatus.ACTIVE, role: { in: VISIT_ASSIGNEE_ROLES } },
    select: { id: true, name: true },
  });
}

/** Mensagem de conflito se o responsável já tiver uma visita agendada que se sobreponha. */
async function findScheduleConflict(
  tx: Tx,
  companyId: string,
  assignee: { id: string; name: string },
  start: Date,
  durationMinutes: number,
  ignoreVisitId?: string
): Promise<string | null> {
  const end = visitEnd(start, durationMinutes);
  const candidates = await tx.visitRequest.findMany({
    where: {
      companyId,
      assignedToId: assignee.id,
      status: VisitStatus.SCHEDULED,
      scheduledAt: { gte: new Date(start.getTime() - MAX_DURATION * 60_000), lt: end },
    },
    select: { id: true, scheduledAt: true, durationMinutes: true },
  });
  const conflict = findVisitConflict(
    candidates.map((v) => ({ id: v.id, start: v.scheduledAt!, end: visitEnd(v.scheduledAt!, v.durationMinutes) })),
    start,
    end,
    ignoreVisitId
  );
  if (!conflict) return null;
  return texts.dashboard.visits.conflict(
    assignee.name,
    timeFormatter.format(conflict.start),
    timeFormatter.format(conflict.end)
  );
}

const visitRequestSchema = z.object({
  clientId: z.string().min(1, "Cliente em falta."),
  requestedAddress: z.string().trim().min(3, "Indique a morada da visita.").max(300),
  notes: z.string().trim().max(2000),
  scheduledAt: z.string().trim(),
  assignedToId: z.string().trim(),
  durationMinutes: durationField,
});

export async function createVisitRequestAction(formData: FormData) {
  const user = await requireRole([Role.OWNER]);
  const parsed = visitRequestSchema.safeParse({
    clientId: formText(formData, "clientId"),
    requestedAddress: formText(formData, "requestedAddress"),
    notes: formText(formData, "notes"),
    scheduledAt: formText(formData, "scheduledAt"),
    assignedToId: formText(formData, "assignedToId"),
    durationMinutes: formText(formData, "durationMinutes") || DEFAULT_VISIT_DURATION,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? texts.dashboard.visits.error };
  }
  const { clientId, requestedAddress, notes, assignedToId, durationMinutes } = parsed.data;

  // Data opcional na marcação (hora de Europe/Lisbon); com data, o responsável é obrigatório
  let scheduledAt: Date | null = null;
  if (parsed.data.scheduledAt) {
    scheduledAt = parseLisbonDateTime(parsed.data.scheduledAt.slice(0, 16));
    if (!scheduledAt) return { error: "Indique uma data e hora válida em Europe/Lisbon." };
    if (!assignedToId) return { error: texts.dashboard.visits.assigneeRequired };
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const client = await tx.client.findFirst({
        where: { id: clientId, companyId: user.companyId },
        select: { id: true },
      });
      if (!client) return { error: "O cliente selecionado não pertence à sua empresa." } as const;

      let assignee: { id: string; name: string } | null = null;
      if (assignedToId) {
        assignee = await findAssignee(tx, user.companyId, assignedToId);
        if (!assignee) return { error: texts.dashboard.visits.invalidAssignee } as const;
      }

      if (scheduledAt && assignee) {
        const conflict = await findScheduleConflict(tx, user.companyId, assignee, scheduledAt, durationMinutes);
        if (conflict) return { error: conflict } as const;
      }

      const visit = await tx.visitRequest.create({
        data: {
          companyId: user.companyId,
          clientId: client.id,
          requestedAddress,
          notes: notes || null,
          createdById: user.id,
          assignedToId: assignee?.id ?? null,
          durationMinutes,
          ...(scheduledAt ? { status: VisitStatus.SCHEDULED, scheduledAt } : {}),
        },
        select: { clientId: true },
      });
      return { clientId: visit.clientId } as const;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
  if ("error" in result) return { error: result.error };

  safeRevalidatePath("/dashboard/clientes");
  safeRevalidatePath(`/dashboard/clientes/${result.clientId}`);
  safeRevalidatePath("/dashboard");
  return { success: true, clientId: result.clientId };
}

const visitStatusSchema = z.object({
  status: z.nativeEnum(VisitStatus),
  scheduledAt: z.string(),
  assignedToId: z.string().trim(),
  durationMinutes: durationField,
});

export async function updateVisitStatusAction(visitRequestId: string, formData: FormData) {
  const user = await requireRole([Role.OWNER]);
  const parsed = visitStatusSchema.safeParse({
    status: formText(formData, "status"),
    scheduledAt: formText(formData, "scheduledAt"),
    assignedToId: formText(formData, "assignedToId"),
    durationMinutes: formText(formData, "durationMinutes") || DEFAULT_VISIT_DURATION,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? texts.dashboard.visits.error };
  }
  const { status, assignedToId, durationMinutes } = parsed.data;

  let scheduledAt: Date | null = null;
  if (status === VisitStatus.SCHEDULED) {
    scheduledAt = parseLisbonDateTime(parsed.data.scheduledAt.slice(0, 16));
    if (!scheduledAt) return { error: "Indique uma data e hora válida em Europe/Lisbon." };
    if (!assignedToId) return { error: texts.dashboard.visits.assigneeRequired };
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const visit = await tx.visitRequest.findFirst({
        where: { id: visitRequestId, companyId: user.companyId },
        select: { id: true, status: true, clientId: true },
      });
      if (!visit) return { error: "Pedido de visita não encontrado." } as const;
      if (!canTransitionVisitStatus(visit.status, status)) {
        return { error: "Esta alteração de estado não é permitida." } as const;
      }

      let scheduleData: Prisma.VisitRequestUncheckedUpdateManyInput = {};
      if (scheduledAt) {
        const assignee = await findAssignee(tx, user.companyId, assignedToId);
        if (!assignee) return { error: texts.dashboard.visits.invalidAssignee } as const;
        const conflict = await findScheduleConflict(tx, user.companyId, assignee, scheduledAt, durationMinutes, visit.id);
        if (conflict) return { error: conflict } as const;
        scheduleData = { scheduledAt, assignedToId: assignee.id, durationMinutes };
      }

      const updated = await tx.visitRequest.updateMany({
        where: { id: visit.id, companyId: user.companyId, status: visit.status },
        data: { status, ...scheduleData },
      });
      if (updated.count !== 1) return { error: "O pedido foi alterado entretanto. Atualize a página." } as const;
      return { clientId: visit.clientId } as const;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
  if ("error" in result) return { error: result.error };

  safeRevalidatePath(`/dashboard/clientes/${result.clientId}`);
  safeRevalidatePath("/dashboard/orcamentos");
  safeRevalidatePath("/dashboard");
  return { success: true };
}

/**
 * Agenda do responsável para os próximos dias (visitas agendadas e tarefas com prazo),
 * usada no diálogo de marcação para ver a disponibilidade.
 */
export async function getVisitAgendaAction(
  assigneeId: string,
  startDateKey: string
): Promise<{ days: AgendaDay[] } | { error: string }> {
  const user = await requireRole([Role.OWNER]);
  if (!isDashboardDateKey(startDateKey)) return { error: "Data inválida." };

  const assignee = await findAssignee(prisma, user.companyId, assigneeId);
  if (!assignee) return { error: texts.dashboard.visits.invalidAssignee };

  const rangeStart = getLisbonStartOfDay(new Date(`${startDateKey}T12:00:00.000Z`));
  const rangeEnd = getLisbonStartOfDay(new Date(`${addDaysToDateKey(startDateKey, AGENDA_DAYS)}T12:00:00.000Z`));

  const [visits, tasks] = await Promise.all([
    prisma.visitRequest.findMany({
      where: {
        companyId: user.companyId,
        assignedToId: assignee.id,
        status: VisitStatus.SCHEDULED,
        scheduledAt: { gte: rangeStart, lt: rangeEnd },
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        requestedAddress: true,
        client: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        companyId: user.companyId,
        assignedToId: assignee.id,
        status: TaskStatus.PENDING,
        dueDate: { gte: rangeStart, lt: rangeEnd },
      },
      select: { id: true, title: true, dueDate: true },
    }),
  ]);

  return {
    days: buildAgendaDays(
      startDateKey,
      AGENDA_DAYS,
      visits.map((v) => ({
        id: v.id,
        start: v.scheduledAt!,
        durationMinutes: v.durationMinutes,
        clientName: v.client.name,
        address: v.requestedAddress,
      })),
      tasks.map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate! }))
    ),
  };
}
