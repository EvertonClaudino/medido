import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { texts } from "@/lib/texts";

const t = texts.landing.product;

/** Portátil com o painel do Dono e telemóvel com um registo diário, construídos em HTML (sem imagens). */
export function ProductShowcase() {
  return (
    <figure className="relative">
      <figcaption className="mb-4 font-plexmono text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {t.exampleLabel}
      </figcaption>
      <div className="relative sm:pb-16 lg:pb-20">
        <DashboardScreen />
        <div
          className="lp-parallax hidden w-[250px] sm:absolute sm:-bottom-2 sm:right-6 sm:block lg:right-12"
          style={{ "--lp-shift": "40px" } as CSSProperties}
        >
          <PhoneScreen />
        </div>
      </div>
    </figure>
  );
}

function DashboardScreen() {
  const d = t.dashboard;
  return (
    <div className="rounded-[18px] border border-slate-300 bg-slate-900 p-1.5 shadow-[0_40px_80px_-30px_rgb(2_6_23/0.45)] sm:p-2 dark:border-slate-700">
      <div className="flex overflow-hidden rounded-[12px] bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <aside className="hidden w-44 shrink-0 border-r border-slate-200 bg-slate-50 p-4 md:block dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-end gap-1">
            <span className="h-3.5 w-1 bg-amber-500" />
            <span className="h-2.5 w-1 bg-amber-500" />
            <span className="h-1.5 w-1 bg-amber-500" />
            <span className="ml-1.5 text-sm leading-none font-semibold">Medido</span>
          </div>
          <ul className="mt-6 space-y-1 text-[13px]">
            {d.nav.map((item, index) => (
              <li
                key={item}
                className={`rounded-md px-2.5 py-1.5 ${
                  index === 0
                    ? "bg-white font-medium text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-lg font-semibold">{d.title}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{d.company}</p>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            {d.kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-slate-200 p-2.5 sm:p-3.5 dark:border-slate-800">
                <dt className="text-[10px] leading-tight text-slate-500 sm:text-xs dark:text-slate-400">{kpi.label}</dt>
                <dd className="mt-1 font-display text-2xl font-bold tabular-nums sm:text-3xl">{kpi.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{d.projectsTitle}</p>
              <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                {d.projects.map((project) => (
                  <li key={project.code} className="py-2.5">
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="truncate font-medium">{project.name}</span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          project.late
                            ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="font-plexmono text-[10px] text-slate-400">{project.code}</span>
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <span className="block h-full bg-amber-500" style={{ width: `${project.progress}%` }} />
                      </span>
                      <span className="font-plexmono text-[10px] tabular-nums text-slate-500">{project.progress}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden rounded-lg border border-slate-200 p-3.5 sm:block dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{d.agendaTitle}</p>
              <ul className="mt-2 space-y-2.5">
                {d.agenda.map((item) => (
                  <li key={item.time} className="flex gap-3 text-[13px]">
                    <span className="font-plexmono text-xs text-amber-700 dark:text-amber-400">{item.time}</span>
                    <span className="min-w-0">
                      <span className="block font-medium">{item.title}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhoneScreen() {
  const r = t.record;
  return (
    <div className="rounded-[38px] border border-slate-700 bg-slate-900 p-2 shadow-[0_30px_60px_-20px_rgb(2_6_23/0.55)]">
      <div className="overflow-hidden rounded-[30px] bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto mt-2 h-5 w-20 rounded-full bg-slate-900" />
        <div className="px-4 pt-3 pb-5">
          <p className="text-[15px] font-semibold">{r.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{r.date}</p>

          <div className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <p className="truncate text-[13px] font-medium">{r.project}</p>
            <p className="font-plexmono text-[10px] text-slate-400">{r.projectCode}</p>
            <div className="mt-2.5 flex items-baseline justify-between border-t border-dashed border-slate-200 pt-2.5 text-[13px] dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{r.hoursLabel}</span>
              <span className="font-plexmono">{r.hours}</span>
            </div>
            <p className="mt-2.5 border-t border-dashed border-slate-200 pt-2.5 text-[13px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {r.measurementsLabel}
            </p>
            <ul className="mt-1.5 space-y-1 text-[13px]">
              {r.measurements.map((m) => (
                <li key={m.description} className="flex items-baseline justify-between gap-3">
                  <span className="truncate">{m.description}</span>
                  <span className="shrink-0 font-plexmono tabular-nums">
                    {m.quantity} <span className="text-slate-400">{m.unit}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2.5 text-[13px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {r.validated}
          </p>
        </div>
      </div>
    </div>
  );
}
