"use client";

import { ArrowRight, Building2, ClipboardList, Smartphone, User, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import EtapeCode, { annoncerCode } from "@/components/auth/EtapeCode";
import { enter, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { toast } from "@/components/motion/Toaster";
import { Button, cn, inputClass } from "@/components/ui";
import GoogleConnexion, { googleConfigure } from "@/components/ui/GoogleConnexion";
import { apiActive, texteErreur } from "@/lib/api";
import { connexionGoogle, demanderCode, verifierCode } from "@/lib/auth";
import { cheminRetour, retourDemande } from "@/lib/redirect";
import { ESPACE_ROLE, memoriserNumeroVerifie, type RoleApi } from "@/lib/session";

type Etape = "telephone" | "code" | "espace";

// Numéro mobile guinéen : 9 chiffres commençant par 6.
const TEL_REGEX = /^6\d{8}$/;

const ESPACES = [
  { href: "/client", icon: User, titre: "Espace client", texte: "Mes demandes et mes interventions" },
  { href: "/technicien", icon: Wrench, titre: "Espace technicien", texte: "Mes missions et mon profil pro" },
  { href: "/admin", icon: Building2, titre: "Back-office", texte: "Administration de la plateforme" },
];

export default function ConnexionForm() {
  const router = useRouter();
  const redirect = cheminRetour(useSearchParams().get("redirect"));
  const ref = useRef<HTMLDivElement>(null);
  const [etape, setEtape] = useState<Etape>("telephone");
  const [telephone, setTelephone] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  // Transition entre les étapes : la nouvelle étape glisse depuis la droite.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      enter(".step-panel > *", { x: 40, autoAlpha: 0, stagger: 0.06, duration: 0.5 });
    },
    { dependencies: [etape], scope: ref, revertOnUpdate: true },
  );

  const telNettoye = telephone.replace(/\D/g, "");

  /** Après connexion : retour à l'action en cours (ex. envoi d'une demande), sinon l'espace du rôle. */
  function entrer(role: RoleApi) {
    router.push(redirect ?? ESPACE_ROLE[role]);
  }

  async function envoyerCode(e: FormEvent) {
    e.preventDefault();
    if (!TEL_REGEX.test(telNettoye)) {
      setErreur("Entrez un numéro mobile valide à 9 chiffres (ex. 620 12 34 56).");
      return;
    }
    setErreur("");
    if (!apiActive) {
      setEtape("code");
      return toast("Code envoyé par SMS au +224 " + telephone, "info");
    }
    setEnvoi(true);
    try {
      const { codeDev } = await demanderCode(telNettoye);
      setEtape("code");
      annoncerCode(telephone, codeDev);
    } catch (err) {
      setErreur(texteErreur(err));
    } finally {
      setEnvoi(false);
    }
  }

  async function renvoyer() {
    if (!apiActive) return toast("Nouveau code envoyé par SMS", "info");
    const { codeDev } = await demanderCode(telNettoye);
    annoncerCode(telephone, codeDev);
  }

  async function valider(code: string) {
    if (!apiActive) {
      // Démonstration : tout code à 6 chiffres est accepté.
      if (redirect) return router.push(redirect);
      return setEtape("espace");
    }
    const res = await verifierCode(telNettoye, code);
    if (res.inscriptionRequise) {
      // Numéro vérifié mais sans compte : l'inscription reprend ce numéro sans redemander de code.
      memoriserNumeroVerifie(telNettoye, res.jetonInscription);
      toast("Ce numéro n'a pas encore de compte GDC. Créez-le en une minute.", "info");
      return router.push(redirect ? `/inscription?redirect=${encodeURIComponent(redirect)}` : "/inscription");
    }
    toast(`Bienvenue, ${res.utilisateur.prenom} !`);
    entrer(res.utilisateur.role);
  }

  return (
    <div ref={ref}>
      {retourDemande(redirect) && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-accent-50 p-4 text-sm text-accent-700 ring-1 ring-accent-100">
          <ClipboardList className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>Votre demande est prête.</strong> Identifiez-vous pour l&apos;envoyer : elle partira automatiquement juste après.
          </p>
        </div>
      )}
      <div className="mb-8 flex items-center gap-2">
        {(["telephone", "code", "espace"] as Etape[]).map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-500",
              ["telephone", "code", "espace"].indexOf(etape) >= i ? "bg-accent-500" : "bg-slate-200",
            )}
          />
        ))}
      </div>

      {etape === "telephone" && (
        <form onSubmit={envoyerCode} className="step-panel space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-950">Se connecter</h1>
            <p className="mt-2 text-slate-500">Entrez votre numéro de téléphone pour recevoir votre code de vérification.</p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Numéro de téléphone</span>
            <div className="flex">
              <span className="inline-flex items-center gap-1.5 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-slate-600">
                <Smartphone className="size-4" /> +224
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="620 12 34 56"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className={cn(inputClass, "rounded-l-none text-base")}
                autoFocus
              />
            </div>
          </label>
          {erreur && <p className="text-sm font-medium text-red-600">{erreur}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={envoi}>
            {envoi ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Envoi du code…
              </>
            ) : (
              <>
                Recevoir le code <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          {googleConfigure && (
            <>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" /> ou <span className="h-px flex-1 bg-slate-200" />
              </div>
              <GoogleConnexion
                onConnexion={async (profil) => {
                  if (!apiActive) {
                    toast(`Connecté en tant que ${profil.nom}`);
                    if (redirect) return router.push(redirect);
                    return setEtape("espace");
                  }
                  try {
                    const res = await connexionGoogle(profil.jeton);
                    toast(`Bienvenue, ${res.utilisateur.prenom} !`);
                    entrer(res.utilisateur.role);
                  } catch (err) {
                    setErreur(texteErreur(err));
                  }
                }}
              />
            </>
          )}
          <p className="text-center text-sm text-slate-500">
            Pas encore de compte ?{" "}
            <Link href={redirect ? `/inscription/client?redirect=${encodeURIComponent(redirect)}` : "/inscription"} className="font-bold text-accent-500 hover:underline">
              S&apos;inscrire
            </Link>
          </p>
        </form>
      )}

      {etape === "code" && <EtapeCode telephone={telephone} onValider={valider} onRenvoyer={renvoyer} onRetour={() => setEtape("telephone")} />}

      {etape === "espace" && (
        <div className="step-panel space-y-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-950">Bienvenue !</h1>
            <p className="mt-2 text-slate-500">Votre numéro est associé à plusieurs espaces. Lequel souhaitez-vous ouvrir ?</p>
          </div>
          {ESPACES.map(({ href, icon: Icon, titre, texte }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 p-4 text-left transition hover:border-accent-500 hover:bg-accent-50/40"
            >
              <span className="rounded-xl bg-brand-50 p-3 text-brand-600 transition group-hover:bg-accent-500 group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-bold text-slate-900">{titre}</span>
                <span className="block text-sm text-slate-500">{texte}</span>
              </span>
              <ArrowRight className="size-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-accent-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
