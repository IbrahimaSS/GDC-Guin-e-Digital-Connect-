"use client";

// Messagerie client ↔ technicien : conversations et fil de messages, en démonstration (navigateur)
// comme avec l'API (REST pour l'historique et l'envoi, Socket.IO pour la réception en direct).

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api, API_URL, apiActive } from "./api";
import type { StatutDemande } from "./data";
import { conversations, heureActuelle, nouvelId, REPONSES_DEMO, useMessages, type Auteur, type Message } from "./messages";
import { notifier } from "./notifier";
import { lireSession, useSession } from "./session";
import { useApi } from "./useApi";

/** Conversation telle que l'écran l'affiche, quelle que soit la source. */
export interface ConversationVue {
  id: string;
  reference: string;
  titre: string;
  statut: StatutDemande;
  interlocuteur: string;
  /** Pour l'appel direct (démonstration uniquement pour l'instant). */
  telephone?: string;
  /** Avec l'API : dernier message et non-lus fournis par le serveur. */
  dernier?: { texte: string; heure: string; deMoi: boolean };
  nonLus?: number;
  client: string;
}

interface ConversationApi {
  demandeId: string;
  numero: number;
  titre: string;
  statut: string;
  interlocuteur: { nom: string; photoUrl: string | null };
  dernierMessage: MessageApi | null;
  nonLus: number;
}

interface MessageApi {
  id: string;
  demandeId: string;
  auteurId: string;
  texte: string | null;
  photoUrl: string | null;
  lu: boolean;
  createdAt: string;
}

const autre = (a: Auteur): Auteur => (a === "client" ? "technicien" : "client");

/** « Aujourd'hui · 10h42 » ou « 20 oct. · 10h42 » */
function heure(iso: string) {
  const d = new Date(iso);
  const h = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
  const jour = d.toDateString() === new Date().toDateString() ? "Aujourd'hui" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${jour} · ${h}`;
}

// ------------------------------------------------------------ Conversations

export function useConversations(vue: Auteur) {
  const { donnees, chargement, recharger } = useApi<ConversationApi[]>(apiActive ? "/conversations" : null);
  const moi = useSession()?.utilisateur.id;

  // Les compteurs de non-lus se mettent à jour régulièrement (les messages arrivent aussi hors du fil ouvert).
  useEffect(() => {
    if (!apiActive) return;
    const t = window.setInterval(recharger, 30_000);
    return () => window.clearInterval(t);
  }, [recharger]);

  if (!apiActive) {
    const liste = conversations(vue).map<ConversationVue>((c) => ({
      id: c.demande.id,
      reference: c.demande.reference,
      titre: c.demande.titre,
      statut: c.demande.statut,
      interlocuteur: vue === "client" ? c.technicien : c.client,
      telephone: c.demande.clientTel,
      client: c.client,
    }));
    return { liste, chargement: false, recharger };
  }
  const liste = (donnees ?? []).map<ConversationVue>((c) => ({
    id: c.demandeId,
    reference: `#${c.numero}`,
    titre: c.titre,
    statut: c.statut.toLowerCase() as StatutDemande,
    interlocuteur: c.interlocuteur.nom,
    nonLus: c.nonLus,
    dernier: c.dernierMessage
      ? { texte: c.dernierMessage.texte ?? "Photo", heure: heure(c.dernierMessage.createdAt), deMoi: c.dernierMessage.auteurId === moi }
      : undefined,
    client: vue === "client" ? "" : c.interlocuteur.nom,
  }));
  return { liste, chargement, recharger };
}

// ------------------------------------------------------------ Temps réel

let socket: Socket | null = null;

/** Connexion Socket.IO unique pour la page ; le jeton est relu à chaque (re)connexion. */
function connexion(): Socket {
  if (socket) return socket;
  const s = io(`${API_URL}/messagerie`, {
    auth: (cb) => cb({ token: lireSession()?.acces }),
    transports: ["websocket", "polling"],
  });
  // Connexion refusée (jeton d'accès expiré, il dure 15 minutes) : un appel à l'API renouvelle
  // la session, puis on retente. Sans session, on abandonne (l'espace renvoie vers la connexion).
  s.on("connect_error", () => {
    window.setTimeout(() => {
      if (!lireSession()) return;
      api("/moi")
        .then(() => s.connect())
        .catch(() => undefined);
    }, 2000);
  });
  socket = s;
  return s;
}

// ------------------------------------------------------------ Fil de messages

/**
 * Messages d'une conversation et envoi. `onLu` : appelé quand des messages reçus viennent d'être lus
 * (pour rafraîchir les compteurs de la liste).
 */
export function useFil(conv: ConversationVue, vue: Auteur, onLu?: () => void) {
  const [locaux, setLocaux] = useMessages(conv.id);
  const [distants, setDistants] = useState<MessageApi[] | null>(null);
  const [ecrit, setEcrit] = useState(false);
  const moi = useSession()?.utilisateur.id;
  const rappelLu = useRef(onLu);
  useEffect(() => {
    rappelLu.current = onLu;
  });

  const marquerLus = useCallback(() => {
    api<{ lus: number }>(`/demandes/${encodeURIComponent(conv.id)}/messages/lus`, { methode: "POST" })
      .then((r) => r.lus && rappelLu.current?.())
      .catch(() => undefined);
  }, [conv.id]);

  // Démonstration : les messages reçus sont marqués comme lus à l'ouverture.
  useEffect(() => {
    if (apiActive) return;
    if (locaux.some((x) => x.auteur !== vue && !x.lu)) setLocaux((liste) => liste.map((x) => (x.auteur !== vue ? { ...x, lu: true } : x)));
  }, [locaux, vue, setLocaux]);

  // API : historique, puis réception en direct dans le salon de la demande.
  useEffect(() => {
    if (!apiActive) return;
    let actif = true;
    api<MessageApi[]>(`/demandes/${encodeURIComponent(conv.id)}/messages`)
      .then((liste) => {
        if (!actif) return;
        setDistants(liste);
        marquerLus();
      })
      .catch(() => actif && setDistants([]));

    const s = connexion();
    const rejoindre = () => s.emit("rejoindre", { demandeId: conv.id });
    let finEcrit: number | undefined;
    const surMessage = (m: MessageApi) => {
      if (m.demandeId !== conv.id) return;
      setDistants((l) => (l?.some((x) => x.id === m.id) ? l : [...(l ?? []), m]));
      if (m.auteurId !== lireSession()?.utilisateur.id) {
        setEcrit(false);
        marquerLus();
      }
    };
    const surLu = () => setDistants((l) => l?.map((x) => (x.auteurId === lireSession()?.utilisateur.id ? { ...x, lu: true } : x)) ?? l);
    const surEcrit = (e: { demandeId: string }) => {
      if (e.demandeId !== conv.id) return;
      setEcrit(true);
      window.clearTimeout(finEcrit);
      finEcrit = window.setTimeout(() => setEcrit(false), 4000);
    };
    rejoindre();
    s.on("connect", rejoindre);
    s.on("message", surMessage);
    s.on("lu", surLu);
    s.on("ecrit", surEcrit);
    return () => {
      actif = false;
      window.clearTimeout(finEcrit);
      s.emit("quitter", { demandeId: conv.id });
      s.off("connect", rejoindre);
      s.off("message", surMessage);
      s.off("lu", surLu);
      s.off("ecrit", surEcrit);
    };
  }, [conv.id, marquerLus]);

  const messages: Message[] = apiActive
    ? (distants ?? []).map((m) => ({
        id: m.id,
        auteur: m.auteurId === moi ? vue : autre(vue),
        texte: m.texte ?? undefined,
        photo: m.photoUrl ?? undefined,
        heure: heure(m.createdAt),
        lu: m.lu,
      }))
    : locaux;

  async function envoyer(texte: string, photo?: string | null) {
    if (apiActive) {
      const m = await api<MessageApi>(`/demandes/${encodeURIComponent(conv.id)}/messages`, { methode: "POST", corps: { texte: texte.trim() || undefined } });
      setDistants((l) => (l?.some((x) => x.id === m.id) ? l : [...(l ?? []), m]));
      return;
    }
    setLocaux((l) => [...l, { id: nouvelId(), auteur: vue, texte: texte.trim() || undefined, photo: photo ?? undefined, heure: heureActuelle() }]);
    if (vue === "client") notifier("nouveau_message", { client: conv.client, mission: conv.titre });
    // Démonstration : réponse de l'interlocuteur après quelques secondes.
    window.setTimeout(() => setEcrit(true), 900);
    window.setTimeout(() => {
      setEcrit(false);
      const pool = REPONSES_DEMO[autre(vue)];
      setLocaux((l) => [...l, { id: nouvelId(), auteur: autre(vue), texte: pool[l.length % pool.length], heure: heureActuelle() }]);
    }, 2800);
  }

  // Indicateur « en train d'écrire » envoyé à l'interlocuteur (au plus toutes les 3 secondes).
  const dernierSignal = useRef(0);
  function signalerEcriture() {
    if (!apiActive || Date.now() - dernierSignal.current < 3000) return;
    dernierSignal.current = Date.now();
    connexion().emit("ecrit", { demandeId: conv.id });
  }

  return { messages, envoyer, ecrit, signalerEcriture, chargement: apiActive && distants === null };
}

/** Aperçu d'une conversation (dernier message, non-lus) : fourni par l'API, ou calculé en démonstration. */
export function useApercu(conv: ConversationVue, vue: Auteur) {
  const [locaux] = useMessages(conv.id);
  if (apiActive) return { dernier: conv.dernier, nonLus: conv.nonLus ?? 0 };
  const d = locaux[locaux.length - 1];
  return {
    dernier: d && { texte: d.texte ?? "Photo", heure: d.heure, deMoi: d.auteur === vue },
    nonLus: locaux.filter((x) => x.auteur !== vue && !x.lu).length,
  };
}
