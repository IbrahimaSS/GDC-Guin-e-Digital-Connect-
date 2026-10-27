"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

interface CounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

const format = (v: number, decimals: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v).replace(/\p{Zs}/gu, String.fromCharCode(160));

/** Nombre qui défile de 0 jusqu'à sa valeur quand il devient visible. */
export default function Counter({ value, decimals = 0, prefix = "", suffix = "", duration = 1.6, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const obj = { v: 0 };
      el.textContent = prefix + format(0, decimals) + suffix;
      gsap.to(obj, {
        v: value,
        duration,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 96%", once: true },
        onUpdate: () => {
          el.textContent = prefix + format(obj.v, decimals) + suffix;
        },
      });
    },
    { dependencies: [value] },
  );

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {prefix + format(value, decimals) + suffix}
    </span>
  );
}
