import { ChevronDown } from "lucide-react";

export function TimelineProgressChart() {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set"];

  // Coordenadas calculadas para as curvas do gráfico SVG (largura 400, altura 140)
  // 9 pontos: x = 20, 65, 110, 155, 200, 245, 290, 335, 380
  // Planned (azul): 10%, 18%, 28%, 38%, 46%, 58%, 70%, 82%, 96%
  const plannedPath = "M 20 125 C 65 115, 110 100, 155 88 C 200 76, 245 60, 290 44 C 335 28, 380 15, 380 15";

  // Actual (verde/esmeralda): 8%, 15%, 24%, 31%, 38% (até Maio)
  const actualPath = "M 20 128 C 65 120, 110 108, 155 98 C 180 92, 200 87, 200 87";

  // Forecast (âmbar tracejado): a partir de Maio até Setembro (42%, 52%, 65%, 78%, 92%)
  const forecastPath = "M 200 87 C 245 74, 290 56, 335 38 C 360 28, 380 20, 380 20";

  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Evolução e Cronograma de Obras
            </h2>
            <p className="text-[11px] text-slate-500">
              Progresso global planeado vs. real vs. previsão
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <span>Todas as Obras</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Legenda das Linhas */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600">
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
            <line x1="20" y1="15" x2="380" y2="15" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="20" y1="48" x2="380" y2="48" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="20" y1="82" x2="380" y2="82" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="20" y1="115" x2="380" y2="115" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="20" y1="140" x2="380" y2="140" stroke="#e2e8f0" strokeWidth="1" />

            {/* Curva Planeada (Azul) */}
            <path d={plannedPath} fill="none" stroke="#2563eb" strokeWidth="2.5" />

            {/* Curva Executada (Verde) */}
            <path d={actualPath} fill="none" stroke="#10b981" strokeWidth="3" />

            {/* Curva Previsão (Âmbar tracejado) */}
            <path d={forecastPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" />

            {/* Ponto de Inspeção em Maio (Mês Corrente) */}
            <line x1="200" y1="15" x2="200" y2="140" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="200" cy="76" r="4" fill="#2563eb" stroke="#fff" strokeWidth="2" />
            <circle cx="200" cy="87" r="4.5" fill="#10b981" stroke="#fff" strokeWidth="2" />
          </svg>

          {/* Tooltip flutuante sobre Maio */}
          <div className="absolute left-[44%] top-3 z-10 hidden sm:flex flex-col rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[10px] shadow-sm backdrop-blur-xs">
            <span className="font-bold text-slate-800">Mai &apos;26 (Mês Atual)</span>
            <div className="mt-0.5 space-y-0.5">
              <span className="flex items-center justify-between gap-3 text-slate-600">
                <span>Planeado:</span> <strong className="text-blue-700">46%</strong>
              </span>
              <span className="flex items-center justify-between gap-3 text-slate-600">
                <span>Executado:</span> <strong className="text-emerald-700">38%</strong>
              </span>
              <span className="flex items-center justify-between gap-3 text-slate-600">
                <span>Previsão:</span> <strong className="text-amber-700">42%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Eixo X com os Meses */}
        <div className="mt-2 flex items-center justify-between px-2 text-[10px] font-semibold text-slate-600">
          {months.map((m, idx) => (
            <span key={m} className={idx === 4 ? "text-blue-700 font-bold" : ""}>
              {m}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

