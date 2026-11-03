// Profil professionnel du technicien connecté (GET /api/techniciens/moi) et ses modifications.

import { api, apiActive } from "./api";
import { useApi } from "./useApi";

export interface CreneauJour {
  jour: string;
  actif: boolean;
  debut: string;
  fin: string;
}

export interface Conge {
  du: string;
  au: string;
  motif?: string;
}

export interface Agenda {
  planning: CreneauJour[];
  conges: Conge[];
  urgences: boolean;
  delai: "1h" | "2h" | "24h" | "48h";
}

export interface Tarif {
  prestation: string;
  prix: number;
}

export interface RealisationApi {
  id: string;
  titre: string;
  categorie: string;
  imageUrl: string;
  createdAt: string;
}

export interface MonProfilApi {
  id: string;
  metierId: string;
  metier: { id: string; label: string };
  specialites: string[];
  experience: number;
  bio: string;
  niveau: number;
  disponible: boolean;
  disponibilites: string;
  note: number;
  nbAvis: number;
  nbMissions: number;
  zones: { id: string; nom: string }[];
  agenda: Partial<Agenda>;
  tarifs: Tarif[];
  realisations: RealisationApi[];
  user: { nom: string; prenom: string; photoUrl: string | null; zone: { id: string; nom: string } | null };
}

export const JOURS_SEMAINE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/** Calendrier par défaut : du lundi au samedi, 8h – 18h (14h le samedi). */
export const AGENDA_DEFAUT: Agenda = {
  planning: JOURS_SEMAINE.map((jour, i) => ({ jour, actif: i < 6, debut: "08:00", fin: i === 5 ? "14:00" : "18:00" })),
  conges: [],
  urgences: true,
  delai: "2h",
};

/** Calendrier enregistré, complété par les valeurs par défaut. */
export const lireAgenda = (a?: Partial<Agenda>): Agenda => ({
  ...AGENDA_DEFAUT,
  ...a,
  planning: a?.planning?.length ? a.planning : AGENDA_DEFAUT.planning,
});

/** Résumé affiché sur le profil public : « Lundi – Samedi (8h – 18h) ». */
export function resumeAgenda(planning: CreneauJour[]): string {
  const actifs = planning.filter((p) => p.actif);
  if (!actifs.length) return "Sur rendez-vous";
  const heure = (h: string) => `${Number(h.slice(0, 2))}h${h.slice(3) === "00" ? "" : h.slice(3)}`;
  const jours = actifs.length === 1 ? actifs[0].jour : `${actifs[0].jour} – ${actifs[actifs.length - 1].jour}`;
  // Horaires les plus fréquents de la semaine.
  const plages = actifs.map((p) => `${heure(p.debut)} – ${heure(p.fin)}`);
  const courante = plages.sort((a, b) => plages.filter((x) => x === b).length - plages.filter((x) => x === a).length)[0];
  return `${jours} (${courante})`;
}

export function useMonProfil() {
  return useApi<MonProfilApi>(apiActive ? "/techniciens/moi" : null);
}

export const modifierMonProfil = (corps: Record<string, unknown>) => api<MonProfilApi>("/techniciens/moi", { methode: "PATCH", corps });
