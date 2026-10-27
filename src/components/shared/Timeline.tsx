"use client";

import { Check } from "lucide-react";
import { useRef } from "react";
import { enter, gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { cn } from "@/components/ui";
import type { EtapeChronologie } from "@/lib/data";

/** Chronologie verticale : la ligne de progression se dessine, puis les étapes apparaissent. */
export default function Timeline({ etapes }: { etapes: EtapeChronologie[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const faites = etapes.filter((e) => e.fait).length;
  const progression = etapes.length > 1 ? Math.max(0, (faites - 1) / (etapes.length - 1)) : 0;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top 90%", once: true } });
      tl.add(enter(".tl-item", { x: -12, autoAlpha: 0, stagger: 0.12, duration: 0.5 }))
        .add(enter(".tl-progress", { scaleY: 0, transformOrigin: "top", duration: 0.9, ease: "power2.inOut" }), 0.1)
        .add(enter(".tl-dot-done", { scale: 0, stagger: 0.12, duration: 0.45, ease: "back.out(2.5)" }), 0.2)
        .to(".tl-current", { boxShadow: "0 0 0 8px rgba(255,138,0,0.18)", repeat: -1, yoyo: true, duration: 0.9, ease: "sine.inOut" });
    },
    { scope: ref },
  );

  return (
    <ol ref={ref} className="relative space-y-6">
      <span className="absolute bottom-3 left-[13px] top-3 w-0.5 bg-slate-200" aria-hidden />
      <span
        className="tl-progress absolute left-[13px] top-3 w-0.5 bg-brand-600"
        style={{ height: `calc((100% - 1.5rem) * ${progression})` }}
        aria-hidden
      />
      {etapes.map((e, i) => {
        const current = e.fait && i === faites - 1 && faites < etapes.length;
        return (
          <li key={e.label} className="tl-item relative flex items-start gap-4">
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                e.fait ? "tl-dot-done border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white",
                current && "tl-current border-accent-500 bg-accent-500",
              )}
            >
              {e.fait && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <div className="pt-0.5">
              <p className={cn("text-sm font-semibold", e.fait ? "text-slate-900" : "text-slate-400")}>{e.label}</p>
              <p className="text-xs text-slate-500">{e.date ?? (e.fait ? "" : "En attente")}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
