"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Building2, Check, Hash, Lock, Mail, User } from "lucide-react";
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
      <h1 className="font-display text-[1.75rem] leading-tight font-bold tracking-[-0.03em] [font-stretch:106%]">{labels.title}</h1>
      <p className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-400">{labels.subtitle}</p>

      {generalError && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {generalError}
        </p>
      )}

      {/* key força o reset dos valores por defeito após cada resposta do servidor */}
      <form key={JSON.stringify(values ?? {})} action={formAction} className="mt-7 space-y-8" noValidate>
        <fieldset className="space-y-5">
          <StepLegend step={1} label={labels.companySection} />
          <Field
            id="companyName"
            name="companyName"
            label={labels.companyName}
            icon={Building2}
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
            icon={Hash}
            hint={labels.nifHint}
            inputMode="numeric"
            maxLength={11}
            defaultValue={values?.nif}
            error={errorFor("nif")}
          />
        </fieldset>

        <fieldset className="space-y-5">
          <StepLegend step={2} label={labels.ownerSection} />
          <Field
            id="ownerName"
            name="ownerName"
            label={labels.ownerName}
            icon={User}
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
            icon={Mail}
            hint={labels.emailHint}
            autoComplete="email"
            inputMode="email"
            defaultValue={values?.email}
            error={errorFor("email")}
            required
          />
          <PasswordFields errorFor={errorFor} />
        </fieldset>

        <button type="submit" disabled={isPending} className={authPrimaryButtonClass}>
          {isPending ? labels.submitting : labels.submit}
          {!isPending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </form>
    </>
  );
}

function StepLegend({ step, label }: { step: number; label: string }) {
  return (
    <legend className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-white">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 font-plexmono text-xs text-white dark:bg-amber-500 dark:text-slate-950">
        {step}
      </span>
      {label}
    </legend>
  );
}

/** Palavra-passe e confirmação, com as regras a ficarem verdes à medida que são cumpridas (a validação real é no servidor). */
function PasswordFields({ errorFor }: { errorFor: (field: string) => string | undefined }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const rules = [
    { label: labels.passwordRules.length, met: password.length >= 8 },
    { label: labels.passwordRules.uppercase, met: /[A-Z]/.test(password) },
    { label: labels.passwordRules.digit, met: /\d/.test(password) },
  ];
  const matches = confirmation.length > 0 && confirmation === password;

  return (
    <>
      <PasswordField
        id="password"
        name="password"
        label={labels.password}
        icon={Lock}
        hint={
          <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
            {rules.map((rule) => (
              <li
                key={rule.label}
                className={`flex items-center gap-1.5 transition-colors ${rule.met ? "text-emerald-700 dark:text-emerald-400" : ""}`}
              >
                <Check className={`h-3.5 w-3.5 shrink-0 ${rule.met ? "opacity-100" : "opacity-30"}`} strokeWidth={3} aria-hidden="true" />
                {rule.label}
              </li>
            ))}
          </ul>
        }
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errorFor("password")}
        showLabel={showLabel}
        hideLabel={hideLabel}
        required
      />
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label={labels.confirmPassword}
        icon={Lock}
        hint={
          matches ? (
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
              {labels.passwordsMatch}
            </span>
          ) : undefined
        }
        autoComplete="new-password"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        error={errorFor("confirmPassword")}
        showLabel={showLabel}
        hideLabel={hideLabel}
        required
      />
    </>
  );
}
