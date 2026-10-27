"use client";

import { Moon, Sun } from "lucide-react";
import { useRef } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { cn } from "./index";

export const CLE_THEME = "gdc-theme";

/**
 * Bascule clair / sombre. Les deux icônes sont rendues et le CSS (variante dark:) affiche la bonne :
 * aucun état React, donc aucun décalage d'hydratation avec le thème posé par le script de layout.tsx.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { contextSafe } = useGSAP({ scope: ref });

  const basculer = contextSafe(() => {
    const html = document.documentElement;
    const sombre = html.getAttribute("data-theme") !== "dark";
    html.classList.add("theme-transition");
    html.setAttribute("data-theme", sombre ? "dark" : "light");
    try {
      localStorage.setItem(CLE_THEME, sombre ? "dark" : "light");
    } catch {
      // Préférence non mémorisée (stockage indisponible) : le thème reste appliqué pour cette visite.
    }
    window.setTimeout(() => html.classList.remove("theme-transition"), 450);
    gsap.fromTo(".tt-icon", { rotate: -90, scale: 0.4 }, { rotate: 0, scale: 1, duration: 0.6, ease: "back.out(2)" });
  });

  return (
    <button
      ref={ref}
      type="button"
      onClick={basculer}
      aria-label="Changer de thème (clair / sombre)"
      title="Mode clair / sombre"
      className={cn("relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900", className)}
    >
      <Moon className="tt-icon size-5 dark:hidden" />
      <Sun className="tt-icon hidden size-5 text-amber-400 dark:block" />
    </button>
  );
}
