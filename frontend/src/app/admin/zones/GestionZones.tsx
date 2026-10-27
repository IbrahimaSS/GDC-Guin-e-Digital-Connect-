"use client";

import { MapPin, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { BarChart, ProgressBar } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { Modal, Toggle } from "@/components/ui/interactive";
import { Table, Td, Th } from "@/components/ui/table";
import { ZONES_DETAIL } from "@/lib/data";

export default function GestionZones() {
  const [zones, setZones] = useState(ZONES_DETAIL);
  const [ajout, setAjout] = useState(false);
  const [active, setActive] = useState(true);
  const [erreur, setErreur] = useState("");
  const [modele, setModele] = useState({ nom: "", ville: "Conakry" });
  const ouvrir = (nom = "", ville = "Conakry") => {
    setModele({ nom, ville });
    setErreur("");
    setActive(true);
    setAjout(true);
  };
  const max = Math.max(1, ...zones.map((z) => z.demandes));

  function ajouter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const nom = String(data.get("nom")).trim();
    if (zones.some((z) => z.nom.toLowerCase() === nom.toLowerCase())) return setErreur("Cette zone existe déjà.");
    // TODO : enregistrer via l'API, avec les coordonnées de la zone pour la carte.
    setZones([...zones, { nom, ville: String(data.get("ville")), techniciens: 0, demandes: 0, actif: active }]);
    form.reset();
    setErreur("");
    setActive(true);
    setAjout(false);
    toast(`Zone « ${nom} » ajoutée`);
  }

  return (
    <>
      <PageHeader
        title="Gestion des zones"
        subtitle="Communes et villes couvertes par la plateforme."
        actions={
          <Button onClick={() => ouvrir()}>
            <Plus className="size-4" /> Ajouter une zone
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Zone</Th>
                <Th>Ville</Th>
                <Th>Techniciens</Th>
                <Th>Demandes</Th>
                <Th>Couverture</Th>
                <Th>Active</Th>
              </tr>
            </thead>
            <Reveal as="tbody" y={10} stagger={0.04} deps={[zones.length]}>
              {zones.map((z) => {
                const ratio = z.demandes ? z.techniciens / z.demandes : 0;
                return (
                  <tr key={z.nom} className="transition hover:bg-slate-50/80">
                    <Td>
                      <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                        <MapPin className="size-4 text-accent-500" /> {z.nom}
                      </span>
                    </Td>
                    <Td className="text-slate-600">{z.ville}</Td>
                    <Td className="font-semibold">{z.techniciens}</Td>
                    <Td>
                      <div className="flex w-28 items-center gap-2">
                        <span className="w-8 font-semibold">{z.demandes}</span>
                        <ProgressBar value={(z.demandes / max) * 100} />
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={ratio >= 0.7 ? "green" : ratio >= 0.5 ? "amber" : "red"} dot>
                        {ratio >= 0.7 ? "Bonne" : ratio >= 0.5 ? "Moyenne" : "Faible"}
                      </Badge>
                    </Td>
                    <Td>
                      <Toggle
                        checked={z.actif}
                        onChange={(v) => {
                          setZones(zones.map((x) => (x.nom === z.nom ? { ...x, actif: v } : x)));
                          toast(`${z.nom} ${v ? "activée" : "désactivée"}`, "info");
                        }}
                      />
                    </Td>
                  </tr>
                );
              })}
            </Reveal>
          </Table>
        </Card>
        <Reveal className="space-y-6" delay={0.1}>
          <Card>
            <CardHeader title="Demandes par zone" subtitle="30 derniers jours" />
            <div className="p-5">
              <BarChart data={zones.map((z, i) => ({ label: z.nom.slice(0, 6), value: z.demandes, color: i < 5 ? "#0066cc" : "#ff8a00" }))} />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white">
            <p className="font-bold">Prochaine extension</p>
            <p className="mt-1 text-sm text-brand-100">
              Kindia et Boké sont les zones les plus demandées hors Conakry (124 recherches ce mois-ci).
            </p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => ouvrir("Kindia centre", "Kindia")}>
              Préparer l&apos;ouverture
            </Button>
          </Card>
        </Reveal>
      </div>

      <Modal open={ajout} onClose={() => setAjout(false)} title="Ajouter une zone">
        <form key={`${modele.nom}-${modele.ville}-${ajout}`} onSubmit={ajouter} className="space-y-4">
          <Field label="Nom de la zone *" hint="Commune, quartier ou ville couverte par la plateforme.">
            <Input name="nom" required defaultValue={modele.nom} placeholder="Ex. : Kindia centre" autoFocus />
          </Field>
          <Field label="Ville / préfecture">
            <Select name="ville" defaultValue={modele.ville}>
              {["Conakry", "Coyah", "Dubréka", "Kindia", "Boké", "Mamou", "Labé", "Kankan", "N'Zérékoré"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </Field>
          <Toggle checked={active} onChange={setActive} label="Zone active" description="Les clients et techniciens peuvent la choisir." />
          {erreur && <p className="text-sm font-medium text-red-600">{erreur}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAjout(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter la zone</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
