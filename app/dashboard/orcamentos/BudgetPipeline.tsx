"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Columns3, List, Search } from "lucide-react";
import { formatBudgetAmount } from "@/lib/budget-utils";
import type { BudgetStatusValue } from "@/lib/client-record";
import { texts } from "@/lib/texts";

export interface PipelineBudget {
  id: string;
  projectName: string;
  status: BudgetStatusValue;
  clientId: string;
  clientName: string;
  grossCents: number;
  itemCount: number;
  updatedAt: string;
  projectId: string | null;
}

const OPEN_COLUMNS: BudgetStatusValue[] = ["DRAFT", "SENT", "NEGOTIATION", "APPROVED"];
const CLOSED_STATUSES: BudgetStatusValue[] = ["REJECTED", "CANCELLED"];

const COLUMN_ACCENTS: Record<BudgetStatusValue, string> = {
  DRAFT: "border-t-slate-400",
  SENT: "border-t-blue-500",
  NEGOTIATION: "border-t-amber-500",
  APPROVED: "border-t-emerald-500",
  REJECTED: "border-t-red-500",
  CANCELLED: "border-t-red-500",
};

const STATUS_PILLS: Record<BudgetStatusValue, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SENT: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  NEGOTIATION: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  CANCELLED: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

const dateFormatter = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "Europe/Lisbon" });

export function BudgetPipeline({ budgets }: { budgets: PipelineBudget[] }) {
  const labels = texts.dashboard.budgets;
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"board" | "list">("board");
  const [showClosed, setShowClosed] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return budgets.filter((budget) => {
      if (!showClosed && CLOSED_STATUSES.includes(budget.status)) return false;
      if (!q) return true;
      return budget.projectName.toLowerCase().includes(q) || budget.clientName.toLowerCase().includes(q);
    });
  }, [budgets, query, showClosed]);

  const columns = showClosed ? [...OPEN_COLUMNS, "CLOSED" as const] : OPEN_COLUMNS;

  return (
    <div className="space-y-4">
      {/* Barra de ferramentas */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(event) => setShowClosed(event.target.checked)}
              className="h-3.5 w-3.5 accent-amber-500"
            />
            {labels.showClosed}
          </label>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700" role="group" aria-label={labels.viewMode}>
            <ViewButton active={view === "board"} onClick={() => setView("board")} label={labels.boardView}>
              <Columns3 className="h-4 w-4" />
            </ViewButton>
            <ViewButton active={view === "list"} onClick={() => setView("list")} label={labels.listView}>
              <List className="h-4 w-4" />
            </ViewButton>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {budgets.length === 0 ? labels.empty : labels.noResults}
        </p>
      ) : view === "board" ? (
        <div className="-mx-1 overflow-x-auto px-1 pb-2">
          <div className="grid min-w-[56rem] gap-3" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(13rem, 1fr))` }}>
            {columns.map((column) => {
              const items = filtered.filter((b) =>
                column === "CLOSED" ? CLOSED_STATUSES.includes(b.status) : b.status === column
              );
              const totalCents = items.reduce((sum, b) => sum + b.grossCents, 0);
              const title = column === "CLOSED" ? labels.closedColumn : labels.statuses[column];
              return (
                <section
                  key={column}
                  aria-label={title}
                  className={`flex flex-col rounded-xl border border-t-4 border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 ${COLUMN_ACCENTS[column === "CLOSED" ? "REJECTED" : column]}`}
                >
                  <header className="border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{title}</h2>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs dark:bg-slate-800 dark:text-slate-300">
                        {items.length}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-sm font-black text-slate-900 dark:text-white">{formatBudgetAmount(totalCents)}</p>
                  </header>
                  <div className="flex-1 space-y-2 p-2">
                    {items.length === 0 ? (
                      <p className="py-6 text-center text-[11px] italic text-slate-400">{labels.emptyColumn}</p>
                    ) : (
                      items.map((budget) => <BoardCard key={budget.id} budget={budget} />)
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {filtered.map((budget) => (
            <li key={budget.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/orcamentos/${budget.id}`} className="truncate text-sm font-bold text-slate-900 hover:text-amber-700 dark:text-white dark:hover:text-amber-400">
                    {budget.projectName}
                  </Link>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_PILLS[budget.status]}`}>{labels.statuses[budget.status]}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <Link href={`/dashboard/clientes/${budget.clientId}`} className="font-medium hover:text-amber-700 hover:underline dark:hover:text-amber-400">
                    {budget.clientName}
                  </Link>
                  {" · "}
                  {dateFormatter.format(new Date(budget.updatedAt))} · {labels.itemCount(budget.itemCount)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {budget.projectId && <ProjectBadge />}
                <span className="font-mono text-sm font-black text-slate-900 dark:text-white">{formatBudgetAmount(budget.grossCents)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BoardCard({ budget }: { budget: PipelineBudget }) {
  const labels = texts.dashboard.budgets;
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs transition hover:border-slate-300 hover:shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
      <Link href={`/dashboard/orcamentos/${budget.id}`} className="block text-xs font-bold text-slate-900 hover:text-amber-700 dark:text-white dark:hover:text-amber-400">
        {budget.projectName}
      </Link>
      <Link href={`/dashboard/clientes/${budget.clientId}`} className="mt-0.5 block truncate text-[11px] text-slate-500 hover:text-amber-700 hover:underline dark:text-slate-400 dark:hover:text-amber-400">
        {budget.clientName}
      </Link>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">{formatBudgetAmount(budget.grossCents)}</span>
        {CLOSED_STATUSES.includes(budget.status) ? (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_PILLS[budget.status]}`}>{labels.statuses[budget.status]}</span>
        ) : (
          budget.projectId && <ProjectBadge />
        )}
      </div>
      <p className="mt-1.5 text-[10px] text-slate-400">{dateFormatter.format(new Date(budget.updatedAt))}</p>
    </article>
  );
}

function ProjectBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
      <Building2 className="h-3 w-3" aria-hidden="true" />
      {texts.dashboard.budgets.projectCreatedBadge}
    </span>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition ${
        active
          ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950"
          : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}
