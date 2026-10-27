import type { Metadata } from "next";
import DemandesRecues from "./DemandesRecues";

export const metadata: Metadata = { title: "Demandes reçues" };

export default function DemandesRecuesPage() {
  return <DemandesRecues />;
}
