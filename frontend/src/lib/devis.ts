"use client";

import { usePersistant } from "./stockage";

// Devis et paiement d'une mission. Le technicien rédige et envoie le devis, le client l'accepte puis paie
// (Orange Money, MTN MoMo ou espèces). GDC conserve le paiement jusqu'à la fin de la mission, puis le reverse
// au technicien, commission déduite.

export const COMMISSION = 0.05; // 5 % en phase pilote

export type MoyenPaiement = "orange" | "mtn" | "especes";
export type StatutDevis = "brouillon" | "envoye" | "accepte" | "refuse" | "paye";

export interface LigneDevis {
  id: string;
  libelle: string;
  quantite: number;
  prix: number;
}

export interface Paiement {
  moyen: MoyenPaiement;
  numero?: string;
  reference: string;
  date: string;
}

export interface Devis {
  lignes: LigneDevis[];
  deplacement: number;
  note?: string;
  statut: StatutDevis;
  envoyeLe?: string;
  paiement?: Paiement;
}

export const MOYENS: Record<MoyenPaiement, { label: string; detail: string; couleur: string }> = {
  orange: { label: "Orange Money", detail: "Paiement depuis votre compte Orange Money", couleur: "#ff7900" },
  mtn: { label: "MTN Mobile Money", detail: "Paiement depuis votre compte MoMo", couleur: "#ffcb05" },
  especes: { label: "Espèces", detail: "Remis en main propre au technicien, confirmé dans l'application", couleur: "#10b981" },
};

export const sousTotal = (d: Devis) => d.lignes.reduce((s, l) => s + l.quantite * l.prix, 0);
export const totalDevis = (d: Devis) => sousTotal(d) + d.deplacement;

const ligne = (libelle: string, quantite: number, prix: number, i: number): LigneDevis => ({ id: `l${i}`, libelle, quantite, prix });

// Devis de démonstration, alignés sur le statut des missions.
const INITIAUX: Record<string, Devis> = {
  "d-1023": {
    lignes: [ligne("Diagnostic du climatiseur", 1, 50000, 1), ligne("Recharge en gaz R410A", 1, 180000, 2), ligne("Nettoyage des filtres", 1, 70000, 3)],
    deplacement: 50000,
    statut: "paye",
    envoyeLe: "20 oct. · 11h20",
    paiement: { moyen: "orange", numero: "621 11 22 33", reference: "OM-260420-8841", date: "20 oct. · 12h05" },
  },
  "d-1019": {
    lignes: [ligne("Prise électrique encastrée", 6, 75000, 1), ligne("Point lumineux complet", 4, 60000, 2), ligne("Câble et gaines (forfait)", 1, 90000, 3)],
    deplacement: 50000,
    note: "Matériel fourni, garantie 6 mois sur l'installation.",
    statut: "envoye",
    envoyeLe: "18 oct. · 15h10",
  },
};

const VIDE: Devis = { lignes: [], deplacement: 50000, statut: "brouillon" };

/** Devis d'une demande, partagé entre l'espace client et l'espace technicien. */
export function useDevis(demandeId: string) {
  return usePersistant<Devis>(`devis-${demandeId}`, INITIAUX[demandeId] ?? VIDE);
}

export const referencePaiement = (moyen: MoyenPaiement) =>
  `${moyen === "orange" ? "OM" : moyen === "mtn" ? "MOMO" : "ESP"}-${Date.now().toString().slice(-8)}`;
