"use client";

import { useCallback, useSyncExternalStore } from "react";

// Petit magasin de données conservé dans le navigateur (localStorage) et synchronisé entre onglets.
// Il permet de faire vivre la démo entre espaces (le devis envoyé côté technicien apparaît côté client).
// À remplacer par l'API : les composants n'utilisent que `usePersistant`.

const PREFIXE = "gdc:";
const EVENEMENT = "gdc:stockage";
const cache = new Map<string, unknown>();

function lire<T>(cle: string, initial: T): T {
  if (cache.has(cle)) return cache.get(cle) as T;
  let valeur = initial;
  try {
    const brut = localStorage.getItem(PREFIXE + cle);
    if (brut) valeur = JSON.parse(brut) as T;
  } catch {
    // Stockage indisponible : on reste sur la valeur initiale.
  }
  cache.set(cle, valeur);
  return valeur;
}

export function ecrire<T>(cle: string, valeur: T) {
  cache.set(cle, valeur);
  try {
    localStorage.setItem(PREFIXE + cle, JSON.stringify(valeur));
  } catch {
    // Quota dépassé ou navigation privée : la valeur vit le temps de la session.
  }
  window.dispatchEvent(new CustomEvent(EVENEMENT, { detail: cle }));
}

function abonner(rappel: () => void) {
  const surStockage = (e: StorageEvent) => {
    if (e.key?.startsWith(PREFIXE)) {
      cache.delete(e.key.slice(PREFIXE.length));
      rappel();
    }
  };
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", surStockage);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", surStockage);
  };
}

/** Comme useState, mais la valeur est conservée et partagée entre pages et onglets. */
export function usePersistant<T>(cle: string, initial: T) {
  const valeur = useSyncExternalStore(
    abonner,
    () => lire(cle, initial),
    () => initial,
  );
  const modifier = useCallback(
    (suivante: T | ((precedente: T) => T)) => {
      const actuelle = lire(cle, initial);
      ecrire(cle, typeof suivante === "function" ? (suivante as (p: T) => T)(actuelle) : suivante);
    },
    [cle, initial],
  );
  return [valeur, modifier] as const;
}

/** Statut d'une demande, partagé entre l'espace client et l'espace technicien. */
export function useStatutDemande<S extends string>(demandeId: string, initial: S) {
  return usePersistant<S>(`statut-${demandeId}`, initial);
}
