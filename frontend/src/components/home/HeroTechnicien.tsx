"use client";

import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { enter, gsap, prefersReducedMotion, SplitText, useGSAP } from "@/components/motion/gsap";
import { cn, LinkButton } from "@/components/ui";

export default function HeroTechnicien({ photo }: { photo: string }) {
  const root = useRef<HTMLElement>(null);
  const detouree = photo.endsWith(".png");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const split = SplitText.create(".ht-title", { type: "words", mask: "words" });
      gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .add(enter(".ht-eyebrow", { y: 16, autoAlpha: 0, duration: 0.5 }))
        .add(enter(split.words, { yPercent: 110, duration: 0.9, stagger: 0.05 }), "-=0.2")
        .add(enter(".ht-sub", { y: 20, autoAlpha: 0, duration: 0.7 }), "-=0.6")
        .add(enter(".ht-cta > *", { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.5 }), "-=0.5")
        .add(enter(".ht-photo", { x: 50, autoAlpha: 0, duration: 1.1 }), 0.2)
        .add(enter(".ht-badge", { y: 20, autoAlpha: 0, duration: 0.6, ease: "back.out(1.6)" }), "-=0.4");
      gsap.fromTo(".ht-img", { scale: 1.12 }, { scale: 1, duration: 2.2, ease: "power2.out" });
      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-brand-950 text-white">
      <div className="absolute -left-32 top-0 size-[420px] rounded-full bg-brand-600/40 blur-[110px]" aria-hidden />
      <div className="absolute -right-20 bottom-0 size-[360px] rounded-full bg-accent-500/20 blur-[110px]" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 md:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div className="pb-4 lg:pb-20">
          <p className="ht-eyebrow text-sm font-semibold uppercase tracking-wider text-accent-400">Devenir technicien / artisan</p>
          <h1 className="ht-title mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            Valorisez votre savoir-faire et développez votre activité avec GDC.
          </h1>
          <p className="ht-sub mt-5 max-w-xl text-lg text-brand-100/80">
            Présentez vos compétences, montrez vos réalisations et soyez visible auprès de clients à la recherche de professionnels dans votre domaine.
          </p>
          <div className="ht-cta mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href="/inscription/technicien" size="lg">
              Créer mon profil professionnel <ArrowRight className="size-4" />
            </LinkButton>
            <LinkButton href="#etapes" size="lg" variant="dark">
              Comment ça marche
            </LinkButton>
          </div>
        </div>

        <div className="ht-photo relative">
          {detouree ? (
            // Photo détourée : posée devant un halo, sans cadre.
            <div className="relative mx-auto aspect-[4/5] max-h-[560px] w-full max-w-[460px]">
              <div className="absolute inset-x-[6%] bottom-0 top-[14%] rounded-t-full bg-gradient-to-b from-brand-500/50 via-brand-700/40 to-transparent" aria-hidden />
              <div className="absolute inset-x-[18%] top-[10%] aspect-square rounded-full bg-accent-500/25 blur-3xl" aria-hidden />
              <Image src={photo} alt="Aïssatou Camara, électricienne" fill priority sizes="(min-width: 1024px) 460px, 90vw" className="ht-img object-contain object-bottom drop-shadow-2xl" />
            </div>
          ) : (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] shadow-2xl shadow-brand-950/60">
              <Image src={photo} alt="Aïssatou Camara, électricienne" fill priority sizes="(min-width: 1024px) 560px, 100vw" className="ht-img object-cover object-[50%_15%]" />
            </div>
          )}
          <div
            className={cn(
              "ht-badge absolute flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-800 shadow-xl",
              detouree ? "bottom-16 left-0 sm:left-4" : "-bottom-6 left-6",
            )}
          >
            <span className="rounded-xl bg-brand-600 p-2 text-white">
              <BadgeCheck className="size-5" />
            </span>
            <span className="text-sm">
              <span className="block font-bold">Aïssatou Camara · Niveau 3</span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Star className="size-3.5 fill-amber-400 text-amber-400" /> 4,9 · 68 missions réalisées
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
