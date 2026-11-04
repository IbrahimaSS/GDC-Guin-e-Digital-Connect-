// Back-office : indicateurs, comptes, vérifications, avis, signalements, métiers et zones (API).

import { apiActive } from "./api";
import type { UtilisateurApi } from "./session";
import { useApi } from "./useApi";

/** Indicateurs du back-office (GET /api/admin/statistiques), tous calculés sur les données réelles. */
export interface StatsAdmin {
  utilisateurs: { clients: number; techniciens: number; admins: number; techniciensEnAttente: number; suspendus: number };
  demandes: Record<"ENVOYEE" | "ACCEPTEE" | "EN_COURS" | "TERMINEE" | "ANNULEE", number>;
  demandes7j: number;
  verificationsEnAttente: number;
  verificationsParStatut: Record<"EN_ATTENTE" | "EN_COURS" | "APPROUVEE" | "REFUSEE", number>;
  avisAModerer: number;
  signalementsOuverts: number;
  paiements: { nombre: number; volume: number; commissions: number };
  missions: { ceMois: number; delaiReponseMinutes: number; tauxReussite: number };
  techniciens: { inscrits: number; verifiesNiveau2: number; noteMoyenne: number; suspendus: number };
  croissanceMensuelle: number;
  clientsRecurrents: number;
  recommandation: number;
  signalements: { resolusCeMois: number; delaiMoyenHeures: number };
  series: { mois: string[]; utilisateurs: number[]; techniciens: number[]; volume: number[]; jours: string[]; demandesJour: number[]; missionsJour: number[] };
  entonnoir: { demandes: number; acceptees: number; terminees: number; avis: number };
  demandesParMetier: Record<string, number>;
  demandesParZone: Record<string, number>;
  activite: { type: string; texte: string; date: string }[];
}

export function useStatsAdmin() {
  return useApi<StatsAdmin>(apiActive ? "/admin/statistiques" : null);
}

/** Compte vu par le back-office : nombre de demandes (client) ou de missions (technicien). */
export type UtilisateurAdmin = UtilisateurApi & { nbDemandes: number; derniereConnexion?: string | null; nbSignalements?: number };

export interface Page<T> {
  total: number;
  page: number;
  parPage: number;
  resultats: T[];
}

/** « Il y a 5 min », « Il y a 2 h », « Hier », « 12 oct. » */
export function ilYa(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  if (min < 24 * 60) return `Il y a ${Math.round(min / 60)} h`;
  if (min < 48 * 60) return "Hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export const dateCourte = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** Majuscule initiale (« lun » → « Lun »). */
export const capitaliser = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
