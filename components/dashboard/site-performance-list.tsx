import Link from "next/link";
import { Building, ArrowUpRight } from "lucide-react";

export interface ProjectPerformanceItem {
  id: string;
  name: string;
  address?: string | null;
  progressPercent: number;
}

interface SitePerformanceListProps {
  projects: ProjectPerformanceItem[];
}

export function SitePerformanceList({ projects }: SitePerformanceListProps) {

  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Desempenho por Obra
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Avanço calculado pelas tarefas concluídas
            </p>
          </div>
          <Link
            href="/dashboard/obras"
            className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
          >
            <span>Ver Todas</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-4 space-y-3.5">
          {projects.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">Sem obras ativas.</p>
          )}
          {projects.slice(0, 4).map((p) => {
            const barColor =
              p.progressPercent >= 70
                ? "bg-emerald-500"
                : p.progressPercent >= 50
                ? "bg-blue-600"
                : "bg-amber-500";

            return (
              <div key={p.id} className="group">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <Building className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors text-[13px]">
                        {p.name}
                      </h3>
                      {p.address && (
                        <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {p.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white shrink-0">
                    {p.progressPercent}%
                  </span>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${p.progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
