/** Chemin de retour après connexion : uniquement un chemin interne au site (pas de redirection ouverte). */
export function cheminRetour(valeur: string | null): string | null {
  return valeur && valeur.startsWith("/") && !valeur.startsWith("//") ? valeur : null;
}
