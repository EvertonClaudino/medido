import type { CSSProperties } from "react";
import { texts } from "@/lib/texts";

const t = texts.landing.hero;

/**
 * Alçado técnico de um edifício com andaime e cotas, desenhado em traço (SVG).
 * Com `animated`, cada traço desenha-se ao carregar (classes lp-draw em globals.css).
 */
export function HeroDrawing({ animated = true, className = "" }: { animated?: boolean; className?: string }) {
  const draw = (delay: number) =>
    animated ? { className: "lp-draw", style: { "--d": `${delay}ms` } as CSSProperties } : {};

  const windows = [
    { x: 125, y: 195 }, { x: 220, y: 195 }, { x: 315, y: 195 },
    { x: 125, y: 295 }, { x: 220, y: 295 }, { x: 315, y: 295 },
    { x: 125, y: 395 }, { x: 315, y: 395 },
  ];

  return (
    <svg viewBox="0 0 620 540" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" className="text-slate-300/70">
        <path pathLength={1} d="M0 470 H620" {...draw(0)} />
        <path pathLength={1} d="M90 470 V170 L250 82 L410 170 V470" {...draw(150)} />
        <path pathLength={1} d="M90 170 H410" {...draw(450)} />
        <path pathLength={1} d="M90 270 H410 M90 370 H410" {...draw(600)} />
        {windows.map((w, i) => (
          <rect key={`${w.x}-${w.y}`} pathLength={1} x={w.x} y={w.y} width="60" height="52" {...draw(800 + i * 70)} />
        ))}
        <path pathLength={1} d="M225 470 V392 H275 V470" {...draw(1350)} />
        <path pathLength={1} d="M232 140 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0" {...draw(1400)} />
      </g>

      {/* Andaime */}
      <g stroke="currentColor" strokeWidth="1" className="text-slate-500/80">
        <path pathLength={1} d="M432 470 V150 M478 470 V150 M524 470 V230" {...draw(900)} />
        <path pathLength={1} d="M432 390 H524 M432 310 H524 M432 230 H524 M432 150 H478" {...draw(1200)} />
        <path pathLength={1} d="M432 470 L478 390 M478 390 L524 310 M432 310 L478 230 M478 470 L524 390" {...draw(1500)} />
      </g>

      {/* Área medida */}
      <rect x="125" y="295" width="60" height="52" className="fill-amber-500/25" />
      <rect x="220" y="295" width="60" height="52" className="fill-amber-500/25" />
      <path d="M90 270 H410 V370 H90 Z" stroke="currentColor" strokeDasharray="4 5" className="text-amber-500/70" />

      {/* Cotas */}
      <g stroke="currentColor" strokeWidth="1" className="text-amber-500">
        <path pathLength={1} d="M48 170 V470 M40 170 H56 M40 470 H56" {...draw(1700)} />
        <path pathLength={1} d="M90 506 H410 M90 498 V514 M410 498 V514" {...draw(1850)} />
      </g>
      <g className="fill-amber-500 font-plexmono" fontSize="13">
        <text x="30" y="324" transform="rotate(-90 30 324)" textAnchor="middle">9,00 m</text>
        <text x="250" y="530" textAnchor="middle">12,00 m</text>
        <text x="250" y="262" textAnchor="middle" className="fill-amber-400">{t.dimension}</text>
      </g>
    </svg>
  );
}
