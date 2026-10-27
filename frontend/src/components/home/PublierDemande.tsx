import { ArrowRight, CheckCircle2, ClipboardList, Droplets, MapPin, Zap } from "lucide-react";
import Image from "next/image";
import Reveal from "@/components/motion/Reveal";
import { Avatar, LinkButton } from "@/components/ui";
import { TECHNICIENS } from "@/lib/data";

const POINTS = [
  "Une demande simple à remplir",
  "Des professionnels correspondant à votre besoin",
  "Un suivi de votre demande et de votre mission",
];

/** Section d'accueil : le second parcours, « J'ai un besoin → je publie une demande ». */
export default function PublierDemande() {
  const proposes = TECHNICIENS.filter((t) => t.metier === "plomberie" || t.metier === "electricite").slice(0, 3);

  return (
    <section className="bg-white py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-6 lg:grid-cols-2">
        <Reveal stagger={0.1}>
          <p className="text-sm font-semibold text-accent-500">Publier une demande</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-brand-950 md:text-4xl">
            Un problème à résoudre ? Trouvons le bon professionnel.
          </h2>
          <p className="mt-4 max-w-lg text-slate-600">
            Décrivez votre besoin et entrez en relation avec un technicien ou un artisan adapté à votre intervention.
          </p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 font-medium text-slate-800">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> {p}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <LinkButton href="/publier-une-demande" size="lg">
              Créer une demande <ArrowRight className="size-4" />
            </LinkButton>
          </div>
        </Reveal>

        <Reveal x={40} y={0} delay={0.15}>
          <div className="relative">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[28px]">
              <Image src="/images/plombier-evier.jpg" alt="Plombier en intervention sous un évier" fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
            </div>

            {/* Aperçu d'une demande publiée */}
            <div className="absolute -bottom-8 left-4 right-4 rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200/70 sm:left-auto sm:right-6 sm:w-80">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                <ClipboardList className="size-4 text-brand-600" /> Demande publiée
              </p>
              <p className="mt-2 font-bold text-slate-900">Fuite d&apos;eau sous l&apos;évier</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Droplets className="size-3.5 text-accent-500" /> Plomberie
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> Kaloum
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                  <Zap className="size-3.5" /> Urgent
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex -space-x-2">
                  {proposes.map((t) => (
                    <Avatar key={t.id} nom={t.nom} className="size-8 ring-2 ring-white" />
                  ))}
                </div>
                <p className="text-xs font-semibold text-emerald-600">3 professionnels disponibles</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
