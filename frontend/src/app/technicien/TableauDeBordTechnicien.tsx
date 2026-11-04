"use client";

import { ArrowRight, BellRing, CalendarCheck, CheckCircle2, Clock, Eye, Hourglass, ShieldCheck, Wallet, Wrench } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { LineChart, ProgressBar } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import ChargementListe from "@/components/shared/ChargementListe";
import DemandeRow from "@/components/shared/DemandeRow";
import { Badge, Card, CardHeader, EmptyState, LinkButton, PageHeader, StatCard } from "@/components/ui";
import { apiActive } from "@/lib/api";
import { formatGNF, JOURS, NIVEAUX, TECHNICIEN_CONNECTE, type Demande, type Niveau } from "@/lib/data";
import { useDemandesRecues } from "@/lib/missions";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/useApi";

const AGENDA_DEMO = [
  { id: "a1", heure: "10h00", titre: "Réparation de climatisation", lieu: "Kaloum · Almamya", statut: "En cours" },
  { id: "a2", heure: "14h30", titre: "Devis tableau électrique", lieu: "Dixinn · Port", statut: "À venir" },
  { id: "a3", heure: "17h00", titre: "Contrôle installation", lieu: "Matam · Bonfi", statut: "À venir" },
];

interface Statistiques {
  note: number;
  nbAvis: number;
  niveau: number;
  missions: Partial<Record<"ACCEPTEE" | "EN_COURS" | "TERMINEE" | "ANNULEE", number>>;
  gains: number;
  gainsEnAttente: number;
}

interface VerificationApi {
  niveau: number;
  statut: "EN_ATTENTE" | "EN_COURS" | "APPROUVEE" | "REFUSEE";
}

/** Demandes reçues et missions terminées sur les 7 derniers jours (lundi → dimanche glissant). */
function activite(demandes: Demande[]) {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const jours = Array.from({ length: 7 }, (_, i) => new Date(aujourdhui.getTime() - (6 - i) * 86_400_000));
  const memeJour = (iso: string | null | undefined, j: Date) => Boolean(iso) && new Date(iso!).toDateString() === j.toDateString();
  return {
    labels: jours.map((j) => {
      const l = j.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
      return l.charAt(0).toUpperCase() + l.slice(1);
    }),
    recues: jours.map((j) => demandes.filter((d) => memeJour(d.api?.creeLe, j)).length),
    terminees: jours.map((j) => demandes.filter((d) => memeJour(d.api?.termineeLe, j)).length),
  };
}

const sansAbonnement = () => () => {};
const dateDuJour = () => new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export default function TableauDeBordTechnicien() {
  const session = useSession();
  const { demandes, chargement } = useDemandesRecues();
  const stats = useApi<Statistiques>(apiActive ? "/techniciens/moi/statistiques" : null).donnees;
  const verifications = useApi<VerificationApi[]>(apiActive ? "/verifications" : null).donnees;
  const aujourdhui = useSyncExternalStore(sansAbonnement, dateDuJour, () => "");

  const profil = session?.utilisateur.technicien;
  const prenom = apiActive ? (session?.utilisateur.prenom ?? "") : TECHNICIEN_CONNECTE.nom.split(" ")[0];
  const niveau = apiActive ? (stats?.niveau ?? profil?.niveau ?? 0) : TECHNICIEN_CONNECTE.niveau;
  const disponible = apiActive ? (profil?.disponible ?? true) : true;
  const nouvelles = demandes.filter((d) => d.statut === "envoyee");
  const enAttente = demandes.filter((d) => d.statut === "acceptee").length;
  const actives = demandes.filter((d) => d.statut === "en_cours").length;
  const terminees = apiActive ? (stats?.missions.TERMINEE ?? 0) : TECHNICIEN_CONNECTE.missions;
  const dossier = verifications?.find((v) => v.statut === "EN_ATTENTE" || v.statut === "EN_COURS");
  // Graphique calculé dans le navigateur uniquement (dates du jour).
  const semaine = apiActive && aujourdhui ? activite(demandes) : null;
  const agenda = apiActive
    ? demandes
        .filter((d) => d.statut === "acceptee" || d.statut === "en_cours")
        .map((d) => ({ id: d.id, heure: d.statut === "en_cours" ? "En cours" : "À venir", titre: d.titre, lieu: `${d.zone} · ${d.adresse}`, statut: d.creneau }))
    : AGENDA_DEMO;

  return (
    <>
      <PageHeader
        eyebrow="Espace technicien"
        title={`Bonjour${prenom && `, ${prenom}`} !`}
        subtitle="Voici votre activité du jour."
        actions={
          <>
            <Badge tone={disponible ? "green" : "slate"} dot className="py-1.5">
              {disponible ? "Disponible" : "Indisponible"}
            </Badge>
            <LinkButton href="/technicien/demandes" size="lg">
              <BellRing className="size-4" /> {nouvelles.length} nouvelle{nouvelles.length > 1 ? "s" : ""} demande{nouvelles.length > 1 ? "s" : ""}
            </LinkButton>
          </>
        }
      />

      {apiActive && niveau < 1 && (
        <Card className="mb-6 flex flex-col gap-3 border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
          <ShieldCheck className="size-6 shrink-0 text-amber-600" />
          <p className="flex-1 text-sm text-amber-800">
            {dossier
              ? "Votre pièce d'identité est en cours de vérification par l'équipe GDC. Vous pourrez accepter des missions dès qu'elle sera validée."
              : "Envoyez votre pièce d'identité pour être visible des clients et accepter des missions."}
          </p>
          <LinkButton href={dossier ? "/technicien/verification/suivi" : "/technicien/verification"} size="sm" variant="outline">
            {dossier ? "Suivre" : "Envoyer"}
          </LinkButton>
        </Card>
      )}

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BellRing} label="Nouvelles demandes" value={nouvelles.length} tone="blue" />
        <StatCard icon={Hourglass} label="À démarrer" value={apiActive ? enAttente : 2} tone="orange" />
        <StatCard icon={Wrench} label="Missions actives" value={apiActive ? actives : 3} tone="violet" />
        <StatCard icon={CheckCircle2} label="Missions terminées" value={terminees} tone="green" />
      </Reveal>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Reveal className="space-y-6">
          <Card>
            <CardHeader title="Activité de la semaine" subtitle="Demandes reçues et missions réalisées" />
            <div className="p-5">
              <LineChart
                labels={semaine?.labels ?? JOURS}
                series={[
                  { name: "Demandes reçues", color: "#0066cc", data: semaine?.recues ?? (apiActive ? [0, 0, 0, 0, 0, 0, 0] : [3, 5, 4, 7, 6, 8, 2]) },
                  { name: "Missions réalisées", color: "#ff8a00", data: semaine?.terminees ?? (apiActive ? [0, 0, 0, 0, 0, 0, 0] : [2, 3, 3, 5, 4, 6, 1]) },
                ]}
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Demandes récentes"
              action={
                <Link href="/technicien/demandes" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2">
                  Voir tout <ArrowRight className="size-4 transition-all" />
                </Link>
              }
            />
            <div className="space-y-2 p-5">
              {chargement ? (
                <ChargementListe />
              ) : demandes.length ? (
                demandes.slice(0, 4).map((d) => <DemandeRow key={d.id} demande={d} vue="technicien" href={`/technicien/missions/${d.id}`} />)
              ) : (
                <EmptyState icon={BellRing} title="Aucune demande pour l'instant" text="Les demandes de votre métier et de vos zones apparaîtront ici." />
              )}
            </div>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.15}>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="size-5" /> Votre niveau de vérification
                </p>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">Niveau {niveau}</span>
              </div>
              <p className="mt-3 text-sm text-brand-100">
                {niveau >= 1 ? NIVEAUX[Math.min(3, niveau) as Niveau].label : "Identité à vérifier"}
                {apiActive ? (dossier ? ` · dossier niveau ${dossier.niveau} en cours d'examen` : "") : " · dossier niveau 3 en cours d'évaluation"}
              </p>
              <div className="mt-4">
                <ProgressBar value={Math.round((Math.min(3, niveau) / 3) * 100)} color="bg-accent-500" className="h-2.5 bg-white/20" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-brand-100">
                <span>Identité</span>
                <span>Compétence</span>
                <span>Recommandé</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-slate-600">{niveau >= 3 ? "Niveau maximal atteint" : `Prochaine étape : niveau ${niveau + 1}`}</span>
              <LinkButton href={dossier || !apiActive ? "/technicien/verification/suivi" : "/technicien/verification"} variant="outline" size="sm">
                {dossier || !apiActive ? "Suivre" : niveau >= 3 ? "Voir" : "Demander"}
              </LinkButton>
            </div>
          </Card>

          <Card>
            <CardHeader title="Agenda" subtitle={apiActive ? "Missions acceptées et en cours" : aujourdhui} action={<CalendarCheck className="size-5 text-brand-600" />} />
            {agenda.length ? (
              <ol className="space-y-3 p-5">
                {agenda.map((a) => (
                  <li key={a.id}>
                    <Link href={apiActive ? `/technicien/missions/${a.id}` : "/technicien/demandes"} className="flex gap-3">
                      <span className="w-16 shrink-0 pt-0.5 text-sm font-bold text-brand-700">{a.heure}</span>
                      <div className="flex-1 rounded-xl border-l-4 border-accent-500 bg-slate-50 p-3 transition hover:bg-slate-100">
                        <p className="text-sm font-semibold text-slate-900">{a.titre}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="size-3 shrink-0" /> {a.lieu} · {a.statut}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="p-5 text-sm text-slate-400">Aucune mission prévue pour l&apos;instant.</p>
            )}
          </Card>

          {apiActive ? (
            <Card className="flex items-center gap-4 p-5">
              <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <Wallet className="size-6" />
              </span>
              <div className="flex-1">
                <p className="text-2xl font-extrabold text-slate-900">{formatGNF(stats?.gains ?? 0)}</p>
                <p className="text-sm text-slate-500">
                  gagnés sur GDC{stats?.gainsEnAttente ? ` · dont ${formatGNF(stats.gainsEnAttente)} versés à la fin des missions en cours` : ""}
                </p>
              </div>
            </Card>
          ) : (
            <Card className="flex items-center gap-4 p-5">
              <span className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                <Eye className="size-6" />
              </span>
              <div className="flex-1">
                <p className="text-2xl font-extrabold text-slate-900">48</p>
                <p className="text-sm text-slate-500">vues de votre profil cette semaine</p>
              </div>
              <Link href={`/techniciens/${TECHNICIEN_CONNECTE.id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                Voir
              </Link>
            </Card>
          )}
        </Reveal>
      </div>
    </>
  );
}
