"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "./theme-toggle";
import { texts } from "@/lib/texts";

const labels = texts.landing.nav;

/** Navegação da landing: transparente sobre o hero escuro, sólida depois de deslizar. */
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid
          ? "border-b border-slate-200 bg-white/90 text-slate-900 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 dark:text-white"
          : "border-b border-transparent text-white"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-5 sm:px-8 lg:h-20 lg:px-12">
        <Logo inverted={!solid} />

        <nav aria-label={labels.sectionsLabel} className="hidden items-center gap-9 md:flex">
          {labels.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm transition-opacity hover:opacity-100 ${solid ? "opacity-70" : "opacity-80"}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle
            className={`h-10 w-10 rounded-full! ${solid ? "" : "border-white/20! bg-white/5! hover:bg-white/15! [&_svg]:text-white!"}`}
          />
          <Link
            href="/login"
            className={`hidden h-10 items-center rounded-full px-4 text-sm font-medium transition-colors sm:inline-flex ${
              solid ? "hover:bg-slate-100 dark:hover:bg-slate-900" : "hover:bg-white/10"
            }`}
          >
            {labels.login}
          </Link>
          <Link
            href="/registo"
            className="inline-flex h-10 items-center rounded-full bg-amber-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            {labels.register}
          </Link>
          <button
            type="button"
            aria-label={open ? labels.closeMenu : labels.openMenu}
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-500/10 md:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="landing-mobile-nav" aria-label={labels.sectionsLabel} className="px-5 pt-2 pb-6 md:hidden">
          {labels.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex min-h-[52px] items-center border-b border-slate-200 font-display text-2xl font-semibold dark:border-slate-800"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="mt-5 flex h-12 items-center justify-center rounded-full border border-slate-300 text-[15px] font-medium dark:border-slate-700"
          >
            {labels.login}
          </Link>
        </nav>
      )}
    </header>
  );
}
