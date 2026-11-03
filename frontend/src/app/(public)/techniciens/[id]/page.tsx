import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { apiActive } from "@/lib/api";
import { getTechnicien, TECHNICIENS } from "@/lib/data";
import ProfilPublic from "./ProfilPublic";
import ProfilPublicApi from "./ProfilPublicApi";

export function generateStaticParams() {
  return TECHNICIENS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/techniciens/[id]">): Promise<Metadata> {
  if (apiActive) return { title: "Profil du technicien" };
  const { id } = await params;
  return { title: getTechnicien(id)?.nom ?? "Profil introuvable" };
}

/** L'identifiant est lu dans la frontière Suspense (préchargement partiel), puis le profil est chargé dans le navigateur. */
async function ProfilDepuisApi({ params }: { params: PageProps<"/techniciens/[id]">["params"] }) {
  const { id } = await params;
  return <ProfilPublicApi id={id} />;
}

export default async function ProfilTechnicienPage({ params }: PageProps<"/techniciens/[id]">) {
  // Avec l'API, le profil est chargé dans le navigateur (il change à chaque avis ou réalisation).
  if (apiActive) {
    return (
      <Suspense fallback={<div className="mx-auto h-96 max-w-6xl animate-pulse rounded-3xl bg-slate-100" />}>
        <ProfilDepuisApi params={params} />
      </Suspense>
    );
  }
  const { id } = await params;
  const tech = getTechnicien(id);
  if (!tech) notFound();
  return <ProfilPublic tech={tech} />;
}
