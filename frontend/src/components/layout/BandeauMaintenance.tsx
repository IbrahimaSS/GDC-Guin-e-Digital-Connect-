"use client";

import { Wrench } from "lucide-react";
import { useParametresPublics } from "@/lib/plateforme";

/** Bandeau affiché aux visiteurs quand le mode maintenance est activé dans le back-office. */
export default function BandeauMaintenance() {
  const p = useParametresPublics();
  if (!p?.maintenance) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
      <Wrench className="size-4 shrink-0" /> Maintenance en cours : certaines fonctions peuvent être momentanément indisponibles.
    </div>
  );
}
