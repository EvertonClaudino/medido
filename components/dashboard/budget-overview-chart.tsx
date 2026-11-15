import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatPtNumber } from "@/lib/dashboard-utils";

export interface BudgetOverviewProps {
  totalBudget?: number;
  utilizedBudget?: number;
  committedBudget?: number;
  balanceBudget?: number;
}

export function BudgetOverviewChart({
  totalBudget = 185000,
  utilizedBudget = 125800,
  committedBudget = 32400,
  balanceBudget = 26800,
}: BudgetOverviewProps) {
  const effectiveTotal = totalBudget > 0 ? totalBudget : utilizedBudget + committedBudget + balanceBudget;
  const utilizedPercent = effectiveTotal > 0 ? Math.round((utilizedBudget / effectiveTotal) * 100) : 68;
  const committedPercent = effectiveTotal > 0 ? Math.round((committedBudget / effectiveTotal) * 100) : 18;
  const balancePercent = Math.max(0, 100 - utilizedPercent - committedPercent);

  // Donut chart geometry
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 11;

  // Calculo dos offsets para os segmentos do donut
  const utilizedOffset = circumference * (1 - utilizedPercent / 100);
  const committedOffset = circumference * (1 - committedPercent / 100);
  const balanceOffset = circumference * (1 - balancePercent / 100);

  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Execução Orçamental das Obras
            </h2>
            <p className="text-[11px] text-slate-500">
              Controlo consolidado de despesas e saldo disponível
            </p>
          </div>
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
            Orçamentos
          </span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-5">
          {/* Donut Chart SVG */}
          <div className="relative flex shrink-0 items-center justify-center">
            <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 100 100">
              {/* Fundo do anel */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Segmento: Saldo Disponível (Âmbar claro / Cinzento) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#f59e0b"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={balanceOffset}
                strokeLinecap="round"
                fill="transparent"
                className="opacity-70"
              />
              {/* Segmento: Comprometido (Azul Céu) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#38bdf8"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={committedOffset}
                strokeLinecap="round"
                fill="transparent"
              />
              {/* Segmento: Executado (Azul Royal) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#2563eb"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={utilizedOffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                {utilizedPercent}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-0.5">Executado</span>
            </div>
          </div>

          {/* Legenda de Valores */}
          <div className="w-full flex-1 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-50 pb-1">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                Orçamento Total
              </span>
              <span className="font-mono font-bold text-slate-900">
                {formatPtNumber(effectiveTotal)} €
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-50 pb-1">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                Valor Executado
              </span>
              <span className="font-mono font-bold text-blue-700">
                {formatPtNumber(utilizedBudget)} €
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-50 pb-1">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0" />
                Comprometido
              </span>
              <span className="font-mono font-bold text-slate-700">
                {formatPtNumber(committedBudget)} €
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                Saldo Restante
              </span>
              <span className="font-mono font-bold text-emerald-700">
                {formatPtNumber(balanceBudget)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5">
          <ArrowUpRight className="h-3 w-3" />
          +6% vs mês anterior
        </span>
        <Link
          href="/dashboard/obras"
          className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 hover:underline"
        >
          <span>Ver Obras e Orçamentos</span>
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}

