"use client";

import { BadgeCheck, Briefcase, Heart, MapPin, Phone, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { cn, LinkButton, VerificationBadge } from "@/components/ui";
import { getMetier, type Technicien } from "@/lib/data";

/** Carte de présentation d'un technicien : photo, métier, note et actions. */
export default function TechnicienProCard({ tech }: { tech: Technicien }) {
  const [favori, setFavori] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const { contextSafe } = useGSAP({ scope: ref });

  const toggleFavori = contextSafe(() => {
    setFavori((f) => !f);
    gsap.fromTo(".fav-icon", { scale: 0.5 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)" });
  });

  return (
    <article
      ref={ref}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-[box-shadow,border-color,translate] duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={tech.photo}
          alt={tech.nom}
          fill
          sizes="(min-width: 1280px) 300px, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-[50%_25%] transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 via-transparent to-transparent" />
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur",
            tech.disponible ? "bg-white/90 text-emerald-700" : "bg-white/80 text-slate-500",
          )}
        >
          <span className={cn("size-1.5 rounded-full", tech.disponible ? "bg-emerald-500" : "bg-slate-400")} />
          {tech.disponible ? "Disponible" : "Indisponible"}
        </span>
        <button
          onClick={toggleFavori}
          aria-label="Ajouter aux favoris"
          aria-pressed={favori}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-500 backdrop-blur transition hover:text-accent-500"
        >
          <Heart className={cn("fav-icon size-4", favori && "fill-accent-500 text-accent-500")} />
        </button>
        <div className="absolute bottom-3 left-3">
          <VerificationBadge niveau={tech.niveau} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/techniciens/${tech.id}`} className="flex items-center gap-1.5 font-bold text-slate-900 hover:text-brand-600">
              <span className="truncate">{tech.nom}</span>
              <BadgeCheck className="size-4 shrink-0 text-brand-600" />
            </Link>
            <p className="text-sm text-slate-500">{getMetier(tech.metier).label}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-sm font-bold text-amber-700">
            <Star className="size-3.5 fill-amber-400 text-amber-400" /> {tech.note.toFixed(1)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tech.specialites.slice(0, 3).map((s) => (
            <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {tech.zone}
          </span>
          <span className="inline-flex items-center gap-1">
            <Briefcase className="size-3.5" /> {tech.experience} ans
          </span>
          <span>{tech.nbAvis} avis</span>
        </div>

        <div className="mt-4 flex gap-2 pt-1">
          <LinkButton href={`/techniciens/${tech.id}`} variant="secondary" className="flex-1">
            Voir le profil
          </LinkButton>
          <a
            href={`tel:${tech.telephone.replace(/\s/g, "")}`}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 text-brand-600 transition hover:border-brand-600 hover:bg-brand-50"
            aria-label={`Appeler ${tech.nom}`}
          >
            <Phone className="size-4" />
          </a>
        </div>
      </div>
    </article>
  );
}
