"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

export const authInputClass =
  "block h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 shadow-xs placeholder:text-slate-400 transition-colors hover:border-slate-400 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-amber-400";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  icon?: LucideIcon;
}

function describedByFor(id: string, hint: ReactNode, error?: string) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

function FieldMessages({ id, hint, error }: { id: string; hint?: ReactNode; error?: string }) {
  return (
    <>
      {hint && !error && (
        <div id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </>
  );
}

function FieldIcon({ icon: Icon }: { icon?: LucideIcon }) {
  if (!Icon) return null;
  return (
    <Icon
      className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-slate-500"
      aria-hidden="true"
    />
  );
}

/** Campo com etiqueta por cima, ícone opcional e ajuda/erro ligados ao input (aria-describedby). */
export function Field({ id, label, hint, error, icon, ...input }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <div className="relative mt-1.5">
        <FieldIcon icon={icon} />
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByFor(id, hint, error)}
          className={`${authInputClass} ${icon ? "pl-11" : ""}`}
          {...input}
        />
      </div>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

/** Palavra-passe com botão para mostrar/ocultar (permite colar; WCAG 3.3.8). */
export function PasswordField({
  showLabel,
  hideLabel,
  ...props
}: FieldProps & { showLabel: string; hideLabel: string }) {
  const [visible, setVisible] = useState(false);
  const { id, label, hint, error, icon, ...input } = props;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <div className="relative mt-1.5">
        <FieldIcon icon={icon} />
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByFor(id, hint, error)}
          className={`${authInputClass} pr-12 ${icon ? "pl-11" : ""}`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500 dark:text-slate-400 dark:hover:text-white"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

export const authPrimaryButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 text-[15px] font-semibold text-slate-950 shadow-sm transition-colors hover:bg-amber-400 active:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:outline-white";
