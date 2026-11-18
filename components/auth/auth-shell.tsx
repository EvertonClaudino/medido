import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PhoneScreen } from "@/components/landing/product-showcase";
import { publicFontClasses } from "@/lib/fonts";
import { texts } from "@/lib/texts";

const panel = texts.auth.panel;
const switcher = texts.auth.switcher;

type AuthMode = "login" | "register";

/**
 * Estrutura comum de iniciar sessão e criar conta: cartão com o formulário
 * e alternância entre os dois modos; em ecrãs largos, painel de marca com o produto.
 */
export function AuthShell({ mode, children }: { mode: AuthMode; children: React.ReactNode }) {
  return (
    <div
      className={`${publicFontClasses} grid min-h-screen bg-slate-50 text-slate-900 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] dark:bg-slate-950 dark:text-slate-100`}
    >
      <div className="flex min-h-screen flex-col px-4 py-4 sm:px-8 sm:py-5">
        <header className="flex items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-amber-500 dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {texts.auth.backHome}
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 sm:py-12">
          <div className="w-full max-w-[28rem] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_48px_-24px_rgb(15_23_42/0.18)] sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <ModeSwitcher mode={mode} />
            <div className="mt-7">{children}</div>
          </div>
        </main>

        <footer className="text-center font-plexmono text-[11px] text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} Medido</footer>
      </div>

      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-slate-950 bg-blueprint-dark text-white lg:flex lg:flex-col lg:p-12 xl:p-16"
      >
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />
        <p className="font-plexmono text-[11px] tracking-[0.2em] text-slate-500 uppercase">{panel.label}</p>

        <div className="mt-auto max-w-lg pt-12">
          <p className="font-display text-[2.1rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance [font-stretch:106%]">
            {panel.statement}
          </p>
          <ul className="mt-8 space-y-3">
            {panel.points.map((point) => (
              <li key={point} className="flex gap-3 text-[15px] text-slate-300">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-12 -mb-32 w-[250px] self-end xl:mr-6">
          <PhoneScreen />
        </div>
      </aside>
    </div>
  );
}

function ModeSwitcher({ mode }: { mode: AuthMode }) {
  const options: { mode: AuthMode; href: string; label: string }[] = [
    { mode: "login", href: "/login", label: switcher.login },
    { mode: "register", href: "/registo", label: switcher.register },
  ];
  return (
    <nav aria-label={switcher.label} className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
      {options.map((option) => {
        const active = option.mode === mode;
        return (
          <Link
            key={option.mode}
            href={option.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-amber-500 ${
              active
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
