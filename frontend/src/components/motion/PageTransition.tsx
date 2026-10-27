"use client";

import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "./gsap";

/** Fondu + glissement à chaque changement de page. */
export default function PageTransition({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(ref.current, { autoAlpha: 1 });
        return;
      }
      gsap.fromTo(
        ref.current,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          clearProps: "transform",
          onComplete: () => ScrollTrigger.refresh(),
        },
      );
    },
    { dependencies: [pathname] },
  );

  return (
    <div ref={ref} data-page-transition className={className}>
      {children}
    </div>
  );
}
