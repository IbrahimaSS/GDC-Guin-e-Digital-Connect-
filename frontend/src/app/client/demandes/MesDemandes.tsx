"use client";

import { ClipboardList, PlusCircle, Search } from "lucide-react";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import DemandeRow from "@/components/shared/DemandeRow";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { Tabs } from "@/components/ui/interactive";
import { DEMANDES, type StatutDemande } from "@/lib/data";

type Filtre = "toutes" | StatutDemande;

export default function MesDemandes() {
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [q, setQ] = useState("");

  const count = (s: StatutDemande) => DEMANDES.filter((d) => d.statut === s).length;
  const liste = DEMANDES.filter((d) => (filtre === "toutes" || d.statut === filtre) && d.titre.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Mes demandes"
        subtitle="Suivez l'avancement de toutes vos demandes d'intervention."
        actions={
          <LinkButton href="/client/demandes/nouvelle">
            <PlusCircle className="size-4" /> Nouvelle demande
          </LinkButton>
        }
      />
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <Tabs<Filtre>
            value={filtre}
            onChange={setFiltre}
            tabs={[
              { id: "toutes", label: "Toutes", count: DEMANDES.length },
              { id: "envoyee", label: "En attente", count: count("envoyee") },
              { id: "acceptee", label: "Acceptées", count: count("acceptee") },
              { id: "en_cours", label: "En cours", count: count("en_cours") },
              { id: "terminee", label: "Terminées", count: count("terminee") },
              { id: "annulee", label: "Annulées", count: count("annulee") },
            ]}
          />
          <label className="relative mb-2 lg:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une demande"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-brand-300 focus:bg-white"
            />
          </label>
        </div>
        <div className="mt-5">
          {liste.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Aucune demande" text="Aucune demande ne correspond à ce filtre." />
          ) : (
            <Reveal className="space-y-2" deps={[filtre, q]} y={14} stagger={0.05}>
              {liste.map((d) => (
                <DemandeRow key={d.id} demande={d} href={`/client/demandes/${d.id}`} />
              ))}
            </Reveal>
          )}
        </div>
      </Card>
    </>
  );
}
