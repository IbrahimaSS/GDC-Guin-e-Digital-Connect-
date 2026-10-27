import type { Metadata } from "next";
import { Suspense } from "react";
import ResultatsView from "./ResultatsView";

export const metadata: Metadata = { title: "Résultats de recherche" };

function Chargement() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />
      ))}
    </div>
  );
}

export default function ResultatsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <Suspense fallback={<Chargement />}>
        <ResultatsView />
      </Suspense>
    </div>
  );
}
