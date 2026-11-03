"use client";

// Devis et paiement d'une demande, côté client : la même interface en démonstration (navigateur)
// et avec l'API, pour que les écrans n'aient pas à distinguer les deux.

import { api, apiActive } from "./api";
import { formatGNF, type Demande } from "./data";
import { referencePaiement, totalDevis, useDevis, type Devis, type MoyenPaiement, type Paiement } from "./devis";
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
