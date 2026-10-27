"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { enter, gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { GuineeFlag } from "@/components/ui";

const VISUELS: Record<string, { src: string; titre: string; texte: string; position?: string }> = {
  "/connexion": {
    src: "/images/equipe-usine.jpg",
    titre: "Des professionnels à portée de main",
    texte: "Retrouvez vos demandes, vos missions et vos échanges en un seul endroit.",
  },
  "/inscription": {
    src: "/images/chantier.jpg",
    titre: "Rejoignez la communauté GDC",
    texte: "Clients et techniciens, ensemble pour un meilleur service en Guinée.",
  },
  "/inscription/client": {
    src: "/images/plombier-portrait.jpg",
    titre: "Le bon technicien, en quelques minutes",
    texte: "Des profils vérifiés et des avis issus de vraies missions.",
  },
  "/inscription/technicien": {
    src: "/images/technicienne-entrepot.jpg",
    position: "object-[50%_20%]",
    titre: "Faites reconnaître votre savoir-faire",
    texte: "Un profil vérifié, plus de visibilité et de nouvelles missions près de chez vous.",
  },
};

/** Photo plein cadre des écrans d'authentification, différente selon la page. */
export default function AuthVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const visuel = VISUELS[pathname] ?? VISUELS["/connexion"];

  useGSAP(
    () => {
      gsap.set(ref.current, { autoAlpha: 1 });
      if (prefersReducedMotion()) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .add(enter(".av-photo", { scale: 1.08, autoAlpha: 0, duration: 1.2 }))
        .add(enter(".av-texte > *", { y: 24, autoAlpha: 0, stagger: 0.1, duration: 0.7 }), "-=0.8");
    },
    { scope: ref, dependencies: [visuel.src], revertOnUpdate: true },
  );

  return (
    <div ref={ref} data-page-transition className="relative hidden overflow-hidden bg-brand-950 lg:block">
      <Image
        key={visuel.src}
        src={visuel.src}
        alt=""
        fill
        priority
        sizes="50vw"
        className={`av-photo object-cover ${visuel.position ?? "object-[50%_30%]"}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-brand-950/10" />

      <div className="av-texte absolute inset-x-12 bottom-12 text-white">
        <h2 className="max-w-lg text-4xl font-extrabold leading-tight tracking-tight [text-wrap:balance]">{visuel.titre}</h2>
        <p className="mt-3 max-w-md text-brand-100/90">{visuel.texte}</p>
        <p className="mt-8 flex items-center gap-3 text-sm italic text-brand-100/70">
          <GuineeFlag className="h-3.5" /> La technologie au service des talents guinéens
        </p>
      </div>
    </div>
  );
}
