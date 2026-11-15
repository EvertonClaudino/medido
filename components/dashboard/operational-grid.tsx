import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Flame,
  CalendarDays,
} from "lucide-react";

export interface ProjectUpdateItem {
  id: string;
  projectName: string;
  description: string;
  authorName?: string;
  timeAgo: string;
  statusType: "success" | "info" | "warning";
}

export interface CriticalAlertItem {
  id: string;
  title: string;
  projectName?: string;
  severity: "high" | "medium";
  dateFormatted: string;
}

export interface UpcomingDeadlineItem {
  id: string;
  title: string;
  projectName: string;
  dueDateFormatted: string;
  daysLeft: number;
}

interface OperationalGridProps {
  recentUpdates: ProjectUpdateItem[];
  criticalAlerts: CriticalAlertItem[];
  upcomingDeadlines: UpcomingDeadlineItem[];
}

export function OperationalGrid({
  recentUpdates,
  criticalAlerts,
  upcomingDeadlines,
}: OperationalGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Painel 1: Últimas Atualizações de Obra */}
      <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Atualizações das Obras
              </h2>
              <p className="text-[11px] text-slate-500">Últimos registos de trabalho</p>
            </div>
            <Link
              href="/dashboard/registos"
              className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-700 hover:text-blue-900"
            >
              <span>Ver Todos</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3.5 space-y-3">
            {recentUpdates.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Sem registos recentes.</p>
            ) : (
              recentUpdates.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-xs">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      item.statusType === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.statusType === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="truncate font-bold text-slate-900 text-xs">
                        {item.projectName}
                      </h3>
                      <span className="text-[10px] font-medium text-slate-400 shrink-0">
                        {item.timeAgo}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-[11px] text-slate-600 mt-0.5">
                      {item.description}
                    </p>
                    {item.authorName && (
                      <span className="text-[10px] text-slate-400">Por {item.authorName}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </article>

      {/* Painel 2: Alertas Críticos de Obra */}
      <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-rose-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Alertas Críticos
                </h2>
                <p className="text-[11px] text-slate-500">Incidentes e aprovações</p>
              </div>
            </div>
            <Link
              href="/dashboard/alertas"
              className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-700 hover:text-rose-900"
            >
              <span>Ver Todos</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3.5 space-y-3">
            {criticalAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Sem alertas críticos pendentes.</p>
            ) : (
              criticalAlerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 text-xs">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                      alert.severity === "high"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="truncate font-bold text-slate-900 text-xs">
                        {alert.title}
                      </h3>
                      <span
                        className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                          alert.severity === "high"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {alert.severity === "high" ? "Alto" : "Médio"}
                      </span>
                    </div>
                    {alert.projectName && (
                      <p className="truncate text-[11px] text-slate-600 mt-0.5">
                        {alert.projectName}
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400">{alert.dateFormatted}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </article>

      {/* Painel 3: Próximos Prazos & Milestones */}
      <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-amber-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Próximos Prazos
                </h2>
                <p className="text-[11px] text-slate-500">Prazos de obra e entregas</p>
              </div>
            </div>
            <Link
              href="/dashboard/tarefas"
              className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-700 hover:text-blue-900"
            >
              <span>Ver Todos</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3.5 space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Sem prazos imediatos agendados.</p>
            ) : (
              upcomingDeadlines.slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-start gap-3 text-xs">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                    <Clock className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="truncate font-bold text-slate-900 text-xs">
                        {d.title}
                      </h3>
                      <span
                        className={`rounded-sm px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 ${
                          d.daysLeft <= 8
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : d.daysLeft <= 16
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {d.daysLeft} dias restam
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-slate-600 mt-0.5">
                      {d.projectName}
                    </p>
                    <span className="text-[10px] text-slate-400">{d.dueDateFormatted}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

