// Techniciens : recherche publique et profil, depuis l'API, convertis au format des écrans (type Technicien).

import { apiActive } from "./api";
import { getTechnicien, type MetierId, type Niveau, type Technicien } from "./data";
import { formaterDate } from "./demandes";
import { useApi } from "./useApi";

/** Fiche de recherche (GET /api/techniciens). */
export interface TechnicienCarteApi {
  id: string;
  nom: string;
  photoUrl: string | null;
  metier: { id: string; label: string };
  specialites: string[];
  zone: { id: string; nom: string } | null;
  zonesIntervention: { id: string; nom: string }[];
  note: number;
  nbAvis: number;
  niveau: number;
  disponible: boolean;
  experience: number;
  missions: number;
}

/** Profil public complet (GET /api/techniciens/:id). */
export interface TechnicienProfilApi extends TechnicienCarteApi {
  bio: string;
  disponibilites: string;
  tarifs: { prestation: string; prix: number }[];
  telephone: string;
  inscritLe: string;
  realisations: { id: string; titre: string; categorie: string; imageUrl: string }[];
  avis: { id: string; auteur: string; note: number; commentaire: string | null; mission: string; date: string }[];
}

export function versTechnicien(t: TechnicienCarteApi | TechnicienProfilApi): Technicien {
  const maquette = getTechnicien(t.id);
  const profil = "bio" in t ? t : undefined;
  return {
    id: t.id,
    nom: t.nom,
    metier: t.metier.id as MetierId,
    specialites: t.specialites,
    zone: t.zone?.nom ?? t.zonesIntervention[0]?.nom ?? "Conakry",
    zonesIntervention: t.zonesIntervention.map((z) => z.nom),
    note: t.note,
    nbAvis: t.nbAvis,
    niveau: Math.min(3, Math.max(1, t.niveau)) as Niveau,
    disponible: t.disponible,
    experience: t.experience,
    missions: t.missions,
    telephone: profil?.telephone ?? "",
    bio: profil?.bio ?? "",
    disponibilites: profil?.disponibilites ?? "",
    photo: t.photoUrl ?? maquette?.photo ?? "/images/technicien-antenne.jpg",
    realisations: profil?.realisations.map((r) => ({ titre: r.titre, categorie: r.categorie, image: r.imageUrl })) ?? [],
    tarifs: profil?.tarifs ?? [],
    avis: profil?.avis.map((a) => ({ id: a.id, auteur: a.auteur, note: a.note, commentaire: a.commentaire ?? "", date: formaterDate(a.date), mission: a.mission })) ?? [],
    inscrit: profil ? formaterDate(profil.inscritLe) : "",
    statut: "actif",
  };
}

export interface FiltresRecherche {
  metier?: string;
  /** Identifiant de zone (l'API ne connaît pas les noms) */
  zoneId?: string;
  q?: string;
  niveauMin?: number;
  disponible?: boolean;
  tri?: "pertinence" | "note" | "avis" | "experience";
}

/** Recherche de techniciens dans l'API (`actif` faux : rien n'est chargé, mode démonstration). */
export function useRechercheTechniciens(f: FiltresRecherche, actif = apiActive) {
  const params = new URLSearchParams({ parPage: "50" });
  if (f.metier) params.set("metier", f.metier);
  if (f.zoneId) params.set("zone", f.zoneId);
  if (f.q) params.set("q", f.q);
  if (f.niveauMin) params.set("niveauMin", String(f.niveauMin));
  if (f.disponible) params.set("disponible", "true");
  if (f.tri && f.tri !== "pertinence") params.set("tri", f.tri);
  const { donnees, chargement, erreur } = useApi<{ total: number; resultats: TechnicienCarteApi[] }>(actif ? `/techniciens?${params}` : null);
  return { resultats: donnees?.resultats.map(versTechnicien) ?? [], total: donnees?.total ?? 0, chargement, erreur };
}

export function useProfilTechnicien(id: string) {
  const { donnees, chargement, erreur } = useApi<TechnicienProfilApi>(apiActive ? `/techniciens/${encodeURIComponent(id)}` : null);
  return { tech: donnees && versTechnicien(donnees), chargement, erreur };
}
