import Link from "next/link";
import { Role, VisitStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { texts } from "@/lib/texts";
import VisitRequestForm from "./VisitRequestForm";
import VisitStatusControls from "./VisitStatusControls";

export const metadata = { title: "Visitas — Medido" };

function visitStatusLabel(status: VisitStatus): string {
  const labels = texts.dashboard.visits;
  switch (status) {
    case VisitStatus.REQUESTED:
      return labels.requested;
    case VisitStatus.SCHEDULED:
      return labels.scheduled;
    case VisitStatus.COMPLETED:
      return labels.completed;
    case VisitStatus.CANCELLED:
      return labels.cancelled;
  }
}

export default async function VisitsPage() {
  const user = await requireRole([Role.OWNER]);
  const [clients, visits] = await Promise.all([
    prisma.client.findMany({
      where: { companyId: user.companyId },
      select: { id: true, name: true, phone: true, address: true },
      orderBy: { name: "asc" },
    }),
    prisma.visitRequest.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        requestedAddress: true,
        scheduledAt: true,
        status: true,
        notes: true,
        createdAt: true,
        client: { select: { id: true, name: true, phone: true } },
        budget: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Lisbon",
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{texts.dashboard.visits.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{texts.dashboard.visits.description}</p>
        </div>
        <Link
          href="/dashboard/orcamentos"
          className="text-sm font-semibold text-amber-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        >
          {texts.dashboard.budgets.title}
        </Link>
      </header>

      <VisitRequestForm clients={clients} />

      <section aria-labelledby="visits-list-heading" className="space-y-3">
        <h2 id="visits-list-heading" className="text-base font-bold text-slate-900">
          {texts.dashboard.visits.visitList}
        </h2>
        {visits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            {texts.dashboard.visits.empty}
          </p>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => (
              <article
                key={visit.id}
                className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:grid-cols-[minmax(0,1fr)_minmax(16rem,auto)] lg:items-start"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{visit.client.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {visitStatusLabel(visit.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{visit.requestedAddress}</p>
                  {visit.client.phone && (
                    <p className="mt-1 text-xs text-slate-600">{visit.client.phone}</p>
                  )}
                  {visit.scheduledAt && (
                    <p className="mt-2 text-xs text-slate-600">
                      {texts.dashboard.visits.scheduledFor(dateFormatter.format(visit.scheduledAt))}
                    </p>
                  )}
                  {visit.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{visit.notes}</p>}
                  <p className="mt-2 text-xs text-slate-500">
                    {texts.dashboard.visits.receivedOn(dateFormatter.format(visit.createdAt))}
                  </p>
                  {visit.budget && (
                    <Link
                      href={`/dashboard/orcamentos/${visit.budget.id}`}
                      className="mt-3 inline-block text-sm font-semibold text-amber-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                    >
                      {texts.dashboard.visits.viewBudget}
                    </Link>
                  )}
                  {visit.status === VisitStatus.COMPLETED && !visit.budget && (
                    <Link
                      href={`/dashboard/orcamentos/novo/${visit.id}`}
                      className="mt-3 inline-block text-sm font-semibold text-amber-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                    >
                      {texts.dashboard.visits.createBudget}
                    </Link>
                  )}
                </div>
                <VisitStatusControls visitRequestId={visit.id} status={visit.status} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
