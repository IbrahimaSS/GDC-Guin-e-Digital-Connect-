"use client";

import { Building2, ClipboardList, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Button, cn, Field, Input, Select } from "@/components/ui";
import { ZONES } from "@/lib/data";
import { cheminRetour } from "@/lib/redirect";

export default function InscriptionClientForm() {
  const router = useRouter();
  const redirect = cheminRetour(useSearchParams().get("redirect"));
  const [type, setType] = useState<"particulier" | "entreprise">("particulier");
  const [envoi, setEnvoi] = useState(false);

  function soumettre(e: FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    // Simulation de l'appel API.
    setTimeout(() => {
      toast("Compte créé ! Bienvenue sur GDC 🎉");
      router.push(redirect ?? "/client");
    }, 900);
  }

  return (
    <Reveal stagger={0.08}>
      {redirect && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-accent-50 p-4 text-sm text-accent-700 ring-1 ring-accent-100">
          <ClipboardList className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>Votre demande est prête.</strong> Créez votre compte pour l&apos;envoyer : elle partira automatiquement juste après.
          </p>
        </div>
      )}
      <Link href="/inscription" className="text-sm font-semibold text-slate-500 hover:text-brand-600">
        ← Changer de type de compte
      </Link>
      <div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950">Créer votre compte client</h1>
        <p className="mt-2 text-slate-500">Quelques informations pour faciliter vos demandes d&apos;intervention.</p>
      </div>

      <form onSubmit={soumettre} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
          {[
            { id: "particulier" as const, icon: User, label: "Particulier" },
            { id: "entreprise" as const, icon: Building2, label: "Entreprise / PME" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300",
                type === id ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-800",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom *">
            <Input required autoComplete="family-name" placeholder="Camara" />
          </Field>
          <Field label="Prénom *">
            <Input required autoComplete="given-name" placeholder="Mohamed" />
          </Field>
          <Field label="Téléphone *" hint="Un code de vérification vous sera envoyé.">
            <Input required type="tel" autoComplete="tel-national" placeholder="620 12 34 56" />
          </Field>
          <Field label="Quartier / Zone *">
            <Select required defaultValue="">
              <option value="" disabled>
                Choisir une zone
              </option>
              {ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </Select>
          </Field>
          {type === "entreprise" && (
            <>
              <Field label="Nom de l'entreprise *">
                <Input required autoComplete="organization" placeholder="Kaloum Services SARL" />
              </Field>
              <Field label="Secteur d'activité">
                <Select defaultValue="">
                  <option value="">Choisir</option>
                  <option>Commerce</option>
                  <option>Hôtellerie / restauration</option>
                  <option>Immobilier</option>
                  <option>Bureaux / services</option>
                  <option>Industrie</option>
                </Select>
              </Field>
            </>
          )}
          <Field label="E-mail (optionnel)" className="sm:col-span-2">
            <Input type="email" autoComplete="email" placeholder="nom@exemple.gn" />
          </Field>
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input required type="checkbox" className="mt-0.5 size-4 accent-brand-600" />
          J&apos;accepte les conditions d&apos;utilisation et la politique de protection des données de GDC.
        </label>

        <Button type="submit" size="lg" className="w-full" disabled={envoi}>
          {envoi ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Création du compte…
            </>
          ) : (
            "Créer mon compte"
          )}
        </Button>
        <p className="text-center text-sm text-slate-500">
          Déjà un compte ?{" "}
          <Link href={redirect ? `/connexion?redirect=${encodeURIComponent(redirect)}` : "/connexion"} className="font-bold text-brand-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </Reveal>
  );
}
