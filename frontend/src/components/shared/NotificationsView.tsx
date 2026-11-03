"use client";

import { Bell, BellOff, CheckCheck, ClipboardList, Info, ShieldCheck, Star, Trash2, Wrench, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import ChargementListe from "@/components/shared/ChargementListe";
import { Button, Card, cn, EmptyState, PageHeader } from "@/components/ui";
import { Tabs } from "@/components/ui/interactive";
import { api, apiActive, texteErreur } from "@/lib/api";
import type { Notification, TypeNotification } from "@/lib/data";
import { cleNotifications, type Destinataire } from "@/lib/notifier";
import { usePersistant } from "@/lib/stockage";
import { useApi } from "@/lib/useApi";

const AUCUNE: Notification[] = [];

const TYPES: Record<TypeNotification, { icon: LucideIcon; color: string; label: string }> = {
  demande: { icon: ClipboardList, color: "bg-brand-50 text-brand-600", label: "Demandes" },
  mission: { icon: Wrench, color: "bg-emerald-50 text-emerald-600", label: "Missions" },
  avis: { icon: Star, color: "bg-amber-50 text-amber-500", label: "Avis" },
  verification: { icon: ShieldCheck, color: "bg-violet-50 text-violet-600", label: "Vérification" },
  systeme: { icon: Info, color: "bg-slate-100 text-slate-600", label: "Système" },
};

type Filtre = "toutes" | "non_lues" | TypeNotification;

interface NotificationApi {
  id: string;
  type: TypeNotification;
  titre: string;
  texte: string;
  lien: string | null;
  lu: boolean;
  createdAt: string;
}

/** « À l'instant », « Il y a 5 min », « Il y a 2 h », « Hier », « 12 oct. » */
function ilYa(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  if (min < 24 * 60) return `Il y a ${Math.round(min / 60)} h`;
  if (min < 48 * 60) return "Hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/**
 * Notifications de l'utilisateur. Avec l'API : celles du serveur (les actions y sont enregistrées) ;
 * en démonstration : celles envoyées pendant la session, puis l'historique fictif.
 */
function useNotifications(initial: Notification[], destinataire: Destinataire) {
  const [recentes, setRecentes] = usePersistant(cleNotifications(destinataire), AUCUNE);
  const [historique, setHistorique] = useState(initial);
  const distantes = useApi<NotificationApi[]>(apiActive ? "/notifications" : null);
  // Modifications locales (lues, supprimées) appliquées en attendant le prochain chargement.
  const [maj, setMaj] = useState<{ lues: Set<string>; supprimees: Set<string>; tout: boolean }>({ lues: new Set(), supprimees: new Set(), tout: false });

  if (apiActive) {
    const items: (Notification & { lien?: string })[] = (distantes.donnees ?? [])
      .filter((n) => !maj.supprimees.has(n.id))
      .map((n) => ({ id: n.id, type: n.type, titre: n.titre, texte: n.texte, date: ilYa(n.createdAt), lu: n.lu || maj.tout || maj.lues.has(n.id), lien: n.lien ?? undefined }));
    const erreur = (e: unknown) => toast(texteErreur(e), "error");
    return {
      items,
      chargement: distantes.chargement,
      lire(id: string) {
        if (items.find((n) => n.id === id)?.lu) return;
        setMaj((m) => ({ ...m, lues: new Set(m.lues).add(id) }));
        api(`/notifications/${id}/lu`, { methode: "PATCH" }).catch(erreur);
      },
      toutLire() {
        setMaj((m) => ({ ...m, tout: true }));
        api("/notifications/tout-lu", { methode: "POST" }).catch(erreur);
      },
      supprimer(id: string) {
        setMaj((m) => ({ ...m, supprimees: new Set(m.supprimees).add(id) }));
        api(`/notifications/${id}`, { methode: "DELETE" }).catch(erreur);
      },
    };
  }

  const items: (Notification & { lien?: string })[] = [...recentes, ...historique];
  const setItems = (f: (prev: Notification[]) => Notification[]) => {
    const suivantes = f(items);
    const ids = new Set(recentes.map((n) => n.id));
    setRecentes(suivantes.filter((n) => ids.has(n.id)));
    setHistorique(suivantes.filter((n) => !ids.has(n.id)));
  };
  return {
    items,
    chargement: false,
    lire: (id: string) => setItems((prev) => prev.map((p) => (p.id === id ? { ...p, lu: true } : p))),
    toutLire: () => setItems((prev) => prev.map((n) => ({ ...n, lu: true }))),
    supprimer: (id: string) => setItems((prev) => prev.filter((n) => n.id !== id)),
  };
}

export default function NotificationsView({ initial, destinataire }: { initial: Notification[]; destinataire: Destinataire }) {
  const router = useRouter();
  const { items, chargement, lire, toutLire: toutMarquer, supprimer: retirer } = useNotifications(initial, destinataire);
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const list = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: list });

  const types = Array.from(new Set(items.map((n) => n.type)));
  const nonLues = items.filter((n) => !n.lu).length;
  const visibles = items.filter((n) => (filtre === "toutes" ? true : filtre === "non_lues" ? !n.lu : n.type === filtre));

  const supprimer = contextSafe((id: string) => {
    gsap.to(`[data-notif="${id}"]`, {
      x: 60,
      autoAlpha: 0,
      height: 0,
      marginTop: 0,
      paddingTop: 0,
      paddingBottom: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => retirer(id),
    });
  });

  const toutLire = () => {
    toutMarquer();
    toast("Toutes les notifications sont marquées comme lues");
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={nonLues ? `Vous avez ${nonLues} notification${nonLues > 1 ? "s" : ""} non lue${nonLues > 1 ? "s" : ""}.` : "Vous êtes à jour."}
        actions={
          <Button variant="outline" onClick={toutLire} disabled={!nonLues}>
            <CheckCheck className="size-4" /> Tout marquer comme lu
          </Button>
        }
      />
      <Card className="p-5">
        <Tabs<Filtre>
          value={filtre}
          onChange={setFiltre}
          tabs={[
            { id: "toutes", label: "Toutes", count: items.length },
            { id: "non_lues", label: "Non lues", count: nonLues },
            ...types.map((t) => ({ id: t as Filtre, label: TYPES[t].label })),
          ]}
        />
        <div ref={list} className="mt-4">
          {chargement ? (
            <ChargementListe />
          ) : visibles.length === 0 ? (
            <EmptyState icon={filtre === "non_lues" ? BellOff : Bell} title="Aucune notification" text="Rien de nouveau pour ce filtre." />
          ) : (
            <Reveal className="space-y-2" deps={[filtre]} y={14} stagger={0.05}>
              {visibles.map((n) => {
                const T = TYPES[n.type];
                return (
                  <div
                    key={n.id}
                    data-notif={n.id}
                    onClick={() => {
                      lire(n.id);
                      if (n.lien) router.push(n.lien);
                    }}
                    className={cn(
                      "group flex cursor-pointer items-start gap-4 overflow-hidden rounded-xl border p-4 transition-colors",
                      n.lu ? "border-transparent hover:bg-slate-50" : "border-brand-100 bg-brand-50/50 hover:bg-brand-50",
                    )}
                  >
                    <span className={cn("rounded-xl p-2.5", T.color)}>
                      <T.icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{n.titre}</p>
                        {!n.lu && <span className="size-2 rounded-full bg-accent-500" />}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{n.texte}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="whitespace-nowrap text-xs text-slate-400">{n.date}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          supprimer(n.id);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </Reveal>
          )}
        </div>
      </Card>
    </>
  );
}
