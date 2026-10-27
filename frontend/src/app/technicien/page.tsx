import { ArrowRight, BellRing, CalendarCheck, CheckCircle2, Clock, Eye, Hourglass, ShieldCheck, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LineChart, ProgressBar } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import DemandeRow from "@/components/shared/DemandeRow";
import { Badge, Card, CardHeader, LinkButton, PageHeader, StatCard } from "@/components/ui";
import { DEMANDES_RECUES, JOURS, NIVEAUX, TECHNICIEN_CONNECTE as moi } from "@/lib/data";

export const metadata: Metadata = { title: "Tableau de bord technicien" };

const AGENDA = [
  { heure: "10h00", titre: "Réparation de climatisation", lieu: "Kaloum · Almamya", statut: "En cours" },
  { heure: "14h30", titre: "Devis tableau électrique", lieu: "Dixinn · Port", statut: "À venir" },
  { heure: "17h00", titre: "Contrôle installation", lieu: "Matam · Bonfi", statut: "À venir" },
];

export default function TechnicienDashboard() {
  const nouvelles = DEMANDES_RECUES.filter((d) => d.statut === "envoyee");

  return (
    <>
      <PageHeader
        eyebrow="Espace technicien"
        title={`Bonjour, ${moi.nom.split(" ")[0]} !`}
        subtitle="Voici votre activité du jour."
        actions={
          <>
            <Badge tone="green" dot className="py-1.5">
              Disponible
            </Badge>
            <LinkButton href="/technicien/demandes" size="lg">
              <BellRing className="size-4" /> {nouvelles.length} nouvelles demandes
            </LinkButton>
          </>
        }
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BellRing} label="Nouvelles demandes" value={nouvelles.length} tone="blue" />
        <StatCard icon={Hourglass} label="En attente" value={2} tone="orange" />
        <StatCard icon={Wrench} label="Missions actives" value={3} tone="violet" />
        <StatCard icon={CheckCircle2} label="Missions terminées" value={moi.missions} tone="green" />
      </Reveal>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Reveal className="space-y-6">
          <Card>
            <CardHeader title="Activité de la semaine" subtitle="Demandes reçues et missions réalisées" />
            <div className="p-5">
              <LineChart
                labels={JOURS}
                series={[
                  { name: "Demandes reçues", color: "#0066cc", data: [3, 5, 4, 7, 6, 8, 2] },
                  { name: "Missions réalisées", color: "#ff8a00", data: [2, 3, 3, 5, 4, 6, 1] },
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
              {DEMANDES_RECUES.slice(0, 4).map((d) => (
                <DemandeRow key={d.id} demande={d} vue="technicien" href={`/technicien/missions/${d.id}`} />
              ))}
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
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">Niveau {moi.niveau}</span>
              </div>
              <p className="mt-3 text-sm text-brand-100">
                {NIVEAUX[moi.niveau].label} · dossier niveau 3 en cours d&apos;évaluation
              </p>
              <div className="mt-4">
                <ProgressBar value={66} color="bg-accent-500" className="h-2.5 bg-white/20" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-brand-100">
                <span>Identité</span>
                <span>Compétence</span>
                <span>Recommandé</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-slate-600">Prochaine étape : niveau 3</span>
              <LinkButton href="/technicien/verification/suivi" variant="outline" size="sm">
                Suivre
              </LinkButton>
            </div>
          </Card>

          <Card>
            <CardHeader title="Agenda du jour" subtitle="Jeudi 22 octobre" action={<CalendarCheck className="size-5 text-brand-600" />} />
            <ol className="space-y-3 p-5">
              {AGENDA.map((a) => (
                <li key={a.heure} className="flex gap-3">
                  <span className="w-12 shrink-0 pt-0.5 text-sm font-bold text-brand-700">{a.heure}</span>
                  <div className="flex-1 rounded-xl border-l-4 border-accent-500 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{a.titre}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="size-3" /> {a.lieu} · {a.statut}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="flex items-center gap-4 p-5">
            <span className="rounded-2xl bg-violet-50 p-3 text-violet-600">
              <Eye className="size-6" />
            </span>
            <div className="flex-1">
              <p className="text-2xl font-extrabold text-slate-900">48</p>
              <p className="text-sm text-slate-500">vues de votre profil cette semaine</p>
            </div>
            <Link href={`/techniciens/${moi.id}`} className="text-sm font-semibold text-brand-600 hover:underline">
              Voir
            </Link>
          </Card>
        </Reveal>
      </div>
    </>
  );
}
