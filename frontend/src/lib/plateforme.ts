"use client";

// Paramètres publics de la plateforme (GET /api/parametres) : logos, contacts, inscriptions ouvertes,
// moyens de paiement… Gardés dans le navigateur pour un affichage immédiat, puis rafraîchis.

import { useEffect } from "react";
import { api, apiActive } from "./api";
import { METIERS, METIERS_API, type Metier, type MetierId } from "./data";
import { ecrire, usePersistant } from "./stockage";

export interface ParametresPublics {
  nomPlateforme: string;
  slogan: string;
  messageAccueil: string;
  logoUrl: string | null;
  logoSombreUrl: string | null;
  telephoneSupport: string;
  emailSupport: string;
  inscriptionsOuvertes: boolean;
  maintenance: boolean;
  moyensPaiement: { orange: boolean; mtn: boolean; especes: boolean };
  fraisDeplacementDefaut: number;
}

const CLE = "parametres-publics";
const AUCUN: ParametresPublics | null = null;
let chargement: Promise<void> | null = null;

/** Recharge les paramètres publics (après une modification dans le back-office, par exemple). */
export function rafraichirParametres() {
  chargement = api<ParametresPublics>("/parametres", { auth: false })
    .then((p) => ecrire(CLE, p))
    .catch(() => {
      chargement = null;
    });
  return chargement;
}

// ------------------------------------------------------------ Métiers

interface MetierApi {
  id: string;
  label: string;
  specialites: string[];
  actif: boolean;
  nbTechniciens: number;
}

const CLE_METIERS = "metiers-publics";
const AUCUN_METIER: MetierApi[] | null = null;
let chargementMetiers: Promise<void> | null = null;

/**
 * Métiers proposés aux visiteurs : ceux de l'API (actifs, avec le nombre de techniciens vérifiés),
 * ou ceux de la maquette en démonstration.
 */
export function useMetiers(): Metier[] {
  const [liste] = usePersistant<MetierApi[] | null>(CLE_METIERS, AUCUN_METIER);
  useEffect(() => {
    if (!apiActive || chargementMetiers) return;
    chargementMetiers = api<MetierApi[]>("/metiers", { auth: false })
      .then((m) => ecrire(CLE_METIERS, m))
      .catch(() => {
        chargementMetiers = null;
      });
  }, []);
  if (!apiActive) return METIERS;
  const metiers = (liste ?? []).map((m) => ({ id: m.id as MetierId, label: m.label, techniciens: m.nbTechniciens, demandes: 0, actif: m.actif }));
  // getMetier() connaît ainsi les métiers ajoutés depuis le back-office.
  for (const m of metiers) METIERS_API.set(m.id, m);
  return metiers;
}

/** Paramètres publics (null en démonstration ou avant le premier chargement). */
export function useParametresPublics() {
  const [parametres] = usePersistant<ParametresPublics | null>(CLE, AUCUN);
  useEffect(() => {
    if (apiActive && !chargement) void rafraichirParametres();
  }, []);
  return apiActive ? parametres : null;
}
