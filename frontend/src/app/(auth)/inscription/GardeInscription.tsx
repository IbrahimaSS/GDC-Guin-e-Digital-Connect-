"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useParametresPublics } from "@/lib/plateforme";

/** Si les inscriptions sont fermées dans le back-office, on le dit avant que le visiteur remplisse le formulaire. */
export default function GardeInscription({ children }: { children: ReactNode }) {
  const fermees = useParametresPublics()?.inscriptionsOuvertes === false;
  return (
    <>
      {fermees && (
        <div className="rounded-2xl bg-slate-50 p-8 text-center ring-1 ring-slate-200">
          <Lock className="mx-auto size-8 text-slate-400" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Inscriptions momentanément fermées</h1>
          <p className="mt-2 text-sm text-slate-500">La création de nouveaux comptes est suspendue. Revenez bientôt !</p>
          <Link href="/connexion" className="mt-5 inline-block text-sm font-semibold text-brand-600 hover:underline">
            Vous avez déjà un compte ? Se connecter
          </Link>
        </div>
      )}
      <div hidden={fermees}>{children}</div>
    </>
  );
}
