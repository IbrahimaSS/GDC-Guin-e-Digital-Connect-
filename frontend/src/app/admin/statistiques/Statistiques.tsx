"use client";

import { Download, Repeat, Smile, Timer, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { BarChart, DonutChart, LineChart, ProgressBar } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import { Button, Card, CardHeader, PageHeader, StatCard } from "@/components/ui";
import { Tabs } from "@/components/ui/interactive";
import { ACTIVITE_SEMAINE, CROISSANCE, JOURS, METIERS, MOIS, REVENUS_MOIS, ZONES_DETAIL } from "@/lib/data";

type Periode = "7j" | "12m";

const ENTONNOIR = [
  { l: "Recherches", v: 12480 },
  { l: "Profils consultés", v: 6210 },
  { l: "Demandes envoyées", v: 1830 },
  { l: "Missions réalisées", v: 1512 },
  { l: "Avis laissés", v: 1104 },
];

export default function Statistiques() {
  const [periode, setPeriode] = useState<Periode>("12m");
  const couleurs = ["#0066cc", "#1a7ae0", "#3d8fe6", "#00b4e6", "#ff8a00", "#ff9d2e", "#94a3b8", "#cbd5e1"];

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
        <StatCard icon={TrendingUp} label="Croissance mensuelle" value={11.4} decimals={1} suffix=" %" tone="green" />
        <StatCard icon={Repeat} label="Clients récurrents" value={38} suffix=" %" tone="blue" />
        <StatCard icon={Timer} label="Délai de réponse (min)" value={42} tone="orange" />
        <StatCard icon={Smile} label="NPS" value={67} tone="violet" />
      </Reveal>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Reveal className="space-y-6">
          <Card>
            <CardHeader
              title={periode === "12m" ? "Croissance des inscriptions" : "Activité de la semaine"}
              subtitle={periode === "12m" ? "Utilisateurs et techniciens cumulés" : "Demandes et missions par jour"}
            />
            <div className="p-5">
              {periode === "12m" ? (
                <LineChart
                  key="12m"
                  labels={MOIS}
                  series={[
                    { name: "Utilisateurs", color: "#0066cc", data: CROISSANCE.utilisateurs },
                    { name: "Techniciens", color: "#ff8a00", data: CROISSANCE.techniciens },
                  ]}
                />
              ) : (
                <LineChart
                  key="7j"
                  labels={JOURS}
                  series={[
                    { name: "Demandes", color: "#0066cc", data: ACTIVITE_SEMAINE.demandes },
                    { name: "Missions", color: "#ff8a00", data: ACTIVITE_SEMAINE.missions },
                  ]}
                />
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Volume de transactions" subtitle="En millions de GNF par mois" />
            <div className="p-5">
              <BarChart data={MOIS.map((m, i) => ({ label: m, value: REVENUS_MOIS[i], color: i === MOIS.length - 1 ? "#ff8a00" : "#0066cc" }))} unit="M" />
            </div>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card>
            <CardHeader title="Demandes par métier" />
            <div className="p-5">
              <DonutChart centerLabel="demandes" data={METIERS.map((m, i) => ({ label: m.label, value: m.demandes, color: couleurs[i] }))} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Entonnoir de conversion" subtitle="12 derniers mois" />
            <ul className="space-y-3 p-5">
              {ENTONNOIR.map((e) => (
                <li key={e.l}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600">{e.l}</span>
                    <span className="font-bold">{new Intl.NumberFormat("fr-FR").format(e.v)}</span>
                  </div>
                  <ProgressBar value={(e.v / ENTONNOIR[0].v) * 100} color="bg-gradient-to-r from-brand-600 to-sky-brand" />
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>

      <Reveal className="mt-6">
        <Card>
          <CardHeader title="Top zones" subtitle="Classement par nombre de demandes" action={<Users className="size-5 text-brand-600" />} />
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...ZONES_DETAIL]
              .sort((a, b) => b.demandes - a.demandes)
              .slice(0, 4)
              .map((z, i) => (
                <div key={z.nom} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-accent-500">#{i + 1}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{z.nom}</p>
                  <p className="text-sm text-slate-500">
                    {z.demandes} demandes · {z.techniciens} techniciens
                  </p>
                </div>
              ))}
          </div>
        </Card>
      </Reveal>
    </>
  );
}
