"use client";

import { Bell, BellOff, CheckCheck, ClipboardList, Info, ShieldCheck, Star, Trash2, Wrench, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, cn, EmptyState, PageHeader } from "@/components/ui";
import { Tabs } from "@/components/ui/interactive";
import type { Notification, TypeNotification } from "@/lib/data";
import { cleNotifications, type Destinataire } from "@/lib/notifier";
import { usePersistant } from "@/lib/stockage";

const AUCUNE: Notification[] = [];

const TYPES: Record<TypeNotification, { icon: LucideIcon; color: string; label: string }> = {
  demande: { icon: ClipboardList, color: "bg-brand-50 text-brand-600", label: "Demandes" },
  mission: { icon: Wrench, color: "bg-emerald-50 text-emerald-600", label: "Missions" },
  avis: { icon: Star, color: "bg-amber-50 text-amber-500", label: "Avis" },
  verification: { icon: ShieldCheck, color: "bg-violet-50 text-violet-600", label: "Vérification" },
  systeme: { icon: Info, color: "bg-slate-100 text-slate-600", label: "Système" },
};

type Filtre = "toutes" | "non_lues" | TypeNotification;

export default function NotificationsView({ initial, destinataire }: { initial: Notification[]; destinataire: Destinataire }) {
  // Notifications envoyées pendant la session (SMS / WhatsApp de chaque étape), puis l'historique.
  const [recentes, setRecentes] = usePersistant(cleNotifications(destinataire), AUCUNE);
  const [historique, setHistorique] = useState(initial);
  const items = [...recentes, ...historique];
  const setItems = (maj: (prev: Notification[]) => Notification[]) => {
    const suivantes = maj(items);
    const ids = new Set(recentes.map((n) => n.id));
    setRecentes(suivantes.filter((n) => ids.has(n.id)));
    setHistorique(suivantes.filter((n) => !ids.has(n.id)));
  };
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
      onComplete: () => setItems((prev) => prev.filter((n) => n.id !== id)),
    });
  });

  const toutLire = () => {
    setItems((prev) => prev.map((n) => ({ ...n, lu: true })));
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
          {visibles.length === 0 ? (
            <EmptyState icon={filtre === "non_lues" ? BellOff : Bell} title="Aucune notification" text="Rien de nouveau pour ce filtre." />
          ) : (
            <Reveal className="space-y-2" deps={[filtre]} y={14} stagger={0.05}>
              {visibles.map((n) => {
                const T = TYPES[n.type];
                return (
                  <div
                    key={n.id}
                    data-notif={n.id}
                    onClick={() => setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, lu: true } : p)))}
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
