"use client";

import { CalendarDays, Check, Inbox, MapPin, Wallet, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { StatutDemandeBadge } from "@/components/shared/status";
import { Avatar, Button, Card, EmptyState, LinkButton, MetierIcon, PageHeader } from "@/components/ui";
import { Tabs } from "@/components/ui/interactive";
import ChargementListe from "@/components/shared/ChargementListe";
import { apiActive, texteErreur } from "@/lib/api";
import { DEMANDES_RECUES, formatGNF, TECHNICIEN_CONNECTE, type StatutDemande } from "@/lib/data";
import { codeMission } from "@/lib/mission";
import { accepterMission, useDemandesRecues } from "@/lib/missions";
import { notifier } from "@/lib/notifier";
import { useSession } from "@/lib/session";
import { usePersistant } from "@/lib/stockage";

type Filtre = "envoyee" | "acceptee" | "en_cours" | "terminee";

const AUCUNE: string[] = [];

export default function DemandesRecues() {
  const source = useDemandesRecues();
  // Démonstration : liste modifiée sur place. API : rechargée après chaque réponse.
  const [locales, setLocales] = useState(DEMANDES_RECUES);
  // Demandes ouvertes que le technicien a déclinées : masquées chez lui, toujours visibles des autres.
  const session = useSession();
  const [ignorees, setIgnorees] = usePersistant<string[]>(`demandes-ignorees-${session?.utilisateur.id ?? "demo"}`, AUCUNE);
  const demandes = (apiActive ? source.demandes : locales).filter((d) => !ignorees.includes(d.id));
  const [filtre, setFiltre] = useState<Filtre>("envoyee");
  const ref = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: ref });

  const count = (s: StatutDemande) => demandes.filter((d) => d.statut === s).length;
  const liste = demandes.filter((d) => d.statut === filtre);

  async function appliquer(id: string, accepter: boolean) {
    const d = demandes.find((x) => x.id === id);
    if (!accepter) {
      setIgnorees([...ignorees, id]);
      return toast("Demande masquée : elle reste proposée aux autres professionnels.", "info");
    }
    if (!apiActive) {
      setLocales((prev) => prev.map((x) => (x.id === id ? { ...x, statut: "acceptee" } : x)));
      if (d) notifier("demande_acceptee", { client: d.client, technicien: TECHNICIEN_CONNECTE.nom, mission: d.titre, code: codeMission(d.id), numero: d.clientTel });
      return;
    }
    try {
      await accepterMission(id);
      toast("Mission acceptée : le client est prévenu et reçoit son code d'intervention.");
    } catch (e) {
      toast(texteErreur(e), "error");
    }
    source.recharger();
  }

  const repondre = contextSafe((id: string, accepter: boolean) => {
    gsap.to(`[data-demande="${id}"]`, {
      x: accepter ? 80 : -80,
      autoAlpha: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => void appliquer(id, accepter),
    });
  });

  return (
    <div ref={ref}>
      <PageHeader title="Demandes reçues" subtitle="Répondez rapidement : les techniciens réactifs sont mieux classés." />
      <Tabs<Filtre>
        value={filtre}
        onChange={setFiltre}
        tabs={[
          { id: "envoyee", label: "Nouvelles", count: count("envoyee") },
          { id: "acceptee", label: "Acceptées", count: count("acceptee") },
          { id: "en_cours", label: "En cours", count: count("en_cours") },
          { id: "terminee", label: "Terminées", count: count("terminee") },
        ]}
        className="mb-6"
      />

      {source.chargement ? (
        <ChargementListe />
      ) : liste.length === 0 ? (
        <EmptyState icon={Inbox} title="Aucune demande ici" text={source.erreur ?? "Les nouvelles demandes de votre zone apparaîtront dans cet onglet."} />
      ) : (
        <Reveal className="grid gap-4 lg:grid-cols-2" deps={[filtre, liste.length]} y={20} stagger={0.08}>
          {liste.map((d) => (
            <Card key={d.id} data-demande={d.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-accent-50 p-2.5 text-accent-500">
                  <MetierIcon metier={d.metier} className="size-5" />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900">{d.titre}</p>
                    {d.urgence === "urgente" && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-600">
                        <Zap className="size-3" /> Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {d.reference} · reçue le {d.date}
                  </p>
                </div>
                <StatutDemandeBadge statut={d.statut} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">{d.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-2 text-slate-600">
                  <MapPin className="size-3.5 shrink-0 text-brand-600" /> {d.zone}
                </span>
                <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-2 text-slate-600">
                  <CalendarDays className="size-3.5 shrink-0 text-brand-600" /> <span className="truncate">{d.creneau}</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-2 text-slate-600">
                  <Wallet className="size-3.5 shrink-0 text-brand-600" /> <span className="truncate">{d.budget ? formatGNF(d.budget) : "Devis"}</span>
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                <Avatar nom={d.client} className="size-9 text-[11px]" />
                <p className="flex-1 text-sm font-semibold text-slate-800">{d.client}</p>
                {d.statut === "envoyee" ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => repondre(d.id, false)}>
                      <X className="size-4" /> Décliner
                    </Button>
                    <LinkButton href={`/technicien/missions/${d.id}`} variant="ghost" size="sm">
                      Détail
                    </LinkButton>
                    <Button variant="secondary" size="sm" onClick={() => repondre(d.id, true)}>
                      <Check className="size-4" /> Accepter
                    </Button>
                  </>
                ) : (
                  <LinkButton href={`/technicien/missions/${d.id}`} variant="outline" size="sm">
                    Voir le détail
                  </LinkButton>
                )}
              </div>
            </Card>
          ))}
        </Reveal>
      )}
      <p className="mt-6 text-center text-xs text-slate-400">
        Astuce : activez les notifications WhatsApp dans vos{" "}
        <Link href="/technicien/parametres" className="font-semibold text-brand-600 hover:underline">
          paramètres
        </Link>{" "}
        pour ne manquer aucune demande.
      </p>
    </div>
  );
}
