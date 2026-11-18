import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { updateProjectAction } from "@/app/dashboard/actions";
import { texts } from "@/lib/texts";

export default async function EditarObraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole([Role.OWNER]);

  const project = await prisma.project.findFirst({
    where: { id, companyId: user.companyId },
    select: {
      id: true,
      name: true,
      code: true,
      serviceType: true,
      clientId: true,
      clientName: true,
      address: true,
      budget: true,
      startDate: true,
      endDate: true,
      quote: { select: { id: true } },
    },
  });

  if (!project) {
    redirect("/dashboard/obras");
  }

  const clients = project.quote
    ? []
    : await prisma.client.findMany({
        where: { companyId: user.companyId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateProjectAction(id, formData);
    if (result.success) {
      redirect("/dashboard/obras");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/obras"
          className="text-xs text-slate-500 hover:text-slate-900 underline dark:text-slate-400 dark:hover:text-white"
        >
          ← Voltar a Obras
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Editar Obra
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Atualiza os dados da obra{" "}
          <span className="font-semibold">{project.name}</span>.
        </p>
        {project.quote && (
          <Link
            href={`/dashboard/orcamentos/${project.quote.id}`}
            className="mt-2 inline-block text-xs font-semibold text-amber-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:text-amber-300"
          >
            {texts.dashboard.budgets.associatedQuote}
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <form action={handleUpdate} className="space-y-4 text-xs">
          {project.quote ? (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              {texts.dashboard.budgets.projectSyncNote}
            </p>
          ) : (
            <div>
              <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
                Nome da Obra *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={project.name}
                maxLength={120}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
              Código Interno
            </label>
            <input
              type="text"
              name="code"
              defaultValue={project.code ?? ""}
              maxLength={30}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
              Tipo de Serviço
            </label>
            <input
              type="text"
              name="serviceType"
              defaultValue={project.serviceType ?? ""}
              placeholder="Ex.: Reabilitação & Remodelação"
              maxLength={80}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white"
            />
          </div>

          {!project.quote && (
            <>
              <div>
                <label htmlFor="clientId" className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Cliente Associado
                </label>
                <select
                  id="clientId"
                  name="clientId"
                  defaultValue={project.clientId ?? ""}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Sem cliente associado</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Nome do Cliente (apresentado na obra)
                </label>
                <input
                  type="text"
                  name="clientName"
                  defaultValue={project.clientName ?? ""}
                  maxLength={120}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Morada
                </label>
                <input
                  type="text"
                  name="address"
                  defaultValue={project.address ?? ""}
                  maxLength={200}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Orçamento (€)
                </label>
                <input
                  type="number"
                  name="budget"
                  step="0.01"
                  min="0"
                  defaultValue={project.budget?.toFixed(2) ?? ""}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
                Data de Início
              </label>
              <input
                type="date"
                name="startDate"
                defaultValue={project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : ""}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
                Data Limite / Conclusão
              </label>
              <input
                type="date"
                name="endDate"
                defaultValue={project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : ""}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-5 py-2.5 font-semibold text-white hover:bg-amber-500"
            >
              Guardar Alterações
            </button>
            <Link
              href="/dashboard/obras"
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
