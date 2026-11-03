"use client";

import { BriefcaseBusiness } from "lucide-react";
import { EmptyState, LinkButton } from "@/components/ui";
import { useDemande } from "@/lib/demandes";
import DetailMission from "./DetailMission";

/** Détail d'une mission chargée depuis l'API. */
export default function DetailMissionApi({ id }: { id: string }) {
  const { demande, chargement, erreur, recharger } = useDemande(id);

  if (chargement) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }
  if (!demande) {
    return (
      <div className="space-y-4 text-center">
        <EmptyState icon={BriefcaseBusiness} title="Mission introuvable" text={erreur ?? "Cette demande n'existe pas ou n'est plus disponible."} />
        <LinkButton href="/technicien/demandes" variant="outline">
          Retour aux demandes
        </LinkButton>
      </div>
    );
  }
  return <DetailMission mission={demande} onChange={recharger} />;
}
