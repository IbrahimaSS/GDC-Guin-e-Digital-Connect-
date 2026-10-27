"use client";

import { DEMANDES, DEMANDES_RECUES, getTechnicien, TECHNICIEN_CONNECTE, type Demande } from "./data";
import { usePersistant } from "./stockage";

// Messagerie client ↔ technicien, une conversation par demande : l'historique de la mission (photos, prix…)
// reste dans GDC. Les messages sont conservés dans le navigateur en attendant l'API temps réel.

export type Auteur = "client" | "technicien";

export interface Message {
  id: string;
  auteur: Auteur;
  texte?: string;
  photo?: string;
  heure: string;
  lu?: boolean;
}

export interface Conversation {
  demande: Demande;
  client: string;
  technicien: string;
  photoTechnicien?: string;
}

const m = (id: string, auteur: Auteur, texte: string, heure: string, photo?: string): Message => ({ id, auteur, texte, heure, photo, lu: true });

const INITIAUX: Record<string, Message[]> = {
  "d-1023": [
    m("1", "client", "Bonjour, le climatiseur du salon ne refroidit plus du tout depuis deux jours.", "20 oct. · 10h30"),
    m("2", "technicien", "Bonjour M. Camara, c'est noté. Pouvez-vous m'envoyer une photo de l'étiquette de l'appareil ?", "20 oct. · 10h42"),
    m("3", "client", "Voici l'étiquette.", "20 oct. · 10h45", "/images/electricien-tableau.jpg"),
    m("4", "technicien", "Merci. Il s'agit probablement d'un manque de gaz. Je passe demain à 10h, je vous envoie le devis.", "20 oct. · 11h05"),
    m("5", "technicien", "Je suis en route, j'arrive dans une quinzaine de minutes.", "21 oct. · 09h55"),
  ],
  "d-1019": [
    m("1", "technicien", "Bonjour, j'ai bien reçu votre demande pour l'extension. Le devis est dans l'application.", "18 oct. · 15h12"),
    m("2", "client", "Merci, je regarde ça ce soir.", "18 oct. · 16h03"),
  ],
  "d-1027": [m("1", "client", "Bonjour, le disjoncteur saute dès que j'allume la cuisine. Vous pouvez passer aujourd'hui ?", "22 oct. · 07h45")],
  "d-1026": [m("1", "client", "Bonjour, les ventilateurs sont déjà achetés, il faut seulement la pose.", "21 oct. · 20h20")],
};

const VIDE: Message[] = [];

/** Conversations visibles dans l'espace client ou technicien. */
export function conversations(vue: Auteur): Conversation[] {
  const demandes = vue === "client" ? DEMANDES.filter((d) => d.technicienId && d.statut !== "annulee") : DEMANDES_RECUES.filter((d) => d.statut !== "annulee");
  return demandes.map((d) => {
    const t = vue === "client" ? getTechnicien(d.technicienId!) : TECHNICIEN_CONNECTE;
    return { demande: d, client: d.client, technicien: t?.nom ?? "Technicien", photoTechnicien: t?.photo };
  });
}

export function useMessages(demandeId: string) {
  return usePersistant<Message[]>(`messages-${demandeId}`, INITIAUX[demandeId] ?? VIDE);
}

export const REPONSES_RAPIDES: Record<Auteur, string[]> = {
  client: ["Bonjour, êtes-vous disponible aujourd'hui ?", "D'accord, merci !", "Pouvez-vous m'envoyer le devis ?", "Je suis à la maison."],
  technicien: ["Je suis en route.", "J'arrive dans 15 minutes.", "Le devis est disponible dans l'application.", "Merci pour votre confiance !"],
};

// Réponses automatiques de démonstration (l'interlocuteur « répond » quelques secondes après).
export const REPONSES_DEMO: Record<Auteur, string[]> = {
  technicien: ["Bien reçu, je m'en occupe.", "D'accord, je vous tiens au courant.", "Parfait, à tout à l'heure !"],
  client: ["Très bien, merci !", "D'accord, je vous attends.", "Merci beaucoup."],
};

/** Identifiant unique d'un nouveau message. */
export const nouvelId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const heureActuelle = () => `Aujourd'hui · ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
