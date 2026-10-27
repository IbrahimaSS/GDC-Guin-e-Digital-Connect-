import type { Metadata } from "next";
import { Suspense } from "react";
import PublierDemandeWizard from "./PublierDemandeWizard";

export const metadata: Metadata = {
  title: "Publier une demande",
  description: "Décrivez votre besoin et entrez en relation avec un technicien ou un artisan vérifié.",
};

export default function PublierUneDemandePage() {
  return (
    <>
      <section className="bg-brand-950 pb-28 pt-12 text-white">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-400">Publier une demande</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Un problème à résoudre ? Trouvons le bon professionnel.</h1>
          <p className="mt-2 max-w-2xl text-brand-100/80">Décrivez votre besoin en 2 étapes, puis identifiez-vous pour l&apos;envoyer aux professionnels vérifiés de votre zone.</p>
        </div>
      </section>
      <div className="relative mx-auto -mt-20 max-w-6xl px-4 pb-16 md:px-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
          <PublierDemandeWizard />
        </Suspense>
      </div>
    </>
  );
}
