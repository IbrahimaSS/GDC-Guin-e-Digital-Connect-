import type { Metadata } from "next";
import MetiersEtDisponibles from "./MetiersEtDisponibles";
import RechercheForm from "./RechercheForm";

export const metadata: Metadata = { title: "Trouver un technicien" };

export default function RecherchePage() {
  return (
    <>
      {/* En-tête */}
      <section className="relative overflow-hidden bg-brand-950 pb-32 pt-14 text-white">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-brand-600/40 blur-[100px]" aria-hidden />
        <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-accent-500/20 blur-[100px]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-400">Trouver un technicien</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Rechercher un professionnel</h1>
          <p className="mt-2 max-w-2xl text-brand-100/80">Précisez votre besoin, nous vous montrons les techniciens vérifiés les plus proches de chez vous.</p>
        </div>
      </section>

      <div className="relative mx-auto -mt-24 max-w-6xl px-4 md:px-6">
        <RechercheForm />
      </div>

      <MetiersEtDisponibles />
    </>
  );
}
