"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/(auth)/actions";
import { Field, PasswordField, authPrimaryButtonClass } from "@/components/auth/form-field";
import { texts } from "@/lib/texts";

const labels = texts.auth.login;

export function LoginForm({ initialError }: { initialError?: string }) {
  const [errorMessage, formAction, isPending] = useActionState(loginAction, undefined);

  const displayError =
    errorMessage ?? (initialError === "inactive" ? labels.inactive : initialError ? labels.genericError : undefined);

  return (
    <>
      <h1 className="font-display text-[2rem] leading-tight font-bold tracking-[-0.03em] [font-stretch:108%]">{labels.title}</h1>
      <p className="mt-2 text-[15px] text-slate-600 dark:text-slate-400">{labels.subtitle}</p>

      {displayError && (
        <p
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {displayError}
        </p>
      )}

      <form action={formAction} className="mt-8 space-y-5">
        <Field id="email" name="email" type="email" label={labels.email} autoComplete="email" inputMode="email" required />
        <PasswordField
          id="password"
          name="password"
          label={labels.password}
          autoComplete="current-password"
          required
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
        />
        <button type="submit" disabled={isPending} className={authPrimaryButtonClass}>
          {isPending ? labels.submitting : labels.submit}
        </button>
      </form>

      <p className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        {labels.noAccount}{" "}
        <Link
          href="/registo"
          className="font-semibold text-slate-900 underline decoration-amber-500 decoration-2 underline-offset-4 hover:decoration-slate-900 dark:text-white dark:hover:decoration-white"
        >
          {labels.createAccount}
        </Link>
      </p>
    </>
  );
}
