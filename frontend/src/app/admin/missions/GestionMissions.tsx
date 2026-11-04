"use client";

import { BriefcaseBusiness, CheckCircle2, Clock, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { StatutDemandeBadge } from "@/components/shared/status";
import { Avatar, Card, MetierIcon, PageHeader, StatCard } from "@/components/ui";
import { Tabs } from "@/components/ui/interactive";
import { Pagination, SearchBox, Table, TableToolbar, Td, Th } from "@/components/ui/table";
import { useStatsAdmin, type Page } from "@/lib/admin";
import { apiActive } from "@/lib/api";
import { formatGNF, TOUTES_DEMANDES, type StatutDemande } from "@/lib/data";
import { technicienDe, versDemande, type DemandeApi } from "@/lib/demandes";
import { useApi } from "@/lib/useApi";

type Filtre = "toutes" | StatutDemande;

export default function GestionMissions() {
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [q, setQ] = useState("");
  const stats = useStatsAdmin().donnees;

  // Avec l'API : filtre et recherche côté serveur (référence, titre, client).
  const params = new URLSearchParams({ parPage: "100" });
  if (filtre !== "toutes") params.set("statut", filtre.toUpperCase());
  if (q.trim()) params.set("q", q.trim());
  const distants = useApi<Page<DemandeApi>>(apiActive ? `/admin/demandes?${params}` : null);

  const demandes = apiActive ? (distants.donnees?.resultats ?? []).map(versDemande) : TOUTES_DEMANDES;
  const count = (s: StatutDemande) => (apiActive ? (stats?.demandes[s.toUpperCase() as keyof NonNullable<typeof stats>["demandes"]] ?? 0) : TOUTES_DEMANDES.filter((d) => d.statut === s).length);
  const total = apiActive ? (stats ? Object.values(stats.demandes).reduce((a, b) => a + b, 0) : 0) : TOUTES_DEMANDES.length;
  const liste = apiActive ? demandes : demandes.filter((d) => (filtre === "toutes" || d.statut === filtre) && (d.titre + d.client + d.reference).toLowerCase().includes(q.toLowerCase()));
  // Montant : total du devis payé s'il existe, sinon le budget indiqué par le client.
  const montants = new Map((distants.donnees?.resultats ?? []).map((d) => [d.id, (d as DemandeApi & { devis?: { paiement?: { montant: number } | null } | null }).devis?.paiement?.montant]));

  return (
    <>
      <PageHeader title="Toutes les missions" subtitle="Suivi global des demandes et des interventions sur la plateforme." />
      <Reveal className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BriefcaseBusiness} label="Demandes ce mois" value={apiActive ? (stats?.missions.ceMois ?? 0) : 428} />
        <StatCard icon={Clock} label="Délai moyen de réponse (min)" value={apiActive ? (stats?.missions.delaiReponseMinutes ?? 0) : 42} tone="orange" />
        <StatCard icon={CheckCircle2} label="Taux de réussite" value={apiActive ? (stats?.missions.tauxReussite ?? 0) : 94} suffix=" %" tone="green" />
        <StatCard icon={Wallet} label="Volume (M GNF)" value={apiActive ? (stats?.paiements.volume ?? 0) / 1_000_000 : 182.4} decimals={1} tone="violet" />
      </Reveal>
      {apiActive && (
        <p className="-mt-3 mb-5 text-xs text-slate-400">
          Délai de réponse : temps moyen entre la publication et l&apos;acceptation. Taux de réussite : missions terminées parmi les missions clôturées (terminées ou annulées).
        </p>
      )}
      <Card>
        <TableToolbar>
          <Tabs<Filtre>
            value={filtre}
            onChange={setFiltre}
            variant="pill"
            tabs={[
              { id: "toutes", label: "Toutes", count: total },
              { id: "envoyee", label: "En attente", count: count("envoyee") },
              { id: "acceptee", label: "Acceptées", count: count("acceptee") },
              { id: "en_cours", label: "En cours", count: count("en_cours") },
              { id: "terminee", label: "Terminées", count: count("terminee") },
              { id: "annulee", label: "Annulées", count: count("annulee") },
            ]}
          />
          <SearchBox value={q} onChange={setQ} placeholder="Référence, client, titre…" />
        </TableToolbar>
        <Table>
          <thead>
            <tr>
              <Th>Mission</Th>
              <Th>Client</Th>
              <Th>Technicien</Th>
              <Th>Zone</Th>
              <Th>Date</Th>
              <Th>Montant</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <Reveal as="tbody" deps={[filtre, q, liste.length]} y={10} stagger={0.04}>
            {liste.map((d) => {
              const t = technicienDe(d);
              const paye = montants.get(d.id);
              return (
                <tr key={d.id} className="transition hover:bg-slate-50/80">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-accent-50 p-2 text-accent-500">
                        <MetierIcon metier={d.metier} className="size-4" />
                      </span>
                      <div>
                        <p className="flex items-center gap-1 font-semibold text-slate-900">
                          {d.titre} {d.urgence === "urgente" && <Zap className="size-3.5 text-red-500" />}
                        </p>
                        <p className="text-xs text-slate-500">{d.reference}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-slate-700">{d.client}</Td>
                  <Td>
                    {t ? (
                      <Link href={`/techniciens/${t.id}`} className="inline-flex items-center gap-2 hover:text-brand-600">
                        <Avatar nom={t.nom} className="size-7 text-[10px]" />
                        {t.nom}
                      </Link>
                    ) : (
                      <span className="text-xs italic text-slate-400">Non assigné</span>
                    )}
                  </Td>
                  <Td className="text-slate-600">{d.zone}</Td>
                  <Td className="whitespace-nowrap text-slate-600">{d.date}</Td>
                  <Td className="whitespace-nowrap font-semibold">
                    {paye ? formatGNF(paye) : d.budget ? <span className="font-normal text-slate-500">{formatGNF(d.budget)} (budget)</span> : "—"}
                  </Td>
                  <Td>
                    <StatutDemandeBadge statut={d.statut} />
                  </Td>
                </tr>
              );
            })}
          </Reveal>
        </Table>
        {apiActive && !distants.chargement && liste.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Aucune mission ne correspond à cette recherche.</p>}
        <Pagination total={apiActive ? (distants.donnees?.total ?? 0) : liste.length} label="missions" />
      </Card>
    </>
  );
}
