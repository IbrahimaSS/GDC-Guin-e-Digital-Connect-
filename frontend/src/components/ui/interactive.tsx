"use client";

import { Star, X } from "lucide-react";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { enter, gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { cn } from "./index";

/* ---------------------------------------------------------------- Onglets */

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

/** Onglets avec un indicateur qui glisse sous l'onglet actif. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  variant = "underline",
  className,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  variant?: "underline" | "pill";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useGSAP(
    () => {
      const btn = ref.current?.querySelector<HTMLElement>(`[data-tab="${value}"]`);
      if (!btn || !indicator.current) return;
      const props = { x: btn.offsetLeft, width: btn.offsetWidth };
      if (first.current || prefersReducedMotion()) {
        gsap.set(indicator.current, props);
        first.current = false;
      } else {
        gsap.to(indicator.current, {
          ...props,
          duration: 0.45,
          ease: "power3.out",
        });
      }
    },
    { dependencies: [value, tabs.length], scope: ref },
  );

  const pill = variant === "pill";

  return (
    <div
      ref={ref}
      role="tablist"
      className={cn("scrollbar-none relative flex overflow-x-auto", pill ? "gap-1 rounded-xl bg-slate-100 p-1" : "gap-6 border-b border-slate-200", className)}
    >
      <span
        ref={indicator}
        aria-hidden
        className={cn("absolute left-0", pill ? "inset-y-1 rounded-lg bg-white shadow-sm" : "bottom-0 h-0.5 rounded-full bg-accent-500")}
      />
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-tab={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative z-10 inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors",
              pill ? "rounded-lg px-3.5 py-1.5" : "pb-3",
              active ? (pill ? "text-brand-700" : "text-accent-500") : "text-slate-500 hover:text-slate-800",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-[11px] font-bold", active ? "bg-accent-500 text-white" : "bg-slate-200 text-slate-600")}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- Interrupteur */

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
}) {
  const knob = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      gsap.to(knob.current, {
        x: checked ? 20 : 0,
        duration: 0.35,
        ease: "back.out(2)",
      });
    },
    { dependencies: [checked] },
  );

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-semibold text-slate-800">{label}</span>}
          {description && <span className="block text-xs text-slate-500">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300", checked ? "bg-brand-600" : "bg-slate-300")}
      >
        <span ref={knob} className="absolute left-0.5 top-0.5 size-5 rounded-full bg-[#fff] shadow" />
      </button>
    </label>
  );
}

/**
 * Fenêtres et panneaux sont rendus à la racine du document : un parent animé (transform, visibilité)
 * ne doit ni les masquer ni décaler leur position fixe.
 */
function Portail({ children }: { children: ReactNode }) {
  const client = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return client ? createPortal(children, document.body) : null;
}

/* ----------------------------------------------------------- Panneau latéral */

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!root.current) return;
      const tl = gsap.timeline();
      if (open) {
        tl.set(root.current, { opacity: 1, visibility: "visible" })
          .fromTo(".dr-overlay", { opacity: 0 }, { opacity: 1, duration: 0.3 })
          .fromTo(".dr-panel", { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, "<")
          .add(
            enter(".dr-body > *", {
              y: 16,
              autoAlpha: 0,
              stagger: 0.05,
              duration: 0.4,
            }),
            "-=0.25",
          );
      } else {
        tl.to(".dr-panel", { xPercent: 100, duration: 0.35, ease: "power3.in" })
          .to(".dr-overlay", { opacity: 0, duration: 0.25 }, "<")
          .set(root.current, { opacity: 0, visibility: "hidden" });
      }
    },
    { dependencies: [open], scope: root },
  );

  return (
    <Portail>
      <div ref={root} className="invisible fixed inset-0 z-50" aria-hidden={!open}>
        <div className="dr-overlay absolute inset-0 bg-brand-950/40 backdrop-blur-[2px]" onClick={onClose} />
        <aside className="dr-panel absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Fermer">
              <X className="size-5" />
            </button>
          </div>
          <div className="dr-body flex-1 space-y-5 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex gap-2 border-t border-slate-200 px-6 py-4">{footer}</div>}
        </aside>
      </div>
    </Portail>
  );
}

/* ----------------------------------------------------------------- Modale */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!root.current) return;
      const tl = gsap.timeline();
      if (open) {
        tl.set(root.current, { opacity: 1, visibility: "visible" }).fromTo(".md-overlay", { opacity: 0 }, { opacity: 1, duration: 0.25 }).fromTo(
          ".md-panel",
          { y: 30, scale: 0.94, opacity: 0 },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.45,
            ease: "back.out(1.5)",
          },
          "<",
        );
      } else {
        tl.to(".md-panel", {
          y: 20,
          scale: 0.96,
          opacity: 0,
          duration: 0.2,
          ease: "power2.in",
        })
          .to(".md-overlay", { opacity: 0, duration: 0.2 }, "<")
          .set(root.current, { opacity: 0, visibility: "hidden" });
      }
    },
    { dependencies: [open], scope: root },
  );

  return (
    <Portail>
      <div ref={root} className="invisible fixed inset-0 z-50 flex items-center justify-center p-4" aria-hidden={!open}>
        <div className="md-overlay absolute inset-0 bg-brand-950/40 backdrop-blur-[2px]" onClick={onClose} />
        <div role="dialog" className="md-panel relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <div className="mt-3 text-sm text-slate-600">{children}</div>
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </div>
      </div>
    </Portail>
  );
}

/* ---------------------------------------------------------- Saisie d'une note */

const LIBELLES_NOTE = ["", "Décevant", "Moyen", "Bien", "Très bien", "Excellent !"];

export function StarInput({ value, onChange, size = "size-10" }: { value: number; onChange: (v: number) => void; size?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  const { contextSafe } = useGSAP({ scope: ref });
  const pop = contextSafe((i: number) => {
    gsap.fromTo(`[data-star="${i}"]`, { scale: 0.6, rotate: -25 }, { scale: 1, rotate: 0, duration: 0.6, ease: "elastic.out(1.1, 0.4)" });
    gsap.fromTo(
      Array.from({ length: i - 1 }, (_, k) => `[data-star="${k + 1}"]`).join(",") || "[data-none]",
      { scale: 0.85 },
      { scale: 1, duration: 0.4, stagger: 0.04, ease: "back.out(3)" },
    );
  });

  return (
    <div ref={ref}>
      <div className="flex gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            data-star={i}
            aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(i)}
            onClick={() => {
              onChange(i);
              pop(i);
            }}
            className="transition-transform hover:scale-110"
          >
            <Star className={cn(size, "transition-colors duration-200", i <= shown ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300")} />
          </button>
        ))}
      </div>
      <p className="mt-2 h-5 text-sm font-semibold text-amber-600">{LIBELLES_NOTE[shown]}</p>
    </div>
  );
}
