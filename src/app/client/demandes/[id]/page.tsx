import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMANDES, getDemande } from "@/lib/data";
import DetailDemande from "./DetailDemande";

export function generateStaticParams() {
  return DEMANDES.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/client/demandes/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getDemande(id)?.titre ?? "Demande" };
}

export default async function DetailDemandePage({ params }: PageProps<"/client/demandes/[id]">) {
  const { id } = await params;
  const demande = getDemande(id);
  if (!demande) notFound();
  return <DetailDemande demande={demande} />;
}
