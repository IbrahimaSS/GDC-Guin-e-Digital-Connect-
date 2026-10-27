import type { Metadata } from "next";
import GestionTechniciens from "./GestionTechniciens";

export const metadata: Metadata = { title: "Gestion des techniciens" };

export default function TechniciensPage() {
  return <GestionTechniciens />;
}
