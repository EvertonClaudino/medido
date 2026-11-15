import { Role } from "@prisma/client";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getCompanyAlertsData } from "@/lib/alert-data";
import { type AlertSeverity, type AlertType } from "@/lib/alerts";
import { texts } from "@/lib/texts";
import { AlertItem, AlertsEmptyState } from "@/components/dashboard/alert-item";

const alertTypes: AlertType[] = [
  "PROJECT_NO_FOREMAN",
  "PENDING_WORK_LOGS",
  "PROJECT_INACTIVE",
  "OVERDUE_TASK",
  "PROJECT_NO_WORKERS",
  "USER_MUST_CHANGE_PASSWORD",
];

const severityGroups: Array<{ severity: AlertSeverity; label: string }> = [
  { severity: "CRITICAL", label: texts.dashboard.alerts.criticalBadge },
  { severity: "WARNING", label: texts.dashboard.alerts.warningBadge },
  { severity: "INFO", label: texts.dashboard.alerts.infoBadge },
];

export default async function AlertasPage({
  searchParams,
}: {
  searchParams?: Promise<{ obra?: string; tipo?: string }>;
}) {
  const user = await requireRole([Role.OWNER]);
  const params = await searchParams;
  const selectedType = alertTypes.includes(params?.tipo as AlertType)
    ? (params?.tipo as AlertType)
    : "";
  const { alerts, activeProjects } = await getCompanyAlertsData(user.companyId);
  const projectOptions = new Map(
    activeProjects.map((project) => [project.id, { id: project.id, name: project.name }] as const)
  );
  alerts.forEach((alert) => {
    if (alert.project) projectOptions.set(alert.project.id, alert.project);
  });
  const projects = Array.from(projectOptions.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "pt-PT")
  );
  const selectedProjectId = projects.some((project) => project.id === params?.obra)
    ? params?.obra
    : "";
  const filteredAlerts = alerts.filter(
    (alert) =>
      (!selectedType || alert.type === selectedType) &&
      (!selectedProjectId || alert.project?.id === selectedProjectId)
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {texts.dashboard.alerts.pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {texts.dashboard.alerts.pageDescription}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="w-fit rounded-sm text-sm font-semibold text-amber-800 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          ← {texts.dashboard.alerts.backToOverview}
        </Link>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
      >
        <div>
          <label htmlFor="alert-type" className="mb-1 block text-xs font-semibold text-slate-700">
            {texts.dashboard.alerts.typeFilter}
          </label>
          <select
            id="alert-type"
            name="tipo"
            defaultValue={selectedType}
            className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          >
            <option value="">{texts.dashboard.alerts.allTypes}</option>
            {alertTypes.map((type) => (
              <option key={type} value={type}>
                {texts.dashboard.alerts.types[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="alert-project" className="mb-1 block text-xs font-semibold text-slate-700">
            {texts.dashboard.alerts.projectFilter}
          </label>
          <select
            id="alert-project"
            name="obra"
            defaultValue={selectedProjectId}
            className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          >
            <option value="">{texts.dashboard.alerts.allProjects}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="min-h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          {texts.dashboard.alerts.applyFilters}
        </button>
        <Link
          href="/dashboard/alertas"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          {texts.dashboard.alerts.clearFilters}
        </Link>
      </form>

      {filteredAlerts.length === 0 ? (
        selectedType || selectedProjectId ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            {texts.dashboard.alerts.noFilteredAlerts}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white">
            <AlertsEmptyState />
          </div>
        )
      ) : (
        <div className="space-y-5">
          {severityGroups.map(({ severity, label }) => {
            const groupAlerts = filteredAlerts.filter((alert) => alert.severity === severity);
            if (groupAlerts.length === 0) return null;
            return (
              <section
                key={severity}
                aria-labelledby={`alerts-${severity.toLowerCase()}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <h2
                  id={`alerts-${severity.toLowerCase()}`}
                  className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-900"
                >
                  {label} <span className="text-slate-600">({groupAlerts.length})</span>
                </h2>
                <div className="divide-y divide-slate-100">
                  {groupAlerts.map((alert) => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
