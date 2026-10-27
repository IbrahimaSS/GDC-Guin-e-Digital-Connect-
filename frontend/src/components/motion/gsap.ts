"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, ScrollToPlugin);
  gsap.defaults({ ease: "power3.out", duration: 0.7 });
}

/** Vrai quand l'utilisateur a demandé à réduire les animations. */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Valeurs « au repos » des propriétés animées par les entrées.
const REPOS: Record<string, number> = {
  autoAlpha: 1,
  opacity: 1,
  x: 0,
  y: 0,
  xPercent: 0,
  yPercent: 0,
  rotate: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
};

/**
 * Animation d'entrée : comme `gsap.from`, mais avec des valeurs d'arrivée explicites.
 * `gsap.from` lit l'état final dans le style calculé ; si une transition CSS est en cours
 * (effet rejoué par Activity), il peut lire `opacity: 0` et laisser l'élément invisible.
 */
export function enter(targets: gsap.TweenTarget, vars: gsap.TweenVars) {
  const from: gsap.TweenVars = {};
  const to: gsap.TweenVars = {};
  for (const [k, v] of Object.entries(vars)) {
    if (k in REPOS) {
      from[k] = v;
      to[k] = REPOS[k];
    } else if (k === "transformOrigin") {
      from[k] = to[k] = v;
    } else {
      to[k] = v;
    }
  }
  return gsap.fromTo(targets, from, to);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
