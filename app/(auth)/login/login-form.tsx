"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/(auth)/actions";
import { AlertCircleIcon, ArrowRightIcon } from "@/components/icons";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [errorMessage, formAction, isPending] = useActionState(
    loginAction,
    undefined
  );

  const displayError =
    errorMessage ||
    (initialError === "inactive"
      ? "A sua sessão expirou ou o utilizador já não está ativo. Por favor, inicie sessão novamente."
      : initialError
      ? "Erro de autenticação. Por favor, inicie sessão."
      : undefined);

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Medido
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            Acesso Restrito
          </span>
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
          Iniciar Sessão
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Introduza as suas credenciais para aceder ao dashboard da sua empresa.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Email de Utilizador
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="utilizador@empresa.pt"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Palavra-passe
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {displayError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />
            <span>{displayError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/30 disabled:opacity-70"
        >
          {isPending ? "A verificar..." : "Entrar no Medido"}
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-8 border-t border-slate-100 pt-4 text-center">
        <p className="text-[11px] text-slate-500">
          Contas de teste criadas no seed:
        </p>
        <p className="text-[11px] text-slate-600 font-mono mt-1">
          dono@medido.pt / encarregado@medido.pt / funcionario@medido.pt
        </p>
        <p className="text-[11px] text-slate-500">
          Palavra-passe: <span className="font-mono">Medido123!</span>
        </p>
      </div>
    </div>
  );
}
