"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

const W = 600;

function useChartAnimation(build: (root: HTMLElement) => void, deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      build(ref.current);
    },
    { scope: ref, dependencies: deps, revertOnUpdate: true },
  );
  return ref;
}

function niceMax(v: number) {
  const pow = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / pow) * pow;
}

/* ------------------------------------------------------------------ Courbes */

export interface Serie {
  name: string;
  color: string;
  data: number[];
}

export function LineChart({ series, labels, height = 220 }: { series: Serie[]; labels: string[]; height?: number }) {
  const H = height;
  const pad = { t: 12, r: 12, b: 28, l: 40 };
  const max = niceMax(Math.max(...series.flatMap((s) => s.data)));
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (innerW * i) / (labels.length - 1);
  const y = (v: number) => pad.t + innerH - (innerH * v) / max;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));

  const ref = useChartAnimation(
    (root) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: "top 90%", once: true } });
      tl.from(root.querySelectorAll(".lc-line"), { drawSVG: "0%", duration: 1.4, ease: "power2.inOut", stagger: 0.2 })
        .from(root.querySelectorAll(".lc-area"), { autoAlpha: 0, duration: 0.8 }, "-=0.8")
        .from(root.querySelectorAll(".lc-dot"), { scale: 0, transformOrigin: "center", stagger: 0.03, duration: 0.3, ease: "back.out(3)" }, "-=0.9");
    },
    [series],
  );

  return (
    <div ref={ref}>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label="Graphique d'évolution">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.name} id={`lc-grad-${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeDasharray="3 4" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
              {t}
            </text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={l} x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[11px]">
            {l}
          </text>
        ))}
        {series.map((s, si) => {
          const pts = s.data.map((v, i) => `${x(i)},${y(v)}`);
          const line = `M${pts.join(" L")}`;
          const area = `${line} L${x(s.data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
          return (
            <g key={s.name}>
              <path d={area} fill={`url(#lc-grad-${si})`} className="lc-area" />
              <path d={line} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" className="lc-line" />
              {s.data.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill="var(--surface)" stroke={s.color} strokeWidth={2} className="lc-dot">
                  <title>{`${s.name} – ${labels[i]} : ${v}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------- Barres */

export interface Barre {
  label: string;
  value: number;
  color?: string;
}

export function BarChart({ data, height = 220, unit = "" }: { data: Barre[]; height?: number; unit?: string }) {
  const H = height;
  const pad = { t: 22, r: 8, b: 28, l: 8 };
  const max = Math.max(...data.map((d) => d.value));
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const slot = innerW / data.length;
  const bw = Math.min(46, slot * 0.6);

  const ref = useChartAnimation(
    (root) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: "top 90%", once: true } });
      tl.from(root.querySelectorAll(".bc-bar"), {
        scaleY: 0,
        transformOrigin: "50% 100%",
        duration: 0.9,
        stagger: 0.07,
        ease: "power3.out",
      }).from(root.querySelectorAll(".bc-val"), { autoAlpha: 0, y: 6, stagger: 0.07, duration: 0.4 }, "-=0.7");
    },
    [data],
  );

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label="Graphique en barres">
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + innerH} y2={pad.t + innerH} stroke="var(--grid)" />
        {data.map((d, i) => {
          const h = (innerH * d.value) / max;
          const cx = pad.l + slot * i + slot / 2;
          return (
            <g key={d.label}>
              <rect
                x={cx - bw / 2}
                y={pad.t + innerH - h}
                width={bw}
                height={h}
                rx={6}
                fill={d.color ?? "#0066cc"}
                className="bc-bar"
              >
                <title>{`${d.label} : ${d.value}${unit}`}</title>
              </rect>
              <text x={cx} y={pad.t + innerH - h - 6} textAnchor="middle" className="bc-val fill-slate-600 text-[11px] font-semibold">
                {String(d.value).replace(".", ",")}
                {unit}
              </text>
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[11px]">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------- Anneau */

export interface Segment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ data, centerLabel }: { data: Segment[]; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 70;
  const gap = 0.04; // écart entre segments, en radians
  const polar = (a: number) => [90 + r * Math.cos(a), 90 + r * Math.sin(a)];
  const arcs = data.reduce<{ d: Segment; a0: number; a1: number }[]>((acc, d) => {
    const a0 = acc.length ? acc[acc.length - 1].a1 : -Math.PI / 2;
    return [...acc, { d, a0, a1: a0 + (d.value / total) * Math.PI * 2 }];
  }, []);

  const ref = useChartAnimation(
    (root) => {
      gsap.from(root.querySelectorAll(".dc-seg"), {
        drawSVG: "0%",
        duration: 0.9,
        stagger: 0.15,
        ease: "power2.inOut",
        scrollTrigger: { trigger: root, start: "top 90%", once: true },
      });
    },
    [data],
  );

  return (
    // Requête de conteneur : la légende passe sous l’anneau quand la carte est étroite.
    <div ref={ref} className="@container">
      <div className="flex flex-col items-center gap-5 @sm:flex-row">
      <svg viewBox="0 0 180 180" className="size-44 shrink-0" role="img" aria-label="Répartition">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="18" />
        {arcs.map(({ d, a0, a1 }) => {
          const [sx, sy] = polar(a0 + gap / 2);
          const [ex, ey] = polar(a1 - gap / 2);
          const large = a1 - a0 > Math.PI ? 1 : 0;
          return (
            <path
              key={d.label}
              d={`M${sx} ${sy} A${r} ${r} 0 ${large} 1 ${ex} ${ey}`}
              fill="none"
              stroke={d.color}
              strokeWidth="18"
              className="dc-seg"
            >
              <title>{`${d.label} : ${d.value}`}</title>
            </path>
          );
        })}
        <text x="90" y="92" textAnchor="middle" className="fill-slate-900 text-[26px] font-bold">
          {total}
        </text>
        <text x="90" y="112" textAnchor="middle" className="fill-slate-400 text-[11px]">
          {centerLabel}
        </text>
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <span className="size-2.5 rounded-full" style={{ background: d.color }} />
              {d.label}
            </span>
            <span className="whitespace-nowrap font-semibold text-slate-900">{Math.round((d.value / total) * 100)} %</span>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Barre de progression */

export function ProgressBar({ value, color = "bg-brand-600", className = "h-2" }: { value: number; color?: string; className?: string }) {
  const ref = useChartAnimation(
    (root) => {
      gsap.from(root.firstElementChild, {
        width: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: { trigger: root, start: "top 95%", once: true },
      });
    },
    [value],
  );
  return (
    <div ref={ref} className={`w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}
