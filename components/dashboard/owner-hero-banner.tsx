import { Calendar, CloudSun, Wallet, TrendingUp } from "lucide-react";
import { formatPtNumber } from "@/lib/dashboard-utils";

interface OwnerHeroBannerProps {
  userName: string;
  totalBudget: number;
  /** null enquanto não existir registo de custos para calcular a margem */
  balanceBudget: number | null;
}

const formatEuros = (value: number) =>
  `${formatPtNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function OwnerHeroBanner({ userName, totalBudget, balanceBudget }: OwnerHeroBannerProps) {
  const firstName = userName.trim().split(" ")[0] || userName;

  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  // Capitaliza a primeira letra do dia da semana
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-blue-50/60 via-slate-50 to-amber-50/40 p-5 shadow-xs sm:p-6 lg:p-7 dark:border-slate-800 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 transition-colors">
      {/* Padrão decorativo de fundo inspirado em estaleiro / grelha de arquitetura */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0, 12px 12px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        {/* Lado Esquerdo: Saudação e Metadados */}
        <div className="space-y-3 min-w-0 flex-1">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Bom dia, {firstName}! 👋
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Eis o ponto de situação operacional e financeiro das suas obras hoje.
            </p>
          </div>

          {/* Badges de Metadados: Data, Clima e Dados em Direto */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-3 py-1.5 font-medium text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>{capitalizedDate}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-3 py-1.5 font-medium text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-300">
              <CloudSun className="h-3.5 w-3.5 text-amber-500" />
              <span>Meteorologia indisponível</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 font-semibold text-emerald-700 shadow-2xs dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Dados em Direto</span>
            </span>
          </div>
        </div>

        {/* Lado Direito: Cards Financeiros de Saldo Livre e Orçamento Total */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
          {/* Card: Saldo Livre */}
          <div className="flex-1 sm:flex-initial min-w-[140px] sm:min-w-[160px] rounded-xl border border-emerald-200/90 bg-white/95 p-3.5 shadow-2xs transition hover:border-emerald-300 dark:border-emerald-500/30 dark:bg-slate-900/95 dark:hover:border-emerald-500/50">
            <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Saldo Livre
              </span>
              <Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-1 font-mono text-lg font-black text-slate-900 dark:text-white sm:text-xl">
              {balanceBudget === null ? "—" : formatEuros(balanceBudget)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {balanceBudget === null ? "Sem registo de custos" : "Margem disponível"}
            </div>
          </div>

          {/* Card: Orçamento Total */}
          <div className="flex-1 sm:flex-initial min-w-[140px] sm:min-w-[160px] rounded-xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xs transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/95 dark:hover:border-slate-700">
            <div className="flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Orçamento Total
              </span>
              <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-1 font-mono text-lg font-black text-slate-900 dark:text-white sm:text-xl">
              {formatEuros(totalBudget)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Empreitadas ativas</div>
          </div>

          {/* Ilustração Técnica Estilizada de Estaleiro (Grua e Edifício) em ecrãs XL */}
          <div className="hidden 2xl:flex shrink-0 items-center justify-center pl-2" aria-hidden="true">
            <svg
              className="h-24 w-36 text-slate-700 dark:text-slate-400"
              viewBox="0 0 180 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="25" y="30" width="45" height="75" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-slate-300 dark:text-slate-700" />
              <rect x="30" y="40" width="12" height="12" fill="currentColor" rx="1" className="text-slate-200 dark:text-slate-800" />
              <rect x="52" y="40" width="12" height="12" fill="currentColor" rx="1" className="text-slate-200 dark:text-slate-800" />
              <rect x="30" y="60" width="12" height="12" fill="currentColor" rx="1" className="text-slate-200 dark:text-slate-800" />
              <rect x="52" y="60" width="12" height="12" fill="currentColor" rx="1" className="text-slate-200 dark:text-slate-800" />
              <rect x="30" y="80" width="12" height="12" fill="currentColor" rx="1" className="text-slate-200 dark:text-slate-800" />
              <rect x="52" y="80" width="12" height="12" fill="currentColor" rx="1" className="text-slate-200 dark:text-slate-800" />

              <line x1="110" y1="105" x2="110" y2="15" stroke="#2563eb" strokeWidth="3" />
              <line x1="80" y1="20" x2="160" y2="20" stroke="#2563eb" strokeWidth="2.5" />
              <line x1="110" y1="15" x2="160" y2="20" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="110" y1="15" x2="80" y2="20" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="140" y1="20" x2="140" y2="45" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
              <rect x="135" y="45" width="10" height="8" fill="#f59e0b" rx="1" />

              <circle cx="95" cy="65" r="7" fill="#fbbf24" />
              <circle cx="95" cy="72" r="5" fill="#fde68a" />
              <path d="M86 86 C86 78 104 78 104 86 Z" fill="#2563eb" />
              <rect x="91" y="81" width="11" height="8" rx="1.5" fill="#1e293b" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
