"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import TechnicienProCard from "@/components/shared/TechnicienProCard";
import { MetierIcon } from "@/components/ui";
import { apiActive } from "@/lib/api";
import { TECHNICIENS } from "@/lib/data";
import { useMetiers } from "@/lib/plateforme";
import { useRechercheTechniciens } from "@/lib/techniciens";

const PHOTOS_METIERS: Record<string, string> = {
  electricite: "/images/electricien-tableau.jpg",
  plomberie: "/images/plombier-evier.jpg",
  maconnerie: "/images/chantier.jpg",
  menuiserie: "/images/menuisier-atelier.jpg",
  mecanique: "/images/mecanicien.jpg",
  informatique: "/images/technicien-antenne.jpg",
};

const pros = (n: number) => `${n} professionnel${n > 1 ? "s" : ""}`;

/** Métiers populaires et professionnels disponibles : données réelles avec l'API, maquette sinon. */
export default function MetiersEtDisponibles() {
  const tous = useMetiers();
  const metiers = tous.filter((m) => PHOTOS_METIERS[m.id]);
  const autres = tous.filter((m) => !PHOTOS_METIERS[m.id]);
  const recherche = useRechercheTechniciens({ disponible: true });
  const disponibles = apiActive
    ? recherche.resultats.slice(0, 4)
    : TECHNICIENS.filter((t) => t.disponible)
        .sort((a, b) => b.niveau - a.niveau || b.note - a.note)
        .slice(0, 4);

  return (
    <>
      {/* Métiers populaires */}
      <section className="mx-auto max-w-6xl px-4 pt-16 md:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-brand-950">Métiers populaires</h2>
          <div className="hidden flex-wrap gap-2 sm:flex">
            {autres.map((m) => (
              <Link
                key={m.id}
                href={`/resultats?metier=${m.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:text-accent-600 hover:ring-accent-500"
              >
                <MetierIcon metier={m.id} className="size-3.5 text-accent-500" /> {m.label}
              </Link>
            ))}
          </div>
        </div>
        <Reveal className="grid grid-cols-2 gap-4 md:grid-cols-3" stagger={0.06} scale={0.95} y={14} deps={[metiers.length]}>
          {metiers.map((m) => (
            <Link key={m.id} href={`/resultats?metier=${m.id}`} className="group relative aspect-[16/10] overflow-hidden rounded-2xl">
              <Image src={PHOTOS_METIERS[m.id]} alt={m.label} fill sizes="(min-width: 768px) 360px, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/20 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2 text-white">
                <div>
                  <p className="flex items-center gap-2 font-bold">
                    <MetierIcon metier={m.id} className="size-4 text-accent-400" /> {m.label}
                  </p>
                  <p className="text-xs text-white/75">{pros(m.techniciens)}</p>
                </div>
                <span className="rounded-full bg-white/15 p-1.5 backdrop-blur transition group-hover:bg-accent-500">
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* Professionnels disponibles */}
      {disponibles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-brand-950">Disponibles maintenant</h2>
              <p className="text-sm text-slate-500">Des professionnels vérifiés prêts à intervenir.</p>
            </div>
            <Link href="/resultats?disponible=1" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2">
              Voir tout <ArrowRight className="size-4 transition-all" />
            </Link>
          </div>
          <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08} y={24} deps={[disponibles.length]}>
            {disponibles.map((t) => (
              <TechnicienProCard key={t.id} tech={t} />
            ))}
          </Reveal>
        </section>
      )}
    </>
  );
}
