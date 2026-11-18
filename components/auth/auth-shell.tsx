import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { publicFontClasses } from "@/lib/fonts";
import { texts } from "@/lib/texts";

const panel = texts.auth.panel;

/**
 * Estrutura comum de iniciar sessão e criar conta: formulário à esquerda
 * e, em ecrãs largos, um painel de marca escuro com grelha de planta técnica.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${publicFontClasses} grid min-h-screen bg-white text-slate-900 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] dark:bg-slate-950 dark:text-slate-100`}>
      <div className="flex min-h-screen flex-col px-5 py-5 sm:px-10">
        <header className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center py-10">
          <div className="w-full max-w-sm sm:ml-[8%] lg:ml-[12%]">{children}</div>
        </main>

        <footer className="font-plexmono text-[11px] text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} Medido
        </footer>
      </div>

      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden border-l border-slate-800 bg-slate-950 bg-blueprint-dark lg:flex lg:flex-col lg:justify-between lg:p-12"
      >
        <p className="font-plexmono text-[11px] uppercase tracking-[0.2em] text-slate-500">Medido · Gestão de obra</p>

        <div className="max-w-md">
          <p className="font-display text-4xl leading-[1.02] font-bold tracking-[-0.03em] text-white text-balance [font-stretch:108%]">{panel.statement}</p>

          <ol className="mt-10 divide-y divide-slate-800 border-y border-slate-800">
            {panel.points.map((point, index) => (
              <li key={point} className="flex gap-4 py-3.5 text-sm text-slate-300">
                <span className="font-plexmono text-amber-400">{String(index + 1).padStart(2, "0")}</span>
                <span>{point}</span>
              </li>
            ))}
          </ol>

          {/* Cota de desenho técnico: referência visual à medição */}
          <div className="mt-10 flex items-center gap-3 font-plexmono text-xs text-amber-400">
            <span className="h-3 w-px bg-amber-400" />
            <span className="h-px flex-1 bg-amber-400/60" />
            <span>24,50 m²</span>
            <span className="h-px flex-1 bg-amber-400/60" />
            <span className="h-3 w-px bg-amber-400" />
          </div>
        </div>

        <p className="max-w-sm text-xs text-slate-500">{panel.footer}</p>
      </aside>
    </div>
  );
}
