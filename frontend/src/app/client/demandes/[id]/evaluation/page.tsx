import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMANDES, getDemande } from "@/lib/data";
import EvaluationForm from "./EvaluationForm";

export const metadata: Metadata = { title: "Évaluer la mission" };

export function generateStaticParams() {
  return DEMANDES.map((d) => ({ id: d.id }));
}

export default async function EvaluationPage({ params }: PageProps<"/client/demandes/[id]/evaluation">) {
  const { id } = await params;
  const demande = getDemande(id);
  if (!demande) notFound();
  return <EvaluationForm demande={demande} />;
}
