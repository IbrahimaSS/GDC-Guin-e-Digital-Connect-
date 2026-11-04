"use client";

import { BadgeCheck, Building2, CreditCard, Lightbulb, MapPin, MessageSquare, Palette, Percent, Save, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import Reveal from "@/components/motion/Reveal";
import LogoEditeur from "@/components/shared/LogoEditeur";
import ModelesNotifications from "@/components/shared/ModelesNotifications";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, cn, Field, Input, Logo, PageHeader, Select, Textarea } from "@/components/ui";
import { Tabs, Toggle } from "@/components/ui/interactive";
import { api, apiActive, texteErreur } from "@/lib/api";
import { rafraichirParametres } from "@/lib/plateforme";
import { useApi } from "@/lib/useApi";

type Onglet = "general" | "verification" | "paiements" | "notifications" | "identite";

function Bloc({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="mb-5 flex items-center gap-2 font-bold text-slate-900">
        <Icon className="size-5 text-brand-600" /> {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

const COULEURS = [
  { nom: "Bleu principal", hex: "#0066CC", role: "Confiance, fiabilité", cls: "bg-brand-600" },
  { nom: "Orange principal", hex: "#FF8A00", role: "Dynamisme, action", cls: "bg-accent-500" },
  { nom: "Cyan", hex: "#00B4E6", role: "Modernité, clarté", cls: "bg-sky-brand" },
  { nom: "Bleu nuit", hex: "#071A3A", role: "Texte et fonds sombres", cls: "bg-brand-950" },
];

const VALEURS: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "Confiance" },
  { icon: BadgeCheck, label: "Professionnalisme" },
  { icon: MapPin, label: "Proximité" },
  { icon: Lightbulb, label: "Innovation" },
];

/** Paramètres modifiables sur cette page (les logos se gèrent dans « Identité visuelle »). */
interface Parametres {
  nomPlateforme: string;
  slogan: string;
  messageAccueil: string;
  telephoneSupport: string;
  emailSupport: string;
  inscriptionsOuvertes: boolean;
  maintenance: boolean;
  /** Taux : 0.05 = 5 % */
  commission: number;
  fraisDeplacementDefaut: number;
  moyensPaiement: { orange: boolean; mtn: boolean; especes: boolean };
  abonnementPro: number;
  offreEntreprises: "devis" | "forfait";
  missionsNiveau3: number;
  noteNiveau3: number;
  validiteVerificationMois: number;
  modererAvisNegatifs: boolean;
  delaiAvisJours: number;
  canaux: { sms: boolean; whatsapp: boolean; email: boolean };
  expediteurSms: string;
}

const DEFAUT: Parametres = {
  nomPlateforme: "GDC – Guinée Digital Connect",
  slogan: "Les compétences au service des opportunités.",
  messageAccueil: "Bienvenue sur GDC ! Trouvez le bon professionnel près de chez vous.",
  telephoneSupport: "+224 620 00 00 00",
  emailSupport: "support@gdc.gn",
  inscriptionsOuvertes: true,
  maintenance: false,
  commission: 0.05,
  fraisDeplacementDefaut: 50000,
  moyensPaiement: { orange: true, mtn: true, especes: true },
  abonnementPro: 50000,
  offreEntreprises: "devis",
  missionsNiveau3: 20,
  noteNiveau3: 4.5,
  validiteVerificationMois: 24,
  modererAvisNegatifs: true,
  delaiAvisJours: 14,
  canaux: { sms: true, whatsapp: true, email: false },
  expediteurSms: "GDC",
};
const CLES = Object.keys(DEFAUT) as (keyof Parametres)[];

/** Valeur d'un champ numérique (NaN si vide, refusé à l'enregistrement). */
const nombre = (v: string) => (v.trim() === "" ? NaN : Number(v));
const champ = (n: number) => (Number.isNaN(n) ? "" : n);

/**
 * Paramètres du serveur (ou de la maquette en démonstration). Les modifications restent dans un
 * brouillon jusqu'à « Enregistrer », qui n'envoie que les valeurs changées.
 */
function useParametres() {
  const { donnees, chargement } = useApi<Parametres>(apiActive ? "/admin/parametres" : null);
  const [enregistres, setEnregistres] = useState<Parametres | null>(null);
  const [brouillon, setBrouillon] = useState<Partial<Parametres>>({});
  const base: Parametres = { ...DEFAUT, ...(enregistres ?? (apiActive ? donnees : null) ?? {}) };
  const p: Parametres = { ...base, ...brouillon };
  const modifies = CLES.filter((k) => k in brouillon && JSON.stringify(brouillon[k]) !== JSON.stringify(base[k]));
  const pret = !apiActive || (!chargement && Boolean(donnees));
  return { p, modifies, pret, setBrouillon, setEnregistres };
}

export default function ParametresPlateforme() {
  const [onglet, setOnglet] = useState<Onglet>("general");
  const { p, modifies, pret, setBrouillon, setEnregistres } = useParametres();
  const [envoi, setEnvoi] = useState(false);
  const maj = <K extends keyof Parametres>(k: K, v: Parametres[K]) => setBrouillon((b) => ({ ...b, [k]: v }));
  const moyen = (k: keyof Parametres["moyensPaiement"]) => (v: boolean) => maj("moyensPaiement", { ...p.moyensPaiement, [k]: v });
  const canal = (k: keyof Parametres["canaux"]) => (v: boolean) => maj("canaux", { ...p.canaux, [k]: v });

  async function enregistrer() {
    if (!modifies.length) return toast("Aucune modification à enregistrer", "info");
    const valeurs = Object.fromEntries(modifies.map((k) => [k, p[k]]));
    if (Object.values(valeurs).some((v) => typeof v === "number" && Number.isNaN(v))) return toast("Un champ numérique est vide.", "error");
    if (apiActive) {
      setEnvoi(true);
      try {
        setEnregistres(await api<Parametres>("/admin/parametres", { methode: "PUT", corps: valeurs }));
        void rafraichirParametres(); // en-tête du site, inscription, paiement…
      } catch (e) {
        setEnvoi(false);
        return toast(texteErreur(e), "error");
      }
      setEnvoi(false);
    } else {
      setEnregistres(p);
    }
    setBrouillon({});
    toast("Paramètres de la plateforme enregistrés");
  }

  return (
    <>
      <PageHeader
        title="Paramètres de la plateforme"
        subtitle="Configuration générale de GDC."
        actions={
          <Button onClick={enregistrer} disabled={envoi || !pret}>
            <Save className="size-4" /> {envoi ? "Enregistrement…" : modifies.length ? `Enregistrer (${modifies.length})` : "Enregistrer"}
          </Button>
        }
      />
      <Tabs<Onglet>
        value={onglet}
        onChange={setOnglet}
        className="mb-6"
        tabs={[
          { id: "general", label: "Général" },
          { id: "verification", label: "Vérification" },
          { id: "paiements", label: "Paiements" },
          { id: "notifications", label: "Notifications" },
          { id: "identite", label: "Identité visuelle" },
        ]}
      />

      <Reveal key={onglet} className="grid gap-6 lg:grid-cols-2">
        {onglet === "general" && (
          <>
            <Bloc icon={Building2} title="Informations générales">
              <Field label="Nom de la plateforme">
                <Input value={p.nomPlateforme} onChange={(e) => maj("nomPlateforme", e.target.value)} />
              </Field>
              <Field label="Slogan">
                <Input value={p.slogan} onChange={(e) => maj("slogan", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Téléphone support">
                  <Input value={p.telephoneSupport} onChange={(e) => maj("telephoneSupport", e.target.value)} />
                </Field>
                <Field label="E-mail support">
                  <Input type="email" value={p.emailSupport} onChange={(e) => maj("emailSupport", e.target.value)} />
                </Field>
              </div>
            </Bloc>
            <Bloc icon={Wrench} title="Fonctionnement">
              <Toggle
                checked={p.inscriptionsOuvertes}
                onChange={(v) => maj("inscriptionsOuvertes", v)}
                label="Inscriptions ouvertes"
                description="Autoriser la création de nouveaux comptes."
              />
              <Toggle checked={p.maintenance} onChange={(v) => maj("maintenance", v)} label="Mode maintenance" description="Affiche un bandeau d'information aux visiteurs." />
              <Field label="Message d'accueil">
                <Textarea className="min-h-20" value={p.messageAccueil} onChange={(e) => maj("messageAccueil", e.target.value)} />
              </Field>
            </Bloc>
          </>
        )}

        {onglet === "verification" && (
          <>
            <Bloc icon={ShieldCheck} title="Règles de vérification">
              <Field label="Missions minimum pour le niveau 3" hint="Le niveau 3 (Expert) est attribué automatiquement dès que les deux seuils sont atteints.">
                <Input type="number" min={1} value={champ(p.missionsNiveau3)} onChange={(e) => maj("missionsNiveau3", nombre(e.target.value))} />
              </Field>
              <Field label="Note minimum pour le niveau 3">
                <Input type="number" step={0.1} min={1} max={5} value={champ(p.noteNiveau3)} onChange={(e) => maj("noteNiveau3", nombre(e.target.value))} />
              </Field>
              <Field label="Validité d'une vérification (mois)">
                <Input type="number" min={1} value={champ(p.validiteVerificationMois)} onChange={(e) => maj("validiteVerificationMois", nombre(e.target.value))} />
              </Field>
            </Bloc>
            <Bloc icon={MessageSquare} title="Avis clients">
              <Toggle
                checked={p.modererAvisNegatifs}
                onChange={(v) => maj("modererAvisNegatifs", v)}
                label="Modérer les avis de 1 et 2 étoiles"
                description="Revue manuelle avant publication."
              />
              <Field label="Délai pour laisser un avis (jours)">
                <Input type="number" min={1} value={champ(p.delaiAvisJours)} onChange={(e) => maj("delaiAvisJours", nombre(e.target.value))} />
              </Field>
            </Bloc>
          </>
        )}

        {onglet === "paiements" && (
          <>
            <Bloc icon={CreditCard} title="Moyens de paiement">
              <Toggle checked={p.moyensPaiement.orange} onChange={moyen("orange")} label="Orange Money" description="Paiement mobile, confirmation instantanée." />
              <Toggle checked={p.moyensPaiement.mtn} onChange={moyen("mtn")} label="MTN Mobile Money" description="Paiement mobile, confirmation instantanée." />
              <Toggle checked={p.moyensPaiement.especes} onChange={moyen("especes")} label="Espèces" description="Paiement direct au technicien, déclaré dans l'application." />
            </Bloc>
            <Bloc icon={Percent} title="Modèle économique">
              <Field label="Commission sur les missions (%)" hint="Phase pilote : commission réduite pour favoriser l'adoption.">
                <Input
                  type="number"
                  step={0.5}
                  min={0}
                  max={30}
                  value={Number.isNaN(p.commission) ? "" : Math.round(p.commission * 1000) / 10}
                  onChange={(e) => maj("commission", nombre(e.target.value) / 100)}
                />
              </Field>
              <Field label="Frais de déplacement par défaut (GNF)">
                <Input type="number" min={0} step={5000} value={champ(p.fraisDeplacementDefaut)} onChange={(e) => maj("fraisDeplacementDefaut", nombre(e.target.value))} />
              </Field>
              <Field label="Abonnement Pro (GNF / mois)">
                <Input type="number" min={0} step={5000} value={champ(p.abonnementPro)} onChange={(e) => maj("abonnementPro", nombre(e.target.value))} />
              </Field>
              <Field label="Offre Entreprises">
                <Select value={p.offreEntreprises} onChange={(e) => maj("offreEntreprises", e.target.value as Parametres["offreEntreprises"])}>
                  <option value="devis">Sur devis</option>
                  <option value="forfait">Forfait mensuel</option>
                </Select>
              </Field>
            </Bloc>
          </>
        )}

        {onglet === "notifications" && (
          <Bloc icon={MessageSquare} title="Canaux de notification">
            <Toggle checked={p.canaux.sms} onChange={canal("sms")} label="SMS" description="Codes de connexion, nouvelles demandes, rappels." />
            <Toggle checked={p.canaux.whatsapp} onChange={canal("whatsapp")} label="WhatsApp Business" description="Messages et suivi des missions." />
            <Toggle checked={p.canaux.email} onChange={canal("email")} label="E-mail" description="Récapitulatifs et factures." />
            <Field label="Expéditeur SMS" hint="11 caractères au plus : le nom affiché sur le téléphone.">
              <Input maxLength={11} value={p.expediteurSms} onChange={(e) => maj("expediteurSms", e.target.value)} />
            </Field>
          </Bloc>
        )}
        {onglet === "notifications" && <ModelesNotifications />}

        {onglet === "identite" && (
          <>
            <LogoEditeur />
            <Card className="p-6 lg:col-span-2">
              <h2 className="mb-6 flex items-center gap-2 font-bold text-slate-900">
                <Palette className="size-5 text-brand-600" /> Couleurs et identité visuelle
              </h2>
              <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
                <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-8">
                  <Logo className="h-40" />
                  <p className="mt-6 text-center text-sm italic text-slate-500">Ensemble pour une Guinée connectée</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {COULEURS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => {
                        navigator.clipboard?.writeText(c.hex);
                        toast(`${c.hex} copié`);
                      }}
                      className="group flex items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:shadow-md"
                    >
                      <span className={cn("size-14 rounded-2xl shadow-inner transition group-hover:scale-110", c.cls)} />
                      <span>
                        <span className="block font-bold text-slate-900">{c.nom}</span>
                        <span className="block font-mono text-sm text-slate-500">{c.hex}</span>
                        <span className="block text-xs text-slate-400">{c.role}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                {VALEURS.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-brand-50 p-5 text-brand-700">
                    <Icon className="size-7" />
                    <span className="text-sm font-bold">{label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </Reveal>
    </>
  );
}
