import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMANDES_RECUES, getDemande } from "@/lib/data";
import DetailMission from "./DetailMission";

export function generateStaticParams() {
  return DEMANDES_RECUES.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/technicien/missions/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Mission ${getDemande(id)?.reference ?? ""}` };
}

export default async function DetailMissionPage({ params }: PageProps<"/technicien/missions/[id]">) {
  const { id } = await params;
  const mission = getDemande(id);
  if (!mission) notFound();
  return <DetailMission mission={mission} />;
}
