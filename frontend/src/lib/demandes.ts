// Demandes d'intervention : lecture depuis l'API et conversion au format des écrans (type Demande de data.ts).
// En démonstration (sans API), les écrans gardent les données fictives.

import { api, apiActive } from "./api";
import { DEMANDES, getTechnicien, type Demande, type EtapeChronologie, type MetierId, type Niveau, type StatutDemande, type Technicien } from "./data";
import { useApi } from "./useApi";

type StatutApi = "ENVOYEE" | "ACCEPTEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";

/** Demande telle que l'API la renvoie (GET /api/demandes/:id). */
export interface DemandeApi {
  id: string;
  numero: number;
  reference: string;
  titre: string;
  description: string;
  statut: StatutApi;
  metier: { id: string; label: string };
  zone: { id: string; nom: string; lat: number | null; lng: number | null };
  adresse: string;
  lat: number | null;
  lng: number | null;
  urgente: boolean;
  dateSouhaitee: string | null;
  creneau: string | null;
  budget: number | null;
  photos: string[];
  client: { id: string; nom: string; photoUrl: string | null; telephone?: string };
  technicien: NonNullable<NonNullable<Demande["api"]>["technicien"]> & { userId: string } | null;
  codeIntervention?: string;
  qrIntervention?: string;
  avis: { id: string; note: number } | null;
  accepteeLe: string | null;
  demarreeLe: string | null;
  termineeLe: string | null;
  annuleeLe: string | null;
  creeLe: string;
}

interface Page<T> {
  total: number;
  page: number;
  parPage: number;
  resultats: T[];
}

/** « 20 oct. 2026 » */
export const formaterDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** « 20 oct. · 10h24 » */
const formaterInstant = (iso: string) => {
  const d = new Date(iso);
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${heure}`;
};

const RANG: Record<StatutDemande, number> = { envoyee: 1, acceptee: 2, en_cours: 3, terminee: 4, annulee: 1 };

function chronologie(d: DemandeApi, statut: StatutDemande): EtapeChronologie[] {
  const dates = [d.creeLe, d.accepteeLe, d.demarreeLe, d.termineeLe];
  const etapes = ["Demande créée", "Acceptée par le technicien", "Intervention en cours", "Mission terminée", "Évaluation"];
  const liste = etapes.map((label, i) => ({ label, date: dates[i] ? formaterInstant(dates[i]!) : undefined, fait: i < RANG[statut] || (i === 4 && Boolean(d.avis)) }));
  if (statut === "annulee" && d.annuleeLe) liste.splice(1, liste.length - 1, { label: "Demande annulée", date: formaterInstant(d.annuleeLe), fait: true });
  return liste;
}

/** Conversion d'une demande de l'API au format utilisé par les écrans. */
export function versDemande(d: DemandeApi): Demande {
  const statut = d.statut.toLowerCase() as StatutDemande;
  const date = d.dateSouhaitee ? formaterDate(d.dateSouhaitee) : null;
  return {
    id: d.id,
    reference: d.reference,
    titre: d.titre,
    metier: d.metier.id as MetierId,
    description: d.description,
    client: d.client.nom,
    clientTel: d.client.telephone ?? "",
    technicienId: d.technicien?.id,
    zone: d.zone.nom,
    adresse: d.adresse,
    urgence: d.urgente ? "urgente" : "normale",
    statut,
    date: formaterDate(d.creeLe),
    creneau: date && d.creneau ? `${date} · ${d.creneau}` : (date ?? d.creneau ?? "À convenir"),
    budget: d.budget ?? undefined,
    evaluee: Boolean(d.avis),
    chronologie: chronologie(d, statut),
    api: { technicien: d.technicien ?? undefined, code: d.codeIntervention, qr: d.qrIntervention },
  };
}

/**
 * Technicien d'une demande au format des écrans. Avec l'API, ses informations viennent de la demande
 * (le profil complet de la maquette n'est repris que pour la photo et la zone, s'il existe).
 */
export function technicienDe(d: Demande): Technicien | undefined {
  const maquette = d.technicienId ? getTechnicien(d.technicienId) : undefined;
  const t = d.api?.technicien;
  if (!t) return d.api ? undefined : maquette;
  return {
    specialites: [],
    zone: d.zone,
    zonesIntervention: [],
    disponible: true,
    missions: 0,
    bio: "",
    disponibilites: "",
    photo: "/images/technicien-antenne.jpg",
    realisations: [],
    avis: [],
    inscrit: "",
    statut: "actif",
    ...maquette,
    id: t.id,
    nom: t.nom,
    metier: d.metier,
    note: t.note,
    nbAvis: t.nbAvis,
    niveau: Math.min(3, Math.max(1, t.niveau)) as Niveau,
    experience: t.experience,
    telephone: t.telephone ?? "",
    ...(t.photoUrl && { photo: t.photoUrl }),
  };
}

// ------------------------------------------------------------ Lecture

/** Demandes du client connecté (API), ou celles de la maquette en démonstration. */
export function useMesDemandes() {
  const { donnees, erreur, chargement, recharger } = useApi<Page<DemandeApi>>(apiActive ? "/demandes" : null);
  if (!apiActive) return { demandes: DEMANDES, chargement: false, erreur: undefined, recharger };
  return { demandes: donnees?.resultats.map(versDemande) ?? [], chargement, erreur, recharger };
}

/** Une demande (API), ou `initiale` en démonstration. */
export function useDemande(id: string, initiale?: Demande) {
  const { donnees, erreur, chargement, recharger } = useApi<DemandeApi>(apiActive ? `/demandes/${encodeURIComponent(id)}` : null);
  if (!apiActive) return { demande: initiale, chargement: false, erreur: undefined, recharger };
  return { demande: donnees && versDemande(donnees), chargement, erreur, recharger };
}

// ------------------------------------------------------------ Actions

export interface NouvelleDemande {
  metierId: string;
  titre: string;
  description: string;
  zoneId: string;
  adresse: string;
  lat?: number;
  lng?: number;
  urgente?: boolean;
  dateSouhaitee?: string;
  creneau?: string;
  budget?: number;
  technicienId?: string;
}

export const creerDemande = (d: NouvelleDemande) => api<DemandeApi>("/demandes", { methode: "POST", corps: d });

export const annulerDemande = (id: string) => api<DemandeApi>(`/demandes/${encodeURIComponent(id)}/annuler`, { methode: "POST" });
