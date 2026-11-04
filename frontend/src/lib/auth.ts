"use client";

import { useEffect, useState } from "react";
import { api, ErreurApi } from "./api";
import { fermerSession, lireSession, ouvrirSession, oublierNumeroVerifie, type ReponseSession } from "./session";

// Connexion et inscription par numéro de téléphone (code SMS), branchées sur l'API.

/**
 * Demande un code. « connexion » : refusé (404) si le numéro n'a pas de compte ;
 * « inscription » : refusé (409) s'il en a déjà un. Aucun SMS n'est alors envoyé.
 * Le serveur de développement renvoie le code (codeDev) : aucun SMS réel n'est envoyé.
 */
export async function demanderCode(telephone: string, but: "connexion" | "inscription") {
  return api<{ expireDansSecondes: number; codeDev?: string }>("/auth/otp/demander", { methode: "POST", corps: { telephone, but }, auth: false });
}

/** Le numéro n'a pas de compte (connexion) ou en a déjà un (inscription). */
export const sansCompte = (e: unknown) => e instanceof ErreurApi && e.statut === 404;
export const dejaInscrit = (e: unknown) => e instanceof ErreurApi && e.statut === 409;

export type ResultatVerification = { inscriptionRequise: true; jetonInscription: string } | ({ inscriptionRequise: false } & ReponseSession);

/** Vérifie le code. Si le numéro a déjà un compte, la session est ouverte. */
export async function verifierCode(telephone: string, code: string) {
  const res = await api<ResultatVerification>("/auth/otp/verifier", { methode: "POST", corps: { telephone, code }, auth: false });
  if (!res.inscriptionRequise) ouvrirSession(res);
  return res;
}

export interface Inscription {
  jetonInscription: string;
  nom: string;
  prenom: string;
  role: "CLIENT" | "TECHNICIEN";
  zoneId?: string;
  email?: string;
  typeClient?: "PARTICULIER" | "ENTREPRISE";
  entreprise?: string;
  technicien?: { metierId: string; specialites?: string[]; experience?: number; zones?: string[]; bio?: string };
}

export async function inscrire(donnees: Inscription) {
  const res = await api<ReponseSession>("/auth/inscription", { methode: "POST", corps: donnees, auth: false });
  oublierNumeroVerifie();
  ouvrirSession(res);
  return res;
}

export async function connexionGoogle(jeton: string) {
  const res = await api<ReponseSession>("/auth/google", { methode: "POST", corps: { jeton }, auth: false });
  ouvrirSession(res);
  return res;
}

export async function deconnecter() {
  const session = lireSession();
  if (session) {
    // La session est fermée localement même si le serveur ne répond pas.
    await api("/auth/deconnexion", { methode: "POST", corps: { rafraichissement: session.rafraichissement }, auth: false }).catch(() => undefined);
  }
  fermerSession();
}

// ------------------------------------------------------------ Référentiels

export interface ZoneApi {
  id: string;
  nom: string;
  ville: string;
  lat: number | null;
  lng: number | null;
}

let zones: Promise<ZoneApi[]> | null = null;

/** Zones desservies (chargées une fois). Le frontend désigne les zones par leur nom, l'API par leur identifiant. */
export function useZonesApi(actif: boolean) {
  const [liste, setListe] = useState<ZoneApi[]>([]);
  useEffect(() => {
    if (!actif) return;
    zones ??= api<ZoneApi[]>("/zones", { auth: false }).catch((e) => {
      zones = null;
      throw e;
    });
    zones.then(setListe).catch(() => setListe([]));
  }, [actif]);
  return liste;
}

export const idZone = (liste: ZoneApi[], nom: string) => liste.find((z) => z.nom === nom)?.id;
