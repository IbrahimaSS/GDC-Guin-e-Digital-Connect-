"use client";

import { Building2, ClipboardList, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import EtapeCode from "@/components/auth/EtapeCode";
import { useVerificationNumero } from "@/components/auth/useVerificationNumero";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Button, cn, Field, Input, Select } from "@/components/ui";
import { apiActive, texteErreur } from "@/lib/api";
import { idZone, inscrire, useZonesApi } from "@/lib/auth";
import { ZONES } from "@/lib/data";
import { cheminRetour, retourDemande } from "@/lib/redirect";
import { ESPACE_ROLE, formaterNumero, useNumeroVerifie } from "@/lib/session";

interface Saisie {
  nom: string;
  prenom: string;
  zone: string;
  email: string;
  entreprise: string;
}

export default function InscriptionClientForm() {
  const router = useRouter();
  const redirect = cheminRetour(useSearchParams().get("redirect"));
  const [type, setType] = useState<"particulier" | "entreprise">("particulier");
  // Numéro déjà vérifié sur la page de connexion : prérempli tant que l'utilisateur ne le modifie pas.
  const verifie = useNumeroVerifie();
  const [telephoneSaisi, setTelephone] = useState<string | null>(null);
  const telephone = telephoneSaisi ?? (verifie ? formaterNumero(verifie.telephone) : "");
  // État pour réafficher le formulaire, référence pour la création du compte (lue juste après le clic).
  const [saisie, setSaisie] = useState<Saisie | null>(null);
  const derniereSaisie = useRef<Saisie | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const zones = useZonesApi(apiActive);

  const verification = useVerificationNumero({
    async creerCompte(jetonInscription) {
      const s = derniereSaisie.current!;
      const res = await inscrire({
        jetonInscription,
        nom: s.nom,
        prenom: s.prenom,
        role: "CLIENT",
        zoneId: idZone(zones, s.zone),
        email: s.email || undefined,
        typeClient: type === "entreprise" ? "ENTREPRISE" : "PARTICULIER",
        entreprise: type === "entreprise" ? s.entreprise : undefined,
      });
      toast(`Compte créé. Bienvenue sur GDC, ${res.utilisateur.prenom} !`);
      router.push(redirect ?? "/client");
    },
    compteExistant(utilisateur) {
      toast(`Ce numéro avait déjà un compte : vous êtes connecté, ${utilisateur.prenom}.`, "info");
      router.push(redirect ?? ESPACE_ROLE[utilisateur.role]);
    },
  });

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!apiActive) {
      // Démonstration : création simulée.
      setEnvoi(true);
      setTimeout(() => {
        toast("Compte créé ! Bienvenue sur GDC");
        router.push(redirect ?? "/client");
      }, 900);
      return;
    }
    const f = new FormData(e.currentTarget);
    const texte = (cle: string) => String(f.get(cle) ?? "").trim();
    derniereSaisie.current = { nom: texte("nom"), prenom: texte("prenom"), zone: texte("zone"), email: texte("email"), entreprise: texte("entreprise") };
    setSaisie(derniereSaisie.current);
    setErreur("");
    setEnvoi(true);
    try {
      await verification.demarrer(telephone);
    } catch (err) {
      setErreur(texteErreur(err));
    } finally {
      setEnvoi(false);
    }
  }

  if (verification.telephone) {
    return (
      <EtapeCode
        titre="Vérifiez votre numéro"
        telephone={telephone}
        onValider={verification.valider}
        onRenvoyer={verification.renvoyer}
        codeTest={verification.codeTest}
        onRetour={verification.annuler}
      />
    );
  }

  return (
    <Reveal stagger={0.08}>
      {retourDemande(redirect) && (
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
            <Input name="nom" required autoComplete="family-name" placeholder="Camara" defaultValue={saisie?.nom} />
          </Field>
          <Field label="Prénom *">
            <Input name="prenom" required autoComplete="given-name" placeholder="Mohamed" defaultValue={saisie?.prenom} />
          </Field>
          <Field label="Téléphone *" hint="Un code de vérification vous sera envoyé.">
            <Input
              required
              type="tel"
              autoComplete="tel-national"
              placeholder="620 12 34 56"
              pattern="\s*(\+?224)?[\s.]*6(\s*\d){8}\s*"
              title="Numéro mobile guinéen à 9 chiffres, ex. 620 12 34 56"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
          </Field>
          <Field label="Quartier / Zone *">
            <Select name="zone" required defaultValue={saisie?.zone ?? ""}>
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
                <Input name="entreprise" required autoComplete="organization" placeholder="Kaloum Services SARL" defaultValue={saisie?.entreprise} />
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
            <Input name="email" type="email" autoComplete="email" placeholder="nom@exemple.gn" defaultValue={saisie?.email} />
          </Field>
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input required type="checkbox" className="mt-0.5 size-4 accent-brand-600" />
          J&apos;accepte les conditions d&apos;utilisation et la politique de protection des données de GDC.
        </label>

        {erreur && <p className="text-sm font-medium text-red-600">{erreur}</p>}
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
