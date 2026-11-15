import Link from "next/link";
import { notFound } from "next/navigation";
import { BudgetRevisionType, BudgetStatus, Prisma, Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBudgetTotals, formatBudgetAmount } from "@/lib/budget-utils";
import { texts } from "@/lib/texts";
import BudgetEditor, { type BudgetFormLine } from "../BudgetEditor";
import BudgetStatusControl from "../BudgetStatusControl";

export const metadata = { title: "Detalhe do orçamento — Medido" };

interface SnapshotLine {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

interface SnapshotView {
  projectName: string;
  workAddress: string;
  status: BudgetStatus;
  items: SnapshotLine[];
}

function readSnapshot(snapshot: Prisma.JsonValue): SnapshotView | null {
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) return null;

  const projectName = snapshot.projectName;
  const workAddress = snapshot.workAddress;
  const status = snapshot.status;
  const rawItems = snapshot.items;
  const parsedStatus = Object.values(BudgetStatus).find((value) => value === status);
  if (
    typeof projectName !== "string" ||
    typeof workAddress !== "string" ||
    !parsedStatus ||
    !Array.isArray(rawItems)
  ) {
    return null;
  }

  const items = rawItems.flatMap((item): SnapshotLine[] => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return [];
    if (
      typeof item.description !== "string" ||
      typeof item.quantity !== "number" ||
      typeof item.unit !== "string" ||
      typeof item.unitPrice !== "number" ||
      typeof item.vatRate !== "number"
    ) {
      return [];
    }
    return [{
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
    }];
  });

  return { projectName, workAddress, status: parsedStatus, items };
}

function revisionTypeLabel(type: BudgetRevisionType): string {
  const labels = texts.dashboard.budgets;
  switch (type) {
    case BudgetRevisionType.CREATED:
      return labels.createdRevision;
    case BudgetRevisionType.CONTENT_EDIT:
      return labels.contentEdited;
    case BudgetRevisionType.STATUS_CHANGE:
      return labels.statusChanged;
  }
}

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole([Role.OWNER]);
  const budget = await prisma.budget.findFirst({
    where: { id, companyId: user.companyId },
    select: {
      id: true,
      projectName: true,
      workAddress: true,
      notes: true,
      status: true,
      updatedAt: true,
      projectId: true,
      visitRequestId: true,
      client: {
        select: {
          id: true,
          name: true,
          nif: true,
          address: true,
          email: true,
          phone: true,
        },
      },
      visitRequest: { select: { id: true, scheduledAt: true } },
      items: {
        select: {
          description: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          vatRate: true,
          position: true,
        },
        orderBy: { position: "asc" },
      },
      revisions: {
        select: {
          id: true,
          revisionNumber: true,
          type: true,
          snapshot: true,
          createdAt: true,
          editor: { select: { name: true } },
        },
        orderBy: { revisionNumber: "desc" },
      },
    },
  });

  if (!budget) notFound();

  const formItems: BudgetFormLine[] = budget.items.map((item) => ({
    description: item.description,
    quantity: item.quantity.toString(),
    unit: item.unit,
    unitPrice: item.unitPrice.toString(),
    vatRate: item.vatRate.toString(),
  }));
  const totals = calculateBudgetTotals(budget.items.map((item) => ({
    description: item.description,
    quantity: Number(item.quantity),
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    vatRate: Number(item.vatRate),
  })));
  const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Lisbon",
  });
  const labels = texts.dashboard.budgets;

  const latestRevisionNumber = budget.revisions[0]?.revisionNumber ?? 0;
  const budgetApprovalItems = budget.items.map((item) => ({
    description: item.description,
    quantity: Number(item.quantity),
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    vatRate: Number(item.vatRate),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <Link
          href="/dashboard/orcamentos"
          className="text-xs font-semibold text-slate-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          ← {labels.back}
        </Link>
        <h1 className="pt-2 text-xl font-bold text-slate-900">{budget.projectName}</h1>
        <p className="text-sm text-slate-600">
          {budget.client.name} · {budget.workAddress}
        </p>
        <p className="text-xs text-slate-600">
          {labels.statuses[budget.status]} · {labels.net}: {formatBudgetAmount(totals.netCents)} ·{" "}
          {labels.vat}: {formatBudgetAmount(totals.vatCents)} · {labels.gross}: {formatBudgetAmount(totals.grossCents)}
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <BudgetStatusControl
          key={budget.status}
          budgetId={budget.id}
          currentStatus={budget.status}
          projectName={budget.projectName}
          workAddress={budget.workAddress}
          notes={budget.notes}
          client={budget.client}
          items={budgetApprovalItems}
          revisionNumber={latestRevisionNumber}
          updatedAtIso={budget.updatedAt.toISOString()}
        />
        {budget.projectId && (
          <Link
            href={`/dashboard/obras/${budget.projectId}/editar`}
            className="mt-4 inline-block text-sm font-semibold text-amber-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          >
            {labels.viewProject}
          </Link>
        )}
      </section>

      <section aria-labelledby="budget-edit-heading" className="space-y-3">
        <h2 id="budget-edit-heading" className="text-base font-bold text-slate-900">{labels.editTitle}</h2>
        <BudgetEditor
          mode="edit"
          budgetId={budget.id}
          initialProjectName={budget.projectName}
          initialWorkAddress={budget.workAddress}
          initialNotes={budget.notes ?? ""}
          initialItems={formItems}
        />
      </section>

      <section aria-labelledby="budget-history-heading" className="space-y-3">
        <h2 id="budget-history-heading" className="text-base font-bold text-slate-900">{labels.history}</h2>
        {budget.revisions.map((revision) => {
          const snapshot = readSnapshot(revision.snapshot);
          const snapshotTotals = snapshot
            ? calculateBudgetTotals(snapshot.items)
            : null;

          return (
            <details key={revision.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
                {labels.revision} {revision.revisionNumber} · {revisionTypeLabel(revision.type)} · {dateFormatter.format(revision.createdAt)}
              </summary>
              <p className="mt-2 text-xs text-slate-600">{labels.editor}: {revision.editor.name}</p>
              {snapshot && (
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>{snapshot.projectName} · {snapshot.workAddress}</p>
                  <p>{labels.statuses[snapshot.status]} · {labels.itemCount(snapshot.items.length)}</p>
                  {snapshot.items.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5">
                      {snapshot.items.map((item, index) => (
                        <li key={`${revision.id}-${index}`}>
                          {item.description}: {item.quantity} {item.unit} × {formatBudgetAmount(Math.round(item.unitPrice * 100))} · IVA {item.vatRate}%
                        </li>
                      ))}
                    </ul>
                  )}
                  {snapshotTotals && (
                    <p className="font-semibold">{labels.gross}: {formatBudgetAmount(snapshotTotals.grossCents)}</p>
                  )}
                </div>
              )}
            </details>
          );
        })}
      </section>
    </div>
  );
}
