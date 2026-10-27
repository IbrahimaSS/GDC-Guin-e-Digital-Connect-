import type { Metadata } from "next";
import { Suspense } from "react";
import NouvelleDemandeForm from "./NouvelleDemandeForm";

export const metadata: Metadata = { title: "Nouvelle demande" };

export default function NouvelleDemandePage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
      <NouvelleDemandeForm />
    </Suspense>
  );
}
