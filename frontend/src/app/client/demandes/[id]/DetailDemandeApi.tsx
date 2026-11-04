"use client";

import { ClipboardList } from "lucide-react";
import { EmptyState, LinkButton } from "@/components/ui";
import { useDemande } from "@/lib/demandes";
import DetailDemande from "./DetailDemande";

/** Détail d'une demande chargée depuis l'API. */
export default function DetailDemandeApi({ id }: { id: string }) {
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
        <EmptyState icon={ClipboardList} title="Demande introuvable" text={erreur ?? "Cette demande n'existe pas ou ne vous appartient pas."} />
        <LinkButton href="/client/demandes" variant="outline">
          Retour à mes demandes
        </LinkButton>
      </div>
    );
  }
  return <DetailDemande demande={demande} onChange={recharger} />;
}
