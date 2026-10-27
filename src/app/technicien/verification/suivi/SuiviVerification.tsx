"use client";

import { BadgeCheck, Check, Clock, FileCheck2, FileText, Search, Send } from "lucide-react";
import { useRef } from "react";
import { enter, gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { StatutVerificationBadge } from "@/components/shared/status";
import { Card, cn, LinkButton, PageHeader } from "@/components/ui";
import { NIVEAUX, VERIFICATIONS } from "@/lib/data";

const ETAPES = [
  { icon: Send, label: "Soumise", date: "15 oct. 2026" },
  { icon: Search, label: "En cours d'examen", date: "17 oct. 2026" },
  { icon: FileCheck2, label: "Évaluée", date: "Prévu le 22 oct." },
  { icon: BadgeCheck, label: "Résultat", date: "—" },
];
const COURANTE = 1;

export default function SuiviVerification() {
  const ref = useRef<HTMLDivElement>(null);
  const dossier = VERIFICATIONS[0];
  const historique = [
    { niveau: 2 as const, statut: "approuvee" as const, date: "12 mars 2026", note: "Attestation de formation validée." },
    { niveau: 1 as const, statut: "approuvee" as const, date: "16 janv. 2026", note: "Identité confirmée." },
  ];

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ delay: 0.3 });
      tl.add(enter(".sv-step", { y: 20, autoAlpha: 0, stagger: 0.12, duration: 0.5 }))
        .fromTo(".sv-bar", { scaleX: 0 }, { scaleX: COURANTE / (ETAPES.length - 1), duration: 1, ease: "power3.inOut" }, "-=0.3")
        .to(".sv-current", { boxShadow: "0 0 0 10px rgba(255,138,0,0.15)", repeat: -1, yoyo: true, duration: 0.9, ease: "sine.inOut" });
    },
    { scope: ref },
  );

  return (
    <div ref={ref}>
      <PageHeader
        title="Suivi de la vérification"
        subtitle="Suivez l'avancement de votre demande en temps réel."
        actions={<LinkButton href="/technicien/verification" variant="outline">Nouvelle demande</LinkButton>}
      />

      <Card className="p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Demande du {dossier.date}</p>
            <h2 className="text-xl font-extrabold text-brand-950">
              Niveau {dossier.niveau} – {NIVEAUX[dossier.niveau].label}
            </h2>
          </div>
          <StatutVerificationBadge statut={dossier.statut} />
        </div>

        <div className="relative mt-10">
          <span className="absolute left-[12.5%] right-[12.5%] top-6 h-1 rounded-full bg-slate-200" />
          <span className="sv-bar absolute left-[12.5%] right-[12.5%] top-6 h-1 origin-left rounded-full bg-gradient-to-r from-brand-600 to-accent-500" style={{ transform: `scaleX(${COURANTE / (ETAPES.length - 1)})` }} />
          <ol className="relative grid grid-cols-4">
            {ETAPES.map(({ icon: Icon, label, date }, i) => (
              <li key={label} className="sv-step flex flex-col items-center text-center">
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl transition",
                    i < COURANTE ? "bg-brand-600 text-white" : i === COURANTE ? "sv-current bg-accent-500 text-white" : "bg-white text-slate-400 ring-2 ring-slate-200",
                  )}
                >
                  {i < COURANTE ? <Check className="size-5" strokeWidth={3} /> : <Icon className="size-5" />}
                </span>
                <span className={cn("mt-3 text-sm font-bold", i <= COURANTE ? "text-slate-900" : "text-slate-400")}>{label}</span>
                <span className="text-xs text-slate-500">{date}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-2xl bg-accent-50 p-4 text-sm text-accent-600">
          <Clock className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>Votre dossier est en cours d&apos;examen.</strong> Un vérificateur contacte actuellement vos recommandations. Résultat attendu sous 2 à 3 jours.
          </p>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Pièces transmises</h2>
            <ul className="space-y-2">
              {dossier.pieces.map((p) => (
                <li key={p} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <FileText className="size-4 text-brand-600" />
                  <span className="flex-1 font-medium text-slate-700">{p}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <Check className="size-3.5" /> Reçu
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Historique</h2>
            <ul className="space-y-3">
              {historique.map((h) => (
                <li key={h.niveau} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <BadgeCheck className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      Niveau {h.niveau} – {NIVEAUX[h.niveau].label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {h.date} · {h.note}
                    </p>
                  </div>
                  <StatutVerificationBadge statut={h.statut} />
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
