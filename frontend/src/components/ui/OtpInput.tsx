"use client";

import { useRef } from "react";
import { enter, gsap, useGSAP } from "@/components/motion/gsap";
import { cn } from "./index";

/** Saisie d'un code à N chiffres, une case par chiffre. */
export default function OtpInput({ value, onChange, length = 6, error }: { value: string; onChange: (v: string) => void; length?: number; error?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      enter(".otp-box", { y: 16, autoAlpha: 0, stagger: 0.05, duration: 0.45, ease: "back.out(2)" });
      // autoFocus échoue tant que la case est masquée par l’animation d’entrée : on place le curseur après.
      gsap.delayedCall(0.7, () => ref.current?.querySelector<HTMLInputElement>("input")?.focus());
    },
    { scope: ref },
  );

  // Petite secousse quand le code est refusé.
  useGSAP(
    () => {
      if (error) gsap.fromTo(ref.current, { x: -10 }, { x: 0, duration: 0.5, ease: "elastic.out(1.2, 0.3)" });
    },
    { dependencies: [error] },
  );

  const focus = (i: number) => ref.current?.querySelectorAll<HTMLInputElement>("input")[i]?.focus();

  function set(i: number, digit: string) {
    const chars = value.padEnd(length, " ").split("");
    chars[i] = digit || " ";
    onChange(chars.join("").trimEnd().replace(/ /g, ""));
  }

  return (
    <div ref={ref} className="flex justify-between gap-2" onPaste={(e) => {
      const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (digits) {
        e.preventDefault();
        onChange(digits);
        focus(Math.min(digits.length, length - 1));
      }
    }}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={value[i] ?? ""}
          aria-label={`Chiffre ${i + 1}`}
          autoFocus={i === 0}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            set(i, d);
            if (d) focus(i + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i]) focus(i - 1);
            if (e.key === "ArrowLeft") focus(i - 1);
            if (e.key === "ArrowRight") focus(i + 1);
          }}
          className={cn(
            "otp-box size-12 rounded-xl border-2 text-center text-xl font-bold text-slate-900 outline-none transition sm:size-14",
            error ? "border-red-400 bg-red-50" : value[i] ? "border-brand-500 bg-brand-50" : "border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100",
          )}
        />
      ))}
    </div>
  );
}
