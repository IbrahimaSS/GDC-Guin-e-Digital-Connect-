"use client";

import { Check, ChevronRight, ExternalLink, FileText, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import ChargementListe from "@/components/shared/ChargementListe";
import { StatutVerificationBadge } from "@/components/shared/status";
import { Avatar, Button, Card, EmptyState, Field, PageHeader, Rating, Textarea, VerificationBadge } from "@/components/ui";
import { Drawer, Tabs } from "@/components/ui/interactive";
import { dateCourte } from "@/lib/admin";
import { api, apiActive, texteErreur } from "@/lib/api";
import { getMetier, getTechnicien, NIVEAUX, VERIFICATIONS, type Niveau, type StatutVerification } from "@/lib/data";
import { ouvrirPiece } from "@/lib/fichiers";
import { useApi } from "@/lib/useApi";

type Filtre = "tous" | StatutVerification;

interface VerificationApi {
  id: string;
  niveau: number;
  statut: "EN_ATTENTE" | "EN_COURS" | "APPROUVEE" | "REFUSEE";
  pieces: { type: string; url: string }[];
  message: string | null;
  commentaire: string | null;
  createdAt: string;
  decideLe: string | null;
  decideur: { prenom: string; nom: string } | null;
  technicien: { id: string; nom: string; telephone: string; photoUrl: string | null; metier: string; niveau: number };
}

const LIBELLES_PIECES: Record<string, string> = {
  piece_identite: "Pièce d'identité",
  selfie: "Selfie de contrôle",
  diplome: "Diplôme ou attestation",
  attestation: "Attestation d'employeur",
  photos_realisations: "Photos de réalisations",
  recommandation: "Recommandation",
};

/** Dossier au format de l'écran, quelle que soit la source. */
interface Dossier {
  id: string;
  niveau: Niveau;
  statut: StatutVerification;
  date: string;
  pieces: { libelle: string; url?: string }[];
  message?: string;
  commentaire?: string;
  decision?: string;
  technicien: { id: string; nom: string; photo?: string; metier: string; telephone?: string; niveau: number; detail?: string; note?: number; nbAvis?: number };
}

function depuisApi(v: VerificationApi): Dossier {
  return {
    id: v.id,
    niveau: Math.min(3, Math.max(1, v.niveau)) as Niveau,
    statut: v.statut.toLowerCase() as StatutVerification,
    date: dateCourte(v.createdAt),
    pieces: v.pieces.map((p) => ({ libelle: LIBELLES_PIECES[p.type] ?? p.type, url: p.url })),
    message: v.message ?? undefined,
    commentaire: v.commentaire ?? undefined,
    decision: v.decideLe ? `Décidé le ${dateCourte(v.decideLe)}${v.decideur ? ` par ${v.decideur.prenom} ${v.decideur.nom}` : ""}` : undefined,
    technicien: { id: v.technicien.id, nom: v.technicien.nom, photo: v.technicien.photoUrl ?? undefined, metier: v.technicien.metier, telephone: v.technicien.telephone, niveau: v.technicien.niveau },
  };
}

const DEMO: Dossier[] = VERIFICATIONS.map((v) => {
  const t = getTechnicien(v.technicienId)!;
  return {
    id: v.id,
    niveau: v.niveau,
    statut: v.statut,
    date: v.date,
    pieces: v.pieces.map((libelle) => ({ libelle })),
    commentaire: v.commentaire,
    technicien: { id: t.id, nom: t.nom, metier: getMetier(t.metier).label, niveau: t.niveau, detail: `${t.zone}`, note: t.note, nbAvis: t.nbAvis },
  };
});

export default function GestionVerifications() {
  const distants = useApi<VerificationApi[]>(apiActive ? "/admin/verifications" : null);
  const [locaux, setLocaux] = useState(DEMO);
  const dossiers = apiActive ? (distants.donnees ?? []).map(depuisApi) : locaux;
  const [filtre, setFiltre] = useState<Filtre>(apiActive ? "en_attente" : "tous");
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const selection = dossiers.find((d) => d.id === selectionId) ?? null;
  const liste = dossiers.filter((d) => filtre === "tous" || d.statut === filtre);
  const count = (s: StatutVerification) => dossiers.filter((d) => d.statut === s).length;

  async function ouvrir(v: Dossier) {
    setSelectionId(v.id);
    setCommentaire("");
    setOuvert(true);
    // Le dossier passe « en cours » à l'ouverture : un autre administrateur voit qu'il est pris en charge.
    if (apiActive && v.statut === "en_attente") {
      try {
        await api(`/admin/verifications/${v.id}/prendre`, { methode: "POST" });
        distants.recharger();
      } catch {
        // Déjà pris en charge par un autre administrateur : la liste se met à jour au rechargement.
        distants.recharger();
      }
    }
  }

  async function decider(statut: "approuvee" | "refusee") {
    if (!selection) return;
    if (statut === "refusee" && !commentaire.trim()) return toast("Indiquez au technicien le motif du refus.", "error");
    if (!apiActive) {
      setLocaux(locaux.map((d) => (d.id === selection.id ? { ...d, statut } : d)));
    } else {
      setEnvoi(true);
      try {
        await api(`/admin/verifications/${selection.id}/decision`, {
          methode: "POST",
          corps: { decision: statut === "approuvee" ? "APPROUVEE" : "REFUSEE", commentaire: commentaire.trim() || undefined },
        });
        distants.recharger();
      } catch (e) {
        return toast(texteErreur(e), "error");
      } finally {
        setEnvoi(false);
      }
    }
    setOuvert(false);
    toast(statut === "approuvee" ? "Vérification approuvée, le technicien est notifié" : "Vérification refusée, le technicien est notifié", statut === "approuvee" ? "success" : "info");
  }

  async function voir(url: string) {
    try {
      await ouvrirPiece(url);
    } catch (e) {
      toast(texteErreur(e), "error");
    }
  }

  const tech = selection?.technicien;

  return (
    <>
      <PageHeader title="Demandes de vérification" subtitle="Contrôlez les justificatifs et attribuez les niveaux de vérification." />
      <Card className="p-5">
        <Tabs<Filtre>
          value={filtre}
          onChange={setFiltre}
          tabs={[
            { id: "tous", label: "Toutes", count: dossiers.length },
            { id: "en_attente", label: "En attente", count: count("en_attente") },
            { id: "en_cours", label: "En cours", count: count("en_cours") },
            { id: "approuvee", label: "Approuvées", count: count("approuvee") },
            { id: "refusee", label: "Refusées", count: count("refusee") },
          ]}
        />
        {distants.chargement ? (
          <div className="mt-5">
            <ChargementListe />
          </div>
        ) : liste.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon={ShieldCheck} title="Aucun dossier" text="Aucune demande de vérification dans cette catégorie." />
          </div>
        ) : (
          <Reveal className="mt-5 space-y-2" deps={[filtre, liste.length]} y={12} stagger={0.05}>
            {liste.map((v) => (
              <button
                key={v.id}
                onClick={() => ouvrir(v)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-200 hover:shadow-md"
              >
                <Avatar nom={v.technicien.nom} photo={v.technicien.photo} className="size-11 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{v.technicien.nom}</p>
                  <p className="text-xs text-slate-500">
                    {v.technicien.metier}
                    {v.technicien.detail && ` · ${v.technicien.detail}`} · soumise le {v.date}
                  </p>
                </div>
                <span className="hidden rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 sm:block">Niveau {v.niveau}</span>
                <span className="hidden text-xs text-slate-500 md:block">
                  {v.pieces.length} pièce{v.pieces.length > 1 ? "s" : ""}
                </span>
                <StatutVerificationBadge statut={v.statut} />
                <ChevronRight className="size-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
              </button>
            ))}
          </Reveal>
        )}
      </Card>

      <Drawer
        open={ouvert}
        onClose={() => setOuvert(false)}
        title="Dossier de vérification"
        footer={
          selection && ["en_attente", "en_cours"].includes(selection.statut) ? (
            <>
              <Button variant="danger" className="flex-1" disabled={envoi} onClick={() => decider("refusee")}>
                <X className="size-4" /> Refuser
              </Button>
              <Button variant="secondary" className="flex-1" disabled={envoi} onClick={() => decider("approuvee")}>
                <Check className="size-4" /> Approuver
              </Button>
            </>
          ) : (
            <Button variant="ghost" className="flex-1" onClick={() => setOuvert(false)}>
              Fermer
            </Button>
          )
        }
      >
        {selection && tech && (
          <>
            <div className="flex items-center gap-4">
              <Avatar nom={tech.nom} photo={tech.photo} className="size-16 text-lg" />
              <div>
                <p className="text-lg font-bold text-slate-900">{tech.nom}</p>
                <p className="text-sm text-slate-500">
                  {tech.metier}
                  {tech.telephone && ` · ${tech.telephone}`}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {tech.note !== undefined && <Rating note={tech.note} nbAvis={tech.nbAvis} className="text-xs" />}
                  {tech.niveau >= 1 ? <VerificationBadge niveau={Math.min(3, tech.niveau) as Niveau} /> : <span className="text-xs font-semibold text-amber-600">Identité non vérifiée</span>}
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-brand-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Niveau demandé</p>
              <p className="mt-1 font-bold text-brand-900">
                Niveau {selection.niveau} – {NIVEAUX[selection.niveau].label}
              </p>
              <p className="text-sm text-brand-800/80">{NIVEAUX[selection.niveau].description}</p>
            </div>
            {selection.message && (
              <div>
                <p className="mb-1 text-sm font-bold text-slate-900">Message du technicien</p>
                <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{selection.message}</p>
              </div>
            )}
            <div>
              <p className="mb-2 text-sm font-bold text-slate-900">Justificatifs</p>
              {selection.pieces.length === 0 && <p className="text-sm text-slate-400">Aucune pièce jointe.</p>}
              <ul className="grid grid-cols-2 gap-2">
                {selection.pieces.map((p, i) => (
                  <li key={`${p.libelle}-${i}`} className="overflow-hidden rounded-xl ring-1 ring-slate-200">
                    <button
                      type="button"
                      disabled={!p.url}
                      onClick={() => p.url && voir(p.url)}
                      className={`flex h-20 w-full items-center justify-center bg-gradient-to-br ${i % 2 ? "from-accent-100 to-accent-200" : "from-brand-100 to-brand-200"} text-brand-700/60 transition enabled:hover:opacity-80`}
                      aria-label={`Ouvrir ${p.libelle}`}
                    >
                      {p.url ? <ExternalLink className="size-6" /> : <FileText className="size-7" />}
                    </button>
                    <p className="truncate p-2 text-xs font-semibold text-slate-700">{p.libelle}</p>
                  </li>
                ))}
              </ul>
              {apiActive && selection.pieces.length > 0 && <p className="mt-2 text-xs text-slate-400">Les pièces s&apos;ouvrent dans un nouvel onglet (accès réservé à l&apos;équipe GDC).</p>}
            </div>
            {["en_attente", "en_cours"].includes(selection.statut) ? (
              <>
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-900">Points de contrôle</p>
                  <ul className="space-y-1.5 text-sm">
                    {["Document lisible et non expiré", "Nom identique au profil", "Cohérence avec le métier déclaré"].map((c) => (
                      <li key={c} className="flex items-center gap-2 text-slate-600">
                        <input type="checkbox" className="size-4 accent-brand-600" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <Field label="Commentaire pour le technicien" hint="Obligatoire en cas de refus : le technicien le lit dans le suivi de sa vérification.">
                  <Textarea maxLength={500} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Motif de la décision, éléments manquants…" className="min-h-20" />
                </Field>
              </>
            ) : (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                {selection.decision && <p className="font-semibold text-slate-800">{selection.decision}</p>}
                {selection.commentaire && <p className="mt-1">{selection.commentaire}</p>}
              </div>
            )}
          </>
        )}
      </Drawer>
    </>
  );
}
