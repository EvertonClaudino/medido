// Server Component — mockup visual do dashboard Medido (SVG puro, sem dependências)
export function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-3xl select-none">
      {/* Frame do browser */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10">
        {/* Barra do browser */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <div className="mx-3 flex-1 rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 font-mono">
            app.medido.pt/dashboard
          </div>
        </div>

        {/* Dashboard layout */}
        <div className="flex h-[340px] bg-slate-50 sm:h-[400px]">
          {/* Sidebar */}
          <aside className="hidden w-44 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-4 sm:flex">
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="font-black text-sm text-slate-900">Medido</span>
            </div>
            {[
              { label: "Visão Geral", active: true, color: "bg-amber-600" },
              { label: "Obras", active: false, color: "bg-slate-300" },
              { label: "Registos", active: false, color: "bg-slate-300" },
              { label: "Equipa", active: false, color: "bg-slate-300" },
              { label: "Clientes", active: false, color: "bg-slate-300" },
              { label: "Orçamentos", active: false, color: "bg-slate-300" },
              { label: "Alertas", active: false, color: "bg-slate-300" },
            ].map((item) => (
              <div
                key={item.label}
                className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${item.active ? "bg-amber-50" : ""}`}
              >
                <span className={`h-2 w-2 rounded-sm ${item.color}`} />
                <span
                  className={`text-[11px] font-medium ${item.active ? "text-amber-800" : "text-slate-500"}`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </aside>

          {/* Main content */}
          <main className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Obras Ativas", value: "12", color: "border-l-emerald-500" },
                { label: "Em Atraso", value: "2", color: "border-l-red-500" },
                { label: "Apontamentos", value: "47", color: "border-l-blue-500" },
                { label: "Validações", value: "5", color: "border-l-amber-500" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className={`rounded-lg border border-l-4 border-slate-200 bg-white p-2.5 ${kpi.color}`}
                >
                  <div className="text-[10px] text-slate-500">{kpi.label}</div>
                  <div className="mt-0.5 text-lg font-bold text-slate-800">{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Middle row */}
            <div className="flex flex-1 gap-2 overflow-hidden">
              {/* Obras list */}
              <div className="flex flex-1 flex-col gap-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Obras Recentes
                </div>
                {[
                  { code: "OBR-2026-012", name: "Bloco Residencial Cascais", status: "ACTIVE", pct: 68 },
                  { code: "OBR-2026-011", name: "Remodelação Escritórios Lisboa", status: "ACTIVE", pct: 42 },
                  { code: "OBR-2026-010", name: "Pavilhão Industrial Setúbal", status: "DELAYED", pct: 85 },
                ].map((obra) => (
                  <div key={obra.code} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] text-slate-400">{obra.code}</span>
                        <span
                          className={`rounded-full px-1.5 py-px text-[9px] font-semibold ${
                            obra.status === "DELAYED"
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {obra.status === "DELAYED" ? "Atrasada" : "Ativa"}
                        </span>
                      </div>
                      <div className="text-[10px] font-medium text-slate-700 truncate">{obra.name}</div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-1 rounded-full ${obra.status === "DELAYED" ? "bg-red-400" : "bg-emerald-400"}`}
                          style={{ width: `${obra.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alertas + Tarefas */}
              <div className="hidden w-36 flex-col gap-1.5 md:flex">
                <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Alertas
                  </div>
                  {[
                    { text: "Sem encarregado — OBR-2026-009", sev: "critical" },
                    { text: "Sem registos há 7 dias — OBR-2026-007", sev: "warning" },
                  ].map((a, i) => (
                    <div key={i} className="mb-1 flex gap-1.5">
                      <span
                        className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          a.sev === "critical" ? "bg-red-500" : "bg-amber-500"
                        }`}
                      />
                      <span className="text-[9px] leading-tight text-slate-600">{a.text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Tarefas Hoje
                  </div>
                  {["Vistoria piso 2 Cascais", "Validar medições Setúbal", "Reunião com cliente"].map((t) => (
                    <div key={t} className="mb-1 flex items-start gap-1.5">
                      <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm border border-slate-300" />
                      <span className="text-[9px] leading-tight text-slate-600">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Glow decorativo */}
      <div className="pointer-events-none absolute -bottom-6 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full bg-amber-400/20 blur-3xl" />
    </div>
  );
}
