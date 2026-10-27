"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { cn } from "./index";

/** Options communes : bleu GDC sur blanc, correction d'erreur élevée (lisible même imprimé petit ou abîmé). */
export const OPTIONS_QR: QRCode.QRCodeToDataURLOptions = {
  errorCorrectionLevel: "H",
  margin: 1,
  width: 640,
  color: { dark: "#0b2a5b", light: "#ffffff" },
};

/** Génère l'image (data URL PNG) d'un QR code. */
export function useQrCode(valeur: string) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let annule = false;
    QRCode.toDataURL(valeur, OPTIONS_QR).then((url) => {
      if (!annule) setSrc(url);
    });
    return () => {
      annule = true;
    };
  }, [valeur]);
  return src;
}

/** QR code avec le logo GDC au centre. */
export default function QrCode({ valeur, className = "size-48", logo = true }: { valeur: string; className?: string; logo?: boolean }) {
  const src = useQrCode(valeur);
  return (
    <div className={cn("relative rounded-2xl bg-[#fff] p-2", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- image générée localement (data URL)
        <img src={src} alt={`QR code : ${valeur}`} className="size-full" />
      ) : (
        <div className="size-full animate-pulse rounded-xl bg-slate-100" />
      )}
      {logo && src && (
        <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-lg bg-[#fff] px-1.5 py-0.5 text-[13px] font-black tracking-tight shadow">
          <span className="text-[#0066cc]">GD</span>
          <span className="text-[#ff8a00]">C</span>
        </span>
      )}
    </div>
  );
}
