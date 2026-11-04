"use client";

import Reveal from "@/components/motion/Reveal";
import TechnicienProCard from "@/components/shared/TechnicienProCard";
import { apiActive } from "@/lib/api";
import { TECHNICIENS } from "@/lib/data";
import { useRechercheTechniciens } from "@/lib/techniciens";

/** Les 4 professionnels les mieux notés (vérifiés et visibles, avec l'API). */
export default function MeilleursTechniciens() {
  const recherche = useRechercheTechniciens({ tri: "note" });
  const top = apiActive ? recherche.resultats.slice(0, 4) : [...TECHNICIENS].sort((a, b) => b.note - a.note).slice(0, 4);
  return (
    <Reveal className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" stagger={0.1} y={30} deps={[top.length]}>
      {top.map((t) => (
        <TechnicienProCard key={t.id} tech={t} />
      ))}
    </Reveal>
  );
}
