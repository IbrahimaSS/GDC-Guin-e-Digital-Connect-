"use client";

import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { MetierIcon } from "@/components/ui";
import { useMetiers } from "@/lib/plateforme";

/** Grille des métiers de l'accueil, avec le nombre de professionnels (vérifiés, avec l'API). */
export default function GrilleMetiers() {
  const metiers = useMetiers();
  return (
    <Reveal className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8" stagger={0.05} scale={0.9} y={10} deps={[metiers.length]}>
      {metiers.map((m) => (
        <Link
          key={m.id}
          href={`/resultats?metier=${m.id}`}
          className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-accent-500/10 hover:ring-accent-500"
        >
          <span className="rounded-2xl bg-accent-50 p-3.5 text-accent-500 transition duration-300 group-hover:scale-110 group-hover:bg-accent-500 group-hover:text-white">
            <MetierIcon metier={m.id} className="size-6" />
          </span>
          <span className="text-sm font-semibold text-slate-800">{m.label}</span>
          <span className="-mt-2 text-xs text-slate-400">
            {m.techniciens} pro{m.techniciens > 1 ? "s" : ""}
          </span>
        </Link>
      ))}
    </Reveal>
  );
}
