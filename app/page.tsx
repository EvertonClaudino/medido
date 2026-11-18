import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { HeroDrawing } from "@/components/landing/hero-drawing";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { Logo } from "@/components/brand/logo";
import { publicFontClasses } from "@/lib/fonts";
import { texts } from "@/lib/texts";

const t = texts.landing;

const container = "mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12";
const eyebrow = "font-plexmono text-xs uppercase tracking-[0.2em]";
const display = "font-display font-bold tracking-[-0.035em] [font-stretch:108%]";
const primaryButton =
  "group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-amber-500 pr-2 pl-7 text-[15px] font-semibold text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500";
const primaryIcon =
  "inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-amber-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-rotate-45";
const ghostButtonDark =
  "inline-flex h-14 items-center justify-center rounded-full border border-white/25 px-7 text-[15px] font-medium text-white transition-colors hover:border-white hover:bg-white hover:text-slate-950";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function Home() {
  return (
    <div
      className={`${publicFontClasses} flex min-h-screen flex-col overflow-x-clip bg-white text-slate-900 antialiased selection:bg-amber-500 selection:text-slate-950 dark:bg-slate-950 dark:text-slate-100`}
    >
      <LandingNav />

      <main className="flex-1">
        <Hero />
        <Marquee />
        <Intro />
        <Product />
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
      <HeroDrawing className="pointer-events-none absolute top-[14%] right-[-28%] -z-10 w-[120%] max-w-none opacity-60 sm:right-[-10%] sm:w-[80%] lg:top-[10%] lg:right-[2%] lg:w-[52%] lg:opacity-90" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

      <div className={`${container} flex min-h-[100svh] flex-col pt-28 pb-8 lg:pt-36`}>
        <div className="flex items-start justify-between gap-6">
          <p className={`${eyebrow} lp-fade text-amber-400`} style={delay(200)}>
            {t.hero.eyebrow}
          </p>
          <p className={`${eyebrow} lp-fade hidden text-slate-500 lg:block`} style={delay(400)}>
            {t.hero.drawingLabel}
          </p>
        </div>

        <div className="mt-auto pt-16">
          <h1 className={`${display} text-[clamp(3.6rem,12.4vw,13rem)] leading-[0.84] uppercase`}>
            <span className="lp-mask">
              <span className="lp-rise" style={delay(150)}>
                {t.hero.lines[0]}
              </span>
            </span>
            <span className="lp-mask lg:pl-[18vw]">
              <span className="lp-rise text-amber-500" style={delay(300)}>
                {t.hero.lines[1]}
              </span>
            </span>
          </h1>

          <div className="lp-fade mt-10 flex flex-col gap-8 lg:mt-14 lg:flex-row lg:items-end lg:justify-between" style={delay(700)}>
            <p className="max-w-md text-lg leading-relaxed text-slate-300 text-pretty">{t.hero.body}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
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
          </div>
        </div>

        <dl className="lp-fade mt-12 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-4" style={delay(900)}>
          {t.hero.meta.map((item, index) => (
            <div key={item.term} className={index === 2 ? "col-span-2 sm:col-span-1" : undefined}>
              <dt className="font-plexmono text-[11px] tracking-[0.18em] text-slate-500 uppercase">{item.term}</dt>
              <dd className="mt-1 font-plexmono text-sm text-slate-200">{item.value}</dd>
            </div>
          ))}
          <div className="hidden items-end justify-end sm:flex">
            <a href="#produto" className="font-plexmono text-[11px] tracking-[0.18em] text-slate-400 uppercase hover:text-white">
              {t.hero.scroll} ↓
            </a>
          </div>
        </dl>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [...t.marquee, ...t.marquee];
  return (
    <div className="overflow-hidden border-y border-slate-950 bg-amber-500 py-4 text-slate-950 sm:py-5">
      <div className="lp-marquee flex w-max">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
            {items.map((item, index) => (
              <li key={`${item}-${index}`} className={`${display} flex items-center text-2xl uppercase sm:text-3xl`}>
                <span className="px-6 sm:px-8">{item}</span>
                <span className="h-2.5 w-2.5 bg-slate-950" aria-hidden="true" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

function Intro() {
  const words = t.intro.statement.split(" ");
  return (
    <section className="py-24 sm:py-32 lg:py-44">
      <div className={container}>
        <p className={`${eyebrow} text-amber-700 dark:text-amber-400`}>{t.intro.eyebrow}</p>
        <p className={`${display} mt-8 max-w-[22ch] text-[clamp(2rem,5.2vw,5rem)] leading-[1.02] font-semibold`}>
          {words.map((word, index) => (
            <span key={`${word}-${index}`} className="lp-word">
              {word}{" "}
            </span>
          ))}
        </p>

        <ol className="mt-20 grid gap-10 sm:mt-28 md:grid-cols-3 md:gap-8">
          {t.intro.pillars.map((pillar, index) => (
            <li key={pillar.title} className="lp-reveal border-t border-slate-900 pt-6 dark:border-slate-200">
              <span className="font-plexmono text-xs text-slate-500 dark:text-slate-400">{String(index + 1).padStart(2, "0")}</span>
              <h3 className={`${display} mt-6 text-3xl`}>{pillar.title}</h3>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{pillar.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Product() {
  return (
    <section id="produto" className="scroll-mt-20 bg-slate-100 py-24 sm:py-32 dark:bg-slate-900/60">
      <div className={container}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:items-end">
          <div>
            <p className={`${eyebrow} text-amber-700 dark:text-amber-400`}>{t.product.eyebrow}</p>
            <h2 className={`${display} mt-6 max-w-[16ch] text-[clamp(2.4rem,5.6vw,5.5rem)] leading-[0.95]`}>{t.product.title}</h2>
          </div>
          <p className="max-w-md text-[17px] leading-relaxed text-slate-600 lg:justify-self-end dark:text-slate-400">{t.product.body}</p>
        </div>

        <div className="lp-reveal mt-16 sm:mt-20">
          <ProductShowcase />
        </div>
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
          <h2 className={`${display} mt-6 text-[clamp(2.4rem,4.6vw,4.5rem)] leading-[0.98]`}>{t.journey.title}</h2>
        </div>

        <ol>
          {t.journey.steps.map((step, index) => (
            <li
              key={step.title}
              className="lp-focus grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 border-t border-slate-200 py-10 last:border-b sm:grid-cols-[7rem_minmax(0,1fr)] sm:py-14 dark:border-slate-800"
            >
              <span className={`${display} text-5xl text-amber-500 tabular-nums sm:text-7xl`}>{String(index + 1).padStart(2, "0")}</span>
              <div className="pt-1 sm:pt-3">
                <h3 className={`${display} text-2xl sm:text-4xl`}>{step.title}</h3>
                <p className="mt-3 max-w-md text-[16px] leading-relaxed text-slate-600 dark:text-slate-400">{step.body}</p>
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
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className={`${eyebrow} text-amber-400`}>{t.roles.eyebrow}</p>
            <h2 className={`${display} mt-6 max-w-[14ch] text-[clamp(2.4rem,5vw,5rem)] leading-[0.95]`}>{t.roles.title}</h2>
          </div>
          <p className="max-w-md text-[17px] leading-relaxed text-slate-400 lg:justify-self-end">{t.roles.body}</p>
        </div>

        <ul className="mt-16 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:mt-20 md:grid-cols-3">
          {t.roles.panels.map((panel, index) => (
            <li
              key={panel.role}
              className="group lp-reveal relative flex min-h-[26rem] flex-col bg-slate-950 p-7 transition-colors duration-500 hover:bg-slate-900 sm:p-9 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-amber-500 transition-transform duration-500 group-hover:scale-x-100" />
              <div className="flex items-start justify-between">
                <span className="font-plexmono text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</span>
                <ArrowUpRight
                  className="h-5 w-5 text-slate-600 transition-all duration-500 group-hover:rotate-45 group-hover:text-amber-400"
                  aria-hidden="true"
                />
              </div>
              <h3 className={`${display} mt-16 text-[clamp(2.4rem,3.6vw,3.5rem)] leading-none`}>{panel.role}</h3>
              <p className="mt-2 text-[15px] text-amber-400">{panel.tagline}</p>
              <ul className="mt-7 space-y-2.5 border-t border-white/10 pt-6 text-[15px] text-slate-300">
                {panel.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2.5 h-px w-3 shrink-0 bg-slate-500" aria-hidden="true" />
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
    <section id="estaleiro" className="scroll-mt-20 py-24 sm:py-32 lg:py-40">
      <div className={container}>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className={`${eyebrow} text-amber-700 dark:text-amber-400`}>{t.site.eyebrow}</p>
            <h2 className={`${display} mt-6 max-w-[15ch] text-[clamp(2.4rem,5vw,5rem)] leading-[0.95]`}>{t.site.title}</h2>
          </div>
          <p className="max-w-md text-[17px] leading-relaxed text-slate-600 lg:justify-self-end dark:text-slate-400">{t.site.body}</p>
        </div>

        <dl className="mt-16 grid border-t border-slate-900 sm:mt-24 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-200">
          {t.site.figures.map((figure) => (
            <div
              key={figure.value}
              className="lp-reveal flex flex-col-reverse border-b border-slate-200 py-8 sm:pr-8 lg:border-b-0 lg:border-l lg:py-10 lg:pl-8 lg:first:border-l-0 lg:first:pl-0 dark:border-slate-800"
            >
              <dt className="mt-4 max-w-[24ch] text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{figure.label}</dt>
              <dd className={`${display} text-[clamp(3.2rem,6vw,5.75rem)] leading-none tabular-nums`}>{figure.value}</dd>
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
        <div className="relative isolate grid overflow-hidden bg-slate-950 bg-blueprint-dark text-white lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] dark:border dark:border-slate-800 dark:bg-slate-900">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className={`${eyebrow} text-amber-400`}>{t.cta.eyebrow}</p>
            <h2 className={`${display} mt-6 max-w-[14ch] text-[clamp(2.4rem,5vw,4.75rem)] leading-[0.95]`}>{t.cta.title}</h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-slate-400">{t.cta.body}</p>
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
          <div className="relative hidden min-h-[24rem] border-l border-white/10 lg:block">
            <HeroDrawing animated={false} className="absolute inset-0 m-auto w-[90%] opacity-80" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="overflow-hidden border-t border-slate-200 dark:border-slate-800">
      <div className={`${container} grid gap-10 pt-16 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]`}>
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

      <div className={`${container} mt-16 flex items-center justify-between border-t border-slate-200 py-6 dark:border-slate-800`}>
        <p className="font-plexmono text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} Medido</p>
      </div>

      <p
        aria-hidden="true"
        className={`${display} -mb-[0.2em] text-center text-[20.5vw] leading-[0.8] text-slate-100 uppercase select-none dark:text-slate-900`}
      >
        Medido
      </p>
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
