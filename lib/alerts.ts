import { texts } from "@/lib/texts";

export const ALERT_THRESHOLDS = {
  PENDING_OVERDUE_DAYS: 3,
  PROJECT_INACTIVE_DAYS: 7,
} as const;

export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";

export type AlertType =
  | "PROJECT_NO_FOREMAN"
  | "PENDING_WORK_LOGS"
  | "PROJECT_INACTIVE"
  | "OVERDUE_TASK"
  | "PROJECT_NO_WORKERS"
  | "USER_MUST_CHANGE_PASSWORD";

export interface DashboardAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  project: { id: string; name: string } | null;
  date: Date;
  action: { label: string; href: string };
}

export interface AlertProjectContext {
  id: string;
  name: string;
  createdAt: Date;
  hasForeman: boolean;
  workerCount: number;
  lastLogDate: Date | null;
}

export interface PendingLogAlertContext {
  project: { id: string; name: string };
  count: number;
  oldestCreatedAt: Date;
}

export interface OverdueTaskAlertContext {
  id: string;
  title: string;
  dueDate: Date;
  project: { id: string; name: string } | null;
}

export interface PasswordChangeAlertContext {
  id: string;
  name: string;
  updatedAt: Date;
}

export function isMoreThanDaysOld(date: Date, days: number, now: Date): boolean {
  return now.getTime() - date.getTime() > days * 24 * 60 * 60 * 1000;
}

export function calendarDaysSinceInLisbon(date: Date, now: Date): number {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const getDayNumber = (parts: Intl.DateTimeFormatPart[]) => {
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day));
  };

  return Math.floor((getDayNumber(nowParts) - getDayNumber(dateParts)) / 86_400_000);
}

export function formatAlertDateInLisbon(date: Date): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function deriveAlerts(params: {
  projects: AlertProjectContext[];
  pendingLogs: PendingLogAlertContext[];
  overdueTasks: OverdueTaskAlertContext[];
  usersMustChangePassword: PasswordChangeAlertContext[];
  now: Date;
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  for (const project of params.projects) {
    const projectRef = { id: project.id, name: project.name };
    if (!project.hasForeman) {
      alerts.push({
        id: `project-no-foreman-${project.id}`,
        type: "PROJECT_NO_FOREMAN",
        severity: "CRITICAL",
        title: texts.dashboard.alerts.rules.projectNoLead(project.name),
        project: projectRef,
        date: project.createdAt,
        action: {
          label: texts.dashboard.alerts.actions.assignLead,
          href: `/dashboard/obras/${project.id}/equipa`,
        },
      });
    }

    if (project.lastLogDate) {
      const idleDays = calendarDaysSinceInLisbon(project.lastLogDate, params.now);
      if (idleDays >= ALERT_THRESHOLDS.PROJECT_INACTIVE_DAYS) {
        alerts.push({
          id: `project-inactive-${project.id}`,
          type: "PROJECT_INACTIVE",
          severity: "WARNING",
          title: texts.dashboard.alerts.rules.projectInactive7d(project.name, idleDays),
          project: projectRef,
          date: project.lastLogDate,
          action: {
            label: texts.dashboard.alerts.actions.viewProject,
            href: `/dashboard/obras/${project.id}/editar`,
          },
        });
      }
    } else {
      const idleDays = calendarDaysSinceInLisbon(project.createdAt, params.now);
      if (idleDays >= ALERT_THRESHOLDS.PROJECT_INACTIVE_DAYS) {
        alerts.push({
          id: `project-no-logs-${project.id}`,
          type: "PROJECT_INACTIVE",
          severity: "WARNING",
          title: texts.dashboard.alerts.rules.projectNoLogs(project.name),
          project: projectRef,
          date: project.createdAt,
          action: {
            label: texts.dashboard.alerts.actions.viewProject,
            href: `/dashboard/obras/${project.id}/editar`,
          },
        });
      }
    }

    if (project.workerCount === 0) {
      alerts.push({
        id: `project-no-workers-${project.id}`,
        type: "PROJECT_NO_WORKERS",
        severity: "INFO",
        title: texts.dashboard.alerts.rules.projectNoWorkers(project.name),
        project: projectRef,
        date: project.createdAt,
        action: {
          label: texts.dashboard.alerts.actions.assignWorkers,
          href: `/dashboard/obras/${project.id}/equipa`,
        },
      });
    }
  }

  for (const pending of params.pendingLogs) {
    if (!isMoreThanDaysOld(pending.oldestCreatedAt, ALERT_THRESHOLDS.PENDING_OVERDUE_DAYS, params.now)) {
      continue;
    }
    alerts.push({
      id: `pending-work-logs-${pending.project.id}`,
      type: "PENDING_WORK_LOGS",
      severity: "WARNING",
      title: texts.dashboard.alerts.rules.pendingOverdue(pending.count, pending.project.name),
      project: pending.project,
      date: pending.oldestCreatedAt,
      action: {
        label: texts.dashboard.alerts.actions.reviewLogs,
        href: "/dashboard/registos",
      },
    });
  }

  for (const task of params.overdueTasks) {
    if (calendarDaysSinceInLisbon(task.dueDate, params.now) <= 0) continue;
    alerts.push({
      id: `overdue-task-${task.id}`,
      type: "OVERDUE_TASK",
      severity: "WARNING",
      title: texts.dashboard.alerts.rules.overdueTask(task.title),
      project: task.project,
      date: task.dueDate,
      action: {
        label: texts.dashboard.alerts.actions.viewTasks,
        href: "/dashboard/tarefas",
      },
    });
  }

  for (const user of params.usersMustChangePassword) {
    alerts.push({
      id: `password-change-${user.id}`,
      type: "USER_MUST_CHANGE_PASSWORD",
      severity: "INFO",
      title: texts.dashboard.alerts.rules.userMustChangePassword(user.name),
      project: null,
      date: user.updatedAt,
      action: {
        label: texts.dashboard.alerts.actions.viewTeam,
        href: "/dashboard/equipa",
      },
    });
  }

  const severityOrder: Record<AlertSeverity, number> = {
    CRITICAL: 0,
    WARNING: 1,
    INFO: 2,
  };

  return alerts.sort(
    (left, right) =>
      severityOrder[left.severity] - severityOrder[right.severity] ||
      left.date.getTime() - right.date.getTime() ||
      left.id.localeCompare(right.id)
  );
}

export function deriveProjectStatus(
  projectAlerts: Array<Pick<DashboardAlert, "severity">>
): "inOrder" | "watch" | "critical" {
  if (projectAlerts.some((alert) => alert.severity === "CRITICAL")) {
    return "critical";
  }
  if (projectAlerts.some((alert) => alert.severity === "WARNING")) {
    return "watch";
  }
  return "inOrder";
}

export function getAlertSeverityCounts(alerts: DashboardAlert[]) {
  return alerts.reduce(
    (counts, alert) => {
      counts[alert.severity] += 1;
      return counts;
    },
    { CRITICAL: 0, WARNING: 0, INFO: 0 }
  );
}
