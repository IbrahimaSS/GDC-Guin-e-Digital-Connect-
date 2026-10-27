"use client";

import { useEffect } from "react";
import { useLogos } from "@/components/ui/Logo";

/**
 * Quand l'administrateur importe un logo, l'icône de l'onglet est recomposée dans le navigateur :
 * logo pour fond sombre centré sur un carré bleu nuit. Sinon, l'icône d'origine (app/icon.png) reste.
 */
export default function FaviconLogo() {
  const { sombre, personnalise } = useLogos();

  useEffect(() => {
    if (!personnalise) return;
    const img = new Image();
    img.onload = () => {
      const taille = 64;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = taille;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#071a3a";
      ctx.beginPath();
      ctx.roundRect(0, 0, taille, taille, 14);
      ctx.fill();
      const echelle = Math.min((taille - 6) / img.width, (taille - 6) / img.height);
      const w = img.width * echelle;
      const h = img.height * echelle;
      ctx.drawImage(img, (taille - w) / 2, (taille - h) / 2, w, h);
      let lien = document.querySelector<HTMLLinkElement>("link#icone-personnalisee");
      if (!lien) {
        lien = document.createElement("link");
        lien.id = "icone-personnalisee";
        lien.rel = "icon";
        document.head.appendChild(lien);
      }
      lien.href = canvas.toDataURL("image/png");
    };
    img.src = sombre;
    return () => document.querySelector("link#icone-personnalisee")?.remove();
  }, [sombre, personnalise]);

  return null;
}
