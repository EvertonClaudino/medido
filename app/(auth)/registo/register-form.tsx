"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerCompanyAction, type RegisterState } from "@/app/(auth)/actions";
import { Field, PasswordField, authPrimaryButtonClass } from "@/components/auth/form-field";
import { texts } from "@/lib/texts";

const labels = texts.auth.register;
const showLabel = texts.auth.login.showPassword;
const hideLabel = texts.auth.login.hidePassword;

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(registerCompanyAction, {});
  const errorFor = (field: string) => (state.field === field ? state.error : undefined);
  const generalError = state.error && !state.field ? state.error : undefined;
  const values = state.values;

  return (
    <>
      <h1 className="font-display text-[2rem] leading-tight font-bold tracking-[-0.03em] [font-stretch:108%]">{labels.title}</h1>
      <p className="mt-2 text-[15px] text-slate-600 dark:text-slate-400">{labels.subtitle}</p>

      {generalError && (
        <p
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {generalError}
        </p>
      )}

      {/* key força o reset dos valores por defeito após cada resposta do servidor */}
      <form key={JSON.stringify(values ?? {})} action={formAction} className="mt-8 space-y-8" noValidate>
        <fieldset className="space-y-5">
          <legend className="mb-4 font-plexmono text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {labels.companySection}
          </legend>
          <Field
            id="companyName"
            name="companyName"
            label={labels.companyName}
            placeholder={labels.companyNamePlaceholder}
            autoComplete="organization"
            defaultValue={values?.companyName}
            error={errorFor("companyName")}
            required
          />
          <Field
            id="nif"
            name="nif"
            label={labels.nif}
            hint={labels.nifHint}
            inputMode="numeric"
            maxLength={11}
            defaultValue={values?.nif}
            error={errorFor("nif")}
          />
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-4 font-plexmono text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {labels.ownerSection}
          </legend>
          <Field
            id="ownerName"
            name="ownerName"
            label={labels.ownerName}
            autoComplete="name"
            defaultValue={values?.ownerName}
            error={errorFor("ownerName")}
            required
          />
          <Field
            id="email"
            name="email"
            type="email"
            label={labels.email}
            hint={labels.emailHint}
            autoComplete="email"
            inputMode="email"
            defaultValue={values?.email}
            error={errorFor("email")}
            required
          />
          <PasswordField
            id="password"
            name="password"
            label={labels.password}
            hint={labels.passwordHint}
            autoComplete="new-password"
            error={errorFor("password")}
            showLabel={showLabel}
            hideLabel={hideLabel}
            required
          />
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label={labels.confirmPassword}
            autoComplete="new-password"
            error={errorFor("confirmPassword")}
            showLabel={showLabel}
            hideLabel={hideLabel}
            required
          />
        </fieldset>

        <button type="submit" disabled={isPending} className={authPrimaryButtonClass}>
          {isPending ? labels.submitting : labels.submit}
        </button>
      </form>

      <p className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        {labels.haveAccount}{" "}
        <Link
          href="/login"
          className="font-semibold text-slate-900 underline decoration-amber-500 decoration-2 underline-offset-4 hover:decoration-slate-900 dark:text-white dark:hover:decoration-white"
        >
          {labels.login}
        </Link>
      </p>
    </>
  );
}
