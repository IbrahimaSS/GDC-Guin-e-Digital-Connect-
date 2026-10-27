"use client";

import { BadgeCheck, Building2, CreditCard, Lightbulb, MapPin, MessageSquare, Palette, Percent, Save, ShieldCheck, Wrench, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import Reveal from "@/components/motion/Reveal";
import LogoEditeur from "@/components/shared/LogoEditeur";
import ModelesNotifications from "@/components/shared/ModelesNotifications";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, cn, Field, Input, Logo, PageHeader, Select, Textarea } from "@/components/ui";
import { Tabs, Toggle } from "@/components/ui/interactive";

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

export default function ParametresPlateforme() {
  const [onglet, setOnglet] = useState<Onglet>("general");
  const [opts, setOpts] = useState({
    maintenance: false,
    inscriptions: true,
    verifAuto: true,
    avisModeration: true,
    orange: true,
    mtn: true,
    especes: true,
    sms: true,
    whatsapp: true,
    email: false,
  });
  const set = (k: keyof typeof opts) => (v: boolean) => setOpts({ ...opts, [k]: v });

  return (
    <>
      <PageHeader
        title="Paramètres de la plateforme"
        subtitle="Configuration générale de GDC."
        actions={
          <Button onClick={() => toast("Paramètres de la plateforme enregistrés")}>
            <Save className="size-4" /> Enregistrer
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
                <Input defaultValue="GDC – Guinée Digital Connect" />
              </Field>
              <Field label="Slogan">
                <Input defaultValue="Les compétences au service des opportunités." />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Téléphone support">
                  <Input defaultValue="+224 620 00 00 00" />
                </Field>
                <Field label="E-mail support">
                  <Input defaultValue="support@gdc.gn" />
                </Field>
              </div>
            </Bloc>
            <Bloc icon={Wrench} title="Fonctionnement">
              <Toggle checked={opts.inscriptions} onChange={set("inscriptions")} label="Inscriptions ouvertes" description="Autoriser la création de nouveaux comptes." />
              <Toggle checked={opts.maintenance} onChange={set("maintenance")} label="Mode maintenance" description="Affiche une page d'information aux visiteurs." />
              <Field label="Langue par défaut">
                <Select defaultValue="fr">
                  <option value="fr">Français</option>
                </Select>
              </Field>
              <Field label="Message d'accueil">
                <Textarea className="min-h-20" defaultValue="Bienvenue sur GDC ! Trouvez le bon professionnel près de chez vous." />
              </Field>
            </Bloc>
          </>
        )}

        {onglet === "verification" && (
          <>
            <Bloc icon={ShieldCheck} title="Règles de vérification">
              <Toggle checked={opts.verifAuto} onChange={set("verifAuto")} label="Contrôle automatique des pièces" description="Lecture et contrôle de cohérence avant revue humaine." />
              <Field label="Missions minimum pour le niveau 3">
                <Input type="number" defaultValue={20} />
              </Field>
              <Field label="Note minimum pour le niveau 3">
                <Input type="number" step={0.1} defaultValue={4.5} />
              </Field>
              <Field label="Validité d'une vérification (mois)">
                <Input type="number" defaultValue={24} />
              </Field>
            </Bloc>
            <Bloc icon={MessageSquare} title="Avis clients">
              <Toggle checked={opts.avisModeration} onChange={set("avisModeration")} label="Modérer les avis de 1 et 2 étoiles" description="Revue manuelle avant publication." />
              <Field label="Délai pour laisser un avis (jours)">
                <Input type="number" defaultValue={14} />
              </Field>
            </Bloc>
          </>
        )}

        {onglet === "paiements" && (
          <>
            <Bloc icon={CreditCard} title="Moyens de paiement">
              <Toggle checked={opts.orange} onChange={set("orange")} label="Orange Money" description="Paiement mobile, confirmation instantanée." />
              <Toggle checked={opts.mtn} onChange={set("mtn")} label="MTN Mobile Money" description="Paiement mobile, confirmation instantanée." />
              <Toggle checked={opts.especes} onChange={set("especes")} label="Espèces" description="Paiement direct au technicien, déclaré dans l'application." />
            </Bloc>
            <Bloc icon={Percent} title="Modèle économique">
              <Field label="Commission sur les missions (%)" hint="Phase pilote : commission réduite pour favoriser l'adoption.">
                <Input type="number" defaultValue={5} />
              </Field>
              <Field label="Abonnement Pro (GNF / mois)">
                <Input type="number" defaultValue={50000} />
              </Field>
              <Field label="Offre Entreprises">
                <Select defaultValue="devis">
                  <option value="devis">Sur devis</option>
                  <option value="forfait">Forfait mensuel</option>
                </Select>
              </Field>
            </Bloc>
          </>
        )}

        {onglet === "notifications" && (
          <Bloc icon={MessageSquare} title="Canaux de notification">
            <Toggle checked={opts.sms} onChange={set("sms")} label="SMS" description="Codes de connexion, nouvelles demandes, rappels." />
            <Toggle checked={opts.whatsapp} onChange={set("whatsapp")} label="WhatsApp Business" description="Messages et suivi des missions." />
            <Toggle checked={opts.email} onChange={set("email")} label="E-mail" description="Récapitulatifs et factures." />
            <Field label="Expéditeur SMS">
              <Input defaultValue="GDC" />
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
