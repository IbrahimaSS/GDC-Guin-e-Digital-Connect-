import type { Metadata } from "next";
import { Suspense } from "react";
import InscriptionTechnicienForm from "./InscriptionTechnicienForm";

export const metadata: Metadata = { title: "Inscription technicien" };

export default function InscriptionTechnicienPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-slate-50" />}>
      <InscriptionTechnicienForm />
    </Suspense>
  );
}
