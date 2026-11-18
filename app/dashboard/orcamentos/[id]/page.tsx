import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
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
    <div className="mx-auto max-w-5xl space-y-5">
      <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link href="/dashboard/orcamentos" className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" />
          {labels.back}
        </Link>
        <span aria-hidden="true">·</span>
        <Link href={`/dashboard/clientes/${budget.client.id}`} className="hover:text-slate-900 dark:hover:text-white">
          {labels.backToClient(budget.client.name)}
        </Link>
      </nav>

      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{budget.projectName}</h1>
          <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${STATUS_PILLS[budget.status]}`}>
            {labels.statuses[budget.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          <Link href={`/dashboard/clientes/${budget.client.id}`} className="font-semibold hover:text-amber-700 hover:underline dark:hover:text-amber-400">
            {budget.client.name}
          </Link>
          {" · "}
          {budget.workAddress}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {budget.visitRequest?.scheduledAt
            ? texts.dashboard.visits.viewedOn(dateFormatter.format(budget.visitRequest.scheduledAt))
            : labels.withoutVisitSentence}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <TotalCard label={labels.net} value={formatBudgetAmount(totals.netCents)} />
          <TotalCard label={labels.vat} value={formatBudgetAmount(totals.vatCents)} />
          <TotalCard label={labels.gross} value={formatBudgetAmount(totals.grossCents)} highlight />
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5 dark:border-slate-800 dark:bg-slate-900">
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
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950"
          >
            <Building2 className="h-3.5 w-3.5" />
            {labels.viewProject}
          </Link>
        )}
      </section>

      <section aria-labelledby="budget-edit-heading" className="space-y-3">
        <h2 id="budget-edit-heading" className="text-sm font-bold text-slate-900 dark:text-white">{labels.editTitle}</h2>
        <BudgetEditor
          mode="edit"
          budgetId={budget.id}
          initialProjectName={budget.projectName}
          initialWorkAddress={budget.workAddress}
          initialNotes={budget.notes ?? ""}
          initialItems={formItems}
        />
      </section>

      <section aria-labelledby="budget-history-heading" className="space-y-2">
        <h2 id="budget-history-heading" className="text-sm font-bold text-slate-900 dark:text-white">{labels.history}</h2>
        {budget.revisions.map((revision) => {
          const snapshot = readSnapshot(revision.snapshot);
          const snapshotTotals = snapshot
            ? calculateBudgetTotals(snapshot.items)
            : null;

          return (
            <details key={revision.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <summary className="cursor-pointer text-xs font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:text-white">
                {labels.revision} {revision.revisionNumber} · {revisionTypeLabel(revision.type)} · {dateFormatter.format(revision.createdAt)}
              </summary>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{labels.editor}: {revision.editor.name}</p>
              {snapshot && (
                <div className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
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

const STATUS_PILLS: Record<BudgetStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SENT: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  NEGOTIATION: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  CANCELLED: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

function TotalCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-2.5 sm:p-3 ${
        highlight
          ? "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30"
          : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-0.5 truncate font-mono text-sm font-black text-slate-900 sm:text-base dark:text-white">{value}</div>
    </div>
  );
}
