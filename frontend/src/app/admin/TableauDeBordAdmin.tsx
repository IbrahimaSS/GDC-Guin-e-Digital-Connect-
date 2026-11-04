"use client";

import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  Flag,
  MessageSquareText,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
  UserX,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { DonutChart, LineChart, ProgressBar } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import { StatutVerificationBadge } from "@/components/shared/status";
import { Avatar, Card, CardHeader, cn, LinkButton, MetierIcon, StatCard } from "@/components/ui";
import { capitaliser, ilYa, useStatsAdmin } from "@/lib/admin";
import { apiActive } from "@/lib/api";
import { ACTIVITE_SEMAINE, getTechnicien, JOURS, METIERS, SIGNALEMENTS, STATS_ADMIN, VERIFICATIONS, type MetierId, type StatutVerification } from "@/lib/data";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/useApi";

const ACTIVITE_DEMO: { icon: LucideIcon; ton: string; texte: string; date: string }[] = [
  { icon: UserCheck, ton: "from-emerald-400 to-emerald-600", texte: "Ibrahima Camara a obtenu le niveau 2", date: "Il y a 12 min" },
  { icon: ClipboardList, ton: "from-brand-500 to-brand-700", texte: "Nouvelle demande #1027 à Dixinn (urgent)", date: "Il y a 25 min" },
  { icon: Flag, ton: "from-rose-400 to-red-600", texte: "Signalement : profil suspect (Sékou Bah)", date: "Il y a 1 h" },
  { icon: Users, ton: "from-violet-400 to-violet-600", texte: "18 nouveaux utilisateurs aujourd'hui", date: "Il y a 2 h" },
  { icon: BriefcaseBusiness, ton: "from-accent-400 to-accent-600", texte: "Mission #1015 terminée et évaluée 5★", date: "Il y a 3 h" },
];

/** Icône et couleur de chaque type d'événement de l'activité récente. */
const EVENEMENTS: Record<string, { icon: LucideIcon; ton: string }> = {
  verification_approuvee: { icon: UserCheck, ton: "from-emerald-400 to-emerald-600" },
  verification_refusee: { icon: UserX, ton: "from-slate-400 to-slate-600" },
  demande: { icon: ClipboardList, ton: "from-brand-500 to-brand-700" },
  mission_terminee: { icon: BriefcaseBusiness, ton: "from-accent-400 to-accent-600" },
  avis: { icon: Star, ton: "from-amber-400 to-amber-600" },
  signalement: { icon: Flag, ton: "from-rose-400 to-red-600" },
};

interface VerificationApi {
  id: string;
  niveau: number;
  statut: "EN_ATTENTE" | "EN_COURS" | "APPROUVEE" | "REFUSEE";
  technicien: { nom: string; photoUrl: string | null };
}

interface SignalementApi {
  id: string;
  type: string;
  cibleLibelle: string;
  priorite: string;
}

interface MetierApi {
  id: string;
  label: string;
  nbTechniciens: number;
}

const sansAbonnement = () => () => {};
const dateDuJour = () => new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export default function TableauDeBordAdmin() {
  const session = useSession();
  const stats = useStatsAdmin().donnees;
  const verifsApi = useApi<VerificationApi[]>(apiActive ? "/admin/verifications" : null).donnees;
  const signalementsApi = useApi<SignalementApi[]>(apiActive ? "/admin/signalements?statut=OUVERT" : null).donnees;
  const metiersApi = useApi<MetierApi[]>(apiActive ? "/admin/metiers" : null).donnees;
  const aujourdhui = useSyncExternalStore(sansAbonnement, dateDuJour, () => "");

  // Éléments à traiter : vérifications en attente et signalements ouverts.
  const enAttente = apiActive
    ? (verifsApi ?? [])
        .filter((v) => v.statut === "EN_ATTENTE" || v.statut === "EN_COURS")
        .map((v) => ({ id: v.id, nom: v.technicien.nom, photo: v.technicien.photoUrl ?? undefined, niveau: v.niveau, statut: v.statut.toLowerCase() as StatutVerification }))
    : VERIFICATIONS.filter((v) => v.statut === "en_attente" || v.statut === "en_cours").map((v) => ({
        id: v.id,
        nom: getTechnicien(v.technicienId)!.nom,
        photo: undefined,
        niveau: v.niveau,
        statut: v.statut,
      }));
  const ouverts = apiActive
    ? (signalementsApi ?? []).map((s) => ({ id: s.id, type: s.type === "avis" ? "Avis signalé" : capitaliser(s.type), cible: s.cibleLibelle, priorite: s.priorite }))
    : SIGNALEMENTS.filter((x) => x.statut === "ouvert").map((x) => ({ id: x.id, type: x.type, cible: x.cible, priorite: x.priorite }));
  const metiers = apiActive
    ? (metiersApi ?? []).map((m) => ({ id: m.id, label: m.label, techniciens: m.nbTechniciens })).sort((a, b) => b.techniciens - a.techniciens)
    : [...METIERS].sort((a, b) => b.techniciens - a.techniciens);
  const maxMetier = Math.max(1, ...metiers.map((m) => m.techniciens));

  const S = apiActive
    ? {
        utilisateurs: stats ? stats.utilisateurs.clients + stats.utilisateurs.techniciens + stats.utilisateurs.admins : 0,
        techniciens: stats?.utilisateurs.techniciens ?? 0,
        demandes: stats?.demandes7j ?? 0,
        verificationsEnAttente: stats?.verificationsEnAttente ?? 0,
      }
    : STATS_ADMIN;
  const aTraiter = apiActive ? S.verificationsEnAttente + (stats?.avisAModerer ?? 0) + (stats?.signalementsOuverts ?? 0) : 7;
  const raccourcis: { href: string; icon: LucideIcon; label: string; badge?: number }[] = [
    { href: "/admin/verifications", icon: ShieldCheck, label: "Vérifications", badge: apiActive ? S.verificationsEnAttente : 3 },
    { href: "/admin/avis", icon: MessageSquareText, label: "Avis à modérer", badge: apiActive ? stats?.avisAModerer : 2 },
    { href: "/admin/signalements", icon: Flag, label: "Signalements", badge: apiActive ? stats?.signalementsOuverts : 2 },
    { href: "/admin/statistiques", icon: BarChart3, label: "Statistiques" },
  ];
  const verifs = apiActive
    ? [
        { label: "Approuvées", value: stats?.verificationsParStatut.APPROUVEE ?? 0, color: "#10b981" },
        { label: "En cours", value: stats?.verificationsParStatut.EN_COURS ?? 0, color: "#0066cc" },
        { label: "En attente", value: stats?.verificationsParStatut.EN_ATTENTE ?? 0, color: "#ff8a00" },
        { label: "Refusées", value: stats?.verificationsParStatut.REFUSEE ?? 0, color: "#ef4444" },
      ]
    : [
        { label: "Approuvées", value: 124, color: "#10b981" },
        { label: "En cours", value: 38, color: "#0066cc" },
        { label: "En attente", value: 24, color: "#ff8a00" },
        { label: "Refusées", value: 11, color: "#ef4444" },
      ];
  const activite = apiActive
    ? (stats?.activite ?? []).map((e) => ({ ...(EVENEMENTS[e.type] ?? EVENEMENTS.demande), texte: e.texte, date: ilYa(e.date) }))
    : ACTIVITE_DEMO;
  const prenom = apiActive ? (session?.utilisateur.prenom ?? "") : "Aïssatou";

  return (
    <>
      {/* Bandeau d'accueil */}
      <Reveal className="mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-sky-brand p-6 text-white shadow-xl shadow-brand-900/20 md:p-8">
          <div className="absolute -right-20 -top-24 size-80 rounded-full bg-sky-brand/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-accent-500/25 blur-3xl" aria-hidden />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }}
            aria-hidden
          />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-100/80">Back-office{aujourdhui && ` · ${aujourdhui}`}</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">Bonjour{prenom && `, ${prenom}`}</h1>
              <p className="mt-1 max-w-xl text-brand-100">
                {aTraiter ? (
                  <>
                    <strong className="text-white">
                      {aTraiter} élément{aTraiter > 1 ? "s" : ""}
                    </strong>{" "}
                    {aTraiter > 1 ? "attendent" : "attend"} votre validation.
                  </>
                ) : (
                  "Tout est à jour : aucun élément en attente."
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              {raccourcis.map(({ href, icon: Icon, label, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className="group relative flex items-center gap-2.5 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold ring-1 ring-inset ring-white/15 backdrop-blur transition-colors hover:bg-white/20"
                >
                  <Icon className="size-4 text-accent-400 transition-transform group-hover:scale-110" />
                  {label}
                  {badge ? <span className="ml-auto rounded-full bg-accent-500 px-1.5 text-[11px] font-bold">{badge}</span> : null}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Indicateurs principaux */}
      <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" stagger={0.06}>
        <StatCard icon={Users} label="Utilisateurs" value={S.utilisateurs} />
        <StatCard icon={Wrench} label="Techniciens" value={S.techniciens} tone="orange" />
        <StatCard icon={ClipboardList} label="Demandes (7 j)" value={S.demandes} tone="violet" />
        <StatCard icon={ShieldCheck} label="Vérifications à traiter" value={S.verificationsEnAttente} tone="amber" />
      </Reveal>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <Reveal className="space-y-6">
          <Card>
            <CardHeader
              title="Activité sur 7 jours"
              subtitle="Demandes créées et missions réalisées"
              action={
                <LinkButton href="/admin/statistiques" variant="ghost" size="sm">
                  Détails <ArrowRight className="size-3.5" />
                </LinkButton>
              }
            />
            <div className="p-5">
              <LineChart
                labels={apiActive ? (stats?.series.jours.map(capitaliser) ?? JOURS) : JOURS}
                series={[
                  { name: "Demandes", color: "#0066cc", data: apiActive ? (stats?.series.demandesJour ?? [0, 0, 0, 0, 0, 0, 0]) : ACTIVITE_SEMAINE.demandes },
                  { name: "Missions", color: "#ff8a00", data: apiActive ? (stats?.series.missionsJour ?? [0, 0, 0, 0, 0, 0, 0]) : ACTIVITE_SEMAINE.missions },
                ]}
              />
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Techniciens par métier" subtitle={apiActive ? "Techniciens vérifiés et actifs" : `${S.techniciens} professionnels inscrits`} />
              <ul className="space-y-3.5 p-5">
                {metiers.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <span className="rounded-lg bg-accent-50 p-1.5 text-accent-500">
                      <MetierIcon metier={m.id as MetierId} className="size-4" />
                    </span>
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{m.label}</span>
                        <span className="font-bold text-slate-900">{m.techniciens}</span>
                      </div>
                      <ProgressBar value={(m.techniciens / maxMetier) * 100} color="bg-gradient-to-r from-brand-600 to-sky-brand" className="h-1.5" />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title="Vérifications" subtitle={apiActive ? "Statut de tous les dossiers" : "Statut des dossiers ce mois-ci"} />
              <div className="p-5">
                {verifs.some((v) => v.value) ? (
                  <DonutChart centerLabel="dossiers" data={verifs.filter((v) => v.value)} />
                ) : (
                  <p className="py-10 text-center text-sm text-slate-400">Aucun dossier pour l&apos;instant.</p>
                )}
              </div>
            </Card>
          </div>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card>
            <CardHeader
              title="À traiter en priorité"
              subtitle={`${enAttente.length + ouverts.length} élément${enAttente.length + ouverts.length > 1 ? "s" : ""}`}
              action={
                <Link href="/admin/verifications" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2">
                  Tout voir <ArrowRight className="size-4 transition-all" />
                </Link>
              }
            />
            <ul className="space-y-1 p-3">
              {enAttente.length + ouverts.length === 0 && <li className="p-3 text-sm text-slate-400">Rien à traiter pour l&apos;instant.</li>}
              {enAttente.map((v) => (
                <li key={v.id}>
                  <Link href="/admin/verifications" className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50">
                    <Avatar nom={v.nom} photo={v.photo} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{v.nom}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <BadgeCheck className="size-3" /> Niveau {v.niveau} demandé
                      </p>
                    </div>
                    <StatutVerificationBadge statut={v.statut} />
                  </Link>
                </li>
              ))}
              {ouverts.map((x) => (
                <li key={x.id}>
                  <Link href="/admin/signalements" className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-red-50/60">
                    <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-red-600 text-white">
                      <Flag className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{x.type}</p>
                      <p className="truncate text-xs text-slate-500">{x.cible}</p>
                    </div>
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase text-red-600">{x.priorite}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Activité récente" />
            {activite.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">Aucune activité pour l&apos;instant.</p>
            ) : (
              <ol className="relative space-y-5 p-5">
                <span className="absolute bottom-8 left-[37px] top-8 w-px bg-slate-200" aria-hidden />
                {activite.map(({ icon: Icon, ton, texte, date }, i) => (
                  <li key={`${texte}-${i}`} className="relative flex items-start gap-3">
                    <span className={cn("relative z-10 rounded-xl bg-gradient-to-br p-2 text-white shadow-md", ton)}>
                      <Icon className="size-4" />
                    </span>
                    <div className="pt-0.5">
                      <p className="text-sm font-medium text-slate-800">{texte}</p>
                      <p className="text-xs text-slate-400">{date}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </Reveal>
      </div>
    </>
  );
}
