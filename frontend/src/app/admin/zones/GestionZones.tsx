"use client";

import { MapPin, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { BarChart, ProgressBar } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";
import { Modal, Toggle } from "@/components/ui/interactive";
import { Table, Td, Th } from "@/components/ui/table";
import { api, apiActive, texteErreur } from "@/lib/api";
import { ZONES_DETAIL } from "@/lib/data";
import { chercherAdresse } from "@/lib/geo";
import { useApi } from "@/lib/useApi";

interface ZoneAdminApi {
  id: string;
  nom: string;
  ville: string;
  lat: number | null;
  lng: number | null;
  actif: boolean;
  nbTechniciens: number;
  nbDemandes: number;
}

interface LigneZone {
  id: string;
  nom: string;
  ville: string;
  techniciens: number;
  demandes: number;
  actif: boolean;
}

/** Zones : celles du serveur (avec les vrais comptes) ou celles de la maquette. */
function useZones() {
  const { donnees, recharger } = useApi<ZoneAdminApi[]>(
    apiActive ? "/admin/zones" : null,
  );
  const [demo, setDemo] = useState<LigneZone[]>(() =>
    ZONES_DETAIL.map((z) => ({ ...z, id: z.nom })),
  );
  // Modifications locales (bascule active) tant que le serveur n’a pas renvoyé de nouvelle liste.
  const [locales, setLocales] = useState<{
    de: ZoneAdminApi[] | null | undefined;
    liste: LigneZone[];
  } | null>(null);
  const serveur = (donnees ?? []).map((z) => ({
    id: z.id,
    nom: z.nom,
    ville: z.ville,
    techniciens: z.nbTechniciens,
    demandes: z.nbDemandes,
    actif: z.actif,
  }));
  const zones = apiActive
    ? locales && locales.de === donnees
      ? locales.liste
      : serveur
    : demo;
  const setZones = apiActive
    ? (liste: LigneZone[]) => setLocales({ de: donnees, liste })
    : setDemo;
  return { zones, setZones, recharger };
}

/** Coordonnées de la zone (pour la carte), trouvées sur OpenStreetMap ; facultatives. */
async function coordonnees(nom: string, ville: string) {
  try {
    const [r] = await chercherAdresse(`${nom}, ${ville}`);
    return r ? { lat: r.point.lat, lng: r.point.lng } : {};
  } catch {
    return {};
  }
}

export default function GestionZones() {
  const { zones, setZones, recharger } = useZones();
  const [envoi, setEnvoi] = useState(false);
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
  // La zone active où l’offre suit le moins la demande (calculée, pas inventée).
  const aRenforcer = zones
    .filter((z) => z.actif && z.demandes > 0)
    .sort(
      (a, b) =>
        b.demandes / (b.techniciens + 1) - a.demandes / (a.techniciens + 1),
    )[0];

  async function ajouter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const nom = String(data.get("nom")).trim();
    if (zones.some((z) => z.nom.toLowerCase() === nom.toLowerCase()))
      return setErreur("Cette zone existe déjà.");
    const ville = String(data.get("ville"));
    if (apiActive) {
      setEnvoi(true);
      try {
        await api("/admin/zones", {
          methode: "POST",
          corps: {
            nom,
            ville,
            actif: active,
            ...(await coordonnees(nom, ville)),
          },
        });
        recharger();
      } catch (err) {
        setEnvoi(false);
        return setErreur(texteErreur(err));
      }
      setEnvoi(false);
    } else {
      setZones([
        ...zones,
        { id: nom, nom, ville, techniciens: 0, demandes: 0, actif: active },
      ]);
    }
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
                const ratio = z.demandes
                  ? z.techniciens / z.demandes
                  : z.techniciens
                    ? 1
                    : 0;
                return (
                  <tr key={z.id} className="transition hover:bg-slate-50/80">
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
                      <Badge
                        tone={
                          ratio >= 0.7
                            ? "green"
                            : ratio >= 0.5
                              ? "amber"
                              : "red"
                        }
                        dot
                      >
                        {ratio >= 0.7
                          ? "Bonne"
                          : ratio >= 0.5
                            ? "Moyenne"
                            : "Faible"}
                      </Badge>
                    </Td>
                    <Td>
                      <Toggle
                        checked={z.actif}
                        onChange={async (v) => {
                          const avant = zones;
                          setZones(
                            zones.map((x) =>
                              x.id === z.id ? { ...x, actif: v } : x,
                            ),
                          );
                          if (apiActive) {
                            try {
                              await api(`/admin/zones/${z.id}`, {
                                methode: "PATCH",
                                corps: { actif: v },
                              });
                            } catch (err) {
                              setZones(avant);
                              return toast(texteErreur(err), "error");
                            }
                          }
                          toast(
                            `${z.nom} ${v ? "activée" : "désactivée"}`,
                            "info",
                          );
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
            <CardHeader
              title="Demandes par zone"
              subtitle={apiActive ? "Depuis l’ouverture" : "30 derniers jours"}
            />
            <div className="p-5">
              <BarChart
                data={zones.map((z, i) => ({
                  label: z.nom.slice(0, 6),
                  value: z.demandes,
                  color: i < 5 ? "#0066cc" : "#ff8a00",
                }))}
              />
            </div>
          </Card>
          {aRenforcer && (
            <Card className="bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white">
              <p className="font-bold">Zone à renforcer</p>
              <p className="mt-1 text-sm text-brand-100">
                {aRenforcer.nom} compte {aRenforcer.demandes} demande
                {aRenforcer.demandes > 1 ? "s" : ""} pour{" "}
                {aRenforcer.techniciens} technicien
                {aRenforcer.techniciens > 1 ? "s" : ""} vérifié
                {aRenforcer.techniciens > 1 ? "s" : ""} : c’est la moins bien
                couverte.
              </p>
            </Card>
          )}
        </Reveal>
      </div>

      <Modal
        open={ajout}
        onClose={() => setAjout(false)}
        title="Ajouter une zone"
      >
        <form
          key={`${modele.nom}-${modele.ville}-${ajout}`}
          onSubmit={ajouter}
          className="space-y-4"
        >
          <Field
            label="Nom de la zone *"
            hint="Commune, quartier ou ville couverte par la plateforme."
          >
            <Input
              name="nom"
              required
              defaultValue={modele.nom}
              placeholder="Ex. : Kindia centre"
              autoFocus
            />
          </Field>
          <Field label="Ville / préfecture">
            <Select name="ville" defaultValue={modele.ville}>
              {[
                "Conakry",
                "Coyah",
                "Dubréka",
                "Kindia",
                "Boké",
                "Mamou",
                "Labé",
                "Kankan",
                "N'Zérékoré",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </Field>
          <Toggle
            checked={active}
            onChange={setActive}
            label="Zone active"
            description="Les clients et techniciens peuvent la choisir."
          />
          {erreur && (
            <p className="text-sm font-medium text-red-600">{erreur}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAjout(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={envoi}>
              {envoi ? "Ajout…" : "Ajouter la zone"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
