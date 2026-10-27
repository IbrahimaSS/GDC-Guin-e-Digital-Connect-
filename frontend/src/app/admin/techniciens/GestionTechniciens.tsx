"use client";

import { Ban, CheckCircle2, ExternalLink, ShieldCheck, Star, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { StatutCompteBadge } from "@/components/shared/status";
import { Avatar, Card, PageHeader, Select, StatCard, VerificationBadge } from "@/components/ui";
import { Pagination, SearchBox, Table, TableToolbar, Td, Th } from "@/components/ui/table";
import { getMetier, METIERS, TECHNICIENS } from "@/lib/data";

export default function GestionTechniciens() {
  const [techs, setTechs] = useState(TECHNICIENS);
  const [q, setQ] = useState("");
  const [metier, setMetier] = useState("");
  const [niveau, setNiveau] = useState("");

  const liste = techs.filter(
    (t) => t.nom.toLowerCase().includes(q.toLowerCase()) && (!metier || t.metier === metier) && (!niveau || t.niveau === Number(niveau)),
  );

  const basculer = (id: string) => {
    setTechs(techs.map((t) => (t.id === id ? { ...t, statut: t.statut === "suspendu" ? "actif" : "suspendu" } : t)));
    toast("Statut du technicien mis à jour");
  };

  return (
    <>
      <PageHeader title="Gestion des techniciens" subtitle="Suivez la qualité, la vérification et l'activité des professionnels." />
      <Reveal className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Wrench} label="Techniciens inscrits" value={420} />
        <StatCard icon={ShieldCheck} label="Vérifiés niveau 2+" value={268} tone="green" />
        <StatCard icon={Star} label="Note moyenne" value={4.6} decimals={1} tone="amber" />
        <StatCard icon={Ban} label="Suspendus" value={techs.filter((t) => t.statut === "suspendu").length} tone="red" />
      </Reveal>
      <Card>
        <TableToolbar>
          <div className="flex flex-wrap gap-2">
            <Select value={metier} onChange={(e) => setMetier(e.target.value)} className="w-auto! py-2">
              <option value="">Tous les métiers</option>
              {METIERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
            <Select value={niveau} onChange={(e) => setNiveau(e.target.value)} className="w-auto! py-2">
              <option value="">Tous les niveaux</option>
              <option value="1">Niveau 1</option>
              <option value="2">Niveau 2</option>
              <option value="3">Niveau 3</option>
            </Select>
          </div>
          <SearchBox value={q} onChange={setQ} placeholder="Rechercher un technicien…" />
        </TableToolbar>
        <Table>
          <thead>
            <tr>
              <Th>Technicien</Th>
              <Th>Métier</Th>
              <Th>Zone</Th>
              <Th>Vérification</Th>
              <Th>Note</Th>
              <Th>Missions</Th>
              <Th>Statut</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <Reveal as="tbody" deps={[q, metier, niveau]} y={10} stagger={0.04}>
            {liste.map((t) => (
              <tr key={t.id} className="transition hover:bg-slate-50/80">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar nom={t.nom} className="size-9 text-[11px]" />
                    <div>
                      <p className="font-semibold text-slate-900">{t.nom}</p>
                      <p className="text-xs text-slate-500">Depuis {t.inscrit}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-slate-600">{getMetier(t.metier).label}</Td>
                <Td className="text-slate-600">{t.zone}</Td>
                <Td>
                  <VerificationBadge niveau={t.niveau} />
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" /> {t.note.toFixed(1)}
                  </span>
                </Td>
                <Td className="font-semibold">{t.missions}</Td>
                <Td>
                  <StatutCompteBadge statut={t.statut} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/techniciens/${t.id}`} className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-600" aria-label="Voir le profil">
                      <ExternalLink className="size-4" />
                    </Link>
                    <button onClick={() => basculer(t.id)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Changer le statut">
                      {t.statut === "suspendu" ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Ban className="size-4" />}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </Reveal>
        </Table>
        <Pagination total={liste.length} label="techniciens affichés" />
      </Card>
    </>
  );
}
