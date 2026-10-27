"use client";

import { Camera, CameraOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// API native de lecture de codes (Chrome / Edge / Android). Absente de certains navigateurs : on propose alors la saisie.
interface DetecteurCodes {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => DetecteurCodes;
  }
}

type Etat = "inactif" | "demarrage" | "actif" | "indisponible" | "refuse";

/** Lecture d'un QR code avec la caméra arrière ; appelle `onCode` à la première lecture. */
export default function ScannerQr({ onCode }: { onCode: (valeur: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const flux = useRef<MediaStream | null>(null);
  const [etat, setEtat] = useState<Etat>("inactif");
  const rappel = useRef(onCode);
  useEffect(() => {
    rappel.current = onCode;
  });

  const arreter = () => {
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
  };
  useEffect(() => arreter, []);

  async function demarrer() {
    if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) return setEtat("indisponible");
    setEtat("demarrage");
    try {
      flux.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const v = video.current!;
      v.srcObject = flux.current;
      await v.play();
      setEtat("actif");
      const detecteur = new window.BarcodeDetector({ formats: ["qr_code"] });
      const boucle = async () => {
        if (!flux.current) return;
        try {
          const [code] = await detecteur.detect(v);
          if (code) {
            arreter();
            setEtat("inactif");
            return rappel.current(code.rawValue);
          }
        } catch {
          // Image pas encore prête : on réessaie à la trame suivante.
        }
        requestAnimationFrame(boucle);
      };
      boucle();
    } catch {
      arreter();
      setEtat("refuse");
    }
  }

  if (etat === "indisponible" || etat === "refuse") {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        <CameraOff className="mt-0.5 size-5 shrink-0 text-slate-400" />
        {etat === "refuse"
          ? "Accès à la caméra refusé. Autorisez la caméra dans votre navigateur, ou saisissez le code ci-dessous."
          : "Ce navigateur ne sait pas lire les QR codes. Saisissez le code à 4 chiffres ci-dessous."}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-950">
      <video ref={video} playsInline muted className={etat === "actif" ? "aspect-square w-full object-cover" : "hidden"} />
      {etat === "actif" ? (
        <div className="pointer-events-none absolute inset-8 rounded-2xl border-4 border-accent-500/80 shadow-[0_0_0_9999px_rgba(7,26,58,0.45)]">
          <span className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse bg-accent-400" />
        </div>
      ) : (
        <button type="button" onClick={demarrer} className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 text-white">
          {etat === "demarrage" ? <Loader2 className="size-10 animate-spin" /> : <Camera className="size-10 text-accent-400" />}
          <span className="font-semibold">{etat === "demarrage" ? "Ouverture de la caméra…" : "Scanner le QR code du client"}</span>
        </button>
      )}
    </div>
  );
}
