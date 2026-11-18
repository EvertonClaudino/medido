import Link from "next/link";
import { Plus } from "lucide-react";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBudgetTotals, formatBudgetAmount } from "@/lib/budget-utils";
import { OPEN_BUDGET_STATUSES } from "@/lib/client-record";
import { texts } from "@/lib/texts";
import { BudgetPipeline, type PipelineBudget } from "./BudgetPipeline";

export const metadata = { title: "Orçamentos — Medido" };

export default async function BudgetsPage() {
  const user = await requireRole([Role.OWNER]);
  const rawBudgets = await prisma.budget.findMany({
    where: { companyId: user.companyId },
    select: {
      id: true,
      projectName: true,
      status: true,
      updatedAt: true,
      client: { select: { id: true, name: true } },
      items: {
        select: {
          description: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          vatRate: true,
        },
      },
      project: { select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const labels = texts.dashboard.budgets;

  const budgets: PipelineBudget[] = rawBudgets.map((budget) => ({
    id: budget.id,
    projectName: budget.projectName,
    status: budget.status,
    clientId: budget.client.id,
    clientName: budget.client.name,
    itemCount: budget.items.length,
    updatedAt: budget.updatedAt.toISOString(),
    projectId: budget.project?.id ?? null,
    grossCents: calculateBudgetTotals(
      budget.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        vatRate: Number(item.vatRate),
      }))
    ).grossCents,
  }));

  const sumCents = (list: PipelineBudget[]) => list.reduce((sum, b) => sum + b.grossCents, 0);
  const open = budgets.filter((b) => OPEN_BUDGET_STATUSES.includes(b.status));
  const negotiation = budgets.filter((b) => b.status === "NEGOTIATION");
  const approved = budgets.filter((b) => b.status === "APPROVED");
  const rejected = budgets.filter((b) => b.status === "REJECTED");
  const decided = approved.length + rejected.length;
  const conversion = decided > 0 ? Math.round((approved.length / decided) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{labels.title}</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{labels.pipelineDescription}</p>
        </div>
        <Link
          href="/dashboard/orcamentos/novo"
          className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          {labels.new}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi title={labels.kpis.open} value={formatBudgetAmount(sumCents(open))} hint={labels.kpis.openHint(open.length)} tone="slate" />
        <Kpi
          title={labels.kpis.negotiation}
          value={formatBudgetAmount(sumCents(negotiation))}
          hint={labels.kpis.negotiationHint(negotiation.length)}
          tone="amber"
        />
        <Kpi
          title={labels.kpis.approved}
          value={formatBudgetAmount(sumCents(approved))}
          hint={labels.kpis.approvedHint(approved.length)}
          tone="emerald"
        />
        <Kpi
          title={labels.kpis.conversion}
          value={conversion === null ? "—" : `${conversion}%`}
          hint={labels.kpis.conversionHint}
          tone="blue"
        />
      </div>

      <BudgetPipeline budgets={budgets} />
    </div>
  );
}

const KPI_TONES = {
  slate: "text-slate-500 dark:text-slate-400",
  amber: "text-amber-700 dark:text-amber-500",
  emerald: "text-emerald-700 dark:text-emerald-500",
  blue: "text-blue-700 dark:text-blue-400",
} as const;

function Kpi({ title, value, hint, tone }: { title: string; value: string; hint: string; tone: keyof typeof KPI_TONES }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className={`text-[11px] font-medium uppercase tracking-wider ${KPI_TONES[tone]}`}>{title}</div>
      <div className="mt-1 truncate font-mono text-xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{hint}</div>
    </div>
  );
}
