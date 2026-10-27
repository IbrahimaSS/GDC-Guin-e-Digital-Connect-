"use client";

import { Pencil, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ProgressBar } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, cn, Field, Input, MetierIcon, PageHeader, Textarea } from "@/components/ui";
import { Modal, Toggle } from "@/components/ui/interactive";
import { METIERS, TECHNICIENS, type Metier } from "@/lib/data";

type MetierAdmin = Omit<Metier, "id"> & { id: string; specialites?: string[] };

const slug = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function GestionMetiers() {
  // Spécialités connues de chaque métier, pour pré-remplir la modification.
  const [metiers, setMetiers] = useState<MetierAdmin[]>(() =>
    METIERS.map((m) => ({ ...m, specialites: Array.from(new Set(TECHNICIENS.filter((t) => t.metier === m.id).flatMap((t) => t.specialites))) })),
  );
  const [ajout, setAjout] = useState(false);
  const [edition, setEdition] = useState<MetierAdmin | null>(null);
  const [visible, setVisible] = useState(true);
  const [erreur, setErreur] = useState("");
  const max = Math.max(...metiers.map((m) => m.techniciens));

  const ouvrir = (m: MetierAdmin | null) => {
    setEdition(m);
    setVisible(m?.actif ?? true);
    setErreur("");
    setAjout(true);
  };

  function ajouter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const nom = String(data.get("nom")).trim();
    if (metiers.some((m) => m.id !== edition?.id && m.label.toLowerCase() === nom.toLowerCase())) return setErreur("Ce métier existe déjà.");
    const specialites = String(data.get("specialites") ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    // TODO : enregistrer via l'API ; le nouveau métier sera alors proposé dans la recherche et l'inscription.
    if (edition) {
      setMetiers(metiers.map((m) => (m.id === edition.id ? { ...m, label: nom, actif: visible, specialites } : m)));
      toast(`Métier « ${nom} » modifié`);
    } else {
      setMetiers([...metiers, { id: slug(nom) || String(Date.now()), label: nom, techniciens: 0, demandes: 0, actif: visible, specialites }]);
      toast(`Métier « ${nom} » ajouté`);
    }
    form.reset();
    setErreur("");
    setAjout(false);
  }

  return (
    <>
      <PageHeader
        title="Gestion des métiers"
        subtitle="Les métiers et spécialités proposés dans la recherche et l'inscription."
        actions={
          <Button onClick={() => ouvrir(null)}>
            <Plus className="size-4" /> Nouveau métier
          </Button>
        }
      />
      <Reveal className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" scale={0.95} y={16} deps={[metiers.length]}>
        {metiers.map((m) => (
          <Card key={m.id} className={cn("p-5 transition duration-300 hover:shadow-lg", !m.actif && "opacity-60")}>
            <div className="flex items-start justify-between">
              <span className={cn("rounded-2xl p-3", m.actif ? "bg-accent-50 text-accent-500" : "bg-slate-100 text-slate-400")}>
                <MetierIcon metier={m.id} className="size-6" />
              </span>
              <button onClick={() => ouvrir(m)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Modifier">
                <Pencil className="size-4" />
              </button>
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900">{m.label}</p>
            <div className="mt-3 flex justify-between text-xs text-slate-500">
              <span>
                <strong className="text-slate-900">{m.techniciens}</strong> techniciens
              </span>
              <span>
                <strong className="text-slate-900">{m.demandes}</strong> demandes
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={(m.techniciens / max) * 100} color="bg-accent-500" />
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <Toggle
                checked={m.actif}
                onChange={(v) => {
                  setMetiers(metiers.map((x) => (x.id === m.id ? { ...x, actif: v } : x)));
                  toast(v ? `${m.label} activé` : `${m.label} désactivé`, "info");
                }}
                label={m.actif ? "Visible" : "Masqué"}
              />
            </div>
          </Card>
        ))}
      </Reveal>

      <Modal open={ajout} onClose={() => setAjout(false)} title={edition ? "Modifier le métier" : "Nouveau métier"}>
        <form key={edition?.id ?? "nouveau"} onSubmit={ajouter} className="space-y-4">
          <Field label="Nom du métier *">
            <Input name="nom" required defaultValue={edition?.label} placeholder="Ex. : Soudure" autoFocus />
          </Field>
          <Field label="Spécialités" hint="Séparées par des virgules.">
            <Textarea name="specialites" defaultValue={edition?.specialites?.join(", ")} className="min-h-20" placeholder="Soudure à l'arc, Ferronnerie, Portails" />
          </Field>
          <Toggle checked={visible} onChange={setVisible} label="Visible immédiatement" description="Proposé dans la recherche et l'inscription des techniciens." />
          {erreur && <p className="text-sm font-medium text-red-600">{erreur}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAjout(false)}>
              Annuler
            </Button>
            <Button type="submit">{edition ? "Enregistrer" : "Ajouter le métier"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
