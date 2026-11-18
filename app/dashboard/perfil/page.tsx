import { requireUser } from "@/lib/auth";
import { changePasswordAction } from "@/app/dashboard/actions";
import Link from "next/link";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireUser({ allowMustChangePassword: true });
  const params = await searchParams;

  const roleLabel =
    user.role === "OWNER"
      ? "Dono da Empresa"
      : user.role === "FOREMAN"
      ? "Encarregado de Obra"
      : "Funcionário / Operacional";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          O Meu Perfil
        </h1>
        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
          Consulte os seus dados de utilizador e altere a sua palavra-passe de acesso.
        </p>
      </div>

      {user.mustChangePassword && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          <div className="font-bold flex items-center gap-1.5">
            ⚠️ Alteração de Palavra-passe Obrigatória
          </div>
          <p className="mt-1">
            Por motivos de segurança, é obrigatório definir uma nova palavra-passe pessoal no primeiro acesso antes de continuar para as restantes áreas do Medido.
          </p>
        </div>
      )}

      {params.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {params.error === "password_change_required"
            ? "Tem de alterar a sua palavra-passe para poder aceder à plataforma."
            : decodeURIComponent(params.error)}
        </div>
      )}

      {params.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          Palavra-passe alterada com sucesso!
        </div>
      )}

      {/* Dados do Utilizador */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 text-xs dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 dark:text-white dark:border-slate-800">
          Identificação
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-slate-400 font-medium">Nome:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5 dark:text-white">{user.name}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Email:</span>
            <div className="font-mono text-slate-800 text-sm mt-0.5 dark:text-slate-100">{user.email}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Perfil de Acesso:</span>
            <div className="font-bold text-slate-900 mt-0.5 dark:text-white">{roleLabel}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Empresa:</span>
            <div className="font-bold text-slate-900 mt-0.5 dark:text-white">{user.company.name}</div>
          </div>
        </div>
      </div>

      {/* Formulário de Alteração de Palavra-passe */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 mb-1 dark:text-white">
          Alterar Palavra-passe
        </h2>
        <p className="text-xs text-slate-500 mb-4 dark:text-slate-400">
          A palavra-passe tem de ter no mínimo 8 carateres, incluindo pelo menos uma maiúscula e um algarismo.
        </p>

        <form
          action={async (formData: FormData) => {
            "use server";
            const { redirect } = await import("next/navigation");
            const res = await changePasswordAction(formData);
            if (res.error) {
              redirect(`/dashboard/perfil?error=${encodeURIComponent(res.error)}`);
            } else {
              redirect("/dashboard/perfil?success=true");
            }
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
              Palavra-passe Atual *
            </label>
            <input
              type="password"
              name="currentPassword"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
                Nova Palavra-passe *
              </label>
              <input
                type="password"
                name="newPassword"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white"
                placeholder="Mínimo 8 carateres (ex: Obra!2026)"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-slate-700 dark:text-slate-300">
                Confirmar Nova Palavra-passe *
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white"
                placeholder="Repita a nova palavra-passe"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-5 py-2.5 font-semibold text-white hover:bg-amber-500"
            >
              Atualizar Palavra-passe
            </button>
            {!user.mustChangePassword && (
              <Link
                href="/dashboard"
                className="text-xs text-slate-500 hover:text-slate-900 underline dark:text-slate-400 dark:hover:text-white"
              >
                Voltar ao início
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

