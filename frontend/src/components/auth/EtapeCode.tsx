"use client";

import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "@/components/motion/Toaster";
import { Button } from "@/components/ui";
import OtpInput from "@/components/ui/OtpInput";
import { texteErreur } from "@/lib/api";

interface Props {
  /** Numéro affiché, sans l'indicatif : « 620 12 34 56 » */
  telephone: string;
  onValider: (code: string) => Promise<void> | void;
  onRenvoyer: () => Promise<void> | void;
  onRetour: () => void;
  titre?: string;
  /** Code renvoyé par le serveur de développement (aucun SMS réel n'est envoyé). */
  codeTest?: string;
}

const DELAI_RENVOI = 30;

/** En développement, l'API renvoie le code au lieu de l'envoyer par SMS. */
export function annoncerCode(telephone: string, codeDev?: string) {
  if (codeDev) toast(`Mode test, aucun SMS envoyé : votre code est ${codeDev}`, "info");
  else toast("Code envoyé par SMS au +224 " + telephone, "info");
}

/** Saisie du code à 6 chiffres reçu par SMS, avec renvoi après 30 secondes. */
export default function EtapeCode({ telephone, onValider, onRenvoyer, onRetour, titre = "Vérification", codeTest }: Props) {
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [compteur, setCompteur] = useState(DELAI_RENVOI);

  useEffect(() => {
    if (compteur <= 0) return;
    const t = setTimeout(() => setCompteur((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [compteur]);

  async function valider(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return setErreur("Le code contient 6 chiffres.");
    setErreur("");
    setEnvoi(true);
    try {
      await onValider(code);
    } catch (err) {
      setErreur(texteErreur(err));
      setCode("");
    } finally {
      setEnvoi(false);
    }
  }

  async function renvoyer() {
    setCode("");
    setErreur("");
    try {
      await onRenvoyer();
      setCompteur(DELAI_RENVOI);
    } catch (err) {
      setErreur(texteErreur(err));
    }
  }

  return (
    <form onSubmit={valider} className="step-panel space-y-6">
      <div>
        <span className="inline-flex rounded-2xl bg-brand-50 p-3 text-brand-600">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-950">{titre}</h1>
        <p className="mt-2 text-slate-500">
          Saisissez le code à 6 chiffres envoyé au <strong className="text-slate-800">+224 {telephone}</strong>.
        </p>
      </div>
      {codeTest && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Mode test, aucun SMS n&apos;est envoyé. Votre code : <strong className="font-mono text-base tracking-widest">{codeTest}</strong>
        </p>
      )}
      <OtpInput value={code} onChange={setCode} error={!!erreur} />
      {erreur && <p className="text-sm font-medium text-red-600">{erreur}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={code.length !== 6 || envoi}>
        {envoi ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Vérification…
          </>
        ) : (
          "Valider"
        )}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onRetour} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-brand-600">
          <ArrowLeft className="size-4" /> Modifier le numéro
        </button>
        <button type="button" disabled={compteur > 0} onClick={renvoyer} className="font-semibold text-brand-600 disabled:text-slate-400">
          {compteur > 0 ? `Renvoyer (${compteur}s)` : "Renvoyer le code"}
        </button>
      </div>
    </form>
  );
}
