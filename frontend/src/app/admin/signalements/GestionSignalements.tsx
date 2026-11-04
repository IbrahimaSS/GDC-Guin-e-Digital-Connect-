"use client";

import { AlertOctagon, Check, Flag, Play, ShieldAlert, UserX } from "lucide-react";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { StatutSignalementBadge } from "@/components/shared/status";
import { Badge, Button, Card, cn, EmptyState, PageHeader, StatCard, type Tone } from "@/components/ui";
import { Tabs } from "@/components/ui/interactive";
import { dateCourte, useStatsAdmin } from "@/lib/admin";
import { api, apiActive, texteErreur } from "@/lib/api";
import { SIGNALEMENTS, type Signalement, type StatutSignalement } from "@/lib/data";
import { useApi } from "@/lib/useApi";

const PRIORITES: Record<string, [Tone, string]> = {
  haute: ["red", "Priorité haute"],
  moyenne: ["amber", "Priorité moyenne"],
  basse: ["slate", "Priorité basse"],
};

type Filtre = "tous" | StatutSignalement;

interface SignalementApi {
  id: string;
  type: string;
  cible: string;
  cibleLibelle: string;
  motif: string;
  priorite: "haute" | "moyenne" | "basse";
  statut: "OUVERT" | "EN_COURS" | "RESOLU";
  createdAt: string;
  auteur: { prenom: string; nom: string } | null;
}

/** Nature du signalement, d'après l'élément visé. */
const TYPES: Record<string, string> = {
  technicien: "Profil technicien",
  client: "Compte client",
  demande: "Litige mission",
  avis: "Avis signalé",
  autre: "Autre",
};

type Ligne = Omit<Signalement, "type"> & { type: string };

export default function GestionSignalements() {
  const distants = useApi<SignalementApi[]>(apiActive ? "/admin/signalements" : null);
  const stats = useStatsAdmin();
  const [locaux, setLocaux] = useState<Ligne[]>(SIGNALEMENTS);
  const items: Ligne[] = apiActive
    ? (distants.donnees ?? []).map((s) => ({
        id: s.id,
        type: TYPES[s.type] ?? s.type,
        cible: s.cibleLibelle,
        auteur: s.auteur ? `${s.auteur.prenom} ${s.auteur.nom}` : "Anonyme",
        motif: s.motif,
        date: dateCourte(s.createdAt),
        statut: s.statut.toLowerCase() as StatutSignalement,
        priorite: s.priorite,
      }))
    : locaux;
  const [filtre, setFiltre] = useState<Filtre>("ouvert");
  const liste = items.filter((s) => filtre === "tous" || s.statut === filtre);
  const count = (s: StatutSignalement) => items.filter((i) => i.statut === s).length;

  async function avancer(id: string, statut: StatutSignalement) {
    if (apiActive) {
      try {
        await api(`/admin/signalements/${id}`, { methode: "PATCH", corps: { statut: statut.toUpperCase() } });
        distants.recharger();
        stats.recharger();
      } catch (e) {
        return toast(texteErreur(e), "error");
      }
    } else {
      setLocaux(locaux.map((s) => (s.id === id ? { ...s, statut } : s)));
    }
    toast(statut === "resolu" ? "Signalement résolu" : "Signalement pris en charge");
  }

  return (
    <>
      <PageHeader title="Signalements" subtitle="Profils suspects, avis frauduleux, litiges : traitez les alertes de la communauté." />
      <Reveal className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Flag} label="Ouverts" value={count("ouvert")} tone="red" />
        <StatCard icon={ShieldAlert} label="En cours" value={count("en_cours")} tone="blue" />
        <StatCard icon={Check} label="Résolus ce mois" value={apiActive ? (stats.donnees?.signalements.resolusCeMois ?? 0) : 27} tone="green" />
        <StatCard icon={AlertOctagon} label="Délai moyen de résolution (h)" value={apiActive ? (stats.donnees?.signalements.delaiMoyenHeures ?? 0) : 6} tone="amber" />
      </Reveal>
      <Card className="p-5">
        <Tabs<Filtre>
          value={filtre}
          onChange={setFiltre}
          tabs={[
            { id: "ouvert", label: "Ouverts", count: count("ouvert") },
            { id: "en_cours", label: "En cours", count: count("en_cours") },
            { id: "resolu", label: "Résolus", count: count("resolu") },
            { id: "tous", label: "Tous", count: items.length },
          ]}
        />
        {liste.length === 0 && (
          <div className="mt-5">
            <EmptyState icon={Flag} title={distants.chargement ? "Chargement…" : "Aucun signalement"} text="Aucun signalement dans cette catégorie." />
          </div>
        )}
        <Reveal className="mt-5 grid gap-3 lg:grid-cols-2" deps={[filtre, items.length]} y={14} stagger={0.06}>
          {liste.map((s) => (
            <div key={s.id} className={cn("rounded-2xl border p-5", s.priorite === "haute" && s.statut !== "resolu" ? "border-red-200 bg-red-50/30" : "border-slate-200")}>
              <div className="flex items-start gap-3">
                <span className={cn("rounded-xl p-2.5", s.priorite === "haute" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600")}>
                  {s.type === "Usurpation d'identité" ? <UserX className="size-5" /> : <Flag className="size-5" />}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-900">{s.type}</p>
                    <StatutSignalementBadge statut={s.statut} />
                  </div>
                  <p className="text-sm text-slate-500">
                    Cible : <span className="font-semibold text-slate-700">{s.cible}</span> · par {s.auteur}
                  </p>
                </div>
              </div>
              <p className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700 ring-1 ring-slate-100">{s.motif}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone={PRIORITES[s.priorite][0]}>{PRIORITES[s.priorite][1]}</Badge>
                <span className="text-xs text-slate-400">{s.date}</span>
                <div className="ml-auto flex gap-2">
                  {s.statut === "ouvert" && (
                    <Button size="sm" variant="outline" onClick={() => avancer(s.id, "en_cours")}>
                      <Play className="size-3.5" /> Prendre en charge
                    </Button>
                  )}
                  {s.statut !== "resolu" && (
                    <Button size="sm" variant="secondary" onClick={() => avancer(s.id, "resolu")}>
                      <Check className="size-3.5" /> Résoudre
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Reveal>
      </Card>
    </>
  );
}
