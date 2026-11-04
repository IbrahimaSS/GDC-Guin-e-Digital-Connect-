"use client";

import {
  Download,
  Repeat,
  ThumbsUp,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  DonutChart,
  LineChart,
  ProgressBar,
} from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import {
  Button,
  Card,
  CardHeader,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { Tabs } from "@/components/ui/interactive";
import { capitaliser, useStatsAdmin } from "@/lib/admin";
import { apiActive } from "@/lib/api";
import {
  ACTIVITE_SEMAINE,
  CROISSANCE,
  getMetier,
  JOURS,
  METIERS,
  MOIS,
  REVENUS_MOIS,
  ZONES_DETAIL,
} from "@/lib/data";
import { useMetiers } from "@/lib/plateforme";
import { useApi } from "@/lib/useApi";

type Periode = "7j" | "12m";

const ENTONNOIR_DEMO = [
  { l: "Recherches", v: 12480 },
  { l: "Profils consultés", v: 6210 },
  { l: "Demandes envoyées", v: 1830 },
  { l: "Missions réalisées", v: 1512 },
  { l: "Avis laissés", v: 1104 },
];

interface ZoneStats {
  nom: string;
  nbTechniciens: number;
  nbDemandes: number;
}

const zero = (n: number) => Array.from({ length: n }, () => 0);

export default function Statistiques() {
  const [periode, setPeriode] = useState<Periode>("12m");
  const couleurs = [
    "#0066cc",
    "#1a7ae0",
    "#3d8fe6",
    "#00b4e6",
    "#ff8a00",
    "#ff9d2e",
    "#94a3b8",
    "#cbd5e1",
  ];
  useMetiers(); // fait connaître à getMetier() les métiers ajoutés depuis le back-office
  const { donnees: s } = useStatsAdmin();
  const { donnees: zonesApi } = useApi<ZoneStats[]>(
    apiActive ? "/admin/zones" : null,
  );

  // Avec l'API, tout vient des données réelles ; sinon, la maquette.
  const mois = apiActive ? (s?.series.mois.map(capitaliser) ?? MOIS) : MOIS;
  const kpi = apiActive
    ? {
        croissance: s?.croissanceMensuelle ?? 0,
        recurrents: s?.clientsRecurrents ?? 0,
        delai: s?.missions.delaiReponseMinutes ?? 0,
        recommandation: s?.recommandation ?? 0,
      }
    : { croissance: 11.4, recurrents: 38, delai: 42, recommandation: 92 };
  const croissance = apiActive
    ? {
        utilisateurs: s?.series.utilisateurs ?? zero(mois.length),
        techniciens: s?.series.techniciens ?? zero(mois.length),
      }
    : CROISSANCE;
  const semaine = apiActive
    ? {
        jours: s?.series.jours.map(capitaliser) ?? JOURS,
        demandes: s?.series.demandesJour ?? zero(7),
        missions: s?.series.missionsJour ?? zero(7),
      }
    : { jours: JOURS, ...ACTIVITE_SEMAINE };
  // Volume en millions de GNF, arrondi au dixième
  const volume = apiActive
    ? (s?.series.volume ?? zero(mois.length)).map(
        (v) => Math.round(v / 100_000) / 10,
      )
    : REVENUS_MOIS;
  const parMetier = apiActive
    ? Object.entries(s?.demandesParMetier ?? {})
        .sort((a, b) => b[1] - a[1])
        .map(([id, v]) => ({ label: getMetier(id as never).label, value: v }))
    : METIERS.map((m) => ({ label: m.label, value: m.demandes }));
  const entonnoir = apiActive
    ? [
        { l: "Demandes envoyées", v: s?.entonnoir.demandes ?? 0 },
        { l: "Demandes acceptées", v: s?.entonnoir.acceptees ?? 0 },
        { l: "Missions réalisées", v: s?.entonnoir.terminees ?? 0 },
        { l: "Avis laissés", v: s?.entonnoir.avis ?? 0 },
      ]
    : ENTONNOIR_DEMO;
  const topZones = (
    apiActive
      ? (zonesApi ?? []).map((z) => ({
          nom: z.nom,
          demandes: z.nbDemandes,
          techniciens: z.nbTechniciens,
        }))
      : ZONES_DETAIL
  )
    .filter((z) => z.demandes > 0)
    .sort((a, b) => b.demandes - a.demandes)
    .slice(0, 4);

  return (
    <>
      <PageHeader
        title="Statistiques"
        subtitle="Indicateurs clés de croissance et d'impact de GDC."
        actions={
          <>
            <Tabs<Periode>
              value={periode}
              onChange={setPeriode}
              variant="pill"
              tabs={[
                { id: "7j", label: "7 jours" },
                { id: "12m", label: "12 mois" },
              ]}
            />
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="size-4" /> Rapport
            </Button>
          </>
        }
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Croissance mensuelle"
          value={kpi.croissance}
          decimals={1}
          suffix=" %"
          tone="green"
        />
        <StatCard
          icon={Repeat}
          label="Clients récurrents"
          value={kpi.recurrents}
          suffix=" %"
          tone="blue"
        />
        <StatCard
          icon={Timer}
          label="Délai de réponse (min)"
          value={kpi.delai}
          tone="orange"
        />
        <StatCard
          icon={ThumbsUp}
          label="Clients qui recommandent"
          value={kpi.recommandation}
          suffix=" %"
          tone="violet"
        />
      </Reveal>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Reveal className="space-y-6">
          <Card>
            <CardHeader
              title={
                periode === "12m"
                  ? "Croissance des inscriptions"
                  : "Activité de la semaine"
              }
              subtitle={
                periode === "12m"
                  ? "Utilisateurs et techniciens cumulés"
                  : "Demandes et missions par jour"
              }
            />
            <div className="p-5">
              {periode === "12m" ? (
                <LineChart
                  key="12m"
                  labels={mois}
                  series={[
                    {
                      name: "Utilisateurs",
                      color: "#0066cc",
                      data: croissance.utilisateurs,
                    },
                    {
                      name: "Techniciens",
                      color: "#ff8a00",
                      data: croissance.techniciens,
                    },
                  ]}
                />
              ) : (
                <LineChart
                  key="7j"
                  labels={semaine.jours}
                  series={[
                    {
                      name: "Demandes",
                      color: "#0066cc",
                      data: semaine.demandes,
                    },
                    {
                      name: "Missions",
                      color: "#ff8a00",
                      data: semaine.missions,
                    },
                  ]}
                />
              )}
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Volume de transactions"
              subtitle="En millions de GNF par mois"
            />
            <div className="p-5">
              <BarChart
                data={mois.map((m, i) => ({
                  label: m,
                  value: volume[i] ?? 0,
                  color: i === mois.length - 1 ? "#ff8a00" : "#0066cc",
                }))}
                unit="M"
              />
            </div>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card>
            <CardHeader title="Demandes par métier" />
            <div className="p-5">
              {parMetier.length ? (
                <DonutChart
                  centerLabel="demandes"
                  data={parMetier.map((m, i) => ({
                    ...m,
                    color: couleurs[i % couleurs.length],
                  }))}
                />
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">
                  Aucune demande pour le moment.
                </p>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Entonnoir de conversion"
              subtitle={
                apiActive
                  ? "De la demande à l’avis, 12 derniers mois"
                  : "12 derniers mois"
              }
            />
            <ul className="space-y-3 p-5">
              {entonnoir.map((e) => (
                <li key={e.l}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600">{e.l}</span>
                    <span className="font-bold">
                      {new Intl.NumberFormat("fr-FR").format(e.v)}
                    </span>
                  </div>
                  <ProgressBar
                    value={entonnoir[0].v ? (e.v / entonnoir[0].v) * 100 : 0}
                    color="bg-gradient-to-r from-brand-600 to-sky-brand"
                  />
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>

      <Reveal className="mt-6">
        <Card>
          <CardHeader
            title="Top zones"
            subtitle="Classement par nombre de demandes"
            action={<Users className="size-5 text-brand-600" />}
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {topZones.length === 0 && (
              <p className="text-sm text-slate-500">
                Aucune demande pour le moment.
              </p>
            )}
            {topZones.map((z, i) => (
              <div key={z.nom} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-accent-500">#{i + 1}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{z.nom}</p>
                <p className="text-sm text-slate-500">
                  {z.demandes} demande{z.demandes > 1 ? "s" : ""} ·{" "}
                  {z.techniciens} technicien{z.techniciens > 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>
    </>
  );
}
