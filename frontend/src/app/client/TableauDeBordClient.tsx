"use client";

import { ArrowRight, CheckCircle2, ClipboardList, Hourglass, MessageCircle, Phone, PlusCircle, Wallet, Wrench } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { BarChart, DonutChart } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import ChargementListe from "@/components/shared/ChargementListe";
import DemandeRow from "@/components/shared/DemandeRow";
import Timeline from "@/components/shared/Timeline";
import { Avatar, Card, CardHeader, EmptyState, LinkButton, Rating, StatCard, VerificationBadge } from "@/components/ui";
import { apiActive } from "@/lib/api";
import { CLIENT_CONNECTE, DEPENSES_CLIENT, formatGNF, STATUTS_DEMANDE, TECHNICIENS, type Niveau, type StatutDemande } from "@/lib/data";
import { technicienDe, useMesDemandes } from "@/lib/demandes";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/useApi";

const COULEURS_STATUT: Record<StatutDemande, string> = {
  envoyee: "#f59e0b",
  acceptee: "#0066cc",
  en_cours: "#ff8a00",
  terminee: "#10b981",
  annulee: "#94a3b8",
};

interface PaiementApi {
  montant: number;
  statut: "EN_ATTENTE" | "CONFIRME" | "ECHOUE" | "REVERSE";
  confirmeLe: string | null;
}

interface TechnicienCarte {
  id: string;
  nom: string;
  note: number;
  nbAvis: number;
  niveau: number;
}

/** Dépenses des 6 derniers mois (millions de GNF), à partir des paiements confirmés. */
function depensesParMois(paiements: PaiementApi[]) {
  const maintenant = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const debut = new Date(maintenant.getFullYear(), maintenant.getMonth() - 5 + i, 1);
    const fin = new Date(debut.getFullYear(), debut.getMonth() + 1, 1);
    const total = paiements
      .filter((p) => p.confirmeLe && p.statut !== "ECHOUE" && new Date(p.confirmeLe) >= debut && new Date(p.confirmeLe) < fin)
      .reduce((s, p) => s + p.montant, 0);
    const mois = debut.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
    return { mois: mois.charAt(0).toUpperCase() + mois.slice(1), montant: Math.round(total / 10_000) / 100 };
  });
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

// Date du jour lue dans le navigateur uniquement (le rendu serveur n'affiche pas de date).
const sansAbonnement = () => () => {};
const dateDuJour = () => new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export default function TableauDeBordClient() {
  const session = useSession();
  const { demandes, chargement } = useMesDemandes();
  const paiementsApi = useApi<PaiementApi[]>(apiActive ? "/paiements" : null).donnees;
  const paiements = paiementsApi ?? [];
  const pros = useApi<{ resultats: TechnicienCarte[] }>(apiActive ? "/techniciens?tri=note&parPage=3&disponible=true" : null).donnees?.resultats;

  const prenom = apiActive ? (session?.utilisateur.prenom ?? "") : CLIENT_CONNECTE.prenom;
  const enCours = demandes.find((d) => d.statut === "en_cours") ?? demandes.find((d) => d.statut === "acceptee");
  const tech = enCours && technicienDe(enCours);
  const actives = demandes.filter((d) => d.statut === "en_cours").length;
  const enAttente = demandes.filter((d) => ["envoyee", "acceptee"].includes(d.statut)).length;
  const depenses = apiActive
    ? paiements.filter((p) => p.statut === "CONFIRME" || p.statut === "REVERSE").reduce((s, p) => s + p.montant, 0)
    : demandes.filter((d) => d.statut === "terminee").reduce((s, d) => s + (d.budget ?? 0), 0);
  // Calculé seulement dans le navigateur, une fois les paiements reçus.
  const parMois = apiActive ? (paiementsApi ? depensesParMois(paiementsApi) : []) : DEPENSES_CLIENT;
  const recommandes: TechnicienCarte[] = apiActive ? (pros ?? []) : TECHNICIENS.filter((t) => t.niveau >= 2).slice(1, 4);
  const aujourdhui = useSyncExternalStore(sansAbonnement, dateDuJour, () => "");

  return (
    <>
      {/* Bandeau d'accueil */}
      <Reveal className="mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-sky-brand p-6 text-white shadow-xl shadow-brand-900/20 md:p-8">
          <div className="absolute -right-16 -top-20 size-72 rounded-full bg-white/10" aria-hidden />
          <div className="absolute -bottom-24 right-40 size-56 rounded-full bg-accent-500/30 blur-2xl" aria-hidden />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                Espace client{aujourdhui && ` · ${aujourdhui}`}
              </p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">Bonjour{prenom && `, ${prenom}`} !</h1>
              <p className="mt-1 max-w-xl text-brand-100">
                {actives || enAttente ? (
                  <>
                    Vous avez <strong className="text-white">{pluriel(actives, "mission")} en cours</strong> et{" "}
                    <strong className="text-white">{pluriel(enAttente, "demande")}</strong> en attente.
                  </>
                ) : (
                  "Décrivez votre besoin : les professionnels vérifiés de votre zone vous répondent."
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LinkButton href="/client/demandes/nouvelle" size="lg">
                <PlusCircle className="size-4" /> Nouvelle demande
              </LinkButton>
              <LinkButton href="/recherche" size="lg" variant="dark">
                Trouver un pro
              </LinkButton>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Hourglass} label="Demandes en cours" value={enAttente} tone="orange" />
        <StatCard icon={Wrench} label="Missions actives" value={actives} tone="blue" />
        <StatCard icon={CheckCircle2} label="Missions terminées" value={demandes.filter((d) => d.statut === "terminee").length} tone="green" />
        <StatCard icon={Wallet} label="Dépensé (GNF)" value={depenses} tone="violet" />
      </Reveal>

      <Reveal className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]" delay={0.1}>
        <Card>
          <CardHeader title="Mes dépenses" subtitle="Montants des interventions réglées, en millions de GNF" />
          <div className="p-5">
            <BarChart
              data={parMois.map((d, i) => ({ label: d.mois, value: d.montant, color: i === parMois.length - 1 ? "#ff8a00" : "#0066cc" }))}
              unit=" M"
              height={200}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Mes demandes" subtitle="Répartition par statut" />
          <div className="p-5">
            {demandes.length ? (
              <DonutChart
                centerLabel="demandes"
                data={(Object.keys(STATUTS_DEMANDE) as StatutDemande[])
                  .map((s) => ({ label: STATUTS_DEMANDE[s], value: demandes.filter((d) => d.statut === s).length, color: COULEURS_STATUT[s] }))
                  .filter((d) => d.value > 0)}
              />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">Aucune demande pour le moment.</p>
            )}
          </div>
        </Card>
      </Reveal>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Reveal className="space-y-6">
          <Card>
            <CardHeader
              title="Demandes récentes"
              action={
                <Link href="/client/demandes" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2">
                  Voir tout <ArrowRight className="size-4 transition-all" />
                </Link>
              }
            />
            <div className="space-y-2 p-5">
              {chargement ? (
                <ChargementListe />
              ) : demandes.length ? (
                demandes.slice(0, 4).map((d) => <DemandeRow key={d.id} demande={d} href={`/client/demandes/${d.id}`} />)
              ) : (
                <EmptyState icon={ClipboardList} title="Aucune demande" text="Vos demandes d'intervention apparaîtront ici." />
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-5 bg-gradient-to-r from-brand-700 to-brand-500 p-6 text-white sm:flex-row sm:items-center">
              <span className="w-fit rounded-2xl bg-white/15 p-3">
                <ClipboardList className="size-6" />
              </span>
              <div className="flex-1">
                <p className="text-lg font-bold">Un nouveau besoin ?</p>
                <p className="text-sm text-brand-100">Décrivez vos travaux, les professionnels proches de chez vous vous répondent.</p>
              </div>
              <LinkButton href="/client/demandes/nouvelle" variant="primary">
                Créer une demande
              </LinkButton>
            </div>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.15}>
          {enCours && tech && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900">{enCours.statut === "en_cours" ? "Mission en cours" : "Mission à venir"}</h2>
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-500 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-accent-500" />
                </span>
              </div>
              <p className="mt-3 font-semibold text-slate-800">{enCours.titre}</p>
              <p className="text-sm text-slate-500">
                {enCours.reference}
                {enCours.budget ? ` · ${formatGNF(enCours.budget)}` : ""}
              </p>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <Avatar nom={tech.nom} className="size-10 text-xs" />
                <div className="flex-1">
                  <p className="text-sm font-bold">{tech.nom}</p>
                  <Rating note={tech.note} className="text-xs" />
                </div>
                {tech.telephone && (
                  <>
                    <a href={`tel:+${tech.telephone.replace(/\D/g, "")}`} className="rounded-lg bg-white p-2 text-brand-600 shadow-sm" aria-label="Appeler">
                      <Phone className="size-4" />
                    </a>
                    <a
                      href={`https://wa.me/${tech.telephone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  </>
                )}
              </div>
              <div className="mt-5">
                <Timeline etapes={enCours.chronologie} />
              </div>
              <LinkButton href={`/client/demandes/${enCours.id}`} variant="outline" className="mt-5 w-full">
                Suivre la mission
              </LinkButton>
            </Card>
          )}

          {recommandes.length > 0 && (
            <Card>
              <CardHeader title="Professionnels recommandés" subtitle="Les mieux notés et disponibles" />
              <ul className="space-y-1 p-3">
                {recommandes.map((t) => (
                  <li key={t.id}>
                    <Link href={`/techniciens/${t.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                      <Avatar nom={t.nom} className="size-10 text-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{t.nom}</p>
                        <Rating note={t.note} nbAvis={t.nbAvis} className="text-xs" />
                      </div>
                      {t.niveau >= 1 && <VerificationBadge niveau={t.niveau as Niveau} />}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </Reveal>
      </div>
    </>
  );
}
