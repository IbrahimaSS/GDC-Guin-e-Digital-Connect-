"use client";

import { Check, EyeOff, Flag, MessageSquareText, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, Stars, type Tone } from "@/components/ui";
import { Tabs } from "@/components/ui/interactive";
import { dateCourte, type Page } from "@/lib/admin";
import { api, apiActive, texteErreur } from "@/lib/api";
import { AVIS_MODERATION, getTechnicien, type AvisModeration, type StatutAvis } from "@/lib/data";
import { useApi } from "@/lib/useApi";

const STATUTS: Record<StatutAvis, [Tone, string]> = {
  publie: ["green", "Publié"],
  en_attente: ["amber", "En attente"],
  masque: ["slate", "Masqué"],
};

type Filtre = "tous" | StatutAvis | "signales";

interface AvisApi {
  id: string;
  note: number;
  commentaire: string | null;
  statut: "PUBLIE" | "EN_ATTENTE" | "MASQUE";
  signale: boolean;
  createdAt: string;
  auteur: { prenom: string; nom: string };
  technicien: { id: string; user: { prenom: string; nom: string } };
  demande: { titre: string; numero: number };
}

/** Avis au format de l'écran (`technicien` : nom affiché). */
type Ligne = AvisModeration & { technicien: string; mission?: string };

export default function ModerationAvis() {
  const distants = useApi<Page<AvisApi>>(apiActive ? "/admin/avis" : null);
  const [locaux, setLocaux] = useState<Ligne[]>(AVIS_MODERATION.map((a) => ({ ...a, technicien: getTechnicien(a.technicienId)!.nom })));
  // Avis supprimés pendant l'animation de sortie (API).
  const [retires, setRetires] = useState<string[]>([]);
  const avis: Ligne[] = apiActive
    ? (distants.donnees?.resultats ?? [])
        .filter((a) => !retires.includes(a.id))
        .map((a) => ({
          id: a.id,
          auteur: `${a.auteur.prenom} ${a.auteur.nom}`,
          technicienId: a.technicien.id,
          technicien: `${a.technicien.user.prenom} ${a.technicien.user.nom}`,
          mission: `#${a.demande.numero} ${a.demande.titre}`,
          note: a.note,
          texte: a.commentaire ?? "(sans commentaire)",
          date: dateCourte(a.createdAt),
          statut: a.statut.toLowerCase() as StatutAvis,
          signale: a.signale,
        }))
    : locaux;
  const [filtre, setFiltre] = useState<Filtre>("en_attente");
  const ref = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: ref });

  const liste = avis.filter((a) => (filtre === "tous" ? true : filtre === "signales" ? a.signale : a.statut === filtre));

  async function changer(id: string, statut: StatutAvis) {
    if (apiActive) {
      try {
        await api(`/admin/avis/${id}`, { methode: "PATCH", corps: { statut: statut.toUpperCase() } });
        distants.recharger();
      } catch (e) {
        return toast(texteErreur(e), "error");
      }
    } else {
      setLocaux(locaux.map((a) => (a.id === id ? { ...a, statut, signale: statut === "publie" ? false : a.signale } : a)));
    }
    toast(statut === "publie" ? "Avis approuvé et publié : la note du technicien est mise à jour" : "Avis masqué", statut === "publie" ? "success" : "info");
  }

  async function supprimer(id: string) {
    if (apiActive) {
      try {
        await api(`/admin/avis/${id}`, { methode: "DELETE" });
      } catch (e) {
        return toast(texteErreur(e), "error");
      }
    }
    animerSuppression(id);
  }

  const animerSuppression = contextSafe((id: string) => {
    gsap.to(`[data-avis="${id}"]`, {
      height: 0,
      autoAlpha: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      duration: 0.4,
      ease: "power2.inOut",
      onComplete: () => {
        if (apiActive) setRetires((r) => [...r, id]);
        else setLocaux((prev) => prev.filter((a) => a.id !== id));
        toast("Avis supprimé", "info");
      },
    });
  });

  return (
    <div ref={ref}>
      <PageHeader title="Avis et modération" subtitle="Vérifiez les avis signalés ou en attente avant leur publication." />
      <Card className="p-5">
        <Tabs<Filtre>
          value={filtre}
          onChange={setFiltre}
          tabs={[
            { id: "en_attente", label: "À modérer", count: avis.filter((a) => a.statut === "en_attente").length },
            { id: "signales", label: "Signalés", count: avis.filter((a) => a.signale).length },
            { id: "publie", label: "Publiés", count: avis.filter((a) => a.statut === "publie").length },
            { id: "masque", label: "Masqués", count: avis.filter((a) => a.statut === "masque").length },
            { id: "tous", label: "Tous", count: avis.length },
          ]}
        />
        {liste.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={MessageSquareText}
              title={distants.chargement ? "Chargement…" : "Rien à modérer"}
              text={filtre === "en_attente" ? "Les avis de 1 et 2 étoiles attendent ici votre validation avant publication." : "Tous les avis de cette catégorie ont été traités."}
            />
          </div>
        ) : (
          <Reveal className="mt-5 space-y-3" deps={[filtre]} y={14} stagger={0.06}>
            {liste.map((a) => {
              return (
                <div key={a.id} data-avis={a.id} className="overflow-hidden rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <Avatar nom={a.auteur} className="size-10 text-xs" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">{a.auteur}</p>
                        <span className="text-sm text-slate-400">→</span>
                        <p className="text-sm font-semibold text-brand-700">{a.technicien}</p>
                        <Badge tone={STATUTS[a.statut][0]} dot>
                          {STATUTS[a.statut][1]}
                        </Badge>
                        {a.signale && (
                          <Badge tone="red">
                            <Flag className="size-3" /> Signalé
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Stars note={a.note} className="size-3.5" />
                        <span className="text-xs text-slate-400">
                          {a.date}
                          {a.mission && ` · ${a.mission}`}
                        </span>
                      </div>
                      <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">« {a.texte} »</p>
                    </div>
                    <div className="flex shrink-0 gap-2 md:flex-col">
                      {a.statut !== "publie" && (
                        <Button size="sm" variant="secondary" onClick={() => changer(a.id, "publie")}>
                          <Check className="size-4" /> Approuver
                        </Button>
                      )}
                      {a.statut !== "masque" && (
                        <Button size="sm" variant="outline" onClick={() => changer(a.id, "masque")}>
                          <EyeOff className="size-4" /> Masquer
                        </Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => supprimer(a.id)}>
                        <Trash2 className="size-4" /> Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </Reveal>
        )}
      </Card>
    </div>
  );
}
