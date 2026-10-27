import type { Metadata } from "next";
import SuiviVerification from "./SuiviVerification";

export const metadata: Metadata = { title: "Suivi de vérification" };

export default function SuiviVerificationPage() {
  return <SuiviVerification />;
}
