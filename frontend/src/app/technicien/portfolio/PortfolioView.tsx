"use client";

import { ImagePlus, Pencil, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Button, Field, Input, PageHeader, Select } from "@/components/ui";
import { Modal, Tabs } from "@/components/ui/interactive";
import { TECHNICIEN_CONNECTE as moi } from "@/lib/data";

export default function PortfolioView() {
  const [items, setItems] = useState(moi.realisations.map((r, i) => ({ ...r, id: i, date: ["oct. 2026", "sept. 2026", "août 2026", "juil. 2026", "juin 2026", "mai 2026"][i] })));
  const [filtre, setFiltre] = useState("Toutes");
  const [ajout, setAjout] = useState(false);
  // Réalisation en cours de modification (null = ajout).
  const [edition, setEdition] = useState<(typeof items)[number] | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: grid });

  const categories = ["Toutes", ...Array.from(new Set(items.map((i) => i.categorie)))];
  const visibles = items.filter((i) => filtre === "Toutes" || i.categorie === filtre);

  const supprimer = contextSafe((id: number) => {
    gsap.to(`[data-item="${id}"]`, {
      scale: 0.6,
      autoAlpha: 0,
      rotate: -4,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast("Réalisation supprimée", "info");
      },
    });
  });

  const ouvrir = (item: (typeof items)[number] | null) => {
    setEdition(item);
    setApercu(null);
    setAjout(true);
  };

  function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const titre = String(data.get("titre")).trim();
    const categorie = String(data.get("categorie"));
    if (edition) {
      setItems(items.map((i) => (i.id === edition.id ? { ...i, titre, categorie, image: apercu ?? i.image } : i)));
      toast("Réalisation modifiée");
    } else {
      setItems([{ id: Date.now(), titre, categorie, image: apercu ?? "/images/electricien-tableau.jpg", date: "oct. 2026" }, ...items]);
      setFiltre("Toutes");
      toast("Réalisation ajoutée au portfolio");
    }
    setApercu(null);
    setAjout(false);
  }

  return (
    <>
      <PageHeader
        title="Mes réalisations"
        subtitle={`${items.length} réalisations · les profils avec au moins 6 photos sont 2 fois plus contactés.`}
        actions={
          <Button onClick={() => ouvrir(null)}>
            <ImagePlus className="size-4" /> Ajouter une réalisation
          </Button>
        }
      />
      <Tabs value={filtre} onChange={setFiltre} variant="pill" tabs={categories.map((c) => ({ id: c, label: c }))} className="mb-6 w-fit max-w-full" />

      <div ref={grid}>
        <Reveal className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4" deps={[filtre, items.length]} scale={0.9} y={16} stagger={0.05}>
          {visibles.map((r) => (
            <figure key={r.id} data-item={r.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                <Image
                  src={r.image}
                  alt={r.titre}
                  fill
                  sizes="(min-width: 1280px) 25vw, 50vw"
                  unoptimized={r.image.startsWith("blob:")}
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 flex items-start justify-end gap-1.5 bg-gradient-to-t from-brand-950/70 via-transparent p-3 opacity-0 transition duration-300 group-hover:opacity-100">
                <button onClick={() => ouvrir(r)} className="rounded-lg bg-white/90 p-2 text-slate-700 hover:bg-white" aria-label="Modifier">
                  <Pencil className="size-4" />
                </button>
                <button onClick={() => supprimer(r.id)} className="rounded-lg bg-white/90 p-2 text-red-600 hover:bg-white" aria-label="Supprimer">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <figcaption className="relative bg-white p-3">
                <p className="truncate text-sm font-bold text-slate-900">{r.titre}</p>
                <p className="text-xs text-slate-500">
                  {r.categorie} · {r.date}
                </p>
              </figcaption>
            </figure>
          ))}
          <button
            onClick={() => ouvrir(null)}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-500 transition hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-600"
          >
            <Upload className="size-7" />
            Ajouter des photos
          </button>
        </Reveal>
      </div>

      <Modal open={ajout} onClose={() => setAjout(false)} title={edition ? "Modifier la réalisation" : "Nouvelle réalisation"}>
        <form key={edition?.id ?? "nouvelle"} onSubmit={enregistrer} className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-500 hover:border-brand-500">
            {apercu || edition ? (
              <span className="relative block h-28 w-full overflow-hidden rounded-xl">
                <Image src={apercu ?? edition!.image} alt="" fill unoptimized={!!apercu} sizes="400px" className="object-cover" />
              </span>
            ) : (
              <ImagePlus className="size-8 text-brand-600" />
            )}
            <span className="text-sm font-semibold">{edition ? "Changer la photo" : "Glissez vos photos ou cliquez"}</span>
            <span className="text-xs">JPG ou PNG, 5 Mo max.</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && setApercu(URL.createObjectURL(e.target.files[0]))} />
          </label>
          <Field label="Titre *">
            <Input name="titre" required defaultValue={edition?.titre} placeholder="Ex. : Câblage d'une villa" />
          </Field>
          <Field label="Catégorie">
            <Select name="categorie" defaultValue={edition?.categorie ?? "Installation"}>
              {Array.from(new Set(["Installation", "Dépannage", "Maintenance", "Câblage", ...items.map((i) => i.categorie)])).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAjout(false)}>
              Annuler
            </Button>
            <Button type="submit">{edition ? "Enregistrer" : "Publier"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
