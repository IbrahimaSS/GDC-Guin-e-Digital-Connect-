"use client";

import { ClipboardCheck, MessageCircle, Search, Star, UserSearch } from "lucide-react";
import { useRef } from "react";
import { enter, gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";

const ETAPES = [
  { icon: Search, titre: "Recherchez", texte: "un professionnel par métier et par zone." },
  { icon: UserSearch, titre: "Consultez", texte: "les profils, niveaux de vérification et avis." },
  { icon: MessageCircle, titre: "Contactez", texte: "le technicien ou créez une demande." },
  { icon: ClipboardCheck, titre: "Suivez", texte: "votre mission étape par étape." },
  { icon: Star, titre: "Évaluez", texte: "le professionnel pour aider la communauté." },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // La ligne se remplit au rythme du défilement ; les étapes apparaissent une seule fois.
      enter(".hiw-line", {
        scaleX: 0,
        transformOrigin: "left",
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top 80%", end: "bottom 60%", scrub: 0.8 },
      });
      gsap
        .timeline({ scrollTrigger: { trigger: ref.current, start: "top 82%", once: true } })
        .add(enter(".hiw-step", { y: 30, autoAlpha: 0, stagger: 0.15, duration: 0.6 }))
        .add(enter(".hiw-icon", { scale: 0.5, stagger: 0.15, duration: 0.5, ease: "back.out(3)" }), 0.1);
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative">
      <div className="absolute left-[10%] right-[10%] top-8 hidden h-0.5 bg-slate-200 md:block" aria-hidden>
        <div className="hiw-line h-full bg-gradient-to-r from-brand-600 via-sky-brand to-accent-500" />
      </div>
      <ol className="relative grid gap-6 md:grid-cols-5">
        {ETAPES.map(({ icon: Icon, titre, texte }, i) => (
          <li key={titre} className="hiw-step flex gap-4 md:flex-col md:items-center md:text-center">
            <span className="hiw-icon relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-lg shadow-brand-900/10 ring-1 ring-slate-200">
              <Icon className="size-7" />
              <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white ring-4 ring-slate-50">
                {i + 1}
              </span>
            </span>
            <div>
              <p className="font-bold text-slate-900">{titre}</p>
              <p className="mt-1 text-sm text-slate-500">{texte}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
