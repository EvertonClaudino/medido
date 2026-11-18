import Link from "next/link";

/** Marca do Medido: três traços de régua (medição) + nome. */
export function Logo({ href = "/", inverted = false }: { href?: string; inverted?: boolean }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
      aria-label="Medido — página inicial"
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
        <rect x="2" y="3" width="3" height="14" className="fill-amber-500" />
        <rect x="8.5" y="7" width="3" height="10" className="fill-amber-500" />
        <rect x="15" y="11" width="3" height="6" className="fill-amber-500" />
      </svg>
      <span
        className={`text-lg font-semibold tracking-tight ${
          inverted ? "text-white" : "text-slate-900 dark:text-white"
        }`}
      >
        Medido
      </span>
    </Link>
  );
}
