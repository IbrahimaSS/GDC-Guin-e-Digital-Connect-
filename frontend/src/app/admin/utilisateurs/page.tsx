import type { Metadata } from "next";
import GestionUtilisateurs from "./GestionUtilisateurs";

export const metadata: Metadata = { title: "Gestion des utilisateurs" };

export default function UtilisateursPage() {
  return <GestionUtilisateurs />;
}
