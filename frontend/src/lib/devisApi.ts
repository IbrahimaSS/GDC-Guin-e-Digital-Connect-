"use client";

// Devis et paiement d'une demande, côté client et côté technicien : la même interface en démonstration
// (navigateur) et avec l'API, pour que les écrans n'aient pas à distinguer les deux.

import { useState } from "react";
import { api, apiActive } from "./api";
import { formatGNF, type Demande } from "./data";
import { COMMISSION, referencePaiement, totalDevis, useDevis, type Devis, type MoyenPaiement, type Paiement } from "./devis";
import { notifier } from "./notifier";
import { useApi } from "./useApi";

type StatutDevisApi = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "PAYE";
type MoyenApi = "ORANGE" | "MTN" | "ESPECES";

export interface PaiementApi {
  id: string;
  moyen: MoyenApi;
  numero: string | null;
  montant: number;
  commission: number;
  reference: string;
  statut: "EN_ATTENTE" | "CONFIRME" | "ECHOUE" | "REVERSE";
  confirmeLe: string | null;
  createdAt: string;
}

export interface DevisApi {
  id: string;
  statut: StatutDevisApi;
  deplacement: number;
  note: string | null;
  envoyeLe: string | null;
  lignes: { id: string; libelle: string; quantite: number; prix: number }[];
  paiement: PaiementApi | null;
}

const VIDE: Devis = { lignes: [], deplacement: 0, statut: "brouillon" };

/** « 20 oct. · 11h20 » */
const instant = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h")}`;
};

const formaterNumero = (n: string | null) => n?.replace(/^\+224(\d{3})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4") ?? undefined;

export function versPaiement(p: PaiementApi): Paiement {
  return {
    moyen: p.moyen.toLowerCase() as MoyenPaiement,
    numero: formaterNumero(p.numero),
    reference: p.reference,
    date: instant(p.confirmeLe ?? p.createdAt),
    enAttente: p.statut === "EN_ATTENTE",
  };
}

/** Devis de l'API au format des écrans. Un paiement échoué n'est pas montré (le client peut repayer). */
export function versDevis(d: DevisApi | null | undefined): Devis {
  if (!d) return VIDE;
  const paiement = d.paiement && d.paiement.statut !== "ECHOUE" ? versPaiement(d.paiement) : undefined;
  return {
    lignes: d.lignes.map(({ id, libelle, quantite, prix }) => ({ id, libelle, quantite, prix })),
    deplacement: d.deplacement,
    note: d.note ?? undefined,
    statut: d.statut.toLowerCase() as Devis["statut"],
    envoyeLe: d.envoyeLe ? instant(d.envoyeLe) : undefined,
    paiement,
  };
}

const MOYEN_API: Record<MoyenPaiement, MoyenApi> = { orange: "ORANGE", mtn: "MTN", especes: "ESPECES" };

/** Devis d'une demande vu par le client, avec les actions accepter / refuser / payer. */
export function useDevisClient(demande: Demande, technicien: string) {
  const [local, setLocal] = useDevis(demande.id);
  const chemin = `/demandes/${encodeURIComponent(demande.id)}`;
  const { donnees, chargement, recharger } = useApi<DevisApi | undefined>(apiActive ? `${chemin}/devis` : null);
  const devis = apiActive ? versDevis(donnees) : local;
  const vars = { client: demande.client, technicien, mission: demande.titre, montant: formatGNF(totalDevis(devis)) };

  async function accepter() {
    if (!apiActive) {
      setLocal((d) => ({ ...d, statut: "accepte" }));
      notifier("devis_accepte", vars);
      return;
    }
    await api(`${chemin}/devis/accepter`, { methode: "POST" });
    recharger();
  }

  async function refuser() {
    if (!apiActive) return setLocal((d) => ({ ...d, statut: "refuse" }));
    await api(`${chemin}/devis/refuser`, { methode: "POST" });
    recharger();
  }

  /** Paiement : Orange Money / MTN confirmés par l'opérateur ; espèces en attente de la confirmation du technicien. */
  async function payer(moyen: MoyenPaiement, numero?: string): Promise<Paiement> {
    if (!apiActive) {
      // Démonstration : délai de validation simulé sur le téléphone.
      await new Promise((r) => setTimeout(r, 3200));
      const date = `Aujourd'hui · ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
      const paiement: Paiement = { moyen, numero: moyen === "especes" ? undefined : numero, reference: referencePaiement(moyen), date };
      setLocal((d) => ({ ...d, statut: "paye", paiement }));
      notifier("paiement_recu", vars);
      return paiement;
    }
    const p = await api<PaiementApi>(`${chemin}/paiement`, { methode: "POST", corps: { moyen: MOYEN_API[moyen], numero: moyen === "especes" ? undefined : numero } });
    recharger();
    if (p.statut === "ECHOUE") throw new Error("Le paiement a été refusé par l'opérateur. Vérifiez votre solde et réessayez.");
    return versPaiement(p);
  }

  return { devis, chargement, accepter, refuser, payer };
}

/**
 * Devis vu par le technicien : rédaction (brouillon local jusqu'à l'envoi), envoi au client,
 * confirmation d'un paiement reçu en espèces.
 */
export function useDevisTechnicien(mission: Demande, technicien: string) {
  const [local, setLocal] = useDevis(mission.id);
  const chemin = `/demandes/${encodeURIComponent(mission.id)}`;
  const { donnees, chargement, recharger } = useApi<(DevisApi & { tauxCommission?: number }) | undefined>(apiActive ? `${chemin}/devis` : null);
  // Modifications en cours, tant que le devis n'est pas envoyé (avec l'API).
  const [brouillon, setBrouillon] = useState<Devis | null>(null);
  const serveur: Devis = donnees ? versDevis(donnees) : { ...VIDE, deplacement: 50000 };
  const devis = apiActive ? (brouillon ?? serveur) : local;

  function setDevis(f: Devis | ((d: Devis) => Devis)) {
    if (!apiActive) return setLocal(f);
    setBrouillon((prec) => (typeof f === "function" ? f(prec ?? serveur) : f));
  }

  async function envoyer() {
    if (!apiActive) {
      const heure = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      setLocal((d) => ({ ...d, statut: "envoye", envoyeLe: `Aujourd'hui · ${heure}` }));
      notifier("devis_envoye", { technicien, client: mission.client, mission: mission.titre, montant: formatGNF(totalDevis(devis)), numero: mission.clientTel });
      return;
    }
    await api(`${chemin}/devis`, {
      methode: "PUT",
      corps: {
        lignes: devis.lignes.map(({ libelle, quantite, prix }) => ({ libelle: libelle.trim(), quantite, prix })),
        deplacement: devis.deplacement,
        note: devis.note?.trim() || undefined,
      },
    });
    await api(`${chemin}/devis/envoyer`, { methode: "POST" });
    setBrouillon(null);
    recharger();
  }

  async function confirmerEspeces() {
    await api(`${chemin}/paiement/confirmer`, { methode: "POST" });
    recharger();
  }

  return {
    devis,
    setDevis,
    envoyer,
    confirmerEspeces,
    chargement,
    commission: donnees?.tauxCommission ?? COMMISSION,
    /** Paiement en espèces déclaré par le client, à confirmer à réception. */
    especesAConfirmer: apiActive && devis.statut === "accepte" && devis.paiement?.moyen === "especes" && devis.paiement.enAttente,
  };
}
