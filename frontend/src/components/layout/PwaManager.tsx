"use client";

import { Download, WifiOff, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { enter, gsap, useGSAP } from "@/components/motion/gsap";
import { toast } from "@/components/motion/Toaster";

interface InvitationInstallation extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CLE_REFUS = "gdc-installation-refusee";

const abonnerConnexion = (rappel: () => void) => {
  window.addEventListener("online", rappel);
  window.addEventListener("offline", rappel);
  return () => {
    window.removeEventListener("online", rappel);
    window.removeEventListener("offline", rappel);
  };
};

/**
 * Application installable : enregistrement du service worker, invitation à installer GDC
 * sur l'écran d'accueil et bandeau de perte de connexion.
 */
export default function PwaManager() {
  const [invitation, setInvitation] = useState<InvitationInstallation | null>(null);
  const enLigne = useSyncExternalStore(abonnerConnexion, () => navigator.onLine, () => true);
  const carte = useRef<HTMLDivElement>(null);
  const bandeau = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // En développement, le cache gênerait le rechargement à chaud : le service worker n'est actif qu'en production.
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
    const surInvitation = (e: Event) => {
      e.preventDefault();
      try {
        if (localStorage.getItem(CLE_REFUS)) return;
      } catch {
        // Stockage indisponible : on propose quand même l'installation.
      }
      setInvitation(e as InvitationInstallation);
    };
    const surInstallation = () => {
      setInvitation(null);
      toast("GDC est installée sur votre appareil");
    };
    window.addEventListener("beforeinstallprompt", surInvitation);
    window.addEventListener("appinstalled", surInstallation);
    return () => {
      window.removeEventListener("beforeinstallprompt", surInvitation);
      window.removeEventListener("appinstalled", surInstallation);
    };
  }, []);

  useGSAP(() => {
    if (invitation) enter(carte.current, { y: 40, autoAlpha: 0, duration: 0.6, delay: 2, ease: "back.out(1.5)" });
  }, { dependencies: [invitation] });

  useGSAP(() => {
    if (!enLigne) enter(bandeau.current, { y: -40, autoAlpha: 0, duration: 0.4 });
  }, { dependencies: [enLigne] });

  async function installer() {
    if (!invitation) return;
    await invitation.prompt();
    const { outcome } = await invitation.userChoice;
    if (outcome === "dismissed") refuser();
    setInvitation(null);
  }

  function refuser() {
    try {
      localStorage.setItem(CLE_REFUS, "1");
    } catch {
      // Non mémorisé : l'invitation pourra réapparaître à la prochaine visite.
    }
    gsap.to(carte.current, { y: 40, autoAlpha: 0, duration: 0.3, onComplete: () => setInvitation(null) });
  }

  return (
    <>
      {!enLigne && (
        <div ref={bandeau} role="status" className="fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-semibold text-[#1f1300] shadow-lg">
          <WifiOff className="size-4" /> Hors connexion : les pages déjà consultées restent disponibles.
        </div>
      )}
      {invitation && (
        <div ref={carte} className="fixed bottom-4 left-4 right-4 z-[80] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-brand-950 p-4 text-white shadow-2xl ring-1 ring-white/10 sm:left-1/2 sm:right-auto sm:mx-0 sm:w-[28rem] sm:-translate-x-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element -- icône de l'application, déjà servie par le manifeste */}
          <img src="/icon-192.png" alt="" className="size-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Installer l&apos;application GDC</p>
            <p className="text-xs text-brand-100/80">Accès direct depuis l&apos;écran d&apos;accueil, même avec une connexion faible.</p>
          </div>
          <button type="button" onClick={installer} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-500 px-3 py-2 text-sm font-semibold hover:bg-accent-600">
            <Download className="size-4" /> Installer
          </button>
          <button type="button" onClick={refuser} className="rounded-lg p-1 text-brand-100/70 hover:text-white" aria-label="Plus tard">
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
