import type { Metadata } from "next";
import ProfilProForm from "./ProfilProForm";

export const metadata: Metadata = { title: "Mon profil professionnel" };

export default function ProfilProPage() {
  return <ProfilProForm />;
}
