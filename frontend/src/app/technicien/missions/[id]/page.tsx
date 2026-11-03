import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { apiActive } from "@/lib/api";
import { DEMANDES_RECUES, getDemande } from "@/lib/data";
import DetailMission from "./DetailMission";
import DetailMissionApi from "./DetailMissionApi";

export function generateStaticParams() {
  return DEMANDES_RECUES.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/technicien/missions/[id]">): Promise<Metadata> {
  if (apiActive) return { title: "Mission" };
  const { id } = await params;
  return { title: `Mission ${getDemande(id)?.reference ?? ""}` };
}

/** L'identifiant est lu dans la frontière Suspense (préchargement partiel), puis la mission est chargée dans le navigateur. */
async function MissionDepuisApi({ params }: { params: PageProps<"/technicien/missions/[id]">["params"] }) {
  const { id } = await params;
  return <DetailMissionApi id={id} />;
}

export default async function DetailMissionPage({ params }: PageProps<"/technicien/missions/[id]">) {
  if (apiActive) {
    return (
      <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-slate-100" />}>
        <MissionDepuisApi params={params} />
      </Suspense>
    );
  }
  const { id } = await params;
  const mission = getDemande(id);
  if (!mission) notFound();
  return <DetailMission mission={mission} />;
}
