import type { Metadata } from "next";
import DemandeVerification from "./DemandeVerification";

export const metadata: Metadata = { title: "Demande de vérification" };

export default function VerificationPage() {
  return <DemandeVerification />;
}
