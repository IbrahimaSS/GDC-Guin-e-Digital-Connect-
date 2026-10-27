import {
  ArrowRight,
  BadgeCheck,
  Compass,
  HeartHandshake,
  Headphones,
  Lightbulb,
  Lock,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Counter from "@/components/motion/Counter";
import Reveal from "@/components/motion/Reveal";
import { Card, cn, LinkButton } from "@/components/ui";
import { NIVEAUX, STATS_ADMIN, type Niveau } from "@/lib/data";

export const metadata: Metadata = {
  title: "À propos",
  description: "GDC rend les compétences techniques plus visibles, plus lisibles et plus accessibles en Guinée.",
};

const CHIFFRES = [
  { valeur: STATS_ADMIN.utilisateurs, label: "utilisateurs inscrits" },
  { valeur: STATS_ADMIN.techniciens, label: "techniciens et artisans", suffixe: "+" },
  { valeur: STATS_ADMIN.missions, label: "missions réalisées" },
  { valeur: STATS_ADMIN.satisfaction, label: "satisfaction moyenne", decimales: 1, suffixe: "/5" },
];

const PARCOURS = [
  { date: "Mars 2026", titre: "Hackathon Future Champions", texte: "Naissance du projet GDC et premier prototype.", etat: "fait" },
  { date: "Mai 2026", titre: "Étude terrain", texte: "Entretiens avec des techniciens, des clients et des entreprises de Conakry.", etat: "fait" },
  { date: "Octobre 2026", titre: "Pilote à Conakry", texte: "Lancement auprès d'un premier groupe de professionnels vérifiés.", etat: "en_cours" },
  { date: "2027", titre: "Extension", texte: "Ouverture progressive à Kindia, Boké et aux autres régions.", etat: "a_venir" },
] as const;

const VALEURS: { icon: LucideIcon; titre: string; texte: string; ton: string }[] = [
  { icon: ShieldCheck, titre: "Confiance", texte: "Des profils vérifiés et des avis liés à de vraies missions.", ton: "bg-brand-50 text-brand-600" },
  { icon: HeartHandshake, titre: "Professionnalisme", texte: "Valoriser le savoir-faire des techniciens et artisans guinéens.", ton: "bg-accent-50 text-accent-500" },
  { icon: MapPin, titre: "Proximité", texte: "Trouver rapidement un professionnel près de chez soi.", ton: "bg-emerald-50 text-emerald-600" },
  { icon: Lightbulb, titre: "Innovation", texte: "Une plateforme simple, pensée pour le mobile et les connexions lentes.", ton: "bg-violet-50 text-violet-600" },
];

const ENGAGEMENTS: { icon: LucideIcon; titre: string; texte: string }[] = [
  { icon: BadgeCheck, titre: "Une vérification transparente", texte: "Chaque profil indique clairement ce qui a été contrôlé." },
  { icon: MessageSquareText, titre: "Des avis authentiques", texte: "Seuls les clients ayant réalisé une mission peuvent laisser un avis." },
  { icon: Lock, titre: "Des données protégées", texte: "Les justificatifs servent uniquement à la vérification et ne sont jamais publiés." },
  { icon: Headphones, titre: "Un support disponible", texte: "Une équipe joignable 7 jours sur 7 par téléphone et WhatsApp." },
];

const NIVEAU_STYLES: Record<Niveau, string> = {
  1: "bg-white text-brand-900 ring-1 ring-slate-200",
  2: "bg-brand-600 text-white",
  3: "bg-accent-500 text-white",
};

export default function AProposPage() {
  return (
    <>
      {/* En-tête */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/60">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-6 lg:grid-cols-2 lg:py-24">
          <Reveal stagger={0.1}>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent-500">À propos de GDC</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight text-brand-950 md:text-5xl">
              Rendre les compétences techniques plus visibles, plus lisibles et plus accessibles.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Guinée Digital Connect réunit évaluation des compétences, profils professionnels et mise en relation entre clients et techniciens.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/recherche" size="lg">
                Trouver un technicien <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href="/devenir-technicien" size="lg" variant="outline">
                Devenir technicien
              </LinkButton>
            </div>
          </Reveal>

          <Reveal className="grid h-[420px] grid-cols-2 grid-rows-2 gap-4 md:h-[500px]" stagger={0.12} scale={0.94} y={10}>
            <div className="relative row-span-2 overflow-hidden rounded-[28px]">
              <Image src="/images/equipe-usine.jpg" alt="Techniciens au travail en atelier" fill priority sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
            </div>
            <div className="relative overflow-hidden rounded-[28px]">
              <Image src="/images/chantier.jpg" alt="Ouvriers sur un chantier" fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
            </div>
            <div className="relative overflow-hidden rounded-[28px]">
              <Image src="/images/couturiere.jpg" alt="Couturière devant sa machine" fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover object-[50%_30%]" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Chiffres */}
      <section className="bg-brand-950 text-white">
        <Reveal className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 md:px-6 lg:grid-cols-4" stagger={0.1}>
          {CHIFFRES.map((c) => (
            <div key={c.label} className="border-l-2 border-accent-500 pl-5">
              <p className="text-4xl font-extrabold tracking-tight md:text-5xl">
                <Counter value={c.valeur} decimals={c.decimales} suffix={c.suffixe} duration={2} />
              </p>
              <p className="mt-1 text-sm text-brand-100/70">{c.label}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Mission et vision */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <Reveal className="grid gap-6 md:grid-cols-2" stagger={0.15}>
          <Card className="p-8">
            <span className="inline-flex rounded-2xl bg-brand-50 p-3.5 text-brand-600">
              <Target className="size-6" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold text-brand-950">Notre mission</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Aider chaque client à trouver un professionnel fiable, et chaque technicien à prouver ses compétences et à accéder à de nouvelles missions.
              Nous créons un point de rencontre de confiance entre les compétences locales et les besoins du marché.
            </p>
          </Card>
          <Card className="p-8">
            <span className="inline-flex rounded-2xl bg-accent-50 p-3.5 text-accent-500">
              <Compass className="size-6" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold text-brand-950">Notre vision</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Devenir la plateforme de référence pour découvrir et mobiliser les compétences techniques en Guinée, en commençant par Conakry puis en nous
              étendant progressivement aux autres régions.
            </p>
          </Card>
        </Reveal>
      </section>

      {/* Parcours */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold text-accent-500">Notre parcours</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950">De l&apos;idée au pilote</h2>
          </div>
          <Reveal as="ol" className="relative grid gap-8 md:grid-cols-4" stagger={0.12}>
            {PARCOURS.map((p, i) => (
              <li key={p.titre} className="relative">
                {i < PARCOURS.length - 1 && <span className="absolute left-5 right-[-2rem] top-5 hidden h-0.5 bg-slate-200 md:block" aria-hidden />}
                <span
                  className={cn(
                    "relative z-10 flex size-10 items-center justify-center rounded-full text-sm font-bold",
                    p.etat === "fait" && "bg-brand-600 text-white",
                    p.etat === "en_cours" && "bg-accent-500 text-white ring-8 ring-accent-500/15",
                    p.etat === "a_venir" && "bg-white text-slate-400 ring-2 ring-slate-200",
                  )}
                >
                  {i + 1}
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">{p.date}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{p.titre}</p>
                <p className="mt-1 text-sm text-slate-500">{p.texte}</p>
                {p.etat === "en_cours" && <span className="mt-3 inline-flex rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-bold text-accent-600">En cours</span>}
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Valeurs */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-semibold text-accent-500">Nos valeurs</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950">Ce qui guide chacune de nos décisions</h2>
        </div>
        <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {VALEURS.map(({ icon: Icon, titre, texte, ton }) => (
            <Card key={titre} className="p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className={cn("inline-flex rounded-2xl p-3.5", ton)}>
                <Icon className="size-6" />
              </span>
              <p className="mt-5 text-lg font-bold text-slate-900">{titre}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{texte}</p>
            </Card>
          ))}
        </Reveal>
      </section>

      {/* Niveaux de vérification */}
      <section id="verification" className="scroll-mt-24 bg-brand-50/60 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-semibold text-accent-500">Vérification</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950">Trois niveaux, en toute transparence</h2>
            <p className="mt-3 text-slate-500">Chaque profil affiche son niveau : vous savez exactement ce qui a été contrôlé.</p>
          </div>
          <Reveal className="grid gap-5 md:grid-cols-3" stagger={0.12} y={30}>
            {([1, 2, 3] as Niveau[]).map((n) => (
              <div key={n} className={cn("relative overflow-hidden rounded-3xl p-7 shadow-sm", NIVEAU_STYLES[n])}>
                <span className="absolute -right-4 -top-6 text-[120px] font-black leading-none opacity-10">{n}</span>
                <BadgeCheck className="size-9" />
                <p className="mt-5 text-xs font-bold uppercase tracking-wider opacity-70">Niveau {n}</p>
                <p className="mt-1 text-xl font-bold">{NIVEAUX[n].label}</p>
                <p className="mt-2 text-sm opacity-80">{NIVEAUX[n].description}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Engagements */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:px-6 lg:grid-cols-2">
        <Reveal x={-40} y={0}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px]">
            <Image src="/images/electricien-tableau.jpg" alt="Électricien au travail sur un tableau électrique" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover object-[50%_30%]" />
          </div>
        </Reveal>
        <div>
          <p className="text-sm font-semibold text-accent-500">Nos engagements</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950">Une plateforme sur laquelle on peut compter</h2>
          <Reveal as="ul" className="mt-8 space-y-5" stagger={0.1} y={14}>
            {ENGAGEMENTS.map(({ icon: Icon, titre, texte }) => (
              <li key={titre} className="flex gap-4">
                <span className="h-fit rounded-xl bg-brand-50 p-2.5 text-brand-600">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-bold text-slate-900">{titre}</p>
                  <p className="text-sm text-slate-500">{texte}</p>
                </div>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <Reveal>
          <div className="grid gap-6 rounded-[32px] bg-gradient-to-br from-brand-700 via-brand-600 to-sky-brand p-8 text-white md:grid-cols-2 md:p-12">
            <div>
              <h2 className="text-2xl font-extrabold md:text-3xl">Vous avez un besoin ?</h2>
              <p className="mt-2 text-brand-100">Publiez une demande et recevez des propositions de professionnels vérifiés.</p>
              <LinkButton href="/publier-une-demande" size="lg" className="mt-6">
                Publier une demande
              </LinkButton>
            </div>
            <div className="border-white/20 md:border-l md:pl-10">
              <h2 className="text-2xl font-extrabold md:text-3xl">Vous êtes technicien ?</h2>
              <p className="mt-2 text-brand-100">Créez votre profil gratuitement et développez votre activité.</p>
              <LinkButton href="/devenir-technicien" size="lg" variant="dark" className="mt-6">
                Devenir technicien
              </LinkButton>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
