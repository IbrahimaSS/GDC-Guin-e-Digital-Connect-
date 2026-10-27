"use client";

import { Heart, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { Avatar, cn, DispoBadge, LinkButton, Rating, VerificationBadge } from "@/components/ui";
import { getMetier, type Technicien } from "@/lib/data";

export default function TechnicienCard({ tech }: { tech: Technicien }) {
  const [favori, setFavori] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const { contextSafe } = useGSAP({ scope: ref });

  const toggleFavori = contextSafe(() => {
    setFavori((f) => !f);
    gsap.fromTo(".fav-icon", { scale: 0.5 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)" });
  });

  const tel = tech.telephone.replace(/\s/g, "");

  return (
    <article
      ref={ref}
      className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5 sm:flex-row sm:items-center sm:p-5"
    >
      <div className="flex items-center gap-4 sm:contents">
        <div className="relative">
          <Avatar nom={tech.nom} className="size-16 text-lg sm:size-20 sm:text-xl" />
          {tech.disponible && <span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-emerald-500 ring-[3px] ring-white" />}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <Link href={`/techniciens/${tech.id}`} className="font-bold text-slate-900 after:absolute after:inset-0 hover:text-brand-600">
            {tech.nom}
          </Link>
          <p className="truncate text-sm text-slate-600">
            {getMetier(tech.metier).label} · {tech.specialites.join(" · ")}
          </p>
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="size-3.5" /> Conakry, {tech.zone}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:hidden">
        <Rating note={tech.note} nbAvis={tech.nbAvis} />
        <VerificationBadge niveau={tech.niveau} />
      </div>

      <div className="hidden flex-col items-end gap-2 sm:flex">
        <Rating note={tech.note} nbAvis={tech.nbAvis} />
        <div className="flex gap-1.5">
          <DispoBadge disponible={tech.disponible} />
          <VerificationBadge niveau={tech.niveau} />
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        <button
          onClick={toggleFavori}
          aria-label="Ajouter aux favoris"
          aria-pressed={favori}
          className="rounded-full p-2 text-slate-400 transition hover:bg-accent-50 hover:text-accent-500"
        >
          <Heart className={cn("fav-icon size-5", favori && "fill-accent-500 text-accent-500")} />
        </button>
        <a href={`tel:${tel}`} className="rounded-full bg-brand-50 p-2.5 text-brand-600 transition hover:bg-brand-600 hover:text-white" aria-label="Appeler">
          <Phone className="size-4" />
        </a>
        <a
          href={`https://wa.me/${tel.replace("+", "")}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-emerald-50 p-2.5 text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
          aria-label="WhatsApp"
        >
          <MessageCircle className="size-4" />
        </a>
        <LinkButton href={`/techniciens/${tech.id}`} variant="secondary" size="md" className="ml-auto sm:ml-0">
          Contacter
        </LinkButton>
      </div>
    </article>
  );
}
