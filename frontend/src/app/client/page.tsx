import { ArrowRight, CheckCircle2, ClipboardList, Hourglass, MessageCircle, Phone, PlusCircle, Wallet, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart, DonutChart } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import DemandeRow from "@/components/shared/DemandeRow";
import Timeline from "@/components/shared/Timeline";
import { Avatar, Card, CardHeader, LinkButton, Rating, StatCard, VerificationBadge } from "@/components/ui";
import { CLIENT_CONNECTE, DEMANDES, DEPENSES_CLIENT, formatGNF, getTechnicien, STATUTS_DEMANDE, TECHNICIENS, type StatutDemande } from "@/lib/data";

const COULEURS_STATUT: Record<StatutDemande, string> = {
  envoyee: "#f59e0b",
  acceptee: "#0066cc",
  en_cours: "#ff8a00",
  terminee: "#10b981",
  annulee: "#94a3b8",
};

export const metadata: Metadata = { title: "Tableau de bord client" };

export default function ClientDashboard() {
  const enCours = DEMANDES.find((d) => d.statut === "en_cours")!;
  const tech = getTechnicien(enCours.technicienId!)!;
  const recommandes = TECHNICIENS.filter((t) => t.niveau >= 2).slice(1, 4);
  const depenses = DEMANDES.filter((d) => d.statut === "terminee").reduce((s, d) => s + (d.budget ?? 0), 0);

  return (
    <>
      {/* Bandeau d'accueil */}
      <Reveal className="mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-sky-brand p-6 text-white shadow-xl shadow-brand-900/20 md:p-8">
          <div className="absolute -right-16 -top-20 size-72 rounded-full bg-white/10" aria-hidden />
          <div className="absolute -bottom-24 right-40 size-56 rounded-full bg-accent-500/30 blur-2xl" aria-hidden />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">Espace client · jeudi 22 octobre</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">Bonjour, {CLIENT_CONNECTE.prenom} !</h1>
              <p className="mt-1 max-w-xl text-brand-100">
                Vous avez <strong className="text-white">1 mission en cours</strong> et <strong className="text-white">2 demandes</strong> en attente de réponse.
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
        <StatCard icon={Hourglass} label="Demandes en cours" value={DEMANDES.filter((d) => ["envoyee", "acceptee"].includes(d.statut)).length} tone="orange" />
        <StatCard icon={Wrench} label="Missions actives" value={DEMANDES.filter((d) => d.statut === "en_cours").length} tone="blue" />
        <StatCard icon={CheckCircle2} label="Missions terminées" value={DEMANDES.filter((d) => d.statut === "terminee").length} tone="green" />
        <StatCard icon={Wallet} label="Dépensé (GNF)" value={depenses} tone="violet" />
      </Reveal>

      <Reveal className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]" delay={0.1}>
        <Card>
          <CardHeader title="Mes dépenses" subtitle="Montants des interventions réglées, en millions de GNF" />
          <div className="p-5">
            <BarChart
              data={DEPENSES_CLIENT.map((d, i) => ({ label: d.mois, value: d.montant, color: i === DEPENSES_CLIENT.length - 1 ? "#ff8a00" : "#0066cc" }))}
              unit=" M"
              height={200}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Mes demandes" subtitle="Répartition par statut" />
          <div className="p-5">
            <DonutChart
              centerLabel="demandes"
              data={(Object.keys(STATUTS_DEMANDE) as StatutDemande[])
                .map((s) => ({ label: STATUTS_DEMANDE[s], value: DEMANDES.filter((d) => d.statut === s).length, color: COULEURS_STATUT[s] }))
                .filter((d) => d.value > 0)}
            />
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
              {DEMANDES.slice(0, 4).map((d) => (
                <DemandeRow key={d.id} demande={d} href={`/client/demandes/${d.id}`} />
              ))}
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
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Mission en cours</h2>
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-500 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-accent-500" />
              </span>
            </div>
            <p className="mt-3 font-semibold text-slate-800">{enCours.titre}</p>
            <p className="text-sm text-slate-500">
              {enCours.reference} · {formatGNF(enCours.budget!)}
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <Avatar nom={tech.nom} className="size-10 text-xs" />
              <div className="flex-1">
                <p className="text-sm font-bold">{tech.nom}</p>
                <Rating note={tech.note} className="text-xs" />
              </div>
              <a href={`tel:${tech.telephone.replace(/\s/g, "")}`} className="rounded-lg bg-white p-2 text-brand-600 shadow-sm" aria-label="Appeler">
                <Phone className="size-4" />
              </a>
              <a href="#" className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm" aria-label="WhatsApp">
                <MessageCircle className="size-4" />
              </a>
            </div>
            <div className="mt-5">
              <Timeline etapes={enCours.chronologie} />
            </div>
            <LinkButton href={`/client/demandes/${enCours.id}`} variant="outline" className="mt-5 w-full">
              Suivre la mission
            </LinkButton>
          </Card>

          <Card>
            <CardHeader title="Professionnels recommandés" subtitle="Selon vos demandes passées" />
            <ul className="space-y-1 p-3">
              {recommandes.map((t) => (
                <li key={t.id}>
                  <Link href={`/techniciens/${t.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                    <Avatar nom={t.nom} className="size-10 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{t.nom}</p>
                      <Rating note={t.note} nbAvis={t.nbAvis} className="text-xs" />
                    </div>
                    <VerificationBadge niveau={t.niveau} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>
    </>
  );
}
