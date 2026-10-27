"use client";

import { Check, ChevronRight, FileText, X } from "lucide-react";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { StatutVerificationBadge } from "@/components/shared/status";
import { Avatar, Button, Card, Field, PageHeader, Rating, Textarea, VerificationBadge } from "@/components/ui";
import { Drawer, Tabs } from "@/components/ui/interactive";
import { getMetier, getTechnicien, NIVEAUX, VERIFICATIONS, type StatutVerification, type Verification } from "@/lib/data";

type Filtre = "tous" | StatutVerification;

export default function GestionVerifications() {
  const [dossiers, setDossiers] = useState(VERIFICATIONS);
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [selection, setSelection] = useState<Verification | null>(null);
  const [ouvert, setOuvert] = useState(false);

  const liste = dossiers.filter((d) => filtre === "tous" || d.statut === filtre);
  const count = (s: StatutVerification) => dossiers.filter((d) => d.statut === s).length;

  const ouvrir = (v: Verification) => {
    setSelection(v);
    setOuvert(true);
  };

  const decider = (statut: StatutVerification) => {
    if (!selection) return;
    setDossiers(dossiers.map((d) => (d.id === selection.id ? { ...d, statut } : d)));
    setOuvert(false);
    toast(statut === "approuvee" ? "Vérification approuvée, le technicien est notifié" : "Vérification refusée", statut === "approuvee" ? "success" : "info");
  };

  const tech = selection ? getTechnicien(selection.technicienId) : undefined;

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
        <Reveal className="mt-5 space-y-2" deps={[filtre, dossiers]} y={12} stagger={0.05}>
          {liste.map((v) => {
            const t = getTechnicien(v.technicienId)!;
            return (
              <button
                key={v.id}
                onClick={() => ouvrir(v)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-200 hover:shadow-md"
              >
                <Avatar nom={t.nom} className="size-11 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{t.nom}</p>
                  <p className="text-xs text-slate-500">
                    {getMetier(t.metier).label} · {t.zone} · soumise le {v.date}
                  </p>
                </div>
                <span className="hidden rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 sm:block">Niveau {v.niveau}</span>
                <span className="hidden text-xs text-slate-500 md:block">{v.pieces.length} pièces</span>
                <StatutVerificationBadge statut={v.statut} />
                <ChevronRight className="size-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
              </button>
            );
          })}
        </Reveal>
      </Card>

      <Drawer
        open={ouvert}
        onClose={() => setOuvert(false)}
        title="Dossier de vérification"
        footer={
          selection && ["en_attente", "en_cours"].includes(selection.statut) ? (
            <>
              <Button variant="danger" className="flex-1" onClick={() => decider("refusee")}>
                <X className="size-4" /> Refuser
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => decider("approuvee")}>
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
              <Avatar nom={tech.nom} className="size-16 text-lg" />
              <div>
                <p className="text-lg font-bold text-slate-900">{tech.nom}</p>
                <p className="text-sm text-slate-500">
                  {getMetier(tech.metier).label} · {tech.experience} ans
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Rating note={tech.note} nbAvis={tech.nbAvis} className="text-xs" />
                  <VerificationBadge niveau={tech.niveau} />
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
            <div>
              <p className="mb-2 text-sm font-bold text-slate-900">Justificatifs</p>
              <ul className="grid grid-cols-2 gap-2">
                {selection.pieces.map((p, i) => (
                  <li key={p} className="overflow-hidden rounded-xl ring-1 ring-slate-200">
                    <div className={`flex h-20 items-center justify-center bg-gradient-to-br ${i % 2 ? "from-accent-100 to-accent-200" : "from-brand-100 to-brand-200"} text-brand-700/50`}>
                      <FileText className="size-7" />
                    </div>
                    <p className="truncate p-2 text-xs font-semibold text-slate-700">{p}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-slate-900">Points de contrôle</p>
              <ul className="space-y-1.5 text-sm">
                {["Document lisible et non expiré", "Nom identique au profil", "Cohérence avec le métier déclaré"].map((c) => (
                  <li key={c} className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" defaultChecked className="size-4 accent-brand-600" /> {c}
                  </li>
                ))}
              </ul>
            </div>
            {selection.commentaire && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">💬 {selection.commentaire}</p>}
            <Field label="Commentaire pour le technicien">
              <Textarea placeholder="Motif de la décision, éléments manquants…" className="min-h-20" />
            </Field>
          </>
        )}
      </Drawer>
    </>
  );
}
