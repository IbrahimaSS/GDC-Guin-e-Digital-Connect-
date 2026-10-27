import type { Metadata } from "next";
import ChoixCompte from "./ChoixCompte";

export const metadata: Metadata = { title: "Créer un compte" };

export default function InscriptionPage() {
  return <ChoixCompte />;
}
