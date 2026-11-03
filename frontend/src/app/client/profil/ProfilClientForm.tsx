"use client";

import { Heart, Home, MapPin, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProgressBar } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { toast } from "@/components/motion/Toaster";
import { Avatar, Button, Card, CardHeader, Field, Input, PageHeader, Rating, Select } from "@/components/ui";
import { api, apiActive, texteErreur } from "@/lib/api";
import { idZone, useZonesApi } from "@/lib/auth";
import { CLIENT_CONNECTE, TECHNICIENS, ZONES } from "@/lib/data";
import { mettreAJourUtilisateur, useSession, type UtilisateurApi } from "@/lib/session";
import { usePersistant } from "@/lib/stockage";

export default function ProfilClientForm() {
  return apiActive ? <ProfilApi /> : <ProfilDemo />;
}

// ------------------------------------------------------------ Avec l'API

interface Adresse {
  id: number;
  label: string;
  texte: string;
  zone: string;
}
const AUCUNE_ADRESSE: Adresse[] = [];

function ProfilApi() {
  const session = useSession();
  if (!session) return null;
  // Formulaire réinitialisé si un autre compte se connecte.
  return <FormulaireProfil key={session.utilisateur.id} utilisateur={session.utilisateur} />;
}

function FormulaireProfil({ utilisateur: u }: { utilisateur: UtilisateurApi }) {
  const [infos, setInfos] = useState({
    nom: u.nom,
    prenom: u.prenom,
    email: u.email ?? "",
    zone: u.zone?.nom ?? "",
    typeClient: u.typeClient ?? "PARTICULIER",
    entreprise: u.entreprise ?? "",
  });
  const [envoi, setEnvoi] = useState(false);
  const zones = useZonesApi(true);
  // Adresses enregistrées sur cet appareil (pas encore conservées par le serveur).
  const [adresses, setAdresses] = usePersistant<Adresse[]>(`adresses-${u.id}`, AUCUNE_ADRESSE);
  const [nouvelle, setNouvelle] = useState({ label: "", texte: "" });
  const champ = (cle: keyof typeof infos) => ({ value: infos[cle], onChange: (e: { target: { value: string } }) => setInfos((i) => ({ ...i, [cle]: e.target.value })) });

  const etapes = [Boolean(u.nom && u.prenom), Boolean(infos.email), Boolean(infos.zone), Boolean(u.photoUrl)];
  const complet = Math.round((etapes.filter(Boolean).length / etapes.length) * 100);
  const membreDepuis = new Date(u.inscritLe).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });

  async function enregistrer() {
    if (!infos.nom.trim() || !infos.prenom.trim()) return toast("Le nom et le prénom sont obligatoires.", "error");
    setEnvoi(true);
    try {
      const maj = await api<UtilisateurApi>("/moi", {
        methode: "PATCH",
        corps: {
          nom: infos.nom.trim(),
          prenom: infos.prenom.trim(),
          email: infos.email.trim() || undefined,
          zoneId: idZone(zones, infos.zone),
          typeClient: infos.typeClient,
          entreprise: infos.typeClient === "ENTREPRISE" ? infos.entreprise.trim() || undefined : undefined,
        },
      });
      mettreAJourUtilisateur(maj);
      toast("Profil mis à jour");
    } catch (e) {
      toast(texteErreur(e), "error");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <PageHeader title="Mon profil" subtitle="Ces informations sont partagées avec les techniciens que vous contactez." />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Reveal className="space-y-6">
          <Card className="p-6 text-center">
            <PhotoUpload nom={u.nomComplet} />
            <p className="mt-4 text-lg font-bold text-slate-900">{u.nomComplet}</p>
            <p className="text-sm text-slate-500">
              {u.typeClient === "ENTREPRISE" ? "Entreprise" : "Particulier"} · Membre depuis {membreDepuis}
            </p>
            <div className="mt-5 text-left">
              <div className="mb-1.5 flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Profil complété</span>
                <span className="text-brand-600">{complet} %</span>
              </div>
              <ProgressBar value={complet} />
              {!infos.email && <p className="mt-2 text-xs text-slate-500">Ajoutez votre e-mail pour recevoir vos reçus de paiement.</p>}
            </div>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card className="p-6">
            <h2 className="mb-5 font-bold text-slate-900">Informations personnelles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom">
                <Input maxLength={60} {...champ("nom")} />
              </Field>
              <Field label="Prénom">
                <Input maxLength={60} {...champ("prenom")} />
              </Field>
              <Field label="Téléphone" hint="Votre numéro sert à vous connecter : contactez le support pour le changer.">
                <Input value={u.telephone} disabled />
              </Field>
              <Field label="E-mail">
                <Input type="email" placeholder="nom@exemple.gn" {...champ("email")} />
              </Field>
              <Field label="Type de compte">
                <Select {...champ("typeClient")}>
                  <option value="PARTICULIER">Particulier</option>
                  <option value="ENTREPRISE">Entreprise / PME</option>
                </Select>
              </Field>
              <Field label="Zone">
                <Select {...champ("zone")}>
                  <option value="" disabled>
                    Choisir une zone
                  </option>
                  {zones.map((z) => (
                    <option key={z.id}>{z.nom}</option>
                  ))}
                </Select>
              </Field>
              {infos.typeClient === "ENTREPRISE" && (
                <Field label="Nom de l'entreprise" className="md:col-span-2">
                  <Input maxLength={120} {...champ("entreprise")} />
                </Field>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-bold text-slate-900">Mes adresses d&apos;intervention</h2>
            <p className="mb-4 mt-1 text-xs text-slate-500">Enregistrées sur cet appareil, pour remplir plus vite vos demandes.</p>
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
            <div className="mt-3 grid gap-2 sm:grid-cols-[140px_1fr_auto]">
              <Input placeholder="Domicile, Bureau…" value={nouvelle.label} onChange={(e) => setNouvelle({ ...nouvelle, label: e.target.value })} />
              <Input placeholder="Quartier, rue, repère" value={nouvelle.texte} onChange={(e) => setNouvelle({ ...nouvelle, texte: e.target.value })} />
              <Button
                variant="outline"
                disabled={!nouvelle.texte.trim()}
                onClick={() => {
                  setAdresses([...adresses, { id: Date.now(), label: nouvelle.label.trim() || "Adresse", texte: nouvelle.texte.trim(), zone: infos.zone || "Conakry" }]);
                  setNouvelle({ label: "", texte: "" });
                }}
              >
                <Plus className="size-4" /> Ajouter
              </Button>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button size="lg" onClick={enregistrer} disabled={envoi}>
              {envoi ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </Reveal>
      </div>
    </>
  );
}

// ------------------------------------------------------------ Démonstration

function ProfilDemo() {
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
