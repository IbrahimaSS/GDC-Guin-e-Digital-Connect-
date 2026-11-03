/** Chemin de retour après connexion : uniquement un chemin interne au site (pas de redirection ouverte). */
export function cheminRetour(valeur: string | null): string | null {
  return valeur && valeur.startsWith("/") && !valeur.startsWith("//") ? valeur : null;
}

/** La connexion est demandée pour envoyer une demande préparée sur « Publier une demande ». */
export const retourDemande = (chemin: string | null) => chemin?.startsWith("/publier-une-demande") ?? false;
