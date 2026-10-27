"use client";

import { BadgeCheck, Briefcase, Calendar, ChevronLeft, Clock, MapPin, MessageCircle, Phone, Share2, ShieldCheck, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import Counter from "@/components/motion/Counter";
import { enter, gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Avatar, Button, Card, DispoBadge, LinkButton, Rating, Stars, VerificationBadge } from "@/components/ui";
import { Tabs } from "@/components/ui/interactive";
import { ProgressBar } from "@/components/motion/Charts";
import { getMetier, NIVEAUX, type Avis, type Technicien } from "@/lib/data";

type Onglet = "presentation" | "realisations" | "avis";

export default function ProfilPublic({ tech }: { tech: Technicien }) {
  const [onglet, setOnglet] = useState<Onglet>("presentation");
  const root = useRef<HTMLDivElement>(null);
  const tel = tech.telephone.replace(/\s/g, "");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap
        .timeline()
        .add(enter(".pf-cover", { scaleY: 0, transformOrigin: "top", duration: 0.8, ease: "power4.out" }))
        .add(enter(".pf-avatar", { scale: 0.4, autoAlpha: 0, duration: 0.7, ease: "back.out(1.7)" }), "-=0.4")
        .add(enter(".pf-info > *", { y: 16, autoAlpha: 0, stagger: 0.06, duration: 0.5 }), "-=0.4")
        .add(enter(".pf-actions > *", { y: 12, autoAlpha: 0, stagger: 0.08, duration: 0.45 }), "-=0.35");
      // Parallaxe de la couverture au défilement.
      gsap.to(".pf-cover-pattern", { yPercent: 30, ease: "none", scrollTrigger: { trigger: ".pf-cover", start: "top top", end: "bottom top", scrub: true } });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="pb-16">
      <div className="pf-cover relative h-48 overflow-hidden bg-gradient-to-r from-brand-950 via-brand-700 to-sky-brand md:h-60">
        <div className="pf-cover-pattern absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <div className="relative mx-auto max-w-6xl px-4 pt-5 md:px-6">
          <Link href="/resultats" className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-white/20">
            <ChevronLeft className="size-4" /> Retour aux résultats
          </Link>
        </div>
      </div>

      <div className="relative mx-auto -mt-20 max-w-6xl px-4 md:px-6">
        <Card className="p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            <div className="pf-avatar relative w-fit">
              <Avatar nom={tech.nom} className="size-28 text-3xl ring-[6px] ring-white md:size-32" />
              {tech.disponible && <span className="absolute bottom-2 right-2 size-5 rounded-full bg-emerald-500 ring-4 ring-white" />}
            </div>
            <div className="pf-info flex-1 space-y-2">
              <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 md:text-3xl">
                {tech.nom} <BadgeCheck className="size-7 text-brand-600" />
              </h1>
              <p className="text-slate-600">
                {getMetier(tech.metier).label} · {tech.specialites.join(" · ")}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                <Rating note={tech.note} nbAvis={tech.nbAvis} />
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" /> Conakry, {tech.zone}
                </span>
                <VerificationBadge niveau={tech.niveau} long />
                <DispoBadge disponible={tech.disponible} />
              </div>
            </div>
            <div className="pf-actions flex flex-wrap items-center gap-2">
              <a href={`tel:${tel}`} className="rounded-xl bg-brand-50 p-3 text-brand-600 transition hover:bg-brand-600 hover:text-white" aria-label="Appeler">
                <Phone className="size-5" />
              </a>
              <a href={`https://wa.me/${tel.replace("+", "")}`} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition hover:bg-emerald-500 hover:text-white" aria-label="WhatsApp">
                <MessageCircle className="size-5" />
              </a>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast("Lien du profil copié");
                }}
                className="rounded-xl bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
                aria-label="Partager"
              >
                <Share2 className="size-5" />
              </button>
              <LinkButton href={`/publier-une-demande?technicien=${tech.id}`} size="lg">
                Demander une intervention
              </LinkButton>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { v: tech.experience, s: " ans", l: "d'expérience" },
              { v: tech.missions, s: "", l: "missions réalisées" },
              { v: tech.note, s: "/5", l: "note moyenne", d: 1 },
              { v: 98, s: " %", l: "taux de réponse" },
            ].map((k) => (
              <div key={k.l} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-2xl font-extrabold text-brand-950">
                  <Counter value={k.v} suffix={k.s} decimals={k.d} />
                </p>
                <p className="text-xs text-slate-500">{k.l}</p>
              </div>
            ))}
          </div>

          <Tabs<Onglet>
            className="mt-8"
            value={onglet}
            onChange={setOnglet}
            tabs={[
              { id: "presentation", label: "Présentation" },
              { id: "realisations", label: "Réalisations", count: tech.realisations.length },
              { id: "avis", label: "Avis", count: tech.nbAvis },
            ]}
          />

          <div className="pt-6">
            {onglet === "presentation" && <Presentation tech={tech} onVoirAvis={() => setOnglet("avis")} />}
            {onglet === "realisations" && (
              <Reveal className="grid grid-cols-2 gap-4 md:grid-cols-3" scale={0.9} y={10}>
                {tech.realisations.map((r) => (
                  <figure key={r.titre} className="group overflow-hidden rounded-2xl ring-1 ring-slate-200">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <Image src={r.image} alt={r.titre} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
                    </div>
                    <figcaption className="p-3">
                      <p className="text-sm font-semibold text-slate-900">{r.titre}</p>
                      <p className="text-xs text-slate-500">{r.categorie}</p>
                    </figcaption>
                  </figure>
                ))}
              </Reveal>
            )}
            {onglet === "avis" && <ListeAvis tech={tech} />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Presentation({ tech, onVoirAvis }: { tech: Technicien; onVoirAvis: () => void }) {
  const infos = [
    { icon: Briefcase, label: "Expérience", valeur: `${tech.experience} ans` },
    { icon: Wrench, label: "Spécialités", valeur: tech.specialites.join(", ") },
    { icon: MapPin, label: "Zones d'intervention", valeur: tech.zonesIntervention.join(", ") },
    { icon: Calendar, label: "Disponibilité", valeur: tech.disponibilites },
    { icon: Clock, label: "Membre depuis", valeur: tech.inscrit },
  ];
  return (
    <Reveal className="grid gap-8 md:grid-cols-[1.6fr_1fr]" stagger={0.12}>
      <div>
        <h2 className="mb-2 font-bold text-slate-900">À propos</h2>
        <p className="leading-relaxed text-slate-600">{tech.bio}</p>
        <ul className="mt-6 space-y-3">
          {infos.map(({ icon: Icon, label, valeur }) => (
            <li key={label} className="flex items-start gap-3 text-sm">
              <span className="rounded-lg bg-brand-50 p-1.5 text-brand-600">
                <Icon className="size-4" />
              </span>
              <span className="pt-1">
                <span className="font-semibold text-slate-800">{label} :</span> <span className="text-slate-600">{valeur}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-2xl bg-brand-50 p-5">
          <p className="flex items-center gap-2 font-bold text-brand-800">
            <ShieldCheck className="size-5" /> Ce qui a été vérifié
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {([1, 2, 3] as const).map((n) => (
              <li key={n} className={n <= tech.niveau ? "text-brand-800" : "text-slate-400 line-through"}>
                ✓ Niveau {n} – {NIVEAUX[n].label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <aside>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Avis récents</h2>
          <button onClick={onVoirAvis} className="text-sm font-semibold text-brand-600 hover:underline">
            Voir tout
          </button>
        </div>
        <ul className="space-y-3">
          {tech.avis.slice(0, 2).map((a) => (
            <AvisItem key={a.id} avis={a} />
          ))}
        </ul>
      </aside>
    </Reveal>
  );
}

const AUTEURS = ["Mamadou Bah", "Hawa Camara", "Ousmane Diallo", "Aminata Sylla", "Ibrahima Barry", "Kadiatou Keita", "Alpha Soumah", "Fanta Condé"];
const COMMENTAIRES = [
  "Ponctuel et très professionnel, je recommande.",
  "Bon travail, propre et rapide.",
  "Prix correct et bons conseils pour l'entretien.",
  "Intervention efficace, problème réglé du premier coup.",
  "Très à l'écoute, il a bien expliqué les travaux.",
  "Travail sérieux, je referai appel à lui.",
];
const MOIS = ["août", "juil.", "juin", "mai", "avr.", "mars"];

// Avis plus anciens (en attendant l'API, générés de façon stable à partir du technicien).
function avisAnciens(tech: Technicien): Avis[] {
  const restant = Math.max(0, tech.nbAvis - tech.avis.length);
  return Array.from({ length: restant }, (_, i) => ({
    id: `${tech.id}-ancien-${i}`,
    auteur: AUTEURS[(i + tech.nom.length) % AUTEURS.length],
    note: (i * 7 + tech.nom.length) % 6 === 0 ? 4 : 5,
    commentaire: COMMENTAIRES[(i * 5 + tech.experience) % COMMENTAIRES.length],
    date: `${(i * 3) % 27 + 1} ${MOIS[Math.floor(i / 4) % MOIS.length]} 2026`,
  }));
}

const PAR_PAGE = 5;

function ListeAvis({ tech }: { tech: Technicien }) {
  const tous = [...tech.avis, ...avisAnciens(tech)];
  const [affiches, setAffiches] = useState(Math.min(PAR_PAGE, tous.length));
  const repartition = [5, 4, 3, 2, 1].map((n) => ({
    n,
    pct: n === 5 ? 78 : n === 4 ? 16 : n === 3 ? 4 : n === 2 ? 2 : 0,
  }));
  return (
    <div className="grid gap-8 md:grid-cols-[280px_1fr]">
      <div className="rounded-2xl bg-slate-50 p-6">
        <p className="text-5xl font-extrabold text-slate-900">{tech.note.toFixed(1)}</p>
        <Stars note={Math.round(tech.note)} className="size-5" />
        <p className="mt-1 text-sm text-slate-500">{tech.nbAvis} avis vérifiés</p>
        <ul className="mt-5 space-y-2">
          {repartition.map((r) => (
            <li key={r.n} className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-3">{r.n}</span>
              <ProgressBar value={r.pct} color="bg-amber-400" />
              <span className="w-8 text-right">{r.pct} %</span>
            </li>
          ))}
        </ul>
      </div>
      <Reveal as="ul" className="space-y-3" deps={[affiches]}>
        {tous.slice(0, affiches).map((a) => (
          <AvisItem key={a.id} avis={a} />
        ))}
        <li className="pt-1 text-center">
          {affiches < tous.length ? (
            <Button variant="ghost" className="w-full" onClick={() => setAffiches((n) => Math.min(n + PAR_PAGE, tous.length))}>
              Charger plus d&apos;avis ({tous.length - affiches} restants)
            </Button>
          ) : (
            <p className="text-sm text-slate-400">Tous les avis sont affichés ({tous.length}).</p>
          )}
        </li>
      </Reveal>
    </div>
  );
}

function AvisItem({ avis }: { avis: Avis }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-slate-50 p-4">
      <Avatar nom={avis.auteur} className="size-10 text-xs" />
      <div className="text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">{avis.auteur}</span>
          <Stars note={avis.note} className="size-3.5" />
        </div>
        <p className="mt-1 text-slate-700">{avis.commentaire}</p>
        <p className="mt-1 text-xs text-slate-400">
          {avis.mission && `${avis.mission} · `}
          {avis.date}
        </p>
      </div>
    </li>
  );
}
