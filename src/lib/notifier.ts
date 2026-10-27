"use client";

import { toast } from "@/components/motion/Toaster";
import type { Notification, TypeNotification } from "./data";
import { ecrire } from "./stockage";

// Envoi des notifications SMS / WhatsApp à chaque étape d'une mission.
// En production, `envoyer` appelle l'API (fournisseur SMS, WhatsApp Business) ; ici l'envoi est simulé
// et consigné dans un journal visible dans le back-office.

export type Canal = "sms" | "whatsapp";
export type Destinataire = "client" | "technicien";

export type Evenement =
  | "demande_publiee"
  | "demande_acceptee"
  | "technicien_en_route"
  | "intervention_demarree"
  | "mission_terminee"
  | "devis_envoye"
  | "devis_accepte"
  | "paiement_recu"
  | "nouveau_message";

export interface Modele {
  libelle: string;
  destinataire: Destinataire;
  canaux: Canal[];
  type: TypeNotification;
  titre: string;
  /** Variables : {client}, {technicien}, {mission}, {montant}, {code}. */
  texte: string;
}

export const MODELES: Record<Evenement, Modele> = {
  demande_publiee: { libelle: "Demande publiée", destinataire: "client", canaux: ["sms"], type: "demande", titre: "Demande publiée", texte: "GDC : votre demande « {mission} » est publiée. Les professionnels de votre zone sont prévenus." },
  demande_acceptee: { libelle: "Demande acceptée", destinataire: "client", canaux: ["sms", "whatsapp"], type: "demande", titre: "Demande acceptée", texte: "GDC : {technicien} a accepté votre demande « {mission} ». Code d'intervention : {code}." },
  technicien_en_route: { libelle: "Technicien en route", destinataire: "client", canaux: ["whatsapp"], type: "mission", titre: "Technicien en route", texte: "GDC : {technicien} est en route vers vous. Suivez son trajet dans l'application." },
  intervention_demarree: { libelle: "Intervention démarrée", destinataire: "client", canaux: ["sms"], type: "mission", titre: "Intervention démarrée", texte: "GDC : l'intervention « {mission} » a commencé avec {technicien}." },
  mission_terminee: { libelle: "Mission terminée", destinataire: "client", canaux: ["sms", "whatsapp"], type: "avis", titre: "Mission terminée", texte: "GDC : « {mission} » est terminée. Donnez votre avis sur {technicien} en 1 minute." },
  devis_envoye: { libelle: "Devis envoyé", destinataire: "client", canaux: ["sms", "whatsapp"], type: "demande", titre: "Nouveau devis", texte: "GDC : {technicien} vous a envoyé un devis de {montant} pour « {mission} »." },
  devis_accepte: { libelle: "Devis accepté", destinataire: "technicien", canaux: ["sms"], type: "mission", titre: "Devis accepté", texte: "GDC : {client} a accepté votre devis de {montant} pour « {mission} »." },
  paiement_recu: { libelle: "Paiement reçu", destinataire: "technicien", canaux: ["sms", "whatsapp"], type: "mission", titre: "Paiement reçu", texte: "GDC : paiement de {montant} reçu pour « {mission} ». Versement à la fin de la mission." },
  nouveau_message: { libelle: "Nouveau message", destinataire: "technicien", canaux: ["whatsapp"], type: "demande", titre: "Nouveau message", texte: "GDC : nouveau message de {client} au sujet de « {mission} »." },
};

export interface Envoi {
  id: string;
  evenement: Evenement;
  canal: Canal;
  destinataire: Destinataire;
  numero: string;
  texte: string;
  date: string;
  statut: "envoye" | "remis";
}

export const CLE_JOURNAL = "journal-envois";
export const cleNotifications = (d: Destinataire) => `notifications-${d}`;
export const CLE_MODELES = "modeles-notifications";

function lireListe<T>(cle: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(`gdc:${cle}`) ?? "[]") as T[];
  } catch {
    return [];
  }
}

const remplir = (texte: string, vars: Record<string, string>) => texte.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

/** Envoie la notification d'un événement : SMS / WhatsApp simulés, journal et centre de notifications. */
export function notifier(
  evenement: Evenement,
  vars: { client?: string; technicien?: string; mission?: string; montant?: string; code?: string; numero?: string },
) {
  const personnalises = (() => {
    try {
      return JSON.parse(localStorage.getItem(`gdc:${CLE_MODELES}`) ?? "{}") as Partial<Record<Evenement, Partial<Modele>>>;
    } catch {
      return {};
    }
  })();
  const modele = { ...MODELES[evenement], ...personnalises[evenement] };
  const texte = remplir(modele.texte, vars as Record<string, string>);
  const maintenant = new Date();
  const heure = maintenant.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const envois: Envoi[] = modele.canaux.map((canal) => ({
    id: `${maintenant.getTime()}-${canal}-${Math.random().toString(36).slice(2, 6)}`,
    evenement,
    canal,
    destinataire: modele.destinataire,
    numero: vars.numero ?? (modele.destinataire === "client" ? "+224 621 11 22 33" : "+224 620 00 00 01"),
    texte,
    date: `${maintenant.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${heure}`,
    statut: "envoye",
  }));
  ecrire(CLE_JOURNAL, [...envois, ...lireListe<Envoi>(CLE_JOURNAL)].slice(0, 200));

  const notif: Notification = { id: envois[0]?.id ?? String(maintenant.getTime()), type: modele.type, titre: modele.titre, texte: texte.replace(/^GDC : /, ""), date: `Aujourd'hui · ${heure}`, lu: false };
  const cle = cleNotifications(modele.destinataire);
  ecrire(cle, [notif, ...lireListe<Notification>(cle)].slice(0, 50));

  if (modele.canaux.length) {
    const canaux = modele.canaux.map((c) => (c === "sms" ? "SMS" : "WhatsApp")).join(" + ");
    toast(`${canaux} envoyé au ${modele.destinataire} : ${modele.titre.toLowerCase()}`, "info");
  }
}
