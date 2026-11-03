"use client";

import { BadgeCheck, Check, Clock, ExternalLink, FileCheck2, FileText, Search, Send, ShieldCheck, XCircle } from "lucide-react";
import { useRef } from "react";
import { enter, gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { StatutVerificationBadge } from "@/components/shared/status";
import { Card, cn, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { apiActive, texteErreur } from "@/lib/api";
import { NIVEAUX, VERIFICATIONS, type Niveau, type StatutVerification } from "@/lib/data";
import { ouvrirPiece } from "@/lib/fichiers";
import { useApi } from "@/lib/useApi";

interface VerificationApi {
  id: string;
  niveau: number;
  statut: "EN_ATTENTE" | "EN_COURS" | "APPROUVEE" | "REFUSEE";
  pieces: { type: string; url: string }[];
  message: string | null;
  commentaire: string | null;
  decideLe: string | null;
  createdAt: string;
}

const LIBELLES_PIECES: Record<string, string> = {
  piece_identite: "Pièce d'identité",
  selfie: "Selfie de contrôle",
  diplome: "Diplôme ou attestation de formation",
  attestation: "Attestation d'employeur ou d'apprentissage",
  photos_realisations: "Photos de réalisations",
  recommandation: "Recommandation",
};

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** Vue commune : dossier en cours (ou le plus récent) et historique. */
interface Vue {
  dossier: { niveau: Niveau; statut: StatutVerification; date: string; pieces: { libelle: string; url?: string }[]; commentaire?: string } | null;
  etapes: { icon: typeof Send; label: string; date: string }[];
  courante: number;
  historique: { cle: string; niveau: Niveau; statut: StatutVerification; date: string; note: string }[];
}

function depuisApi(liste: VerificationApi[]): Vue {
  const recente = liste[0];
  const enCours = recente && (recente.statut === "EN_ATTENTE" || recente.statut === "EN_COURS");
  const decidee = recente && !enCours;
  return {
    dossier: recente
      ? {
          niveau: Math.min(3, recente.niveau) as Niveau,
          statut: recente.statut.toLowerCase() as StatutVerification,
          date: date(recente.createdAt),
          pieces: recente.pieces.map((p) => ({ libelle: LIBELLES_PIECES[p.type] ?? p.type, url: p.url })),
          commentaire: recente.commentaire ?? undefined,
        }
      : null,
    etapes: [
      { icon: Send, label: "Soumise", date: recente ? date(recente.createdAt) : "—" },
      { icon: Search, label: "En cours d'examen", date: recente?.statut === "EN_COURS" || decidee ? "Pris en charge" : "En attente" },
      { icon: FileCheck2, label: "Évaluée", date: decidee && recente.decideLe ? date(recente.decideLe) : "—" },
      { icon: BadgeCheck, label: "Résultat", date: decidee ? (recente.statut === "APPROUVEE" ? "Approuvée" : "Refusée") : "—" },
    ],
    courante: !recente ? 0 : recente.statut === "EN_ATTENTE" ? 1 : recente.statut === "EN_COURS" ? 2 : 4,
    historique: liste
      .filter((v) => v.statut === "APPROUVEE" || v.statut === "REFUSEE")
      .map((v) => ({
        cle: v.id,
        niveau: Math.min(3, v.niveau) as Niveau,
        statut: v.statut.toLowerCase() as StatutVerification,
        date: date(v.decideLe ?? v.createdAt),
        note: v.commentaire ?? (v.statut === "APPROUVEE" ? "Dossier validé." : "Dossier refusé."),
      })),
  };
}

const VUE_DEMO: Vue = {
  dossier: { niveau: VERIFICATIONS[0].niveau, statut: VERIFICATIONS[0].statut, date: VERIFICATIONS[0].date, pieces: VERIFICATIONS[0].pieces.map((libelle) => ({ libelle })) },
  etapes: [
    { icon: Send, label: "Soumise", date: "15 oct. 2026" },
    { icon: Search, label: "En cours d'examen", date: "17 oct. 2026" },
    { icon: FileCheck2, label: "Évaluée", date: "Prévu le 22 oct." },
    { icon: BadgeCheck, label: "Résultat", date: "—" },
  ],
  courante: 1,
  historique: [
    { cle: "2", niveau: 2, statut: "approuvee", date: "12 mars 2026", note: "Attestation de formation validée." },
    { cle: "1", niveau: 1, statut: "approuvee", date: "16 janv. 2026", note: "Identité confirmée." },
  ],
};

export default function SuiviVerification() {
  const ref = useRef<HTMLDivElement>(null);
  const distantes = useApi<VerificationApi[]>(apiActive ? "/verifications" : null);
  const { dossier, etapes, courante, historique } = apiActive ? depuisApi(distantes.donnees ?? []) : VUE_DEMO;
  const fini = courante >= etapes.length;
  const avancement = Math.min(courante, etapes.length - 1) / (etapes.length - 1);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !dossier) return;
      const tl = gsap.timeline({ delay: 0.3 });
      tl.add(enter(".sv-step", { y: 20, autoAlpha: 0, stagger: 0.12, duration: 0.5 })).fromTo(".sv-bar", { scaleX: 0 }, { scaleX: avancement, duration: 1, ease: "power3.inOut" }, "-=0.3");
      if (!fini) tl.to(".sv-current", { boxShadow: "0 0 0 10px rgba(255,138,0,0.15)", repeat: -1, yoyo: true, duration: 0.9, ease: "sine.inOut" });
    },
    { scope: ref, dependencies: [courante, Boolean(dossier)], revertOnUpdate: true },
  );

  async function ouvrir(url: string) {
    try {
      await ouvrirPiece(url);
    } catch (e) {
      toast(texteErreur(e), "error");
    }
  }

  if (distantes.chargement) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />;

  if (!dossier) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-10 text-center">
        <EmptyState icon={ShieldCheck} title="Aucune demande de vérification" text="Envoyez votre pièce d'identité pour être visible des clients et accepter des missions." />
        <LinkButton href="/technicien/verification">Demander une vérification</LinkButton>
      </div>
    );
  }

  const refusee = dossier.statut === "refusee";

  return (
    <div ref={ref}>
      <PageHeader
        title="Suivi de la vérification"
        subtitle="Suivez l'avancement de votre demande."
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
          <span className="sv-bar absolute left-[12.5%] right-[12.5%] top-6 h-1 origin-left rounded-full bg-gradient-to-r from-brand-600 to-accent-500" style={{ transform: `scaleX(${avancement})` }} />
          <ol className="relative grid grid-cols-4">
            {etapes.map(({ icon: Icon, label, date: d }, i) => (
              <li key={label} className="sv-step flex flex-col items-center text-center">
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl transition",
                    i < courante ? (refusee && i === etapes.length - 1 ? "bg-red-500 text-white" : "bg-brand-600 text-white") : i === courante ? "sv-current bg-accent-500 text-white" : "bg-white text-slate-400 ring-2 ring-slate-200",
                  )}
                >
                  {i < courante ? refusee && i === etapes.length - 1 ? <XCircle className="size-5" /> : <Check className="size-5" strokeWidth={3} /> : <Icon className="size-5" />}
                </span>
                <span className={cn("mt-3 text-sm font-bold", i <= courante ? "text-slate-900" : "text-slate-400")}>{label}</span>
                <span className="text-xs text-slate-500">{d}</span>
              </li>
            ))}
          </ol>
        </div>

        {fini ? (
          <div className={cn("mt-10 flex items-start gap-3 rounded-2xl p-4 text-sm", refusee ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>
            {refusee ? <XCircle className="mt-0.5 size-5 shrink-0" /> : <BadgeCheck className="mt-0.5 size-5 shrink-0" />}
            <p>
              <strong>{refusee ? "Votre demande a été refusée." : `Félicitations : vous êtes vérifié niveau ${dossier.niveau}.`}</strong>{" "}
              {dossier.commentaire ?? (refusee ? "Vous pouvez déposer une nouvelle demande avec des pièces complètes." : "Le badge apparaît sur votre profil public.")}
            </p>
          </div>
        ) : (
          <div className="mt-10 flex items-start gap-3 rounded-2xl bg-accent-50 p-4 text-sm text-accent-600">
            <Clock className="mt-0.5 size-5 shrink-0" />
            <p>
              <strong>Votre dossier est {courante >= 2 ? "en cours d'examen" : "en attente d'examen"}.</strong> L&apos;équipe GDC vérifie vos pièces. Vous serez prévenu par SMS dès la
              décision.
            </p>
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Pièces transmises</h2>
            {dossier.pieces.length === 0 && <p className="text-sm text-slate-400">Aucune pièce jointe à ce dossier.</p>}
            <ul className="space-y-2">
              {dossier.pieces.map((p, i) => (
                <li key={`${p.libelle}-${i}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <FileText className="size-4 text-brand-600" />
                  <span className="flex-1 font-medium text-slate-700">{p.libelle}</span>
                  {p.url ? (
                    <button type="button" onClick={() => ouvrir(p.url!)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
                      Voir <ExternalLink className="size-3.5" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <Check className="size-3.5" /> Reçu
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Historique</h2>
            {historique.length === 0 && <p className="text-sm text-slate-400">Aucune décision pour l&apos;instant.</p>}
            <ul className="space-y-3">
              {historique.map((h) => (
                <li key={h.cle} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
                  <span className={cn("flex size-10 items-center justify-center rounded-xl text-white", h.statut === "refusee" ? "bg-red-500" : "bg-emerald-500")}>
                    {h.statut === "refusee" ? <XCircle className="size-5" /> : <BadgeCheck className="size-5" />}
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
