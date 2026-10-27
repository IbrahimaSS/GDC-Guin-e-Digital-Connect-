import type { Metadata } from "next";
import GestionVerifications from "./GestionVerifications";

export const metadata: Metadata = { title: "Vérifications" };

export default function VerificationsPage() {
  return <GestionVerifications />;
}
