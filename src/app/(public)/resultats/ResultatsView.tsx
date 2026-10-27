"use client";

import { LayoutGrid, List, MapPin, Search, SearchX, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Reveal from "@/components/motion/Reveal";
import TechnicienCard from "@/components/shared/TechnicienCard";
import TechnicienProCard from "@/components/shared/TechnicienProCard";
import { Button, Card, cn, EmptyState, LinkButton, Select } from "@/components/ui";
import { getMetier, METIERS, TECHNICIENS, ZONES } from "@/lib/data";

type Tri = "pertinence" | "note" | "avis" | "experience";

export default function ResultatsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [vue, setVue] = useState<"liste" | "grille">("grille");

  const metier = params.get("metier") ?? "";
  const zone = params.get("zone") ?? "";
  const specialite = params.get("specialite") ?? "";
  const niveau = Number(params.get("niveau") ?? 0);
  const disponible = params.get("disponible") === "1";
  const tri = (params.get("tri") ?? "pertinence") as Tri;

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next}`, { scroll: false });
  }

  const resultats = useMemo(() => {
    const liste = TECHNICIENS.filter(
      (t) =>
        (!metier || t.metier === metier) &&
        (!zone || t.zonesIntervention.includes(zone)) &&
        (!specialite || t.specialites.includes(specialite)) &&
        t.niveau >= niveau &&
        (!disponible || t.disponible),
    );
    const tris: Record<Tri, (a: (typeof liste)[0], b: (typeof liste)[0]) => number> = {
      note: (a, b) => b.note - a.note,
      avis: (a, b) => b.nbAvis - a.nbAvis,
      experience: (a, b) => b.experience - a.experience,
      // Pertinence : disponibles d'abord, puis niveau de vérification, puis note.
      pertinence: (a, b) => Number(b.disponible) - Number(a.disponible) || b.niveau - a.niveau || b.note - a.note,
    };
    return [...liste].sort(tris[tri]);
  }, [metier, zone, specialite, niveau, disponible, tri]);

  const filtresActifs = [metier && getMetier(metier as never).label, zone, specialite, niveau && `Niveau ${niveau}+`, disponible && "Disponible"].filter(Boolean);

  return (
    <>
      {/* Barre de recherche */}
      <Card className="grid gap-1 p-2 md:grid-cols-[1fr_1fr_auto]">
        <label className="flex items-center gap-2 rounded-xl px-3 hover:bg-slate-50">
          <Search className="size-4 text-slate-400" />
          <select value={metier} onChange={(e) => setParam("metier", e.target.value)} className="w-full cursor-pointer bg-transparent py-3 text-sm font-medium outline-none" aria-label="Métier">
            <option value="">Tous les métiers</option>
            {METIERS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-xl px-3 hover:bg-slate-50 md:border-l md:border-slate-100">
          <MapPin className="size-4 text-slate-400" />
          <select value={zone} onChange={(e) => setParam("zone", e.target.value)} className="w-full cursor-pointer bg-transparent py-3 text-sm font-medium outline-none" aria-label="Zone">
            <option value="">Conakry – toutes les zones</option>
            {ZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </label>
        <Button size="lg">
          <Search className="size-4" /> Rechercher
        </Button>
      </Card>

      {/* Filtres */}
      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
          <SlidersHorizontal className="size-4" /> Filtres
        </span>
        <Select value={niveau || ""} onChange={(e) => setParam("niveau", e.target.value)} className="w-auto! py-1.5" aria-label="Vérification">
          <option value="">Vérification : toutes</option>
          <option value="1">Niveau 1 et +</option>
          <option value="2">Niveau 2 et +</option>
          <option value="3">Niveau 3</option>
        </Select>
        <button
          onClick={() => setParam("disponible", disponible ? "" : "1")}
          className={cn(
            "rounded-xl border px-3 py-1.5 font-semibold transition",
            disponible ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400",
          )}
        >
          ● Disponible
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="whitespace-nowrap text-slate-500">Trier par</span>
          <Select value={tri} onChange={(e) => setParam("tri", e.target.value === "pertinence" ? "" : e.target.value)} className="w-auto! py-1.5">
            <option value="pertinence">Pertinence</option>
            <option value="note">Meilleure note</option>
            <option value="avis">Nombre d&apos;avis</option>
            <option value="experience">Expérience</option>
          </Select>
          <div className="hidden rounded-xl bg-slate-100 p-1 sm:flex">
            {(["grille", "liste"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVue(v)}
                className={cn("rounded-lg p-1.5", vue === v ? "bg-white text-brand-600 shadow-sm" : "text-slate-500")}
                aria-label={`Vue ${v}`}
              >
                {v === "liste" ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 mt-6 flex flex-wrap items-center gap-2">
        <p className="mr-2 text-lg font-bold text-slate-900">
          {resultats.length} résultat{resultats.length > 1 ? "s" : ""} trouvé{resultats.length > 1 ? "s" : ""}
        </p>
        {filtresActifs.map((f) => (
          <span key={String(f)} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            {f}
          </span>
        ))}
        {filtresActifs.length > 0 && (
          <button onClick={() => router.replace(pathname, { scroll: false })} className="text-xs font-semibold text-slate-500 underline hover:text-slate-800">
            Effacer
          </button>
        )}
      </div>

      {resultats.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Aucun professionnel trouvé"
          text="Essayez d'élargir la zone, de retirer un filtre ou de choisir un autre métier."
          action={<LinkButton href="/resultats" variant="outline">Voir tous les professionnels</LinkButton>}
        />
      ) : vue === "liste" ? (
        <Reveal className="space-y-3" deps={[resultats.map((r) => r.id).join(), vue]} y={18} stagger={0.06}>
          {resultats.map((t) => (
            <TechnicienCard key={t.id} tech={t} />
          ))}
        </Reveal>
      ) : (
        <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" deps={[resultats.map((r) => r.id).join(), vue]} scale={0.95} y={10}>
          {resultats.map((t) => (
            <TechnicienProCard key={t.id} tech={t} />
          ))}
        </Reveal>
      )}
    </>
  );
}
