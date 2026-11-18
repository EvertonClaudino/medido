"use client";

import { useActionState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
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
      <h1 className="font-display text-[1.75rem] leading-tight font-bold tracking-[-0.03em] [font-stretch:106%]">{labels.title}</h1>
      <p className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-400">{labels.subtitle}</p>

      {displayError && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {displayError}
        </p>
      )}

      <form action={formAction} className="mt-7 space-y-5">
        <Field id="email" name="email" type="email" label={labels.email} icon={Mail} autoComplete="email" inputMode="email" required />
        <PasswordField
          id="password"
          name="password"
          label={labels.password}
          icon={Lock}
          autoComplete="current-password"
          required
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
        />
        <button type="submit" disabled={isPending} className={`${authPrimaryButtonClass} mt-2`}>
          {isPending ? labels.submitting : labels.submit}
          {!isPending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </form>
    </>
  );
}
