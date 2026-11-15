import { cache } from "react";
import { Role, TaskStatus, WorkLogStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ALERT_THRESHOLDS,
  deriveAlerts,
  type AlertProjectContext,
  type DashboardAlert,
  type OverdueTaskAlertContext,
  type PasswordChangeAlertContext,
  type PendingLogAlertContext,
} from "@/lib/alerts";

export const getCompanyAlertsData = cache(async (companyId: string) => {
  const now = new Date();
  const pendingCutoff = new Date(
    now.getTime() - ALERT_THRESHOLDS.PENDING_OVERDUE_DAYS * 24 * 60 * 60 * 1000
  );

  const [activeProjects, pendingGroups, overdueTasks, usersMustChangePassword] =
    await Promise.all([
      prisma.project.findMany({
        where: { companyId, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          clientName: true,
          code: true,
          createdAt: true,
          assignments: {
            where: { user: { companyId, status: "ACTIVE" } },
            select: {
              isLead: true,
              user: { select: { id: true, name: true, role: true } },
            },
          },
          workLogs: {
            where: { companyId },
            take: 1,
            orderBy: { workDate: "desc" },
            select: { workDate: true },
          },
          _count: {
            select: {
              workLogs: { where: { companyId, status: WorkLogStatus.PENDING } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.workLog.groupBy({
        by: ["projectId"],
        where: {
          companyId,
          status: WorkLogStatus.PENDING,
          createdAt: { lt: pendingCutoff },
        },
        _count: { _all: true },
        _min: { createdAt: true },
      }),
      prisma.task.findMany({
        where: {
          companyId,
          status: TaskStatus.PENDING,
          dueDate: { not: null, lt: now },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          projectId: true,
        },
        orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      }),
      prisma.user.findMany({
        where: { companyId, status: "ACTIVE", mustChangePassword: true },
        select: { id: true, name: true, updatedAt: true },
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      }),
    ]);

  const relatedProjectIds = Array.from(new Set([
    ...pendingGroups.map((group) => group.projectId),
    ...overdueTasks.flatMap((task) => task.projectId ? [task.projectId] : []),
  ]));
  const relatedProjects = relatedProjectIds.length
    ? await prisma.project.findMany({
        where: { companyId, id: { in: relatedProjectIds } },
        select: { id: true, name: true },
      })
    : [];
  const pendingProjectById = new Map(
    relatedProjects.map((project) => [project.id, project])
  );

  const projectContexts: AlertProjectContext[] = activeProjects.map((project) => ({
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    hasForeman: project.assignments.some(
      (assignment) => assignment.isLead && assignment.user.role === Role.FOREMAN
    ),
    workerCount: project.assignments.filter(
      (assignment) => assignment.user.role === Role.WORKER
    ).length,
    lastLogDate: project.workLogs[0]?.workDate ?? null,
  }));
  const pendingLogContexts: PendingLogAlertContext[] = pendingGroups.flatMap((group) => {
    const project = pendingProjectById.get(group.projectId);
    const oldestCreatedAt = group._min.createdAt;
    if (!project || !oldestCreatedAt) return [];
    return [{
      project,
      count: group._count._all,
      oldestCreatedAt,
    }];
  });
  const overdueTaskContexts: OverdueTaskAlertContext[] = overdueTasks.flatMap((task) =>
    task.dueDate
      ? [{
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          project: task.projectId ? pendingProjectById.get(task.projectId) ?? null : null,
        }]
      : []
  );
  const passwordChangeContexts: PasswordChangeAlertContext[] =
    usersMustChangePassword.map((user) => user);

  const alerts: DashboardAlert[] = deriveAlerts({
    projects: projectContexts,
    pendingLogs: pendingLogContexts,
    overdueTasks: overdueTaskContexts,
    usersMustChangePassword: passwordChangeContexts,
    now,
  });

  return {
    now,
    activeProjects,
    alerts,
    overduePendingCount: pendingLogContexts.reduce((total, group) => total + group.count, 0),
  };
});
