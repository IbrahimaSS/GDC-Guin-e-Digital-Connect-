"use client";

import { useId, useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

/** Mini-courbe de tendance qui se dessine quand elle entre dans l'écran. */
export default function Sparkline({ data, color = "#0066cc", className = "h-10 w-28" }: { data: number[]; color?: string; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const id = `sp-${useId().replace(/:/g, "")}`;
  const W = 112;
  const H = 40;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const x = (i: number) => (W * i) / (data.length - 1);
  const y = (v: number) => H - 4 - ((H - 8) * (v - min)) / (max - min || 1);
  const ligne = `M${data.map((v, i) => `${x(i)},${y(v)}`).join(" L")}`;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top 95%", once: true } });
      tl.from(".sp-line", { drawSVG: "0%", duration: 1.1, ease: "power2.inOut" }).from(".sp-area", { opacity: 0, duration: 0.6 }, "-=0.5").from(".sp-dot", { scale: 0, transformOrigin: "center", duration: 0.35, ease: "back.out(3)" }, "-=0.2");
    },
    { scope: ref },
  );

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={className} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="sp-area" d={`${ligne} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
      <path className="sp-line" d={ligne} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle className="sp-dot" cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="3.5" fill={color} />
    </svg>
  );
}
