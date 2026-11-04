"use client";

import { useSyncExternalStore } from "react";
import { ecrire, lire, usePersistant } from "./stockage";

// Session de l'utilisateur connecté (jetons de l'API + profil), conservée dans le navigateur
// et partagée entre onglets.

export type RoleApi = "CLIENT" | "TECHNICIEN" | "ADMIN";

/** Utilisateur tel que renvoyé par l'API (GET /api/moi). */
export interface UtilisateurApi {
  id: string;
  nom: string;
  prenom: string;
  nomComplet: string;
  telephone: string;
  email: string | null;
  role: RoleApi;
  statut: "ACTIF" | "SUSPENDU" | "EN_ATTENTE";
  photoUrl: string | null;
  typeClient: "PARTICULIER" | "ENTREPRISE" | null;
  entreprise: string | null;
  zone: { id: string; nom: string } | null;
  technicien: {
    id: string;
    metier: { id: string; label: string };
    specialites: string[];
    niveau: number;
    disponible: boolean;
    note: number;
    nbAvis: number;
    nbMissions: number;
    zones: { id: string; nom: string }[];
  } | null;
  inscritLe: string;
}

export interface ReponseSession {
  acces: string;
  rafraichissement: string;
  utilisateur: UtilisateurApi;
}

export type Session = ReponseSession;

const CLE = "session";

/** Espace d'arrivée de chaque rôle. */
export const ESPACE_ROLE: Record<RoleApi, string> = { CLIENT: "/client", TECHNICIEN: "/technicien", ADMIN: "/admin" };

export const lireSession = () => lire<Session | null>(CLE, null);

export function ouvrirSession({ acces, rafraichissement, utilisateur }: ReponseSession) {
  ecrire<Session>(CLE, { acces, rafraichissement, utilisateur });
}

export function mettreAJourUtilisateur(utilisateur: UtilisateurApi) {
  const session = lireSession();
  if (session) ecrire<Session>(CLE, { ...session, utilisateur });
}

export const fermerSession = () => ecrire<Session | null>(CLE, null);

export function useSession() {
  return usePersistant<Session | null>(CLE, null)[0];
}

// --------------------------------------------------- Vérification du numéro

/** Numéro vérifié sans compte : jeton d'inscription remis par l'API, valable 15 minutes. */
export interface NumeroVerifie {
  telephone: string;
  jeton: string;
  expire: number;
}

const CLE_NUMERO = "gdc:numero-verifie";

export function memoriserNumeroVerifie(telephone: string, jeton: string) {
  try {
    sessionStorage.setItem(CLE_NUMERO, JSON.stringify({ telephone, jeton, expire: Date.now() + 14 * 60_000 }));
  } catch {
    // Stockage indisponible : l'inscription redemandera un code.
  }
}

function lireBrut() {
  try {
    return sessionStorage.getItem(CLE_NUMERO);
  } catch {
    return null;
  }
}

function analyser(brut: string | null): NumeroVerifie | null {
  try {
    const n = JSON.parse(brut ?? "null") as NumeroVerifie | null;
    return n && n.expire > Date.now() ? n : null;
  } catch {
    return null;
  }
}

export const numeroVerifie = () => analyser(lireBrut());

const sansAbonnement = () => () => {};

/** Numéro vérifié sur la page de connexion, pour préremplir l'inscription (rien au rendu serveur). */
export function useNumeroVerifie() {
  return analyser(useSyncExternalStore(sansAbonnement, lireBrut, () => null));
}

/** « 620123456 » → « 620 12 34 56 » */
export const formaterNumero = (n: string) => n.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");

export function oublierNumeroVerifie() {
  try {
    sessionStorage.removeItem(CLE_NUMERO);
  } catch {
    // Rien à faire.
  }
}
