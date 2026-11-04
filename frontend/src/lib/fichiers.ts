// Envoi de fichiers à l'API : photos publiques (profil, réalisations, demandes, messages)
// et pièces justificatives privées (vérification des techniciens).

import { api, API_URL } from "./api";
import { lireSession } from "./session";

export type TypeFichier = "photo" | "piece";

const TAILLE_MAX: Record<TypeFichier, number> = { photo: 5 * 1024 * 1024, piece: 8 * 1024 * 1024 };
const FORMATS: Record<TypeFichier, string[]> = {
  photo: ["image/jpeg", "image/png", "image/webp"],
  piece: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
};

/** Formats proposés par le sélecteur de fichiers. */
export const ACCEPTE: Record<TypeFichier, string> = { photo: FORMATS.photo.join(","), piece: FORMATS.piece.join(",") };

/** Contrôle avant envoi (le serveur vérifie aussi le contenu réel du fichier). Renvoie un message d'erreur, ou null. */
export function verifierFichier(f: File, type: TypeFichier): string | null {
  if (!FORMATS[type].includes(f.type)) return type === "photo" ? "Choisissez une image (JPG, PNG ou WebP)." : "Format accepté : JPG, PNG, WebP ou PDF.";
  if (f.size > TAILLE_MAX[type]) return `Fichier trop lourd : ${TAILLE_MAX[type] / 1024 / 1024} Mo maximum.`;
  return null;
}

/** Envoie le fichier et renvoie son adresse. */
export async function televerser(f: File, type: TypeFichier): Promise<string> {
  const erreur = verifierFichier(f, type);
  if (erreur) throw new Error(erreur);
  const corps = new FormData();
  corps.append("fichier", f);
  const { url } = await api<{ url: string }>(`/fichiers?type=${type}`, { methode: "POST", corps });
  return url;
}

/**
 * Ouvre une pièce justificative (accès protégé : le jeton est joint à la requête, puis le fichier
 * est affiché dans un nouvel onglet).
 */
export async function ouvrirPiece(url: string) {
  const onglet = window.open("", "_blank");
  const rep = await fetch(url.startsWith("http") ? url : `${API_URL}${url}`, { headers: { Authorization: `Bearer ${lireSession()?.acces ?? ""}` } });
  if (!rep.ok) {
    onglet?.close();
    throw new Error("Pièce inaccessible.");
  }
  const lien = URL.createObjectURL(await rep.blob());
  if (onglet) onglet.location.href = lien;
  else window.location.href = lien;
}
