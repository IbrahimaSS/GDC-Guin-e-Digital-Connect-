import type { Metadata } from "next";
import GestionMetiers from "./GestionMetiers";

export const metadata: Metadata = { title: "Métiers" };

export default function MetiersPage() {
  return <GestionMetiers />;
}
