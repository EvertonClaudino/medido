import { ChevronDown } from "lucide-react";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CURRENT_MONTH_INDEX = 4;

interface TimelineProgressChartProps {
  /** Mês corrente em Lisboa, no formato YYYY-MM */
  currentMonthKey: string;
}

// Ainda não existe planeamento de obra (baseline/curva S) na BD: o gráfico mostra
// apenas a grelha e o eixo temporal real, sem curvas.
export function TimelineProgressChart({ currentMonthKey }: TimelineProgressChartProps) {
  const currentMonth = Number(currentMonthKey.slice(5, 7)) - 1;
  const months = Array.from({ length: 9 }, (_, i) => {
    const monthIndex = (currentMonth + i - CURRENT_MONTH_INDEX + 12) % 12;
    return MONTH_LABELS[monthIndex];
  });

  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Evolução e Cronograma de Obras
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Progresso global planeado vs. real vs. previsão
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <span>Todas as Obras</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Legenda das Linhas */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-full bg-blue-600" />
            <span>Planeado</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-full bg-emerald-600" />
            <span>Executado</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-b-2 border-dashed border-amber-500" />
            <span>Previsão</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-b-2 border-dotted border-slate-400" />
            <span>Baseline</span>
          </span>
        </div>

        {/* Gráfico SVG Responsivo */}
        <div className="relative mt-4 h-44 w-full">
          <svg className="h-full w-full overflow-visible" viewBox="0 0 400 150" preserveAspectRatio="none">
            {/* Linhas de Grelha Horizontais */}
            <line x1="20" y1="15" x2="380" y2="15" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
            <line x1="20" y1="48" x2="380" y2="48" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
            <line x1="20" y1="82" x2="380" y2="82" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
            <line x1="20" y1="115" x2="380" y2="115" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" />
            <line x1="20" y1="140" x2="380" y2="140" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />

            {/* Marcador do mês corrente */}
            <line x1="200" y1="15" x2="200" y2="140" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <p className="rounded-md border border-slate-200 bg-white/95 px-3 py-1.5 text-center text-[11px] font-medium text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-800/95 dark:text-slate-400">
              Sem dados de planeamento das obras
            </p>
          </div>
        </div>

        {/* Eixo X com os Meses */}
        <div className="mt-2 flex items-center justify-between px-2 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
          {months.map((m, idx) => (
            <span key={idx} className={idx === CURRENT_MONTH_INDEX ? "text-blue-700 dark:text-blue-400 font-bold" : ""}>
              {m}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
