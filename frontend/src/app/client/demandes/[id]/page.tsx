import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { apiActive } from "@/lib/api";
import { DEMANDES, getDemande } from "@/lib/data";
import DetailDemande from "./DetailDemande";
import DetailDemandeApi from "./DetailDemandeApi";

export function generateStaticParams() {
  return DEMANDES.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/client/demandes/[id]">): Promise<Metadata> {
  if (apiActive) return { title: "Ma demande" };
  const { id } = await params;
  return { title: getDemande(id)?.titre ?? "Demande" };
}

/** L'identifiant est lu dans la frontière Suspense (préchargement partiel), puis la demande est chargée dans le navigateur. */
async function DemandeDepuisApi({ params }: { params: PageProps<"/client/demandes/[id]">["params"] }) {
  const { id } = await params;
  return <DetailDemandeApi id={id} />;
}

export default async function DetailDemandePage({ params }: PageProps<"/client/demandes/[id]">) {
  // Avec l'API, la demande est chargée dans le navigateur (elle appartient à l'utilisateur connecté).
  if (apiActive) {
    return (
      <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-slate-100" />}>
        <DemandeDepuisApi params={params} />
      </Suspense>
    );
  }
  const { id } = await params;
  const demande = getDemande(id);
  if (!demande) notFound();
  return <DetailDemande demande={demande} />;
}
