// Accès à l'API GDC (dossier backend/). Sans NEXT_PUBLIC_API_URL, le site reste en mode démonstration
// et les écrans continuent d'utiliser les données de src/lib/data.ts.

import { fermerSession, lireSession, ouvrirSession, type ReponseSession } from "./session";

export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
export const apiActive = Boolean(API_URL);

export class ErreurApi extends Error {
  constructor(
    message: string,
    readonly statut: number,
  ) {
    super(message);
  }
}

interface Options {
  methode?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  corps?: unknown;
  /** Joindre le jeton de la session (par défaut). */
  auth?: boolean;
}

/** Message lisible à partir d'une réponse d'erreur NestJS ({ message: string | string[] }). */
function messageErreur(donnees: unknown, statut: number): string {
  const message = (donnees as { message?: string | string[] } | null)?.message;
  if (Array.isArray(message)) return message.join(" ");
  if (message) return message;
  return statut >= 500 ? "Le serveur GDC rencontre un problème. Réessayez dans un instant." : "La requête a échoué.";
}

async function appeler(chemin: string, { methode = "GET", corps, auth = true }: Options, jeton?: string) {
  try {
    return await fetch(`${API_URL}/api${chemin}`, {
      method: methode,
      headers: {
        ...(corps !== undefined && { "Content-Type": "application/json" }),
        ...(auth && jeton && { Authorization: `Bearer ${jeton}` }),
      },
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
  } catch {
    throw new ErreurApi("Impossible de joindre le serveur GDC. Vérifiez votre connexion internet.", 0);
  }
}

// Un seul renouvellement à la fois, même si plusieurs requêtes expirent ensemble.
let renouvellement: Promise<string | null> | null = null;

function renouvelerSession(): Promise<string | null> {
  renouvellement ??= (async () => {
    const session = lireSession();
    if (!session) return null;
    const rep = await appeler("/auth/rafraichir", { methode: "POST", corps: { rafraichissement: session.rafraichissement }, auth: false });
    if (!rep.ok) {
      fermerSession();
      return null;
    }
    const nouvelle = (await rep.json()) as ReponseSession;
    ouvrirSession(nouvelle);
    return nouvelle.acces;
  })().finally(() => {
    renouvellement = null;
  });
  return renouvellement;
}

/** Appelle l'API et renvoie le corps JSON (undefined pour une réponse vide). */
export async function api<T>(chemin: string, options: Options = {}): Promise<T> {
  if (!API_URL) throw new ErreurApi("API non configurée (NEXT_PUBLIC_API_URL).", 0);
  let rep = await appeler(chemin, options, lireSession()?.acces);

  // Jeton d'accès expiré : on le renouvelle une fois, puis on rejoue la requête.
  if (rep.status === 401 && options.auth !== false && lireSession()) {
    const jeton = await renouvelerSession();
    if (!jeton) throw new ErreurApi("Votre session a expiré. Reconnectez-vous.", 401);
    rep = await appeler(chemin, options, jeton);
  }

  const texte = await rep.text();
  const donnees = texte ? (JSON.parse(texte) as unknown) : undefined;
  if (!rep.ok) throw new ErreurApi(messageErreur(donnees, rep.status), rep.status);
  return donnees as T;
}

/** Message à afficher pour une erreur quelconque. */
export const texteErreur = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue.");
