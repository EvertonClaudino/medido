import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Building2,
  Calculator,
  Check,
  CheckCheck,
  ClipboardList,
  Contact,
  type LucideIcon,
} from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { HeroDrawing } from "@/components/landing/hero-drawing";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { Logo } from "@/components/brand/logo";
import { publicFontClasses } from "@/lib/fonts";
import { texts } from "@/lib/texts";

const t = texts.landing;

const container = "mx-auto w-full max-w-[84rem] px-5 sm:px-8 lg:px-12";
const eyebrow = "font-plexmono text-xs uppercase tracking-[0.2em]";
const display = "font-display font-bold tracking-[-0.03em] [font-stretch:106%]";
const sectionTitle = `${display} mt-5 text-[clamp(2.1rem,4.2vw,3.6rem)] leading-[1.02] text-balance`;
const sectionBody = "max-w-md text-[17px] leading-relaxed text-slate-600 dark:text-slate-400";
const primaryButton =
  "group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-amber-500 pr-2 pl-7 text-[15px] font-semibold text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500";
const primaryIcon =
  "inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-amber-400 transition-transform duration-300 group-hover:translate-x-0.5";
const ghostButtonDark =
  "inline-flex h-14 items-center justify-center rounded-full border border-white/25 px-7 text-[15px] font-medium text-white transition-colors hover:border-white hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

const featureIcons: LucideIcon[] = [Contact, Calculator, Building2, ClipboardList, CheckCheck, BellRing];

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function Home() {
  return (
    <div
      className={`${publicFontClasses} flex min-h-screen flex-col overflow-x-clip bg-white text-slate-900 antialiased selection:bg-amber-500 selection:text-slate-950 dark:bg-slate-950 dark:text-slate-100`}
    >
      <LandingNav />

      <main className="flex-1">
        <Hero />
        <Intro />
        <Features />
        <Journey />
        <Roles />
        <SiteFigures />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 bg-blueprint-dark text-white">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-slate-950 to-transparent" />
      <div className="pointer-events-none absolute top-1/3 right-[-10%] -z-10 h-[32rem] w-[32rem] rounded-full bg-amber-500/10 blur-3xl" />

      <div
        className={`${container} grid gap-14 pt-32 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14 lg:pt-40 lg:pb-28`}
      >
        <div>
          <p
            className="lp-fade inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[13px] text-slate-300"
            style={delay(100)}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
            {t.hero.eyebrow}
          </p>

          <h1 className={`${display} mt-7 text-[clamp(2.6rem,5vw,4.4rem)] leading-[1.02]`}>
            <span className="lp-mask">
              <span className="lp-rise" style={delay(150)}>
                {t.hero.title}
              </span>
            </span>
            <span className="lp-mask">
              <span className="lp-rise text-amber-400" style={delay(280)}>
                {t.hero.titleAccent}
              </span>
            </span>
          </h1>

          <p className="lp-fade mt-6 max-w-lg text-lg leading-relaxed text-slate-300 text-pretty" style={delay(450)}>
            {t.hero.body}
          </p>

          <div className="lp-fade mt-9 flex flex-col gap-3 sm:flex-row" style={delay(600)}>
            <Link href="/registo" className={primaryButton}>
              {t.hero.primary}
              <span className={primaryIcon}>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
            <Link href="/login" className={ghostButtonDark}>
              {t.hero.secondary}
            </Link>
          </div>

          <ul className="lp-fade mt-10 space-y-2.5 text-[15px] text-slate-300" style={delay(750)}>
            {t.hero.highlights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lp-fade" style={delay(500)}>
          <ProductShowcase />
        </div>
      </div>
    </section>
  );
}

function Intro() {
  const words = t.intro.statement.split(" ");
  return (
    <section className="py-24 sm:py-32">
      <div className={container}>
        <p className={`${eyebrow} text-amber-700 dark:text-amber-400`}>{t.intro.eyebrow}</p>
        <p className={`${display} mt-6 max-w-[26ch] text-[clamp(1.8rem,3.6vw,3.25rem)] leading-[1.1] font-semibold`}>
          {words.map((word, index) => (
            <span key={`${word}-${index}`} className="lp-word">
              {word}{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="funcionalidades" className="scroll-mt-20 bg-slate-50 py-24 sm:py-28 dark:bg-slate-900/60">
      <div className={container}>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <p className={`${eyebrow} text-amber-700 dark:text-amber-400`}>{t.features.eyebrow}</p>
            <h2 className={`${sectionTitle} max-w-[18ch]`}>{t.features.title}</h2>
          </div>
          <p className={`${sectionBody} lg:justify-self-end`}>{t.features.body}</p>
        </div>

        <ul className="mt-14 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((feature, index) => {
            const Icon = featureIcons[index];
            return (
              <li key={feature.title} className="lp-reveal flex gap-4 border-t border-slate-200 py-8 dark:border-slate-800">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-amber-400 dark:ring-slate-800">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{feature.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Journey() {
  return (
    <section id="percurso" className="scroll-mt-20 py-24 sm:py-32">
      <div className={`${container} grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20`}>
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className={`${eyebrow} text-amber-700 dark:text-amber-400`}>{t.journey.eyebrow}</p>
          <h2 className={sectionTitle}>{t.journey.title}</h2>
        </div>

        <ol>
          {t.journey.steps.map((step, index) => (
            <li
              key={step.title}
              className="lp-focus grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 border-t border-slate-200 py-8 last:border-b sm:grid-cols-[5rem_minmax(0,1fr)] sm:py-10 dark:border-slate-800"
            >
              <span className={`${display} text-4xl text-amber-500 tabular-nums sm:text-5xl`}>{String(index + 1).padStart(2, "0")}</span>
              <div className="pt-1">
                <h3 className={`${display} text-2xl sm:text-3xl`}>{step.title}</h3>
                <p className="mt-2 max-w-md text-[16px] leading-relaxed text-slate-600 dark:text-slate-400">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section id="perfis" className="scroll-mt-20 bg-slate-950 py-24 text-white sm:py-32 dark:bg-slate-900">
      <div className={container}>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <p className={`${eyebrow} text-amber-400`}>{t.roles.eyebrow}</p>
            <h2 className={`${sectionTitle} max-w-[16ch]`}>{t.roles.title}</h2>
          </div>
          <p className="max-w-md text-[17px] leading-relaxed text-slate-400 lg:justify-self-end">{t.roles.body}</p>
        </div>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
          {t.roles.panels.map((panel, index) => (
            <li
              key={panel.role}
              className="group lp-reveal relative flex flex-col bg-slate-950 p-7 transition-colors duration-500 hover:bg-slate-900 sm:p-9 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-amber-500 transition-transform duration-500 group-hover:scale-x-100" />
              <div className="flex items-start justify-between">
                <span className="font-plexmono text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</span>
                <ArrowUpRight
                  className="h-5 w-5 text-slate-600 transition-all duration-500 group-hover:rotate-45 group-hover:text-amber-400"
                  aria-hidden="true"
                />
              </div>
              <h3 className={`${display} mt-10 text-4xl leading-none`}>{panel.role}</h3>
              <p className="mt-2 text-[15px] text-amber-400">{panel.tagline}</p>
              <ul className="mt-7 space-y-2.5 border-t border-white/10 pt-6 text-[15px] text-slate-300">
                {panel.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SiteFigures() {
  return (
    <section id="estaleiro" className="scroll-mt-20 py-24 sm:py-32">
      <div className={container}>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <p className={`${eyebrow} text-amber-700 dark:text-amber-400`}>{t.site.eyebrow}</p>
            <h2 className={`${sectionTitle} max-w-[16ch]`}>{t.site.title}</h2>
          </div>
          <p className={`${sectionBody} lg:justify-self-end`}>{t.site.body}</p>
        </div>

        <dl className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.site.figures.map((figure) => (
            <div
              key={figure.value}
              className="lp-reveal flex flex-col-reverse rounded-2xl border border-slate-200 p-6 dark:border-slate-800"
            >
              <dt className="mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{figure.label}</dt>
              <dd className={`${display} text-[clamp(2.6rem,4vw,3.5rem)] leading-none tabular-nums`}>{figure.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="pb-24 sm:pb-32">
      <div className={container}>
        <div className="relative isolate grid overflow-hidden rounded-3xl bg-slate-950 bg-blueprint-dark text-white lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] dark:border dark:border-slate-800 dark:bg-slate-900">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className={`${eyebrow} text-amber-400`}>{t.cta.eyebrow}</p>
            <h2 className={`${sectionTitle} max-w-[16ch]`}>{t.cta.title}</h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-slate-400">{t.cta.body}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/registo" className={primaryButton}>
                {t.cta.primary}
                <span className={primaryIcon}>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
              <Link href="/login" className={ghostButtonDark}>
                {t.cta.secondary}
              </Link>
            </div>
          </div>
          <div className="relative hidden min-h-[22rem] border-l border-white/10 lg:block">
            <HeroDrawing animated={false} className="absolute inset-0 m-auto w-[88%] opacity-80" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className={`${container} grid gap-10 py-14 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]`}>
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t.footer.tagline}</p>
        </div>
        <FooterColumn title={t.footer.productTitle} links={t.nav.links.map((link) => ({ href: `/${link.href}`, label: link.label }))} />
        <FooterColumn
          title={t.footer.accountTitle}
          links={[
            { href: "/login", label: t.nav.login },
            { href: "/registo", label: t.nav.register },
          ]}
        />
      </div>

      <div className={`${container} border-t border-slate-200 py-6 dark:border-slate-800`}>
        <p className="font-plexmono text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} Medido</p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="font-plexmono text-[11px] tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-[15px] text-slate-700 transition-colors hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-400">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
