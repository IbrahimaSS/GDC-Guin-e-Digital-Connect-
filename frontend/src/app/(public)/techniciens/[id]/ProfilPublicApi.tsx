"use client";

import { UserX } from "lucide-react";
import { EmptyState, LinkButton } from "@/components/ui";
import { useProfilTechnicien } from "@/lib/techniciens";
import ProfilPublic from "./ProfilPublic";

/** Profil public d'un technicien chargé depuis l'API. */
export default function ProfilPublicApi({ id }: { id: string }) {
  const { tech, chargement } = useProfilTechnicien(id);

  if (chargement) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6" aria-busy="true">
        <div className="h-56 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }
  if (!tech) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
        <EmptyState icon={UserX} title="Profil introuvable" text="Ce professionnel n'existe pas ou son profil n'est pas encore vérifié." />
        <LinkButton href="/resultats" variant="outline">
          Voir les professionnels
        </LinkButton>
      </div>
    );
  }
  return <ProfilPublic tech={tech} />;
}
