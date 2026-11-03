import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { apiActive } from "@/lib/api";
import { DEMANDES, getDemande } from "@/lib/data";
import EvaluationForm, { EvaluationApi } from "./EvaluationForm";

export const metadata: Metadata = { title: "Évaluer la mission" };

export function generateStaticParams() {
  return DEMANDES.map((d) => ({ id: d.id }));
}

/** L'identifiant est lu dans la frontière Suspense (préchargement partiel), puis la demande est chargée dans le navigateur. */
async function EvaluationDepuisApi({ params }: { params: PageProps<"/client/demandes/[id]/evaluation">["params"] }) {
  const { id } = await params;
  return <EvaluationApi id={id} />;
}

export default async function EvaluationPage({ params }: PageProps<"/client/demandes/[id]/evaluation">) {
  if (apiActive) {
    return (
      <Suspense fallback={<div className="mx-auto h-80 max-w-2xl animate-pulse rounded-2xl bg-slate-100" />}>
        <EvaluationDepuisApi params={params} />
      </Suspense>
    );
  }
  const { id } = await params;
  const demande = getDemande(id);
  if (!demande) notFound();
  return <EvaluationForm demande={demande} />;
}
