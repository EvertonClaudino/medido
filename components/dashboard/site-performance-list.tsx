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
  // Lista padrão caso haja poucas obras cadastradas
  const displayProjects = projects.length > 0 ? projects : [
    { id: "1", name: "Reabilitação Edifício Chiado", address: "Rua Garrett, Lisboa", progressPercent: 72 },
    { id: "2", name: "Construção de Moradia Unifamiliar", address: "Quinta da Marinha, Cascais", progressPercent: 58 },
    { id: "3", name: "Remodelação Espaço Comercial", address: "Avenida da Liberdade, Lisboa", progressPercent: 65 },
    { id: "4", name: "Moradias Parque das Nações", address: "Alameda dos Oceanos, Lisboa", progressPercent: 41 },
  ];

  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Desempenho por Obra
            </h2>
            <p className="text-[11px] text-slate-500">
              Taxa de conclusão e avanço das frentes
            </p>
          </div>
          <Link
            href="/dashboard/obras"
            className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-700 hover:text-blue-900"
          >
            <span>Ver Todas</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-4 space-y-3.5">
          {displayProjects.slice(0, 4).map((p) => {
            // Cor da barra de acordo com o progresso
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
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Building className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-[13px]">
                        {p.name}
                      </h3>
                      {p.address && (
                        <p className="truncate text-[10px] text-slate-500 font-medium">
                          {p.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-900 shrink-0">
                    {p.progressPercent}%
                  </span>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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

