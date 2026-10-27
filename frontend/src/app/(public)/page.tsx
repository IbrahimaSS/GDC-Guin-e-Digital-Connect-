import { ArrowRight, BadgeCheck, ClipboardList, MessageSquareText, MousePointerClick, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import PublierDemande from "@/components/home/PublierDemande";
import Reveal from "@/components/motion/Reveal";
import TechnicienProCard from "@/components/shared/TechnicienProCard";
import { cn, GuineeFlag, LinkButton, MetierIcon, Stars } from "@/components/ui";
import { METIERS, NIVEAUX, TECHNICIENS, type Niveau } from "@/lib/data";

const ATOUTS = [
  { icon: MousePointerClick, titre: "Simple et rapide", texte: "Un professionnel trouvé en quelques clics." },
  { icon: ShieldCheck, titre: "Professionnels vérifiés", texte: "Trois niveaux de vérification transparents." },
  { icon: MessageSquareText, titre: "Avis clients réels", texte: "Uniquement après une mission réalisée." },
  { icon: ClipboardList, titre: "Suivi de vos missions", texte: "De la demande jusqu'à l'évaluation." },
];

const TEMOIGNAGES = [
  { nom: "Fatoumata Sow", role: "Cliente · Dixinn", texte: "J'ai trouvé un électricien vérifié en 10 minutes. Le suivi de la mission m'a vraiment rassurée." },
  { nom: "Alpha Condé", role: "Plombier · Matoto", texte: "Depuis que je suis sur GDC, je reçois des demandes chaque semaine. Mon badge niveau 2 fait la différence." },
  { nom: "Sory Camara", role: "Gérant de PME · Kaloum", texte: "Pour nos bureaux, nous passons maintenant par GDC. Les profils sont clairs et les prix transparents." },
];

const NIVEAU_STYLES: Record<Niveau, string> = {
  1: "from-brand-50 to-white text-brand-700",
  2: "from-brand-600 to-brand-800 text-white",
  3: "from-accent-500 to-accent-600 text-white",
};

export default function Accueil() {
  const top = [...TECHNICIENS].sort((a, b) => b.note - a.note).slice(0, 4);

  return (
    <>
      <Hero />

      {/* Atouts */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ATOUTS.map(({ icon: Icon, titre, texte }) => (
            <div key={titre} className="group flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="rounded-xl bg-brand-50 p-3 text-brand-600 transition duration-300 group-hover:bg-brand-600 group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-bold text-slate-900">{titre}</p>
                <p className="mt-0.5 text-sm text-slate-500">{texte}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Métiers */}
      <section id="metiers" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-accent-500">Métiers</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950">Nos métiers les plus recherchés</h2>
          </div>
          <Link href="/recherche" className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2 sm:inline-flex">
            Tous les métiers <ArrowRight className="size-4 transition-all" />
          </Link>
        </div>
        <Reveal className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8" stagger={0.05} scale={0.9} y={10}>
          {METIERS.map((m) => (
            <Link
              key={m.id}
              href={`/resultats?metier=${m.id}`}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-accent-500/10 hover:ring-accent-500"
            >
              <span className="rounded-2xl bg-accent-50 p-3.5 text-accent-500 transition duration-300 group-hover:scale-110 group-hover:bg-accent-500 group-hover:text-white">
                <MetierIcon metier={m.id} className="size-6" />
              </span>
              <span className="text-sm font-semibold text-slate-800">{m.label}</span>
              <span className="-mt-2 text-xs text-slate-400">{m.techniciens} pros</span>
            </Link>
          ))}
        </Reveal>
      </section>

      <PublierDemande />

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-6">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold text-accent-500">Simple, en 5 étapes</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950">Comment ça marche ?</h2>
        </div>
        <HowItWorks />
      </section>

      {/* Niveaux de vérification */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-semibold text-accent-500">Notre différence</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950">La confiance, vérifiée en 3 niveaux</h2>
            <p className="mt-3 text-slate-500">Chaque profil affiche clairement ce qui a été contrôlé. Vous savez exactement à qui vous confiez vos travaux.</p>
          </div>
          <Reveal className="grid gap-5 md:grid-cols-3" stagger={0.15} y={40}>
            {([1, 2, 3] as Niveau[]).map((n) => (
              <div key={n} className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br p-7 shadow-lg ring-1 ring-black/5", NIVEAU_STYLES[n])}>
                <span className="absolute -right-6 -top-6 text-[120px] font-black leading-none opacity-10">{n}</span>
                <BadgeCheck className="size-10" />
                <p className="mt-5 text-xs font-bold uppercase tracking-wider opacity-70">Niveau {n}</p>
                <p className="mt-1 text-xl font-bold">{NIVEAUX[n].label}</p>
                <p className="mt-2 text-sm opacity-80">{NIVEAUX[n].description}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Professionnels à la une */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-accent-500">À la une</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950">Les professionnels les mieux notés</h2>
          </div>
          <LinkButton href="/resultats" variant="outline" className="hidden sm:inline-flex">
            Voir tous les pros <ArrowRight className="size-4" />
          </LinkButton>
        </div>
        <Reveal className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" stagger={0.1} y={30}>
          {top.map((t) => (
            <TechnicienProCard key={t.id} tech={t} />
          ))}
        </Reveal>
      </section>

      {/* Témoignages */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <Reveal className="grid gap-5 md:grid-cols-3" stagger={0.12}>
          {TEMOIGNAGES.map((t) => (
            <figure key={t.nom} className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200/70">
              <Stars note={5} />
              <blockquote className="mt-4 text-slate-700">« {t.texte} »</blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="font-bold text-slate-900">{t.nom}</span>
                <span className="block text-slate-500">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </section>

      {/* Appel à l'action */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-700 via-brand-600 to-sky-brand px-8 py-14 text-white md:px-14">
            <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/10" aria-hidden />
            <div className="absolute -bottom-24 right-40 size-60 rounded-full bg-accent-500/30 blur-2xl" aria-hidden />
            <div className="relative grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Des professionnels de confiance pour vos projets</h2>
                <p className="mt-3 max-w-lg text-brand-100">
                  Vous êtes technicien ou artisan ? Créez votre profil gratuitement, faites vérifier vos compétences et recevez de nouvelles missions.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <LinkButton href="/devenir-technicien" size="lg">
                    Rejoindre GDC
                  </LinkButton>
                  <LinkButton href="/recherche" size="lg" variant="dark">
                    Trouver un technicien
                  </LinkButton>
                </div>
              </div>
              <div className="hidden justify-end md:flex">
                <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/20 backdrop-blur">
                  <Smartphone className="size-10 text-accent-400" />
                  <p className="mt-3 font-bold">Pensé pour le mobile</p>
                  <p className="mt-1 max-w-[220px] text-sm text-brand-100">Connexion par SMS, contact WhatsApp, pages légères même en 3G.</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-brand-100">
                    <GuineeFlag /> Conçu en Guinée
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
