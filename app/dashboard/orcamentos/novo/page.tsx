import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Role, VisitStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { texts } from "@/lib/texts";
import BudgetEditor from "../BudgetEditor";

export const metadata = { title: "Novo orçamento — Medido" };

const dateTimeFormatter = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Lisbon",
});

export default async function NewBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; visita?: string }>;
}) {
  const { cliente: clientId, visita: visitId } = await searchParams;
  const user = await requireRole([Role.OWNER]);
  const labels = texts.dashboard.budgets;

  // Sem cliente: escolher primeiro o cliente (formulário GET, sem JavaScript)
  if (!clientId) {
    const clients = await prisma.client.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return (
      <div className="mx-auto max-w-lg space-y-5">
        <BackLink href="/dashboard/orcamentos" label={labels.back} />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{labels.createTitle}</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{labels.chooseClientHint}</p>
          {clients.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {labels.noClients}{" "}
              <Link href="/dashboard/clientes" className="font-semibold text-amber-700 underline dark:text-amber-400">
                {labels.goToClients}
              </Link>
            </p>
          ) : (
            <form method="get" className="mt-4 space-y-3">
              <label htmlFor="budget-client" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {labels.client}
              </label>
              <select
                id="budget-client"
                name="cliente"
                required
                defaultValue=""
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="" disabled>
                  {labels.chooseClient}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                {labels.continue}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, companyId: user.companyId },
    select: { id: true, name: true, address: true },
  });
  if (!client) notFound();

  const visit = visitId
    ? await prisma.visitRequest.findFirst({
        where: { id: visitId, companyId: user.companyId, clientId: client.id },
        select: {
          id: true,
          status: true,
          requestedAddress: true,
          scheduledAt: true,
          budget: { select: { id: true } },
        },
      })
    : null;

  if (visit?.budget) redirect(`/dashboard/orcamentos/${visit.budget.id}`);
  const usableVisit = visit && visit.status === VisitStatus.COMPLETED ? visit : null;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <BackLink href={`/dashboard/clientes/${client.id}`} label={labels.backToClient(client.name)} />
        <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">{labels.createTitle}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {client.name}
          {usableVisit?.scheduledAt
            ? ` · ${texts.dashboard.visits.viewedOn(dateTimeFormatter.format(usableVisit.scheduledAt))}`
            : ` · ${labels.withoutVisit}`}
        </p>
      </div>
      <BudgetEditor
        mode="create"
        clientId={client.id}
        visitRequestId={usableVisit?.id ?? null}
        initialProjectName=""
        initialWorkAddress={usableVisit?.requestedAddress ?? client.address ?? ""}
        initialNotes=""
      />
    </div>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
