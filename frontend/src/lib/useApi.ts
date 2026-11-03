"use client";

import { useCallback, useEffect, useState } from "react";
import { api, texteErreur } from "./api";

interface Etat<T> {
  donnees?: T;
  erreur?: string;
  /** Une réponse est arrivée (elle peut être vide : « aucun devis », par exemple). */
  recu?: boolean;
  /** Chemin auquel correspond l'état (pour ignorer une réponse arrivée après un changement de page). */
  chemin?: string | null;
}

/**
 * Charge `chemin` depuis l'API (rien si `chemin` est null, par exemple en démonstration).
 * Les données précédentes restent affichées pendant un rechargement.
 */
export function useApi<T>(chemin: string | null) {
  const [etat, setEtat] = useState<Etat<T>>({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!chemin) return;
    let actif = true;
    api<T>(chemin)
      .then((donnees) => actif && setEtat({ donnees, recu: true, chemin }))
      .catch((e) => actif && setEtat((p) => ({ ...p, erreur: texteErreur(e), chemin })));
    return () => {
      actif = false;
    };
  }, [chemin, version]);

  const recharger = useCallback(() => setVersion((v) => v + 1), []);
  const aJour = etat.chemin === chemin;
  return {
    donnees: aJour ? etat.donnees : undefined,
    erreur: aJour ? etat.erreur : undefined,
    chargement: Boolean(chemin) && (!aJour || (!etat.recu && !etat.erreur)),
    recharger,
  };
}
