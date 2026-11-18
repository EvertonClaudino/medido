/**
 * Regras puras da ficha do cliente (sem acesso à base de dados):
 * etapa comercial (barra de etapas) e histórico cronológico de atividade.
 */

export const CLIENT_STAGES = ["CONTACT", "VISIT", "BUDGET", "NEGOTIATION", "PROJECT"] as const;
export type ClientStage = (typeof CLIENT_STAGES)[number];

export type VisitStatusValue = "REQUESTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type BudgetStatusValue = "DRAFT" | "SENT" | "NEGOTIATION" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ProjectStatusValue = "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type ClientActivityTypeValue = "CALL" | "EMAIL" | "MEETING" | "NOTE";

export const OPEN_BUDGET_STATUSES: readonly BudgetStatusValue[] = ["DRAFT", "SENT", "NEGOTIATION"];

export interface StageInput {
  visits: { status: VisitStatusValue }[];
  budgets: { status: BudgetStatusValue }[];
  projects: { status: ProjectStatusValue }[];
}

/**
 * Etapa comercial atual, calculada a partir dos dados (sem campo manual):
 * obra (ativa ou concluída) > negociação > orçamento em aberto > visita em curso > contacto.
 * Orçamentos rejeitados/cancelados e visitas canceladas não contam.
 */
export function computeClientStage({ visits, budgets, projects }: StageInput): ClientStage {
  if (projects.some((p) => p.status !== "ARCHIVED")) return "PROJECT";
  if (budgets.some((b) => b.status === "NEGOTIATION")) return "NEGOTIATION";
  if (budgets.some((b) => b.status === "DRAFT" || b.status === "SENT")) return "BUDGET";
  if (visits.some((v) => v.status !== "CANCELLED")) return "VISIT";
  return "CONTACT";
}

export type TimelineTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface TimelineEvent {
  id: string;
  kind: "client" | "activity" | "visit" | "budget" | "project";
  date: Date;
  title: string;
  description?: string;
  href?: string;
  tone: TimelineTone;
  activityType?: ClientActivityTypeValue;
  authorName?: string;
}

export interface TimelineInput {
  client: { id: string; createdAt: Date };
  activities: {
    id: string;
    type: ClientActivityTypeValue;
    description: string;
    occurredAt: Date;
    authorName: string;
  }[];
  visits: {
    id: string;
    status: VisitStatusValue;
    requestedAddress: string;
    scheduledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    assigneeName?: string | null;
  }[];
  budgets: {
    id: string;
    projectName: string;
    createdAt: Date;
    grossLabel: string;
    statusChanges: { revisionNumber: number; status: BudgetStatusValue; createdAt: Date }[];
  }[];
  projects: { id: string; name: string; code: string | null; createdAt: Date }[];
}

export interface TimelineLabels {
  clientCreated: string;
  activityTitles: Record<ClientActivityTypeValue, string>;
  visitRequested: (address: string) => string;
  visitScheduled: (date: string) => string;
  visitCompleted: string;
  visitCancelled: string;
  budgetCreated: (name: string, amount: string) => string;
  budgetStatusChanged: (name: string, status: string) => string;
  budgetStatuses: Record<BudgetStatusValue, string>;
  projectCreated: (label: string) => string;
  formatDateTime: (date: Date) => string;
}

const BUDGET_STATUS_TONES: Record<BudgetStatusValue, TimelineTone> = {
  DRAFT: "neutral",
  SENT: "info",
  NEGOTIATION: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "danger",
};

/**
 * Divide o histórico em "próximas" (visitas agendadas no futuro) e "atividade passada",
 * esta ordenada da mais recente para a mais antiga.
 */
export function buildClientTimeline(
  input: TimelineInput,
  labels: TimelineLabels,
  now: Date = new Date()
): { upcoming: TimelineEvent[]; past: TimelineEvent[] } {
  const upcoming: TimelineEvent[] = [];
  const past: TimelineEvent[] = [
    {
      id: `client-${input.client.id}`,
      kind: "client",
      date: input.client.createdAt,
      title: labels.clientCreated,
      tone: "neutral",
    },
  ];

  for (const activity of input.activities) {
    past.push({
      id: `activity-${activity.id}`,
      kind: "activity",
      date: activity.occurredAt,
      title: labels.activityTitles[activity.type],
      description: activity.description,
      tone: "neutral",
      activityType: activity.type,
      authorName: activity.authorName,
    });
  }

  for (const visit of input.visits) {
    past.push({
      id: `visit-requested-${visit.id}`,
      kind: "visit",
      date: visit.createdAt,
      title: labels.visitRequested(visit.requestedAddress),
      tone: "info",
    });

    if (visit.status === "SCHEDULED" && visit.scheduledAt) {
      const event: TimelineEvent = {
        id: `visit-scheduled-${visit.id}`,
        kind: "visit",
        date: visit.scheduledAt,
        title: labels.visitScheduled(labels.formatDateTime(visit.scheduledAt)),
        description: visit.assigneeName ? `${visit.requestedAddress} · ${visit.assigneeName}` : visit.requestedAddress,
        tone: "warning",
      };
      (visit.scheduledAt >= now ? upcoming : past).push(event);
    } else if (visit.status === "COMPLETED") {
      past.push({
        id: `visit-completed-${visit.id}`,
        kind: "visit",
        date: visit.scheduledAt ?? visit.updatedAt,
        title: labels.visitCompleted,
        description: visit.requestedAddress,
        tone: "success",
      });
    } else if (visit.status === "CANCELLED") {
      past.push({
        id: `visit-cancelled-${visit.id}`,
        kind: "visit",
        date: visit.updatedAt,
        title: labels.visitCancelled,
        description: visit.requestedAddress,
        tone: "danger",
      });
    }
  }

  for (const budget of input.budgets) {
    const href = `/dashboard/orcamentos/${budget.id}`;
    past.push({
      id: `budget-created-${budget.id}`,
      kind: "budget",
      date: budget.createdAt,
      title: labels.budgetCreated(budget.projectName, budget.grossLabel),
      href,
      tone: "neutral",
    });
    for (const change of budget.statusChanges) {
      past.push({
        id: `budget-status-${budget.id}-${change.revisionNumber}`,
        kind: "budget",
        date: change.createdAt,
        title: labels.budgetStatusChanged(budget.projectName, labels.budgetStatuses[change.status]),
        href,
        tone: BUDGET_STATUS_TONES[change.status],
      });
    }
  }

  for (const project of input.projects) {
    past.push({
      id: `project-${project.id}`,
      kind: "project",
      date: project.createdAt,
      title: labels.projectCreated(project.code ? `${project.code} · ${project.name}` : project.name),
      href: "/dashboard/obras",
      tone: "success",
    });
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  past.sort((a, b) => b.date.getTime() - a.date.getTime());
  return { upcoming, past };
}

const BUDGET_STATUS_VALUES = new Set<string>(["DRAFT", "SENT", "NEGOTIATION", "APPROVED", "REJECTED", "CANCELLED"]);

/** Lê o estado guardado no snapshot JSON de uma revisão de orçamento. */
export function readSnapshotStatus(snapshot: unknown): BudgetStatusValue | null {
  if (typeof snapshot !== "object" || snapshot === null || !("status" in snapshot)) return null;
  const status = (snapshot as { status: unknown }).status;
  return typeof status === "string" && BUDGET_STATUS_VALUES.has(status) ? (status as BudgetStatusValue) : null;
}
