import type { Metadata } from "next";
import InscriptionTechnicienForm from "./InscriptionTechnicienForm";

export const metadata: Metadata = { title: "Inscription technicien" };

export default function InscriptionTechnicienPage() {
  return <InscriptionTechnicienForm />;
}
