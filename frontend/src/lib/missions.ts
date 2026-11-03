// Missions du technicien : demandes ouvertes dans son métier et ses zones, missions acceptées,
// et les étapes de l'intervention. Démonstration : données de la maquette.

import { api, apiActive } from "./api";
import { DEMANDES_RECUES } from "./data";
import { versDemande, type DemandeApi } from "./demandes";
import { useApi } from "./useApi";

/** Demandes reçues : ouvertes (à accepter) et missions du technicien, sans doublon. */
export function useDemandesRecues() {
  const ouvertes = useApi<DemandeApi[]>(apiActive ? "/demandes/disponibles" : null);
  const miennes = useApi<{ resultats: DemandeApi[] }>(apiActive ? "/demandes" : null);
  const recharger = () => {
    ouvertes.recharger();
    miennes.recharger();
  };
  if (!apiActive) return { demandes: DEMANDES_RECUES, chargement: false, erreur: undefined, recharger };
  const vues = new Set<string>();
  const demandes = [...(ouvertes.donnees ?? []), ...(miennes.donnees?.resultats ?? [])]
    .filter((d) => !vues.has(d.id) && vues.add(d.id))
    .map(versDemande);
  return { demandes, chargement: ouvertes.chargement || miennes.chargement, erreur: ouvertes.erreur ?? miennes.erreur, recharger };
}

const action = (id: string, etape: string, corps?: unknown) =>
  api<DemandeApi>(`/demandes/${encodeURIComponent(id)}/${etape}`, { methode: "POST", corps });

export const accepterMission = (id: string) => action(id, "accepter");
/** Prévient le client que le technicien est en route (SMS / WhatsApp). */
export const signalerEnRoute = (id: string) => action(id, "en-route");
/** Démarre l'intervention avec le code à 4 chiffres du client ou le contenu de son QR code. */
export const demarrerMission = (id: string, code: string) => action(id, "demarrer", { code });
export const terminerMission = (id: string) => action(id, "terminer");
/** Le technicien se retire : la demande redevient ouverte aux autres professionnels. */
export const desisterMission = (id: string) => action(id, "desister");
