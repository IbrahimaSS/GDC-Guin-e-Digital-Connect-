"use client";

import { Ban, CheckCircle2, ExternalLink, ShieldCheck, Star, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { StatutCompteBadge } from "@/components/shared/status";
import { Avatar, Card, PageHeader, Select, StatCard, VerificationBadge } from "@/components/ui";
import { Pagination, SearchBox, Table, TableToolbar, Td, Th } from "@/components/ui/table";
import { dateCourte, useStatsAdmin, type Page, type UtilisateurAdmin } from "@/lib/admin";
import { api, apiActive, texteErreur } from "@/lib/api";
import { getMetier, TECHNICIENS, type Niveau } from "@/lib/data";
import { useMetiers } from "@/lib/plateforme";
import { useApi } from "@/lib/useApi";

/** Ligne du tableau : `userId` sert aux actions sur le compte, `id` au profil public. */
interface Ligne {
  id: string;
  userId: string;
  nom: string;
  photo?: string;
  metier: string;
  metierLabel: string;
  zone: string;
  niveau: number;
  note: number;
  missions: number;
  inscrit: string;
  statut: "actif" | "suspendu" | "en_attente";
}

const DEMO: Ligne[] = TECHNICIENS.map((t) => ({
  id: t.id,
  userId: t.id,
  nom: t.nom,
  metier: t.metier,
  metierLabel: getMetier(t.metier).label,
  zone: t.zone,
  niveau: t.niveau,
  note: t.note,
  missions: t.missions,
  inscrit: t.inscrit,
  statut: t.statut,
}));

export default function GestionTechniciens() {
  const metiers = useMetiers();
  const stats = useStatsAdmin();
  const distants = useApi<Page<UtilisateurAdmin>>(apiActive ? "/admin/utilisateurs?role=TECHNICIEN&parPage=100" : null);
  const [locaux, setLocaux] = useState(DEMO);
  const [q, setQ] = useState("");
  const [metier, setMetier] = useState("");
  const [niveau, setNiveau] = useState("");

  const techs: Ligne[] = apiActive
    ? (distants.donnees?.resultats ?? [])
        .filter((u) => u.technicien)
        .map((u) => ({
          id: u.technicien!.id,
          userId: u.id,
          nom: u.nomComplet,
          photo: u.photoUrl ?? undefined,
          metier: u.technicien!.metier.id,
          metierLabel: u.technicien!.metier.label,
          zone: u.zone?.nom ?? u.technicien!.zones[0]?.nom ?? "—",
          niveau: u.technicien!.niveau,
          note: u.technicien!.note,
          missions: u.technicien!.nbMissions,
          inscrit: dateCourte(u.inscritLe),
          statut: u.statut.toLowerCase() as Ligne["statut"],
        }))
    : locaux;
  const liste = techs.filter((t) => t.nom.toLowerCase().includes(q.toLowerCase()) && (!metier || t.metier === metier) && (!niveau || t.niveau === Number(niveau)));
  const s = stats.donnees?.techniciens;

  async function basculer(t: Ligne) {
    const statut = t.statut === "suspendu" ? "ACTIF" : "SUSPENDU";
    if (apiActive) {
      try {
        await api(`/admin/utilisateurs/${t.userId}/statut`, { methode: "PATCH", corps: { statut } });
        distants.recharger();
        stats.recharger();
      } catch (e) {
        return toast(texteErreur(e), "error");
      }
    } else {
      setLocaux(locaux.map((x) => (x.id === t.id ? { ...x, statut: x.statut === "suspendu" ? "actif" : "suspendu" } : x)));
    }
    toast(statut === "SUSPENDU" ? `${t.nom} est suspendu : il n'apparaît plus dans la recherche` : `${t.nom} est réactivé`);
  }

  return (
    <>
      <PageHeader title="Gestion des techniciens" subtitle="Suivez la qualité, la vérification et l'activité des professionnels." />
      <Reveal className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Wrench} label="Techniciens inscrits" value={apiActive ? (s?.inscrits ?? 0) : 420} />
        <StatCard icon={ShieldCheck} label="Vérifiés niveau 2+" value={apiActive ? (s?.verifiesNiveau2 ?? 0) : 268} tone="green" />
        <StatCard icon={Star} label="Note moyenne" value={apiActive ? (s?.noteMoyenne ?? 0) : 4.6} decimals={1} tone="amber" />
        <StatCard icon={Ban} label="Suspendus" value={apiActive ? (s?.suspendus ?? 0) : techs.filter((t) => t.statut === "suspendu").length} tone="red" />
      </Reveal>
      <Card>
        <TableToolbar>
          <div className="flex flex-wrap gap-2">
            <Select value={metier} onChange={(e) => setMetier(e.target.value)} className="w-auto! py-2">
              <option value="">Tous les métiers</option>
              {metiers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
            <Select value={niveau} onChange={(e) => setNiveau(e.target.value)} className="w-auto! py-2">
              <option value="">Tous les niveaux</option>
              {apiActive && <option value="0">Non vérifié</option>}
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
          <Reveal as="tbody" deps={[q, metier, niveau, liste.length]} y={10} stagger={0.04}>
            {liste.map((t) => (
              <tr key={t.id} className="transition hover:bg-slate-50/80">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar nom={t.nom} photo={t.photo} className="size-9 text-[11px]" />
                    <div>
                      <p className="font-semibold text-slate-900">{t.nom}</p>
                      <p className="text-xs text-slate-500">Depuis {t.inscrit}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-slate-600">{t.metierLabel}</Td>
                <Td className="text-slate-600">{t.zone}</Td>
                <Td>{t.niveau >= 1 ? <VerificationBadge niveau={Math.min(3, t.niveau) as Niveau} /> : <span className="text-xs font-semibold text-amber-600">Non vérifié</span>}</Td>
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
                    {t.niveau >= 1 && t.statut === "actif" && (
                      <Link href={`/techniciens/${t.id}`} className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-600" aria-label="Voir le profil">
                        <ExternalLink className="size-4" />
                      </Link>
                    )}
                    <button onClick={() => basculer(t)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={t.statut === "suspendu" ? "Réactiver" : "Suspendre"}>
                      {t.statut === "suspendu" ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Ban className="size-4" />}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </Reveal>
        </Table>
        {apiActive && !distants.chargement && liste.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Aucun technicien ne correspond à ces filtres.</p>}
        <Pagination total={liste.length} label="techniciens affichés" />
      </Card>
    </>
  );
}
