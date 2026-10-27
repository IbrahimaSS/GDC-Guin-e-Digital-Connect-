"use client";

import { MapPin, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import Counter from "@/components/motion/Counter";
import { enter, gsap, prefersReducedMotion, SplitText, useGSAP } from "@/components/motion/gsap";
import { Avatar, Button, MetierIcon } from "@/components/ui";
import { METIERS, TECHNICIENS, ZONES } from "@/lib/data";

export default function Hero() {
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const [metier, setMetier] = useState("");
  const [zone, setZone] = useState("");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const split = SplitText.create(".hero-title", { type: "words", mask: "words" });
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.add(enter(".hero-eyebrow", { y: 20, autoAlpha: 0, duration: 0.6 }))
        .add(enter(split.words, { yPercent: 110, duration: 0.9, stagger: 0.06 }), "-=0.3")
        .add(enter(".hero-sub", { y: 20, autoAlpha: 0, duration: 0.7 }), "-=0.6")
        .add(enter(".hero-search", { y: 30, autoAlpha: 0, scale: 0.97, duration: 0.8 }), "-=0.5")
        .add(enter(".hero-chip", { y: 12, autoAlpha: 0, stagger: 0.05, duration: 0.5 }), "-=0.5")
        .add(enter(".hero-stat", { y: 16, autoAlpha: 0, stagger: 0.1, duration: 0.6 }), "-=0.4")
        .add(enter(".hero-visual", { x: 60, autoAlpha: 0, rotate: 3, duration: 1.1 }), 0.3);

      gsap.to(".hero-blob", { x: "random(-40, 40)", y: "random(-30, 30)", duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 1 });

      gsap.fromTo(".hero-photo", { scale: 1.12 }, { scale: 1, duration: 2.2, ease: "power2.out", delay: 0.3 });

      // Parallaxe légère à la souris.
      const xTo = gsap.quickTo(".hero-visual-inner", "x", { duration: 0.8 });
      const yTo = gsap.quickTo(".hero-visual-inner", "y", { duration: 0.8 });
      const move = (e: MouseEvent) => {
        xTo((e.clientX / window.innerWidth - 0.5) * 18);
        yTo((e.clientY / window.innerHeight - 0.5) * 18);
      };
      window.addEventListener("mousemove", move);
      return () => {
        window.removeEventListener("mousemove", move);
        split.revert();
      };
    },
    { scope: root },
  );

  function rechercher(e: FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (metier) p.set("metier", metier);
    if (zone) p.set("zone", zone);
    router.push(`/resultats?${p}`);
  }

  return (
    <section ref={root} className="relative overflow-hidden bg-brand-950 text-white">
      {/* Décor */}
      <div className="hero-blob absolute -left-32 top-10 size-[420px] rounded-full bg-brand-600/50 blur-[110px]" aria-hidden />
      <div className="hero-blob absolute -right-20 bottom-0 size-[380px] rounded-full bg-sky-brand/30 blur-[110px]" aria-hidden />
      <div className="hero-blob absolute left-1/2 top-1/3 size-[260px] rounded-full bg-accent-500/20 blur-[100px]" aria-hidden />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 md:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-20">
        <div>
          <p className="hero-eyebrow inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-inset ring-white/15">
            <Sparkles className="size-3.5 text-accent-400" /> La technologie au service des talents guinéens
          </p>
          <h1 className="hero-title mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            Trouvez le bon technicien ou artisan <span className="text-accent-500">en Guinée</span>
          </h1>
          <p className="hero-sub mt-5 max-w-xl text-base text-brand-100/80 md:text-lg">
            GDC vous connecte avec des professionnels vérifiés pour tous vos travaux et dépannages, près de chez vous.
          </p>

          <form
            onSubmit={rechercher}
            className="hero-search mt-8 flex flex-col gap-2 rounded-2xl bg-white p-2 text-slate-800 shadow-2xl shadow-brand-950/50 sm:flex-row sm:items-center"
          >
            <label className="flex flex-1 items-center gap-2 px-3">
              <Search className="size-4 shrink-0 text-slate-400" />
              <select value={metier} onChange={(e) => setMetier(e.target.value)} className="w-full cursor-pointer bg-transparent py-3 text-sm outline-none" aria-label="Métier">
                <option value="">Quel métier ?</option>
                {METIERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="hidden h-8 w-px bg-slate-200 sm:block" />
            <label className="flex flex-1 items-center gap-2 px-3">
              <MapPin className="size-4 shrink-0 text-slate-400" />
              <select value={zone} onChange={(e) => setZone(e.target.value)} className="w-full cursor-pointer bg-transparent py-3 text-sm outline-none" aria-label="Zone">
                <option value="">Où ?</option>
                {ZONES.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </label>
            <Button type="submit" size="lg">
              <Search className="size-4" /> Rechercher
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {METIERS.slice(0, 5).map((m) => (
              <button
                key={m.id}
                onClick={() => router.push(`/resultats?metier=${m.id}`)}
                className="hero-chip inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-brand-100 ring-1 ring-inset ring-white/10 transition hover:bg-white/15 hover:text-white"
              >
                <MetierIcon metier={m.id} className="size-3.5 text-accent-400" /> {m.label}
              </button>
            ))}
          </div>

          <p className="hero-chip mt-5 text-sm text-brand-100/80">
            Vous avez un besoin précis ?{" "}
            <Link href="/publier-une-demande" className="font-semibold text-accent-400 underline-offset-4 hover:underline">
              Publiez une demande →
            </Link>
          </p>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
            {[
              { v: 420, label: "Techniciens vérifiés", suffix: "+" },
              { v: 1248, label: "Utilisateurs actifs" },
              { v: 4.3, label: "Satisfaction /5", decimals: 1 },
            ].map((s) => (
              <div key={s.label} className="hero-stat">
                <dt className="text-2xl font-extrabold md:text-3xl">
                  <Counter value={s.v} decimals={s.decimals} suffix={s.suffix} duration={2} />
                </dt>
                <dd className="mt-1 text-xs text-brand-100/60">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Visuel : photo de l’équipe de techniciens + badges flottants */}
        <div className="hero-visual relative mx-auto w-full max-w-xl lg:mr-0">
          <div className="hero-visual-inner relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] shadow-2xl shadow-brand-950/60">
              <Image
                src="/images/equipe-groupe.jpg"
                alt="Équipe de techniciens GDC"
                fill
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="hero-photo object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/50 via-transparent to-transparent" />
              <div className="absolute bottom-5 right-5 flex items-center gap-3">
                <div className="flex -space-x-3">
                  {TECHNICIENS.slice(0, 4).map((t) => (
                    <Avatar key={t.id} nom={t.nom} className="size-10 ring-2 ring-white" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vague de transition vers la section suivante */}
      <svg className="absolute -bottom-px left-0 w-full text-slate-50" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden>
        <path fill="currentColor" d="M0 60V30C240 0 480 0 720 20s480 40 720 10v30z" />
      </svg>
    </section>
  );
}
