import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Check,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  StickyNote,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BudgetRevisionType, Role, UserStatus, VisitStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBudgetTotals, formatBudgetAmount } from "@/lib/budget-utils";
import {
  CLIENT_STAGES,
  OPEN_BUDGET_STATUSES,
  buildClientTimeline,
  computeClientStage,
  readSnapshotStatus,
  type TimelineEvent,
  type TimelineTone,
} from "@/lib/client-record";
import { getLisbonDateKey } from "@/lib/dashboard-utils";
import { texts } from "@/lib/texts";
import VisitStatusControls from "@/components/clients/visit-status-controls";
import { ClientRecordActions } from "./ClientRecordActions";

const labels = texts.dashboard.clientRecord;

const dateFormatter = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "Europe/Lisbon" });
const wallTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Lisbon",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const dateTimeFormatter = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Lisbon",
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole([Role.OWNER]);
  const client = await prisma.client.findFirst({
    where: { id, companyId: user.companyId },
    select: { name: true },
  });
  return { title: client ? `${client.name} — Medido` : "Cliente — Medido" };
}

export default async function ClientRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole([Role.OWNER]);

  const client = await prisma.client.findFirst({
    where: { id, companyId: user.companyId },
    select: {
      id: true,
      name: true,
      nif: true,
      email: true,
      phone: true,
      address: true,
      notes: true,
      createdAt: true,
      activities: {
        where: { companyId: user.companyId },
        orderBy: { occurredAt: "desc" },
        select: {
          id: true,
          type: true,
          description: true,
          occurredAt: true,
          author: { select: { name: true } },
        },
      },
      visitRequests: {
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          requestedAddress: true,
          scheduledAt: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          durationMinutes: true,
          assignedToId: true,
          assignedTo: { select: { name: true } },
          budget: { select: { id: true } },
        },
      },
      budgets: {
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          projectName: true,
          status: true,
          createdAt: true,
          items: { select: { description: true, quantity: true, unit: true, unitPrice: true, vatRate: true } },
          revisions: {
            where: { type: BudgetRevisionType.STATUS_CHANGE },
            orderBy: { revisionNumber: "asc" },
            select: { revisionNumber: true, snapshot: true, createdAt: true },
          },
        },
      },
      projects: {
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, code: true, status: true, createdAt: true },
      },
    },
  });

  if (!client) notFound();

  // Responsáveis possíveis pelas visitas: encarregados e donos ativos
  const assignees = (
    await prisma.user.findMany({
      where: { companyId: user.companyId, status: UserStatus.ACTIVE, role: { in: [Role.FOREMAN, Role.OWNER] } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, role: true },
    })
  ).map((a) => ({ id: a.id, name: a.name, role: a.role as "OWNER" | "FOREMAN" }));
  const todayKey = getLisbonDateKey(new Date());

  const budgets = client.budgets.map((budget) => {
    const totals = calculateBudgetTotals(
      budget.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        vatRate: Number(item.vatRate),
      }))
    );
    return { ...budget, grossCents: totals.grossCents };
  });

  const stage = computeClientStage({
    visits: client.visitRequests,
    budgets,
    projects: client.projects,
  });
  const stageIndex = CLIENT_STAGES.indexOf(stage);

  const openBudgets = budgets.filter((b) => OPEN_BUDGET_STATUSES.includes(b.status));
  const openBudgetsCents = openBudgets.reduce((sum, b) => sum + b.grossCents, 0);
  const approvedCents = budgets.filter((b) => b.status === "APPROVED").reduce((sum, b) => sum + b.grossCents, 0);
  const activeProjects = client.projects.filter((p) => p.status === "ACTIVE").length;
  const lastContact = client.activities[0]?.occurredAt ?? null;
  const canDelete =
    client.projects.length === 0 && client.visitRequests.length === 0 && client.budgets.length === 0;

  const { upcoming, past } = buildClientTimeline(
    {
      client,
      activities: client.activities.map((a) => ({ ...a, authorName: a.author.name })),
      visits: client.visitRequests.map((v) => ({ ...v, assigneeName: v.assignedTo?.name ?? null })),
      budgets: budgets.map((b) => ({
        id: b.id,
        projectName: b.projectName,
        createdAt: b.createdAt,
        grossLabel: formatBudgetAmount(b.grossCents),
        statusChanges: b.revisions.flatMap((r) => {
          const status = readSnapshotStatus(r.snapshot);
          return status ? [{ revisionNumber: r.revisionNumber, status, createdAt: r.createdAt }] : [];
        }),
      })),
      projects: client.projects,
    },
    {
      ...labels.timeline,
      budgetStatuses: texts.dashboard.budgets.statuses,
      formatDateTime: (date) => dateTimeFormatter.format(date),
    }
  );

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/clientes"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {labels.back}
      </Link>

      {/* Cabeçalho de destaques */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-bold tracking-wider text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              {getInitials(client.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white">{client.name}</h1>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                  {labels.stages[stage]}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {client.nif ? `NIF ${client.nif} · ` : ""}
                {labels.clientSince(dateFormatter.format(client.createdAt))}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1 hover:text-amber-700 dark:hover:text-amber-400">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {client.phone}
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`} className="inline-flex min-w-0 items-center gap-1 hover:text-amber-700 dark:hover:text-amber-400">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{client.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
          <ClientRecordActions
            client={{
              id: client.id,
              name: client.name,
              nif: client.nif,
              email: client.email,
              phone: client.phone,
              address: client.address,
              notes: client.notes,
            }}
            canDelete={canDelete}
            assignees={assignees}
            todayKey={todayKey}
          />
        </div>

        {/* Barra de etapas comerciais */}
        <nav aria-label={labels.currentStage} className="mt-5">
          <ol className="grid grid-cols-5 gap-1">
            {CLIENT_STAGES.map((step, index) => {
              const isDone = index < stageIndex;
              const isCurrent = index === stageIndex;
              return (
                <li
                  key={step}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex min-h-[36px] items-center justify-center gap-1 rounded-md px-1 text-center text-[10px] font-bold uppercase tracking-wide sm:text-[11px] ${
                    isCurrent
                      ? "bg-amber-500 text-slate-950"
                      : isDone
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {isDone && <Check className="hidden h-3 w-3 shrink-0 sm:block" aria-hidden="true" />}
                  <span className="truncate">{labels.stages[step]}</span>
                </li>
              );
            })}
          </ol>
        </nav>
      </section>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Highlight
          title={labels.highlights.projects}
          value={String(client.projects.length)}
          hint={labels.highlights.activeProjects(activeProjects)}
          accent="border-l-blue-600"
        />
        <Highlight
          title={labels.highlights.openBudgets}
          value={formatBudgetAmount(openBudgetsCents)}
          hint={labels.highlights.openBudgetsHint(openBudgets.length)}
          accent="border-l-amber-500"
        />
        <Highlight
          title={labels.highlights.approved}
          value={formatBudgetAmount(approvedCents)}
          hint={labels.highlights.approvedHint}
          accent="border-l-emerald-600"
        />
        <Highlight
          title={labels.highlights.lastContact}
          value={lastContact ? dateFormatter.format(lastContact) : "—"}
          hint={lastContact ? labels.timeline.activityTitles[client.activities[0].type] : labels.highlights.noContact}
          accent="border-l-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_22rem]">
        {/* Atividade */}
        <section aria-labelledby="activity-heading" className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 id="activity-heading" className="text-sm font-bold text-slate-900 dark:text-white">{labels.timeline.title}</h2>

          {upcoming.length > 0 && (
            <div className="mt-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">{labels.timeline.upcoming}</h3>
              <Timeline events={upcoming} />
            </div>
          )}

          <div className="mt-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{labels.timeline.past}</h3>
            {past.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">{labels.timeline.empty}</p>
            ) : (
              <Timeline events={past} />
            )}
          </div>
        </section>

        {/* Listas relacionadas */}
        <aside className="space-y-4">
          <RelatedCard title={labels.related.details}>
            <dl className="space-y-2 text-xs">
              <DetailRow label={labels.related.nif} value={client.nif} />
              <DetailRow label={labels.related.phone} value={client.phone} />
              <DetailRow label={labels.related.email} value={client.email} />
              <DetailRow label={labels.related.address} value={client.address} />
              {client.notes && (
                <div>
                  <dt className="font-semibold text-slate-500 dark:text-slate-400">{labels.related.notes}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{client.notes}</dd>
                </div>
              )}
            </dl>
          </RelatedCard>

          <RelatedCard title={labels.related.visits} count={client.visitRequests.length}>
            {client.visitRequests.length === 0 ? (
              <EmptyRow text={labels.related.noVisits} />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {client.visitRequests.map((visit) => (
                  <li key={visit.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <MapPin className="mr-1 inline h-3 w-3 text-slate-400" />
                        {visit.requestedAddress}
                      </p>
                      <StatusPill tone={VISIT_TONES[visit.status]}>{VISIT_LABELS[visit.status]}</StatusPill>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {visit.scheduledAt ? `${dateTimeFormatter.format(visit.scheduledAt)} · ` : ""}
                      {texts.dashboard.visits.durationOption(visit.durationMinutes)}
                      {" · "}
                      {visit.assignedTo?.name ?? texts.dashboard.visits.noAssignee}
                    </p>
                    {visit.notes && <p className="mt-1 whitespace-pre-wrap text-[11px] text-slate-600 dark:text-slate-300">{visit.notes}</p>}
                    {visit.budget ? (
                      <Link href={`/dashboard/orcamentos/${visit.budget.id}`} className="mt-1 inline-block text-[11px] font-semibold text-amber-700 hover:underline dark:text-amber-400">
                        {texts.dashboard.visits.viewBudget}
                      </Link>
                    ) : (
                      visit.status === VisitStatus.COMPLETED && (
                        <Link
                          href={`/dashboard/orcamentos/novo?cliente=${client.id}&visita=${visit.id}`}
                          className="mt-1 inline-block text-[11px] font-semibold text-amber-700 hover:underline dark:text-amber-400"
                        >
                          {labels.related.visitWithoutBudget}
                        </Link>
                      )
                    )}
                    <VisitStatusControls
                      visitRequestId={visit.id}
                      status={visit.status}
                      assignees={assignees}
                      todayKey={todayKey}
                      schedule={{
                        assignedToId: visit.assignedToId,
                        durationMinutes: visit.durationMinutes,
                        date: visit.scheduledAt ? getLisbonDateKey(visit.scheduledAt) : "",
                        time: visit.scheduledAt ? wallTimeFormatter.format(visit.scheduledAt) : "",
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </RelatedCard>

          <RelatedCard title={labels.related.budgets} count={budgets.length}>
            {budgets.length === 0 ? (
              <EmptyRow text={labels.related.noBudgets} />
            ) : (
              <ul className="space-y-1.5">
                {budgets.map((budget) => (
                  <li key={budget.id}>
                    <Link
                      href={`/dashboard/orcamentos/${budget.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-2 text-xs transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-800 dark:text-slate-200">{budget.projectName}</span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{formatBudgetAmount(budget.grossCents)}</span>
                      </span>
                      <StatusPill tone={BUDGET_TONES[budget.status]}>{texts.dashboard.budgets.statuses[budget.status]}</StatusPill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </RelatedCard>

          <RelatedCard title={labels.related.projects} count={client.projects.length}>
            {client.projects.length === 0 ? (
              <EmptyRow text={labels.related.noProjects} />
            ) : (
              <ul className="space-y-1.5">
                {client.projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href="/dashboard/obras"
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-2 text-xs transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <span className="min-w-0 truncate font-semibold text-slate-800 dark:text-slate-200">
                        {project.code && <span className="mr-1 font-mono text-[10px] text-slate-500 dark:text-slate-400">[{project.code}]</span>}
                        {project.name}
                      </span>
                      <StatusPill tone={PROJECT_TONES[project.status]}>{labels.related.projectStatuses[project.status]}</StatusPill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </RelatedCard>
        </aside>
      </div>
    </div>
  );
}

const VISIT_LABELS: Record<VisitStatus, string> = {
  REQUESTED: texts.dashboard.visits.requested,
  SCHEDULED: texts.dashboard.visits.scheduled,
  COMPLETED: texts.dashboard.visits.completed,
  CANCELLED: texts.dashboard.visits.cancelled,
};
const VISIT_TONES: Record<VisitStatus, TimelineTone> = {
  REQUESTED: "info",
  SCHEDULED: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
};
const BUDGET_TONES: Record<string, TimelineTone> = {
  DRAFT: "neutral",
  SENT: "info",
  NEGOTIATION: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "danger",
};
const PROJECT_TONES: Record<string, TimelineTone> = { ACTIVE: "success", COMPLETED: "info", ARCHIVED: "neutral" };

const TONE_CLASSES: Record<TimelineTone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

function eventIcon(event: TimelineEvent): LucideIcon {
  if (event.kind === "activity") {
    return { CALL: Phone, EMAIL: Mail, MEETING: Users, NOTE: StickyNote }[event.activityType ?? "NOTE"];
  }
  return { client: UserPlus, visit: CalendarClock, budget: FileText, project: Building2, activity: MessageSquare }[event.kind];
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="mt-2 space-y-0">
      {events.map((event, index) => {
        const Icon = eventIcon(event);
        const content = (
          <>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">{event.title}</p>
            {event.description && (
              <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">{event.description}</p>
            )}
            <p className="mt-0.5 text-[11px] text-slate-400">
              {dateTimeFormatter.format(event.date)}
              {event.authorName ? ` · ${labels.timeline.by(event.authorName)}` : ""}
            </p>
          </>
        );
        return (
          <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
            {index < events.length - 1 && (
              <span className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
            )}
            <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[event.tone]}`}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              {event.href ? (
                <Link href={event.href} className="block rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Highlight({ title, value, hint, accent }: { title: string; value: string; hint: string; accent: string }) {
  return (
    <div className={`rounded-xl border border-l-4 border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 ${accent}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</div>
      <div className="mt-1 truncate font-mono text-lg font-black text-slate-900 dark:text-white">{value}</div>
      <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{hint}</div>
    </div>
  );
}

function RelatedCard({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 text-xs font-bold text-slate-900 dark:border-slate-800 dark:text-white">
        {title}
        {count !== undefined && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{count}</span>
        )}
      </h2>
      {children}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`min-w-0 text-right break-words ${value ? "text-slate-800 dark:text-slate-200" : "italic text-slate-400"}`}>
        {value || labels.related.notProvided}
      </dd>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: TimelineTone; children: React.ReactNode }) {
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${TONE_CLASSES[tone]}`}>{children}</span>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-2 text-center text-xs italic text-slate-400">{text}</p>;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
