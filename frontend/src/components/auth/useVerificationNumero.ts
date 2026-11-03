"use client";

import { useEffect, useRef, useState } from "react";
import { demanderCode, verifierCode } from "@/lib/auth";
import { numeroVerifie, type UtilisateurApi } from "@/lib/session";
import { annoncerCode } from "./EtapeCode";

interface Rappels {
  /** Crée le compte avec le jeton d'inscription remis par l'API. */
  creerCompte: (jetonInscription: string) => Promise<void>;
  /** Le numéro avait déjà un compte : la session est ouverte sur celui-ci. */
  compteExistant: (utilisateur: UtilisateurApi) => void;
}

/**
 * Vérification du numéro pendant une inscription : envoi du code, saisie, puis création du compte.
 * Si le numéro vient d'être vérifié sur la page de connexion, le code n'est pas redemandé.
 */
export function useVerificationNumero({ creerCompte, compteExistant }: Rappels) {
  const [telephone, setTelephone] = useState<string | null>(null);
  const [codeTest, setCodeTest] = useState<string>();
  const rappels = useRef({ creerCompte, compteExistant });
  useEffect(() => {
    rappels.current = { creerCompte, compteExistant };
  });

  async function demarrer(saisie: string) {
    const numero = saisie.replace(/\D/g, "").replace(/^(00)?224/, "");
    const dejaVerifie = numeroVerifie();
    if (dejaVerifie?.telephone === numero) return rappels.current.creerCompte(dejaVerifie.jeton);
    const { codeDev } = await demanderCode(numero);
    setTelephone(numero);
    setCodeTest(codeDev);
    annoncerCode(saisie, codeDev);
  }

  async function valider(code: string) {
    const res = await verifierCode(telephone!, code);
    if (res.inscriptionRequise) await rappels.current.creerCompte(res.jetonInscription);
    else rappels.current.compteExistant(res.utilisateur);
  }

  async function renvoyer() {
    const { codeDev } = await demanderCode(telephone!);
    setCodeTest(codeDev);
    annoncerCode(telephone!, codeDev);
  }

  return {
    /** Numéro en cours de vérification : afficher l'étape du code tant qu'il est défini. */
    telephone,
    codeTest,
    demarrer,
    valider,
    renvoyer,
    annuler: () => setTelephone(null),
  };
}
