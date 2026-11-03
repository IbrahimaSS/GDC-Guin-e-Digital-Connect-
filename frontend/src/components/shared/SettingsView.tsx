"use client";

import { Bell, Globe, KeyRound, LifeBuoy, Lock, Smartphone, Trash2, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { Modal, Toggle } from "@/components/ui/interactive";
import { api, apiActive, texteErreur } from "@/lib/api";
import { CLIENT_CONNECTE, DEMANDES, DEMANDES_RECUES, TECHNICIEN_CONNECTE } from "@/lib/data";
import { fermerSession, lireSession, useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { usePersistant } from "@/lib/stockage";
import { dateFichier, telecharger } from "@/lib/telechargement";
import { useApi } from "@/lib/useApi";

function Section({ icon: Icon, title, text, children }: { icon: LucideIcon; title: string; text: string; children: ReactNode }) {
  return (
    <Card className="grid gap-6 p-6 md:grid-cols-[260px_1fr]">
      <div className="flex gap-3">
        <span className="h-fit rounded-xl bg-brand-50 p-2.5 text-brand-600">
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{text}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

interface SessionAppareil {
  id: string;
  appareil: string | null;
  createdAt: string;
}

/** « Chrome sur Windows », « Safari sur iPhone »… à partir de l'agent du navigateur. */
function nomAppareil(ua: string | null) {
  if (!ua) return "Appareil inconnu";
  const nav = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Navigateur";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iPhone" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${nav} sur ${os}` : nav;
}

const PREFERENCES = { notifs: { sms: true, whatsapp: true, email: false, promo: false }, securite: { deuxEtapes: true, visible: true } };

interface PreferencesApi {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
  actualites: boolean;
  visible?: boolean;
}

export default function SettingsView({ role }: { role: "client" | "technicien" }) {
  const prefsApi = useApi<PreferencesApi>(apiActive ? "/moi/preferences" : null).donnees;
  // Le formulaire s'ouvre une fois les préférences du compte chargées (avec l'API).
  if (apiActive && !prefsApi) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />;
  return <Parametres role={role} prefsApi={prefsApi} />;
}

function Parametres({ role, prefsApi }: { role: "client" | "technicien"; prefsApi?: PreferencesApi }) {
  const router = useRouter();
  // En démonstration, les préférences sont conservées sur cet appareil.
  const [preferences, setPreferences] = usePersistant(`preferences-${role}`, PREFERENCES);
  const initiales = prefsApi
    ? { notifs: { sms: prefsApi.sms, whatsapp: prefsApi.whatsapp, email: prefsApi.email, promo: prefsApi.actualites }, securite: { deuxEtapes: true, visible: prefsApi.visible ?? true } }
    : preferences;
  const [notifs, setNotifs] = useState(initiales.notifs);
  const [securite, setSecurite] = useState(initiales.securite);
  const [suppression, setSuppression] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const session = useSession();
  const sessions = useApi<SessionAppareil[]>(apiActive ? "/moi/sessions" : null);

  async function enregistrer() {
    if (!apiActive) {
      setPreferences({ notifs, securite });
      return toast("Paramètres enregistrés");
    }
    setEnvoi(true);
    try {
      await api("/moi/preferences", {
        methode: "PUT",
        corps: { sms: notifs.sms, whatsapp: notifs.whatsapp, email: notifs.email, actualites: notifs.promo, ...(role === "technicien" && { visible: securite.visible }) },
      });
      toast("Paramètres enregistrés");
    } catch (e) {
      toast(texteErreur(e), "error");
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimerCompte() {
    if (!apiActive) {
      setSuppression(false);
      return toast("Demande de suppression enregistrée", "info");
    }
    setEnvoi(true);
    try {
      await api("/moi", { methode: "DELETE" });
      fermerSession();
      toast("Votre compte a été supprimé. Merci d'avoir utilisé GDC.", "info");
      router.push("/");
    } catch (e) {
      setSuppression(false);
      toast(texteErreur(e), "error");
    } finally {
      setEnvoi(false);
    }
  }

  async function deconnecterAutres() {
    if (!apiActive) return toast("Les autres appareils ont été déconnectés");
    try {
      await api("/auth/deconnexion/autres", { methode: "POST", corps: { rafraichissement: lireSession()?.rafraichissement } });
      sessions.recharger();
      toast("Les autres appareils ont été déconnectés");
    } catch (e) {
      toast(texteErreur(e), "error");
    }
  }

  async function exporter() {
    let donnees: unknown;
    if (apiActive) {
      try {
        const [profil, demandes] = await Promise.all([api("/moi"), api<{ resultats: unknown[] }>("/demandes")]);
        donnees = { exporte_le: new Date().toISOString(), role, profil, preferences: { notifications: notifs, securite }, demandes: demandes.resultats };
      } catch (e) {
        return toast(texteErreur(e), "error");
      }
    } else {
      const profil = role === "client" ? CLIENT_CONNECTE : { nom: TECHNICIEN_CONNECTE.nom, telephone: TECHNICIEN_CONNECTE.telephone, zone: TECHNICIEN_CONNECTE.zone };
      donnees = {
        exporte_le: new Date().toISOString(),
        role,
        profil,
        preferences: { notifications: notifs, securite },
        demandes: (role === "client" ? DEMANDES : DEMANDES_RECUES).map((d) => ({ reference: d.reference, titre: d.titre, statut: d.statut, date: d.date, zone: d.zone })),
      };
    }
    telecharger(`gdc-mes-donnees-${dateFichier()}.json`, JSON.stringify(donnees, null, 2), "application/json");
    toast("Vos données ont été téléchargées");
  }

  return (
    <>
      <PageHeader title="Paramètres du compte" subtitle="Gérez vos préférences, la sécurité et la confidentialité de votre compte." />
      <Reveal className="space-y-5">
        <Section icon={User} title="Informations personnelles" text="Les informations de connexion à votre compte.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Numéro de téléphone">
              {apiActive ? (
                <Input value={session?.utilisateur.telephone ?? ""} disabled />
              ) : (
                <Input defaultValue={role === "client" ? "+224 621 11 22 33" : "+224 620 00 00 01"} />
              )}
            </Field>
            <Field label="E-mail (optionnel)">
              {apiActive ? (
                <Input value={session?.utilisateur.email ?? "Non renseigné"} disabled />
              ) : (
                <Input type="email" placeholder="nom@exemple.gn" />
              )}
            </Field>
          </div>
          <Link href={`/${role}/profil`} className="inline-block text-sm font-semibold text-brand-600 hover:underline">
            Modifier mon profil complet →
          </Link>
        </Section>

        <Section icon={Bell} title="Notifications" text="Choisissez comment GDC vous prévient.">
          <Toggle checked={notifs.sms} onChange={(v) => setNotifs({ ...notifs, sms: v })} label="SMS" description="Nouvelles demandes, confirmations et rappels." />
          <Toggle checked={notifs.whatsapp} onChange={(v) => setNotifs({ ...notifs, whatsapp: v })} label="WhatsApp" description="Messages des clients et suivi des missions." />
          <Toggle checked={notifs.email} onChange={(v) => setNotifs({ ...notifs, email: v })} label="E-mail" description="Récapitulatif hebdomadaire de votre activité." />
          <Toggle checked={notifs.promo} onChange={(v) => setNotifs({ ...notifs, promo: v })} label="Actualités GDC" description="Nouveautés et conseils de la plateforme." />
        </Section>

        <Section icon={Lock} title="Sécurité et confidentialité" text="Protégez l'accès à votre compte.">
          {apiActive ? (
            <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              <Lock className="mt-0.5 size-4 shrink-0" /> Chaque connexion sur un nouvel appareil demande un code reçu par SMS : c&apos;est toujours activé.
            </p>
          ) : (
            <Toggle
              checked={securite.deuxEtapes}
              onChange={(v) => setSecurite({ ...securite, deuxEtapes: v })}
              label="Code de confirmation à chaque connexion"
              description="Un code SMS est demandé sur chaque nouvel appareil."
            />
          )}
          {role === "technicien" && (
            <Toggle
              checked={securite.visible}
              onChange={(v) => setSecurite({ ...securite, visible: v })}
              label="Profil visible dans la recherche"
              description="Désactivez pour vous rendre temporairement invisible."
            />
          )}
          {apiActive && sessions.donnees && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-700">Appareils connectés ({sessions.donnees.length})</p>
              <ul className="space-y-1 text-sm text-slate-600">
                {sessions.donnees.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <Smartphone className="size-4 text-slate-400" /> {nomAppareil(s.appareil)}
                    </span>
                    <span className="text-xs text-slate-400">depuis le {new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={deconnecterAutres}>
              <Smartphone className="size-4" /> Déconnecter les autres appareils
            </Button>
            <Button variant="ghost" size="sm" onClick={exporter}>
              <KeyRound className="size-4" /> Télécharger mes données
            </Button>
          </div>
        </Section>

        <Section icon={Globe} title="Préférences" text="Langue et affichage.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Langue">
              <Select defaultValue="fr">
                <option value="fr">Français</option>
                <option value="ff">Pular (bientôt)</option>
                <option value="sus">Soussou (bientôt)</option>
                <option value="man">Malinké (bientôt)</option>
              </Select>
            </Field>
            <Field label="Zone par défaut">
              <Select defaultValue="Kaloum">
                <option>Kaloum</option>
                <option>Dixinn</option>
                <option>Matam</option>
                <option>Ratoma</option>
                <option>Matoto</option>
              </Select>
            </Field>
          </div>
        </Section>

        <Section icon={LifeBuoy} title="Aide et support" text="Une question ? Nous sommes là.">
          <p className="text-sm text-slate-600">
            Contactez le support au <strong>+224 620 00 00 00</strong> (WhatsApp) ou par e-mail à <strong>support@gdc.gn</strong>.
          </p>
        </Section>

        <Card className="flex flex-col gap-4 border-red-200 bg-red-50/40 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-red-700">Supprimer mon compte</h2>
            <p className="text-sm text-red-600/80">Cette action est définitive : vos demandes et avis seront effacés.</p>
          </div>
          <Button variant="danger" onClick={() => setSuppression(true)}>
            <Trash2 className="size-4" /> Supprimer le compte
          </Button>
        </Card>
      </Reveal>

      <div className="sticky bottom-4 mt-6 flex justify-end">
        <Button size="lg" onClick={enregistrer} disabled={envoi} className="shadow-xl">
          Enregistrer les modifications
        </Button>
      </div>

      <Modal
        open={suppression}
        onClose={() => setSuppression(false)}
        title="Supprimer définitivement votre compte ?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSuppression(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={supprimerCompte} disabled={envoi}>
              {envoi ? "Suppression…" : "Oui, supprimer"}
            </Button>
          </>
        }
      >
        {apiActive
          ? "Vos informations personnelles (nom, téléphone, e-mail, photos, adresses) sont effacées immédiatement et vous êtes déconnecté. L'historique de vos missions reste visible, de façon anonyme, pour vos interlocuteurs. Impossible si une mission ou un paiement est en cours."
          : "Toutes vos données seront supprimées sous 30 jours. Vous pouvez annuler en vous reconnectant pendant ce délai."}
      </Modal>
    </>
  );
}
