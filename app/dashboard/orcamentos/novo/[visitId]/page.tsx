import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Role, VisitStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { texts } from "@/lib/texts";
import BudgetEditor from "../../BudgetEditor";

export const metadata = { title: "Novo orçamento — Medido" };

export default async function NewBudgetPage({
  params,
}: {
  params: Promise<{ visitId: string }>;
}) {
  const { visitId } = await params;
  const user = await requireRole([Role.OWNER]);
  const visit = await prisma.visitRequest.findFirst({
    where: { id: visitId, companyId: user.companyId },
    select: {
      id: true,
      status: true,
      requestedAddress: true,
      scheduledAt: true,
      budget: { select: { id: true } },
      client: { select: { name: true } },
    },
  });

  if (!visit) notFound();
  if (visit.budget) redirect(`/dashboard/orcamentos/${visit.budget.id}`);
  if (visit.status !== VisitStatus.COMPLETED) redirect("/dashboard/visitas");
  const visitedAt = visit.scheduledAt
    ? new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Lisbon",
      }).format(visit.scheduledAt)
    : "";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <Link
          href="/dashboard/visitas"
          className="text-xs font-semibold text-slate-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          ← {texts.dashboard.visits.back}
        </Link>
        <h1 className="mt-3 text-xl font-bold text-slate-900">{texts.dashboard.budgets.createTitle}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {visit.client.name}{visitedAt ? ` · ${texts.dashboard.visits.viewedOn(visitedAt)}` : ""}
        </p>
      </div>
      <BudgetEditor
        mode="create"
        visitRequestId={visit.id}
        initialProjectName=""
        initialWorkAddress={visit.requestedAddress}
        initialNotes=""
      />
    </div>
  );
}
