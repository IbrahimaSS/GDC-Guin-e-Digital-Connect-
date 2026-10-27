import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import TechnicienProCard from "@/components/shared/TechnicienProCard";
import { MetierIcon } from "@/components/ui";
import { METIERS, TECHNICIENS, type MetierId } from "@/lib/data";
import RechercheForm from "./RechercheForm";

export const metadata: Metadata = { title: "Trouver un technicien" };

const PHOTOS_METIERS: Partial<Record<MetierId, string>> = {
  electricite: "/images/electricien-tableau.jpg",
  plomberie: "/images/plombier-evier.jpg",
  maconnerie: "/images/chantier.jpg",
  menuiserie: "/images/menuisier-atelier.jpg",
  mecanique: "/images/mecanicien.jpg",
  informatique: "/images/technicien-antenne.jpg",
};

export default function RecherchePage() {
  const metiers = METIERS.filter((m) => PHOTOS_METIERS[m.id]);
  const autres = METIERS.filter((m) => !PHOTOS_METIERS[m.id]);
  const disponibles = TECHNICIENS.filter((t) => t.disponible)
    .sort((a, b) => b.niveau - a.niveau || b.note - a.note)
    .slice(0, 4);

  return (
    <>
      {/* En-tête */}
      <section className="relative overflow-hidden bg-brand-950 pb-32 pt-14 text-white">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-brand-600/40 blur-[100px]" aria-hidden />
        <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-accent-500/20 blur-[100px]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-400">Trouver un technicien</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Rechercher un professionnel</h1>
          <p className="mt-2 max-w-2xl text-brand-100/80">Précisez votre besoin, nous vous montrons les techniciens vérifiés les plus proches de chez vous.</p>
        </div>
      </section>

      <div className="relative mx-auto -mt-24 max-w-6xl px-4 md:px-6">
        <RechercheForm />
      </div>

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
        <Reveal className="grid grid-cols-2 gap-4 md:grid-cols-3" stagger={0.06} scale={0.95} y={14}>
          {metiers.map((m) => (
            <Link key={m.id} href={`/resultats?metier=${m.id}`} className="group relative aspect-[16/10] overflow-hidden rounded-2xl">
              <Image src={PHOTOS_METIERS[m.id]!} alt={m.label} fill sizes="(min-width: 768px) 360px, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/20 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2 text-white">
                <div>
                  <p className="flex items-center gap-2 font-bold">
                    <MetierIcon metier={m.id} className="size-4 text-accent-400" /> {m.label}
                  </p>
                  <p className="text-xs text-white/75">{m.techniciens} professionnels</p>
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
        <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08} y={24}>
          {disponibles.map((t) => (
            <TechnicienProCard key={t.id} tech={t} />
          ))}
        </Reveal>
      </section>
    </>
  );
}
