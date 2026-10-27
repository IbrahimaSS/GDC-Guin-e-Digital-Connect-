"use client";

import { usePersistant } from "@/lib/stockage";

// Logos personnalisés importés par l'administrateur (Paramètres › Identité visuelle), sinon logos d'origine.
// Conservés dans le navigateur en attendant l'API ; avec un backend, ce seront des fichiers stockés côté serveur.
export const CLE_LOGO_CLAIR = "logo-clair";
export const CLE_LOGO_SOMBRE = "logo-sombre";
export const LOGO_CLAIR_DEFAUT = "/logo-gdc.png";
export const LOGO_SOMBRE_DEFAUT = "/logo-gdc-sombre.png";

const AUCUN: string | null = null;

/** Adresses des logos à afficher (personnalisés ou d'origine). */
export function useLogos() {
  const [clair] = usePersistant(CLE_LOGO_CLAIR, AUCUN);
  const [sombre] = usePersistant(CLE_LOGO_SOMBRE, AUCUN);
  return { clair: clair ?? LOGO_CLAIR_DEFAUT, sombre: sombre ?? LOGO_SOMBRE_DEFAUT, personnalise: Boolean(clair || sombre) };
}

const cn = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/**
 * Logo officiel GDC. `light` : version pour fond sombre (texte blanc). Sans `light`, la version claire
 * s'affiche et bascule d'elle-même sur la version sombre en mode sombre.
 * La hauteur se règle avec `className` (h-14 par défaut).
 */
export default function Logo({ className = "h-14", light = false }: { className?: string; light?: boolean }) {
  const { clair, sombre } = useLogos();
  const image = (src: string, visibilite = "") => (
    // eslint-disable-next-line @next/next/no-img-element -- le logo peut être une image importée (data URL)
    <img src={src} alt="GDC – Guinée Digital Connect" className={cn("h-full w-auto max-w-full object-contain", visibilite)} />
  );
  return (
    <span className={cn("inline-flex max-w-full shrink-0 overflow-hidden", className)}>
      {light ? (
        image(sombre)
      ) : (
        <>
          {image(clair, "dark:hidden")}
          {image(sombre, "hidden dark:block")}
        </>
      )}
    </span>
  );
}
