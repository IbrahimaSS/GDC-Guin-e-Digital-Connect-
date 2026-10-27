"use client";

import { Heart, Home, MapPin, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProgressBar } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { toast } from "@/components/motion/Toaster";
import { Avatar, Button, Card, CardHeader, Field, Input, PageHeader, Rating, Select } from "@/components/ui";
import { CLIENT_CONNECTE, TECHNICIENS, ZONES } from "@/lib/data";

export default function ProfilClientForm() {
  const [adresses, setAdresses] = useState([
    { id: 1, label: "Domicile", texte: CLIENT_CONNECTE.adresse, zone: "Kaloum" },
    { id: 2, label: "Bureau", texte: "Immeuble Kaloum Center, 2e étage", zone: "Kaloum" },
  ]);
  const favoris = TECHNICIENS.slice(0, 3);

  return (
    <>
      <PageHeader title="Mon profil" subtitle="Ces informations sont partagées avec les techniciens que vous contactez." />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Reveal className="space-y-6">
          <Card className="p-6 text-center">
            <PhotoUpload nom={CLIENT_CONNECTE.nom} />
            <p className="mt-4 text-lg font-bold text-slate-900">{CLIENT_CONNECTE.nom}</p>
            <p className="text-sm text-slate-500">
              {CLIENT_CONNECTE.type} · Membre depuis sept. 2026
            </p>
            <div className="mt-5 text-left">
              <div className="mb-1.5 flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Profil complété</span>
                <span className="text-brand-600">80 %</span>
              </div>
              <ProgressBar value={80} />
              <p className="mt-2 text-xs text-slate-500">Ajoutez votre e-mail pour atteindre 100 %.</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Techniciens favoris" />
            <ul className="space-y-1 p-3">
              {favoris.map((t) => (
                <li key={t.id}>
                  <Link href={`/techniciens/${t.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">
                    <Avatar nom={t.nom} className="size-9 text-[11px]" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{t.nom}</p>
                      <Rating note={t.note} className="text-xs" />
                    </div>
                    <Heart className="size-4 fill-accent-500 text-accent-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card className="p-6">
            <h2 className="mb-5 font-bold text-slate-900">Informations personnelles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom">
                <Input defaultValue="Camara" />
              </Field>
              <Field label="Prénom">
                <Input defaultValue="Mohamed" />
              </Field>
              <Field label="Téléphone">
                <Input defaultValue={CLIENT_CONNECTE.telephone} />
              </Field>
              <Field label="E-mail">
                <Input type="email" defaultValue={CLIENT_CONNECTE.email} />
              </Field>
              <Field label="Type de compte">
                <Select defaultValue="Particulier">
                  <option>Particulier</option>
                  <option>Entreprise / PME</option>
                </Select>
              </Field>
              <Field label="Zone">
                <Select defaultValue={CLIENT_CONNECTE.zone}>
                  {ZONES.map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Mes adresses d&apos;intervention</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdresses([...adresses, { id: Date.now(), label: "Nouvelle adresse", texte: "À compléter", zone: "Dixinn" }])}
              >
                <Plus className="size-4" /> Ajouter
              </Button>
            </div>
            <Reveal className="space-y-2" deps={[adresses.length]} y={10}>
              {adresses.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <span className="rounded-lg bg-brand-50 p-2 text-brand-600">{a.label === "Domicile" ? <Home className="size-4" /> : <MapPin className="size-4" />}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{a.label}</p>
                    <p className="text-xs text-slate-500">
                      {a.texte} · {a.zone}
                    </p>
                  </div>
                  <button onClick={() => setAdresses(adresses.filter((x) => x.id !== a.id))} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Supprimer">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </Reveal>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="ghost">Annuler</Button>
            <Button size="lg" onClick={() => toast("Profil mis à jour")}>
              Enregistrer
            </Button>
          </div>
        </Reveal>
      </div>
    </>
  );
}
