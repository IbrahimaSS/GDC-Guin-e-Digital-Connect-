"use client";

import { Eye, Plus, X } from "lucide-react";
import { useState } from "react";
import { ProgressBar } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, cn, Field, Input, LinkButton, PageHeader, Rating, Select, Textarea, VerificationBadge } from "@/components/ui";
import { METIERS, TECHNICIEN_CONNECTE as moi, ZONES } from "@/lib/data";

const TARIFS_INIT = [
  { prestation: "Déplacement + diagnostic", prix: "50 000" },
  { prestation: "Installation d'une prise", prix: "75 000" },
  { prestation: "Tableau électrique complet", prix: "1 200 000" },
];

export default function ProfilProForm() {
  const [specialites, setSpecialites] = useState(moi.specialites);
  const [nouvelle, setNouvelle] = useState("");
  const [zones, setZones] = useState(moi.zonesIntervention);
  const [tarifs, setTarifs] = useState(TARIFS_INIT);

  return (
    <>
      <PageHeader
        title="Mon profil professionnel"
        subtitle="Un profil complet reçoit jusqu'à 3 fois plus de demandes."
        actions={
          <LinkButton href={`/techniciens/${moi.id}`} variant="outline">
            <Eye className="size-4" /> Voir mon profil public
          </LinkButton>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Reveal className="space-y-6">
          <Card className="overflow-hidden text-center">
            <div className="h-20 bg-gradient-to-r from-brand-700 to-sky-brand" />
            <div className="-mt-12 px-6 pb-6">
              <PhotoUpload nom={moi.nom} className="size-24 text-2xl" anneau="ring-4 ring-white" />
              <p className="mt-3 text-lg font-bold">{moi.nom}</p>
              <p className="text-sm text-slate-500">Électricien · {moi.zone}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Rating note={moi.note} nbAvis={moi.nbAvis} />
              </div>
              <div className="mt-2 flex justify-center">
                <VerificationBadge niveau={moi.niveau} />
              </div>
              <div className="mt-5 text-left">
                <div className="mb-1.5 flex justify-between text-xs font-semibold">
                  <span>Complétude du profil</span>
                  <span className="text-brand-600">85 %</span>
                </div>
                <ProgressBar value={85} color="bg-gradient-to-r from-brand-600 to-sky-brand" />
                <ul className="mt-3 space-y-1 text-xs text-slate-500">
                  <li>✓ Photo et description</li>
                  <li>✓ Spécialités et zones</li>
                  <li className="text-accent-600">○ Ajoutez 4 photos au portfolio</li>
                </ul>
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card className="p-6">
            <h2 className="mb-5 font-bold text-slate-900">Informations professionnelles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Métier principal">
                <Select defaultValue={moi.metier}>
                  {METIERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Années d'expérience">
                <Input type="number" defaultValue={moi.experience} />
              </Field>
              <Field label="Nom commercial (optionnel)">
                <Input placeholder="Diallo Électricité" />
              </Field>
              <Field label="Téléphone professionnel">
                <Input defaultValue={moi.telephone} />
              </Field>
            </div>
            <Field label="Description" className="mt-4" hint="Présentez votre parcours, vos points forts et vos garanties.">
              <Textarea defaultValue={moi.bio} />
            </Field>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Spécialités</h2>
            <div className="flex flex-wrap gap-2">
              {specialites.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 py-1.5 pl-3 pr-2 text-sm font-medium text-white">
                  {s}
                  <button onClick={() => setSpecialites(specialites.filter((x) => x !== s))} className="rounded-full p-0.5 hover:bg-white/20" aria-label={`Retirer ${s}`}>
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nouvelle.trim()) setSpecialites([...specialites, nouvelle.trim()]);
                  setNouvelle("");
                }}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 pl-3 pr-1"
              >
                <input value={nouvelle} onChange={(e) => setNouvelle(e.target.value)} placeholder="Ajouter…" className="w-24 bg-transparent py-1.5 text-sm outline-none" />
                <button type="submit" className="rounded-full bg-slate-100 p-1 text-slate-600 hover:bg-brand-50 hover:text-brand-600" aria-label="Ajouter">
                  <Plus className="size-3.5" />
                </button>
              </form>
            </div>

            <h2 className="mb-4 mt-8 font-bold text-slate-900">Zones d&apos;intervention</h2>
            <div className="flex flex-wrap gap-2">
              {ZONES.map((z) => (
                <button
                  key={z}
                  onClick={() => setZones(zones.includes(z) ? zones.filter((x) => x !== z) : [...zones, z])}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                    zones.includes(z) ? "border-accent-500 bg-accent-50 text-accent-600" : "border-slate-300 text-slate-600 hover:border-accent-400",
                  )}
                >
                  {z}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Tarifs indicatifs</h2>
              <Button variant="outline" size="sm" onClick={() => setTarifs([...tarifs, { prestation: "", prix: "" }])}>
                <Plus className="size-4" /> Ajouter
              </Button>
            </div>
            <Reveal className="space-y-2" deps={[tarifs.length]} y={8}>
              {tarifs.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_150px_auto] gap-2">
                  <Input defaultValue={t.prestation} placeholder="Prestation" />
                  <Input defaultValue={t.prix} placeholder="Prix (GNF)" />
                  <button onClick={() => setTarifs(tarifs.filter((_, k) => k !== i))} className="rounded-lg px-2 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Supprimer">
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </Reveal>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="ghost">Annuler</Button>
            <Button size="lg" onClick={() => toast("Profil professionnel enregistré")}>
              Enregistrer le profil
            </Button>
          </div>
        </Reveal>
      </div>
    </>
  );
}
