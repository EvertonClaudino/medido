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
      clientName: true,
      address: true,
      budget: true,
      quote: { select: { id: true } },
    },
  });

  if (!project) {
    redirect("/dashboard/obras");
  }

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
          className="text-xs text-slate-500 hover:text-slate-900 underline"
        >
          ← Voltar a Obras
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Editar Obra
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Atualiza os dados da obra{" "}
          <span className="font-semibold">{project.name}</span>.
        </p>
        {project.quote && (
          <Link
            href={`/dashboard/orcamentos/${project.quote.id}`}
            className="mt-2 inline-block text-xs font-semibold text-amber-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          >
            {texts.dashboard.budgets.associatedQuote}
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <form action={handleUpdate} className="space-y-4 text-xs">
          {project.quote ? (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              {texts.dashboard.budgets.projectSyncNote}
            </p>
          ) : (
            <div>
              <label className="block font-semibold uppercase text-slate-700">
                Nome da Obra *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={project.name}
                maxLength={120}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold uppercase text-slate-700">
              Código Interno
            </label>
            <input
              type="text"
              name="code"
              defaultValue={project.code ?? ""}
              maxLength={30}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-700">
              Tipo de Serviço
            </label>
            <input
              type="text"
              name="serviceType"
              defaultValue={project.serviceType ?? ""}
              placeholder="Ex.: Reabilitação & Remodelação"
              maxLength={80}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {!project.quote && (
            <>
              <div>
                <label className="block font-semibold uppercase text-slate-700">
                  Cliente
                </label>
                <input
                  type="text"
                  name="clientName"
                  defaultValue={project.clientName ?? ""}
                  maxLength={120}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700">
                  Morada
                </label>
                <input
                  type="text"
                  name="address"
                  defaultValue={project.address ?? ""}
                  maxLength={200}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700">
                  Orçamento (€)
                </label>
                <input
                  type="number"
                  name="budget"
                  step="0.01"
                  min="0"
                  defaultValue={project.budget ?? ""}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-5 py-2.5 font-semibold text-white hover:bg-amber-500"
            >
              Guardar Alterações
            </button>
            <Link
              href="/dashboard/obras"
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
