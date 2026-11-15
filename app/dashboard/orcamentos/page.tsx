import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBudgetTotals, formatBudgetAmount } from "@/lib/budget-utils";
import { texts } from "@/lib/texts";

export const metadata = { title: "Orçamentos — Medido" };

export default async function BudgetsPage() {
  const user = await requireRole([Role.OWNER]);
  const budgets = await prisma.budget.findMany({
    where: { companyId: user.companyId },
    select: {
      id: true,
      projectName: true,
      status: true,
      updatedAt: true,
      client: { select: { name: true } },
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
  const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeZone: "Europe/Lisbon",
  });
  const labels = texts.dashboard.budgets;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{labels.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{labels.description}</p>
        </div>
        <Link
          href="/dashboard/visitas"
          className="text-sm font-semibold text-amber-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          {texts.dashboard.visits.title}
        </Link>
      </header>

      {budgets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          {labels.empty}
        </p>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const totals = calculateBudgetTotals(budget.items.map((item) => ({
              description: item.description,
              quantity: Number(item.quantity),
              unit: item.unit,
              unitPrice: Number(item.unitPrice),
              vatRate: Number(item.vatRate),
            })));

            return (
              <article
                key={budget.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{budget.projectName}</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {labels.statuses[budget.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{budget.client.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {dateFormatter.format(budget.updatedAt)} · {labels.itemCount(budget.items.length)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <strong className="text-sm text-slate-900">{formatBudgetAmount(totals.grossCents)}</strong>
                  {budget.project?.id && (
                    <Link
                      href={`/dashboard/obras/${budget.project.id}/editar`}
                      className="text-xs font-semibold text-slate-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                    >
                      {labels.viewProject}
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/orcamentos/${budget.id}`}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                  >
                    {labels.openBudget}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
