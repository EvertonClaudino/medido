import { BudgetRevisionType, BudgetStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { texts } from "@/lib/texts";

export type DashboardNotificationType = "workLog" | "project" | "task" | "budget";

export interface DashboardNotification {
  id: string;
  type: DashboardNotificationType;
  title: string;
  occurredAt: Date;
  href: string;
}

function readBudgetStatus(snapshot: unknown): BudgetStatus | null {
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) return null;
  const status = Object.getOwnPropertyDescriptor(snapshot, "status")?.value;
  return Object.values(BudgetStatus).find((value) => value === status) ?? null;
}

export async function getDashboardNotifications(
  companyId: string,
  options: { since?: Date; limit?: number } = {}
): Promise<DashboardNotification[]> {
  const limit = options.limit ?? 8;
  const since = options.since;
  const [workLogs, projects, tasks, revisions] = await Promise.all([
    prisma.workLog.findMany({
      where: {
        companyId,
        ...(since
          ? {
              OR: [
                { createdAt: { gte: since } },
                { reviewedAt: { gte: since } },
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        author: { select: { name: true } },
        reviewedBy: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    prisma.project.findMany({
      where: { companyId, ...(since ? { createdAt: { gte: since } } : {}) },
      take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.task.findMany({
      where: { companyId, ...(since ? { createdAt: { gte: since } } : {}) },
      take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        title: true,
        createdAt: true,
        assignedTo: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    prisma.budgetRevision.findMany({
      where: {
        budget: { companyId },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        type: true,
        snapshot: true,
        createdAt: true,
        budget: { select: { id: true, projectName: true } },
      },
    }),
  ]);
  const events: DashboardNotification[] = [];

  for (const log of workLogs) {
    if (!since || log.createdAt >= since) {
      events.push({
        id: `log-submitted-${log.id}`,
        type: "workLog",
        title: texts.dashboard.notifications.workLogSubmitted(log.author.name, log.project.name),
        occurredAt: log.createdAt,
        href: "/dashboard/registos",
      });
    }

    if (log.reviewedAt && (!since || log.reviewedAt >= since)) {
      if (log.status === "VALIDATED") {
        events.push({
          id: `log-validated-${log.id}`,
          type: "workLog",
          title: texts.dashboard.notifications.workLogValidated(
            log.reviewedBy?.name ?? texts.dashboard.activity.foreman,
            log.author.name,
            log.project.name
          ),
          occurredAt: log.reviewedAt,
          href: "/dashboard/registos",
        });
      } else if (log.status === "REJECTED") {
        events.push({
          id: `log-rejected-${log.id}`,
          type: "workLog",
          title: texts.dashboard.notifications.workLogRejected(
            log.reviewedBy?.name ?? texts.dashboard.activity.foreman,
            log.author.name,
            log.project.name
          ),
          occurredAt: log.reviewedAt,
          href: "/dashboard/registos",
        });
      }
    }
  }

  events.push(
    ...projects.map((project) => ({
      id: `project-created-${project.id}`,
      type: "project" as const,
      title: texts.dashboard.notifications.projectCreated(project.name),
      occurredAt: project.createdAt,
      href: `/dashboard/obras/${project.id}/editar`,
    })),
    ...tasks.map((task) => ({
      id: `task-created-${task.id}`,
      type: "task" as const,
      title: texts.dashboard.notifications.taskCreated(
        task.title,
        task.assignedTo.name,
        task.project?.name ?? null
      ),
      occurredAt: task.createdAt,
      href: "/dashboard/tarefas",
    })),
    ...revisions.map((revision) => {
      const status = readBudgetStatus(revision.snapshot);
      let title = texts.dashboard.notifications.budgetEdited(revision.budget.projectName);
      if (revision.type === BudgetRevisionType.CREATED) {
        title = texts.dashboard.notifications.budgetCreated(revision.budget.projectName);
      } else if (revision.type === BudgetRevisionType.STATUS_CHANGE && status) {
        title = texts.dashboard.notifications.budgetStatusChanged(
          revision.budget.projectName,
          texts.dashboard.budgets.statuses[status]
        );
      }
      return {
        id: `budget-revision-${revision.id}`,
        type: "budget" as const,
        title,
        occurredAt: revision.createdAt,
        href: `/dashboard/orcamentos/${revision.budget.id}`,
      };
    })
  );

  return events
    .sort((left, right) =>
      right.occurredAt.getTime() - left.occurredAt.getTime() ||
      left.id.localeCompare(right.id)
    )
    .slice(0, limit);
}
