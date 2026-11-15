import { Calendar, CloudSun } from "lucide-react";

interface OwnerHeroBannerProps {
  userName: string;
}

export function OwnerHeroBanner({ userName }: OwnerHeroBannerProps) {
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
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-blue-50/60 via-slate-50 to-amber-50/40 p-5 shadow-xs sm:p-6 lg:p-7">
      {/* Padrão decorativo de fundo inspirado em estaleiro / grelha de arquitetura */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0, 12px 12px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        {/* Lado Esquerdo: Saudação e Metadados */}
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Bom dia, {firstName}! 👋
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Eis o ponto de situação operacional e financeiro das suas obras hoje.
            </p>
          </div>

          {/* Badges de Metadados: Data, Clima e Dados em Direto */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-3 py-1.5 font-medium text-slate-700 shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              <span>{capitalizedDate}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-3 py-1.5 font-medium text-slate-700 shadow-2xs">
              <CloudSun className="h-3.5 w-3.5 text-amber-500" />
              <span>19°C · Céu Limpo (Lisboa)</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 font-semibold text-emerald-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Dados em Direto</span>
            </span>
          </div>
        </div>

        {/* Ilustração Técnica Estilizada de Estaleiro (Grua, Edifício e Técnico) */}
        <div className="hidden shrink-0 sm:flex items-center justify-center pr-2" aria-hidden="true">
          <svg
            className="h-28 w-44 text-slate-700"
            viewBox="0 0 180 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Prédio em esqueleto */}
            <rect x="25" y="30" width="45" height="75" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2" />
            <rect x="30" y="40" width="12" height="12" fill="#e2e8f0" rx="1" />
            <rect x="52" y="40" width="12" height="12" fill="#e2e8f0" rx="1" />
            <rect x="30" y="60" width="12" height="12" fill="#e2e8f0" rx="1" />
            <rect x="52" y="60" width="12" height="12" fill="#e2e8f0" rx="1" />
            <rect x="30" y="80" width="12" height="12" fill="#e2e8f0" rx="1" />
            <rect x="52" y="80" width="12" height="12" fill="#e2e8f0" rx="1" />

            {/* Grua de estaleiro */}
            <line x1="110" y1="105" x2="110" y2="15" stroke="#2563eb" strokeWidth="3" />
            <line x1="80" y1="20" x2="160" y2="20" stroke="#2563eb" strokeWidth="2.5" />
            <line x1="110" y1="15" x2="160" y2="20" stroke="#3b82f6" strokeWidth="1.5" />
            <line x1="110" y1="15" x2="80" y2="20" stroke="#3b82f6" strokeWidth="1.5" />
            <line x1="140" y1="20" x2="140" y2="45" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
            <rect x="135" y="45" width="10" height="8" fill="#f59e0b" rx="1" />

            {/* Engenheiro / Responsável com prancheta/tablet */}
            <circle cx="95" cy="65" r="7" fill="#fbbf24" /> {/* Capacete */}
            <circle cx="95" cy="72" r="5" fill="#fde68a" /> {/* Rosto */}
            <path d="M86 86 C86 78 104 78 104 86 Z" fill="#2563eb" /> {/* Colete/corpo */}
            <rect x="91" y="81" width="11" height="8" rx="1.5" fill="#1e293b" /> {/* Tablet */}
          </svg>
        </div>
      </div>
    </div>
  );
}
