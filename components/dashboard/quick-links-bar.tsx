import Link from "next/link";
import {
  Building2,
  HardHat,
  Users2,
  Layers,
  FileSpreadsheet,
  Clock,
  ShieldAlert,
} from "lucide-react";

export function QuickLinksBar() {
  const links = [
    { name: "Obras", href: "/dashboard/obras", icon: Building2, color: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-900/50" },
    { name: "Avanço & Registos", href: "/dashboard/registos", icon: HardHat, color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-900/50" },
    { name: "Equipa & Encarregados", href: "/dashboard/equipa", icon: Users2, color: "text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/50 dark:border-purple-900/50" },
    { name: "Tarefas", href: "/dashboard/tarefas", icon: Clock, color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-900/50" },
    { name: "Clientes", href: "/dashboard/clientes", icon: Layers, color: "text-cyan-600 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-950/50 dark:border-cyan-900/50" },
    { name: "Orçamentos", href: "/dashboard/orcamentos", icon: FileSpreadsheet, color: "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/50 dark:border-orange-900/50" },
    { name: "Alertas", href: "/dashboard/alertas", icon: ShieldAlert, color: "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/50 dark:border-rose-900/50" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Acessos Rápidos
        </span>
        <span className="text-[11px] text-slate-400 font-medium">Atalhos diretos</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950 hover:shadow-2xs dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${link.color}`}>
                <Icon className="h-3 w-3" />
              </span>
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
