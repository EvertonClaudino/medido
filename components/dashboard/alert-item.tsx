import Link from "next/link";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  InfoIcon,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { formatAlertDateInLisbon, type DashboardAlert } from "@/lib/alerts";
import { texts } from "@/lib/texts";

const severityStyles = {
  CRITICAL: "border-red-200 bg-red-50 text-red-900",
  WARNING: "border-amber-200 bg-amber-50 text-amber-900",
  INFO: "border-blue-200 bg-blue-50 text-blue-900",
} as const;

const severityIcons = {
  CRITICAL: AlertCircleIcon,
  WARNING: ClockIcon,
  INFO: InfoIcon,
} as const;

const severityLabels = {
  CRITICAL: texts.dashboard.alerts.criticalBadge,
  WARNING: texts.dashboard.alerts.warningBadge,
  INFO: texts.dashboard.alerts.infoBadge,
} as const;

export function AlertItem({
  alert,
}: {
  alert: DashboardAlert;
}) {
  const Icon = severityIcons[alert.severity];

  return (
    <article className="flex items-start gap-3 p-4">
      <Badge
        variant="outline"
        className={`mt-0.5 h-auto shrink-0 gap-1 rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${severityStyles[alert.severity]}`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {severityLabels[alert.severity]}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-5 text-slate-900">{alert.title}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
          {alert.project && (
            <span>
              {texts.dashboard.alerts.projectLabel}: {alert.project.name}
            </span>
          )}
          <time dateTime={alert.date.toISOString()}>
            {formatAlertDateInLisbon(alert.date)}
          </time>
        </div>
        <Link
          href={alert.action.href}
          className="mt-2 inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          {alert.action.label}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export function AlertsEmptyState() {
  return (
    <div className="flex items-center gap-2 p-5 text-sm text-emerald-900">
      <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{texts.dashboard.alerts.noAlerts}</span>
    </div>
  );
}
