"use client";

import { useEffect, useRef } from "react";

// Connexion avec Google (Google Identity Services). Le bouton n'apparaît que si l'identifiant OAuth
// est configuré dans .env.local : NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export interface ProfilGoogle {
  nom: string;
  email: string;
  photo?: string;
  /** Jeton à transmettre au serveur, qui doit le vérifier auprès de Google avant d'ouvrir la session. */
  jeton: string;
}

interface Gis {
  accounts: {
    id: {
      initialize(o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: "popup"; locale?: string }): void;
      renderButton(el: HTMLElement, o: Record<string, string | number>): void;
    };
  };
}
declare global {
  interface Window {
    google?: Gis;
  }
}

/** Lecture du contenu du jeton (affichage uniquement : la vérification de la signature se fait côté serveur). */
function lireJeton(jeton: string): ProfilGoogle {
  const base64 = jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const octets = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const donnees = JSON.parse(new TextDecoder().decode(octets)) as { name: string; email: string; picture?: string };
  return { nom: donnees.name, email: donnees.email, photo: donnees.picture, jeton };
}

let chargement: Promise<void> | null = null;
function chargerScript() {
  chargement ??= new Promise((resoudre, rejeter) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resoudre();
    s.onerror = () => rejeter(new Error("Script Google indisponible"));
    document.head.appendChild(s);
  });
  return chargement;
}

export const googleConfigure = Boolean(CLIENT_ID);

export default function GoogleConnexion({ onConnexion }: { onConnexion: (p: ProfilGoogle) => void }) {
  const zone = useRef<HTMLDivElement>(null);
  const rappel = useRef(onConnexion);
  useEffect(() => {
    rappel.current = onConnexion;
  });

  useEffect(() => {
    if (!CLIENT_ID) return;
    chargerScript()
      .then(() => {
        if (!window.google || !zone.current) return;
        window.google.accounts.id.initialize({ client_id: CLIENT_ID, ux_mode: "popup", locale: "fr", callback: (r) => rappel.current(lireJeton(r.credential)) });
        window.google.accounts.id.renderButton(zone.current, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: zone.current.offsetWidth || 360, locale: "fr" });
      })
      .catch(() => {});
  }, []);

  if (!CLIENT_ID) return null;
  return <div ref={zone} className="flex min-h-11 w-full justify-center" />;
}
