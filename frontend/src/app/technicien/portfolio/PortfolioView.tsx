"use client";

import { ImagePlus, Pencil, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Button, Field, Input, PageHeader, Select } from "@/components/ui";
import { Modal, Tabs } from "@/components/ui/interactive";
import { api, apiActive, texteErreur } from "@/lib/api";
import { TECHNICIEN_CONNECTE as moi } from "@/lib/data";
import { ACCEPTE, televerser, verifierFichier } from "@/lib/fichiers";
import { useMonProfil, type RealisationApi } from "@/lib/monProfil";

interface Element {
  id: string;
  titre: string;
  categorie: string;
  image: string;
  date: string;
}

const DEMO: Element[] = moi.realisations.map((r, i) => ({ ...r, id: String(i), date: ["oct. 2026", "sept. 2026", "août 2026", "juil. 2026", "juin 2026", "mai 2026"][i] }));

export default function PortfolioView() {
  const profil = useMonProfil();
  if (!apiActive) return <Portfolio initial={DEMO} metier="Installation" />;
  if (!profil.donnees) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />;
  const initial = profil.donnees.realisations
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => ({ id: r.id, titre: r.titre, categorie: r.categorie, image: r.imageUrl, date: new Date(r.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) }));
  return <Portfolio initial={initial} metier={profil.donnees.metier.label} />;
}

function Portfolio({ initial, metier }: { initial: Element[]; metier: string }) {
  const [items, setItems] = useState(initial);
  // Fichier choisi dans la fenêtre d'ajout (envoyé au serveur à l'enregistrement).
  const [fichier, setFichier] = useState<File | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [filtre, setFiltre] = useState("Toutes");
  const [ajout, setAjout] = useState(false);
  // Réalisation en cours de modification (null = ajout).
  const [edition, setEdition] = useState<Element | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: grid });

  const categories = ["Toutes", ...Array.from(new Set(items.map((i) => i.categorie)))];
  const visibles = items.filter((i) => filtre === "Toutes" || i.categorie === filtre);

  const retirer = contextSafe((id: string) => {
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

  async function supprimer(id: string) {
    if (apiActive) {
      try {
        await api(`/techniciens/moi/realisations/${id}`, { methode: "DELETE" });
      } catch (e) {
        return toast(texteErreur(e), "error");
      }
    }
    retirer(id);
  }

  const ouvrir = (item: Element | null) => {
    setEdition(item);
    setApercu(null);
    setFichier(null);
    setAjout(true);
  };

  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const titre = String(data.get("titre")).trim();
    const categorie = String(data.get("categorie"));
    if (apiActive) {
      if (!edition && !fichier) return toast("Ajoutez une photo de la réalisation.", "error");
      setEnvoi(true);
      try {
        const imageUrl = fichier ? await televerser(fichier, "photo") : undefined;
        if (edition) {
          const r = await api<RealisationApi>(`/techniciens/moi/realisations/${edition.id}`, { methode: "PATCH", corps: { titre, categorie, imageUrl } });
          setItems(items.map((i) => (i.id === edition.id ? { ...i, titre: r.titre, categorie: r.categorie, image: r.imageUrl } : i)));
        } else {
          const r = await api<RealisationApi>("/techniciens/moi/realisations", { methode: "POST", corps: { titre, categorie, imageUrl } });
          const date = new Date(r.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
          setItems([{ id: r.id, titre: r.titre, categorie: r.categorie, image: r.imageUrl, date }, ...items]);
          setFiltre("Toutes");
        }
      } catch (err) {
        return toast(texteErreur(err), "error");
      } finally {
        setEnvoi(false);
      }
      toast(edition ? "Réalisation modifiée" : "Réalisation ajoutée au portfolio");
    } else if (edition) {
      setItems(items.map((i) => (i.id === edition.id ? { ...i, titre, categorie, image: apercu ?? i.image } : i)));
      toast("Réalisation modifiée");
    } else {
      setItems([{ id: String(Date.now()), titre, categorie, image: apercu ?? "/images/electricien-tableau.jpg", date: "oct. 2026" }, ...items]);
      setFiltre("Toutes");
      toast("Réalisation ajoutée au portfolio");
    }
    setApercu(null);
    setFichier(null);
    setAjout(false);
  }

  return (
    <>
      <PageHeader
        title="Mes réalisations"
        subtitle={`${items.length} réalisation${items.length > 1 ? "s" : ""} · montrez vos meilleurs travaux : les clients les regardent avant de vous contacter.`}
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
                  unoptimized={!r.image.startsWith("/")}
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
                <Image src={apercu ?? edition!.image} alt="" fill unoptimized={!(apercu ?? edition!.image).startsWith("/")} sizes="400px" className="object-cover" />
              </span>
            ) : (
              <ImagePlus className="size-8 text-brand-600" />
            )}
            <span className="text-sm font-semibold">{edition ? "Changer la photo" : "Glissez vos photos ou cliquez"}</span>
            <span className="text-xs">JPG, PNG ou WebP, 5 Mo max.</span>
            <input
              type="file"
              accept={ACCEPTE.photo}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                const probleme = verifierFichier(f, "photo");
                if (probleme) return toast(probleme, "error");
                setFichier(f);
                setApercu(URL.createObjectURL(f));
              }}
            />
          </label>
          <Field label="Titre *">
            <Input name="titre" required defaultValue={edition?.titre} placeholder="Ex. : Câblage d'une villa" />
          </Field>
          <Field label="Catégorie">
            <Select name="categorie" defaultValue={edition?.categorie ?? "Installation"}>
              {Array.from(new Set([metier, "Installation", "Dépannage", "Maintenance", "Rénovation", ...items.map((i) => i.categorie)])).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAjout(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={envoi}>
              {envoi ? "Envoi…" : edition ? "Enregistrer" : "Publier"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
