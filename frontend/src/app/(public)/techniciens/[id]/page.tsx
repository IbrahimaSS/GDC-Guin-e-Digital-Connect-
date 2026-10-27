import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTechnicien, TECHNICIENS } from "@/lib/data";
import ProfilPublic from "./ProfilPublic";

export function generateStaticParams() {
  return TECHNICIENS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/techniciens/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getTechnicien(id)?.nom ?? "Profil introuvable" };
}

export default async function ProfilTechnicienPage({ params }: PageProps<"/techniciens/[id]">) {
  const { id } = await params;
  const tech = getTechnicien(id);
  if (!tech) notFound();
  return <ProfilPublic tech={tech} />;
}
