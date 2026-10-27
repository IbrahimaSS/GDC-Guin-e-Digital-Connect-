import type { Metadata } from "next";
import { Suspense } from "react";
import ConnexionForm from "./ConnexionForm";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-slate-50" />}>
      <ConnexionForm />
    </Suspense>
  );
}
