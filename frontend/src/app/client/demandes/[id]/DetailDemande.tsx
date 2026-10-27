"use client";

import { CalendarDays, ImageIcon, MapPin, MessageSquareText, MessageCircle, Phone, Star, Wallet, XCircle, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { StatutDemandeBadge } from "@/components/shared/status";
import SuiviTrajet from "@/components/shared/SuiviTrajet";
import Timeline from "@/components/shared/Timeline";
import CodeIntervention from "@/components/shared/CodeIntervention";
import DevisClient from "@/components/shared/DevisClient";
import { useStatutDemande } from "@/lib/stockage";
import { Avatar, Button, Card, LinkButton, MetierIcon, Rating, VerificationBadge } from "@/components/ui";
import { Modal } from "@/components/ui/interactive";
import { formatGNF, getMetier, getTechnicien, type Demande, type StatutDemande } from "@/lib/data";

export default function DetailDemande({ demande }: { demande: Demande }) {
  const tech = demande.technicienId ? getTechnicien(demande.technicienId) : undefined;
  const [annulation, setAnnulation] = useState(false);
  const [statut, setStatut] = useStatutDemande<StatutDemande>(demande.id, demande.statut);

  const infos = [
    { icon: CalendarDays, label: "Créneau", valeur: demande.creneau },
    { icon: MapPin, label: "Adresse", valeur: `${demande.adresse}, ${demande.zone}` },
    { icon: Wallet, label: "Budget", valeur: demande.budget ? formatGNF(demande.budget) : "Sur devis" },
    { icon: Zap, label: "Urgence", valeur: demande.urgence === "urgente" ? "Urgente" : "Normale" },
  ];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="rounded-2xl bg-accent-50 p-3.5 text-accent-500">
            <MetierIcon metier={demande.metier} className="size-6" />
          </span>
          <div>
            <p className="text-sm text-slate-500">
              Demande {demande.reference} · créée le {demande.date}
            </p>
            <h1 className="text-2xl font-extrabold text-brand-950">{demande.titre}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatutDemandeBadge statut={statut} />
          {statut === "terminee" && !demande.evaluee && (
            <LinkButton href={`/client/demandes/${demande.id}/evaluation`}>
              <Star className="size-4" /> Évaluer la mission
            </LinkButton>
          )}
          {["envoyee", "acceptee"].includes(statut) && (
            <Button variant="danger" onClick={() => setAnnulation(true)}>
              <XCircle className="size-4" /> Annuler
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Reveal className="space-y-6">
          {tech && statut !== "annulee" && statut !== "envoyee" && <SuiviTrajet tech={tech} destination={demande.zone} statut={statut} />}
          {tech && <CodeIntervention demandeId={demande.id} statut={statut} technicien={tech.nom.split(" ")[0]} />}
          {tech && statut !== "annulee" && statut !== "envoyee" && <DevisClient demande={demande} technicien={tech.nom} />}
          <Card className="p-6">
            <h2 className="font-bold text-slate-900">Détails de la demande</h2>
            <p className="mt-3 leading-relaxed text-slate-600">{demande.description}</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {infos.map(({ icon: Icon, label, valeur }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                  <Icon className="mt-0.5 size-4 text-brand-600" />
                  <div>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="text-sm font-semibold text-slate-900">{valeur}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className="mb-2 mt-6 text-sm font-semibold text-slate-700">Photos jointes</p>
            <div className="flex gap-3">
              {["from-brand-200 to-brand-400", "from-accent-100 to-accent-400"].map((g) => (
                <div key={g} className={`flex size-24 items-center justify-center rounded-xl bg-gradient-to-br ${g} text-white/80`}>
                  <ImageIcon className="size-6" />
                </div>
              ))}
            </div>
          </Card>

          {tech ? (
            <Card className="p-6">
              <h2 className="mb-4 font-bold text-slate-900">Technicien assigné</h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar nom={tech.nom} className="size-16 text-lg" />
                <div className="flex-1">
                  <Link href={`/techniciens/${tech.id}`} className="font-bold text-slate-900 hover:text-brand-600">
                    {tech.nom}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {getMetier(tech.metier).label} · {tech.experience} ans d&apos;expérience
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Rating note={tech.note} nbAvis={tech.nbAvis} />
                    <VerificationBadge niveau={tech.niveau} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${tech.telephone.replace(/\s/g, "")}`} className="rounded-xl bg-brand-50 p-3 text-brand-600 transition hover:bg-brand-600 hover:text-white" aria-label="Appeler">
                    <Phone className="size-5" />
                  </a>
                  <a href="#" className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition hover:bg-emerald-500 hover:text-white" aria-label="WhatsApp">
                    <MessageCircle className="size-5" />
                  </a>
                  <LinkButton href={`/client/messages?c=${demande.id}`} variant="outline" aria-label="Messages">
                    <MessageSquareText className="size-4" /> Message
                  </LinkButton>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex items-center gap-4 border-dashed p-6">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-amber-500" />
              </span>
              <div>
                <p className="font-bold text-slate-900">En recherche d&apos;un technicien</p>
                <p className="text-sm text-slate-500">3 professionnels de votre zone ont consulté votre demande.</p>
              </div>
            </Card>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="p-6">
            <h2 className="mb-5 font-bold text-slate-900">Chronologie</h2>
            <Timeline etapes={demande.chronologie} />
          </Card>
        </Reveal>
      </div>

      <Modal
        open={annulation}
        onClose={() => setAnnulation(false)}
        title="Annuler cette demande ?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAnnulation(false)}>
              Garder la demande
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setStatut("annulee");
                setAnnulation(false);
                toast("Demande annulée", "info");
              }}
            >
              Oui, annuler
            </Button>
          </>
        }
      >
        Le technicien sera prévenu de l&apos;annulation. Vous pourrez créer une nouvelle demande à tout moment.
      </Modal>
    </>
  );
}
