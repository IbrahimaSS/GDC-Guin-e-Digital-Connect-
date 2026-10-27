import { BadgeCheck, CalendarCheck, Eye, Images, MapPin, Star, UserPlus, Wallet } from "lucide-react";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import HeroTechnicien from "@/components/home/HeroTechnicien";
import Reveal from "@/components/motion/Reveal";
import { Card, cn, LinkButton, Stars } from "@/components/ui";
import { NIVEAUX, type Niveau } from "@/lib/data";

export const metadata: Metadata = {
  title: "Devenir technicien / artisan",
  description: "Valorisez votre savoir-faire et développez votre activité avec GDC.",
};

const AVANTAGES = [
  { icon: Eye, titre: "Plus de visibilité", texte: "Votre profil apparaît auprès des clients qui cherchent votre métier dans votre zone." },
  { icon: BadgeCheck, titre: "Un profil qui inspire confiance", texte: "Les niveaux de vérification montrent aux clients ce qui a été contrôlé." },
  { icon: Images, titre: "Vos réalisations mises en valeur", texte: "Un portfolio pour montrer la qualité de votre travail en photos." },
  { icon: CalendarCheck, titre: "Une activité mieux organisée", texte: "Demandes, disponibilités, missions et avis réunis au même endroit." },
];

const ETAPES = [
  { icon: UserPlus, titre: "Créez votre profil", texte: "Métier, spécialités, zones d'intervention et disponibilités." },
  { icon: BadgeCheck, titre: "Faites vérifier vos compétences", texte: "Pièce d'identité, diplômes ou attestations, réalisations." },
  { icon: MapPin, titre: "Recevez des demandes", texte: "Les clients de votre zone vous contactent ou vous envoient leur besoin." },
  { icon: Star, titre: "Réalisez et soyez évalué", texte: "Chaque mission réussie renforce votre réputation." },
];

const FAQ = [
  ["L'inscription est-elle payante ?", "Non. La création du profil et la réception des demandes sont gratuites pendant la phase de lancement."],
  ["Quels documents dois-je fournir ?", "Une pièce d'identité pour le niveau 1. Pour le niveau 2, un diplôme, une attestation de formation ou d'employeur, ou des photos de réalisations."],
  ["Combien de temps prend la vérification ?", "En moyenne 3 à 5 jours. Vous êtes prévenu par SMS à chaque étape."],
  ["Puis-je choisir mes zones et mes horaires ?", "Oui. Vous indiquez vos zones d'intervention et vos disponibilités, et vous pouvez les modifier à tout moment."],
];

// Photo du haut de page : celle d’Aïssatou Camara si elle a été déposée dans public/images.
function photoHero() {
  const nom = ["aissatou-camara.png", "aissatou-camara.webp", "aissatou-camara.jpg"].find((f) =>
    existsSync(path.join(process.cwd(), "public", "images", f)),
  );
  return nom ? `/images/${nom}` : "/images/electricienne.jpg";
}

const NIVEAU_STYLES: Record<Niveau, string> = {
  1: "bg-brand-50 text-brand-700",
  2: "bg-brand-600 text-white",
  3: "bg-accent-500 text-white",
};

export default function DevenirTechnicienPage() {
  return (
    <>
      <HeroTechnicien photo={photoHero()} />

      {/* Avantages */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-semibold text-accent-500">Pourquoi rejoindre GDC</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950">Développez votre activité, simplement</h2>
        </div>
        <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {AVANTAGES.map(({ icon: Icon, titre, texte }) => (
            <Card key={titre} className="p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="inline-flex rounded-xl bg-accent-50 p-3 text-accent-500">
                <Icon className="size-6" />
              </span>
              <p className="mt-5 font-bold text-slate-900">{titre}</p>
              <p className="mt-1.5 text-sm text-slate-500">{texte}</p>
            </Card>
          ))}
        </Reveal>
      </section>

      {/* Étapes */}
      <section id="etapes" className="scroll-mt-24 bg-white py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-accent-500">Comment ça marche</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950">De l&apos;inscription à votre première mission</h2>
            <Reveal as="ol" className="mt-8 space-y-5" x={-24} y={0} stagger={0.12}>
              {ETAPES.map(({ icon: Icon, titre, texte }, i) => (
                <li key={titre} className="flex gap-4">
                  <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon className="size-5" />
                    <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-accent-500 text-[11px] font-bold text-white ring-2 ring-white">
                      {i + 1}
                    </span>
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{titre}</p>
                    <p className="text-sm text-slate-500">{texte}</p>
                  </div>
                </li>
              ))}
            </Reveal>
          </div>
          <Reveal x={40} y={0}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] sm:aspect-[5/4] lg:aspect-square">
              <Image src="/images/menuisier-atelier.jpg" alt="Menuisier dans son atelier" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Niveaux de vérification */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-semibold text-accent-500">Vérification</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950">Trois niveaux pour gagner la confiance des clients</h2>
          <p className="mt-3 text-slate-500">Plus votre niveau est élevé, plus votre profil est mis en avant dans les résultats.</p>
        </div>
        <Reveal className="grid gap-5 md:grid-cols-3" stagger={0.12}>
          {([1, 2, 3] as Niveau[]).map((n) => (
            <Card key={n} className="p-6">
              <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold", NIVEAU_STYLES[n])}>
                <BadgeCheck className="size-4" /> Niveau {n}
              </span>
              <p className="mt-4 text-lg font-bold text-slate-900">{NIVEAUX[n].label}</p>
              <p className="mt-1 text-sm text-slate-500">{NIVEAUX[n].description}</p>
            </Card>
          ))}
        </Reveal>
      </section>

      {/* Témoignage */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <Reveal>
          <figure className="grid overflow-hidden rounded-[28px] bg-brand-950 text-white md:grid-cols-[2fr_3fr]">
            <div className="relative min-h-72">
              <Image src="/images/plombier-portrait.jpg" alt="Alpha Condé, plombier" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover object-[50%_25%]" />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-12">
              <Stars note={5} className="size-5" />
              <blockquote className="mt-5 text-xl font-medium leading-relaxed md:text-2xl">
                « Depuis que je suis sur GDC, je reçois des demandes chaque semaine. Mon badge niveau 2 rassure les clients avant même le premier appel. »
              </blockquote>
              <figcaption className="mt-6">
                <p className="font-bold">Alpha Condé</p>
                <p className="text-sm text-brand-100/70">Plombier à Matoto · 40 missions réalisées</p>
              </figcaption>
            </div>
          </figure>
        </Reveal>
      </section>

      {/* Questions fréquentes */}
      <section className="mx-auto max-w-3xl px-4 pb-20 md:px-6">
        <h2 className="mb-6 text-center text-3xl font-extrabold tracking-tight text-brand-950">Questions fréquentes</h2>
        <Reveal className="space-y-3" stagger={0.06} y={14}>
          {FAQ.map(([q, r]) => (
            <details key={q} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 open:ring-brand-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900">
                {q}
                <span className="text-xl leading-none text-brand-600 transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{r}</p>
            </details>
          ))}
        </Reveal>
      </section>

      {/* Appel à l'action */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <Reveal>
          <div className="flex flex-col items-start gap-6 rounded-[28px] bg-gradient-to-r from-brand-700 to-brand-500 p-8 text-white md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <h2 className="text-2xl font-extrabold md:text-3xl">Prêt à rejoindre GDC ?</h2>
              <p className="mt-2 flex items-center gap-2 text-brand-100">
                <Wallet className="size-4" /> Inscription gratuite, en quelques minutes.
              </p>
            </div>
            <LinkButton href="/inscription/technicien" size="lg">
              Créer mon profil professionnel
            </LinkButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}
