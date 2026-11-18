import {
  Building2,
  CheckCircle2,
  ClockAlert,
  HardHat,
  FileCheck2,
  Users2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

export interface OwnerKpiRowProps {
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  ongoingActivities: number;
  pendingApprovals: number;
  projectsCreatedThisMonth: number;
  workLogsThisWeek: number;
  /** null quando a empresa não tem funcionários ativos */
  laborAttendanceRate: number | null;
  workersPresentToday: number;
  totalWorkers: number;
}

export function OwnerKpiRow({
  activeProjects,
  completedProjects,
  delayedProjects,
  ongoingActivities,
  pendingApprovals,
  projectsCreatedThisMonth,
  workLogsThisWeek,
  laborAttendanceRate,
  workersPresentToday,
  totalWorkers,
}: OwnerKpiRowProps) {
  const cards = [
    {
      id: "active-projects",
      title: "Obras Ativas",
      value: activeProjects,
      suffix: "",
      delta: `+${projectsCreatedThisMonth}`,
      deltaPeriod: "novas este mês",
      deltaPositive: true,
      icon: Building2,
      iconColor: "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-900/50",
      accentBorder: "border-l-blue-600",
      href: "/dashboard/obras",
    },
    {
      id: "completed-projects",
      title: "Obras Concluídas",
      value: completedProjects,
      suffix: "",
      delta: `${completedProjects}`,
      deltaPeriod: "total acumulado",
      deltaPositive: true,
      icon: CheckCircle2,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-900/50",
      accentBorder: "border-l-emerald-600",
      href: "/dashboard/obras",
    },
    {
      id: "delayed-projects",
      title: "Obras em Atraso",
      value: delayedProjects,
      suffix: "",
      delta: delayedProjects > 0 ? `▲ ${delayedProjects}` : "0",
      deltaPeriod: "em acompanhamento",
      deltaPositive: delayedProjects === 0,
      icon: ClockAlert,
      iconColor: "text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-950/50 dark:border-rose-900/50",
      accentBorder: "border-l-rose-600",
      href: "/dashboard/obras",
    },
    {
      id: "ongoing-activities",
      title: "Apontamentos em Obra",
      value: ongoingActivities,
      suffix: "",
      delta: `+${workLogsThisWeek}`,
      deltaPeriod: "esta semana",
      deltaPositive: true,
      icon: HardHat,
      iconColor: "text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-900/50",
      accentBorder: "border-l-amber-600",
      href: "/dashboard/registos",
    },
    {
      id: "pending-approvals",
      title: "Validações Pendentes",
      value: pendingApprovals,
      suffix: "",
      delta: pendingApprovals > 0 ? `${pendingApprovals} aguardam` : "Em dia",
      deltaPeriod: "pelo encarregado",
      deltaPositive: pendingApprovals === 0,
      icon: FileCheck2,
      iconColor: "text-orange-600 bg-orange-50 border-orange-100 dark:text-orange-400 dark:bg-orange-950/50 dark:border-orange-900/50",
      accentBorder: "border-l-orange-500",
      href: "/dashboard/registos",
    },
    {
      id: "labor-attendance",
      title: "Assiduidade da Equipa",
      value: laborAttendanceRate ?? "—",
      suffix: laborAttendanceRate === null ? "" : "%",
      delta: `${workersPresentToday}/${totalWorkers}`,
      deltaPeriod: "registaram hoje",
      deltaPositive: laborAttendanceRate === null || laborAttendanceRate >= 50,
      icon: Users2,
      iconColor: "text-purple-600 bg-purple-50 border-purple-100 dark:text-purple-400 dark:bg-purple-950/50 dark:border-purple-900/50",
      accentBorder: "border-l-purple-600",
      href: "/dashboard/equipa",
    },
  ];

  return (
    <section aria-label="Métricas Principais de Desempenho" className="w-full">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              href={card.href}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs transition-all duration-150 hover:border-slate-300 hover:shadow-xs border-l-4 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600 ${card.accentBorder} dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors line-clamp-1">
                  {card.title}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center justify-center rounded-lg border p-1.5 ${card.iconColor}`}
                  aria-hidden="true"
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="mt-2.5">
                <div className="font-mono text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {card.value}
                  {card.suffix && <span className="text-lg font-bold text-slate-600 dark:text-slate-400 ml-0.5">{card.suffix}</span>}
                </div>

                <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold">
                  {card.deltaPositive ? (
                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      {card.delta}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-rose-600 dark:text-rose-400">
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      {card.delta}
                    </span>
                  )}
                  <span className="text-slate-400 dark:text-slate-500 font-normal truncate">{card.deltaPeriod}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
