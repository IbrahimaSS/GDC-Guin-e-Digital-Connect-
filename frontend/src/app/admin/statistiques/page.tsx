import type { Metadata } from "next";
import Statistiques from "./Statistiques";

export const metadata: Metadata = { title: "Statistiques" };

export default function StatistiquesPage() {
  return <Statistiques />;
}
