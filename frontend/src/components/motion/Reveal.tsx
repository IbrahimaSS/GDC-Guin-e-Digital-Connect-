"use client";

import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "./gsap";

interface RevealProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "ul" | "ol" | "tbody" | "aside" | "article";
  /** Délai entre chaque enfant. */
  stagger?: number;
  /** Décalage vertical de départ (px). */
  y?: number;
  x?: number;
  scale?: number;
  delay?: number;
  /** Rejoue l'animation quand ces valeurs changent (filtres, onglets…). */
  deps?: unknown[];
}

/**
 * Fait apparaître les enfants directs en cascade quand ils entrent dans l'écran.
 */
export default function Reveal({
  children,
  className,
  as = "div",
  stagger = 0.07,
  y = 24,
  x = 0,
  scale = 1,
  delay = 0,
  deps = [],
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = Array.from(ref.current?.children ?? []);
      if (!items.length || prefersReducedMotion()) return;

      gsap.set(items, { autoAlpha: 0, y, x, scale });
      ScrollTrigger.batch(items, {
        start: "top 94%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            x: 0,
            scale: 1,
            duration: 0.7,
            stagger,
            delay,
            overwrite: true,
            clearProps: "transform",
          }),
      });
    },
    { scope: ref, dependencies: deps, revertOnUpdate: true },
  );

  // Le type réel de l’élément n’a pas d’importance pour GSAP.
  const Tag = as as "div";
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
