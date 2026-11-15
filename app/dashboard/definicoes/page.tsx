import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { updateCompanyAction } from "../actions";

export default async function DefinicoesPage() {
  const user = await requireRole([Role.OWNER]);

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
  });

  if (!company) return null;

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateCompanyAction(formData);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Definições da Empresa
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Atualize os dados institucionais, morada e NIF da sua organização.
        </p>
      </div>

      <form
        action={handleUpdate}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs"
      >
        <div>
          <label className="block font-semibold uppercase text-slate-700">
            Nome da Empresa / Razão Social *
          </label>
          <input
            type="text"
            name="name"
            required
            defaultValue={company.name}
            className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-semibold uppercase text-slate-700">
              NIF da Empresa
            </label>
            <input
              type="text"
              name="nif"
              defaultValue={company.nif || ""}
              placeholder="501234567"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-700">
              Telefone / Contacto
            </label>
            <input
              type="text"
              name="phone"
              defaultValue={company.phone || ""}
              placeholder="+351 210 000 000"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold uppercase text-slate-700">
            Morada da Sede
          </label>
          <input
            type="text"
            name="address"
            defaultValue={company.address || ""}
            placeholder="Avenida Central, Lisboa"
            className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-800"
          >
            Guardar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
