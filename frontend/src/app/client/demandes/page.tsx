import type { Metadata } from "next";
import MesDemandes from "./MesDemandes";

export const metadata: Metadata = { title: "Mes demandes" };

export default function MesDemandesPage() {
  return <MesDemandes />;
}
