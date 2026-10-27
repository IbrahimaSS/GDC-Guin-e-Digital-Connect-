"use client";

import { BriefcaseBusiness, CheckCircle2, Clock, Wallet, Zap } from "lucide-react";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { StatutDemandeBadge } from "@/components/shared/status";
import { Avatar, Card, MetierIcon, PageHeader, StatCard } from "@/components/ui";
import { Tabs } from "@/components/ui/interactive";
import { Pagination, SearchBox, Table, TableToolbar, Td, Th } from "@/components/ui/table";
import { formatGNF, getTechnicien, TOUTES_DEMANDES, type StatutDemande } from "@/lib/data";

type Filtre = "toutes" | StatutDemande;

export default function GestionMissions() {
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [q, setQ] = useState("");
  const count = (s: StatutDemande) => TOUTES_DEMANDES.filter((d) => d.statut === s).length;
  const liste = TOUTES_DEMANDES.filter(
    (d) => (filtre === "toutes" || d.statut === filtre) && (d.titre + d.client + d.reference).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Toutes les missions" subtitle="Suivi global des demandes et des interventions sur la plateforme." />
      <Reveal className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BriefcaseBusiness} label="Missions ce mois" value={428} />
        <StatCard icon={Clock} label="Délai moyen de réponse (min)" value={42} tone="orange" />
        <StatCard icon={CheckCircle2} label="Taux de réussite" value={94} suffix=" %" tone="green" />
        <StatCard icon={Wallet} label="Volume (M GNF)" value={182.4} decimals={1} tone="violet" />
      </Reveal>
      <Card>
        <TableToolbar>
          <Tabs<Filtre>
            value={filtre}
            onChange={setFiltre}
            variant="pill"
            tabs={[
              { id: "toutes", label: "Toutes", count: TOUTES_DEMANDES.length },
              { id: "envoyee", label: "En attente", count: count("envoyee") },
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
          <Reveal as="tbody" deps={[filtre, q]} y={10} stagger={0.04}>
            {liste.map((d) => {
              const t = d.technicienId ? getTechnicien(d.technicienId) : undefined;
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
                      <span className="inline-flex items-center gap-2">
                        <Avatar nom={t.nom} className="size-7 text-[10px]" />
                        {t.nom}
                      </span>
                    ) : (
                      <span className="text-xs italic text-slate-400">Non assigné</span>
                    )}
                  </Td>
                  <Td className="text-slate-600">{d.zone}</Td>
                  <Td className="whitespace-nowrap text-slate-600">{d.date}</Td>
                  <Td className="whitespace-nowrap font-semibold">{d.budget ? formatGNF(d.budget) : "—"}</Td>
                  <Td>
                    <StatutDemandeBadge statut={d.statut} />
                  </Td>
                </tr>
              );
            })}
          </Reveal>
        </Table>
        <Pagination total={liste.length} label="missions" />
      </Card>
    </>
  );
}
