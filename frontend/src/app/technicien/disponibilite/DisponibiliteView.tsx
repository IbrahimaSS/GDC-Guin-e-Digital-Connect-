"use client";

import { CalendarOff, Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, cn, Input, PageHeader, Select } from "@/components/ui";
import { Toggle } from "@/components/ui/interactive";
import { api, apiActive, texteErreur } from "@/lib/api";
import { AGENDA_DEFAUT, lireAgenda, modifierMonProfil, resumeAgenda, useMonProfil, type Agenda, type Conge } from "@/lib/monProfil";
import { mettreAJourUtilisateur, type UtilisateurApi } from "@/lib/session";

const HEURES = Array.from({ length: 15 }, (_, i) => `${String(i + 6).padStart(2, "0")}:00`);
const DEMO: Agenda = { ...AGENDA_DEFAUT, conges: [{ du: "2026-12-24", au: "2026-12-26", motif: "Fêtes de fin d'année" }] };

export default function DisponibiliteView() {
  const profil = useMonProfil();
  if (!apiActive) return <Calendrier initial={DEMO} disponible />;
  if (!profil.donnees) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />;
  return <Calendrier initial={lireAgenda(profil.donnees.agenda)} disponible={profil.donnees.disponible} />;
}

function Calendrier({ initial, disponible }: { initial: Agenda; disponible: boolean }) {
  const [dispoMaintenant, setDispoMaintenant] = useState(disponible);
  const [urgences, setUrgences] = useState(initial.urgences);
  const [delai, setDelai] = useState(initial.delai);
  const [planning, setPlanning] = useState(initial.planning);
  // Identifiant local de chaque ligne de congé (pour l'affichage et la suppression).
  const [conges, setConges] = useState(initial.conges.map((c, i) => ({ ...c, cle: i })));
  const [envoi, setEnvoi] = useState(false);

  const update = (i: number, patch: Partial<(typeof planning)[0]>) => setPlanning(planning.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const majConge = (cle: number, patch: Partial<Conge>) => setConges(conges.map((c) => (c.cle === cle ? { ...c, ...patch } : c)));
  const heuresSemaine = planning.filter((p) => p.actif).reduce((s, p) => s + Math.max(0, parseInt(p.fin) - parseInt(p.debut)), 0);

  // « Disponible maintenant » s'applique tout de suite : c'est le badge vu par les clients.
  async function basculer(v: boolean) {
    setDispoMaintenant(v);
    if (!apiActive) return;
    try {
      await api("/techniciens/moi/disponibilite", { methode: "PATCH", corps: { disponible: v } });
      api<UtilisateurApi>("/moi").then(mettreAJourUtilisateur).catch(() => undefined);
      toast(v ? "Vous apparaissez comme disponible" : "Vous apparaissez comme indisponible", "info");
    } catch (e) {
      setDispoMaintenant(!v);
      toast(texteErreur(e), "error");
    }
  }

  async function enregistrer() {
    if (planning.some((p) => p.actif && p.fin <= p.debut)) return toast("Une plage horaire se termine avant de commencer.", "error");
    const congesValides = conges.filter((c) => c.du && c.au);
    if (congesValides.some((c) => c.au < c.du)) return toast("Un congé se termine avant de commencer.", "error");
    if (!apiActive) return toast("Disponibilités enregistrées");
    setEnvoi(true);
    try {
      await modifierMonProfil({
        agenda: { planning, conges: congesValides.map(({ du, au, motif }) => ({ du, au, motif: motif?.trim() || undefined })), urgences, delai },
        disponibilites: resumeAgenda(planning),
      });
      toast("Disponibilités enregistrées");
    } catch (e) {
      toast(texteErreur(e), "error");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <PageHeader title="Mon calendrier" subtitle="Indiquez quand vous êtes disponible pour recevoir des demandes." />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Reveal className="space-y-6">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Horaires de la semaine</h2>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{heuresSemaine} h / semaine</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {planning.map((p, i) => (
                <li key={p.jour} className="flex flex-wrap items-center gap-4 py-3">
                  <div className="w-40">
                    <Toggle checked={p.actif} onChange={(v) => update(i, { actif: v })} label={p.jour} />
                  </div>
                  <div className={cn("flex flex-1 items-center gap-2 transition-opacity duration-300", !p.actif && "pointer-events-none opacity-30")}>
                    <Select value={p.debut} onChange={(e) => update(i, { debut: e.target.value })} className="w-28 py-2">
                      {HEURES.map((h) => (
                        <option key={h}>{h}</option>
                      ))}
                    </Select>
                    <span className="text-slate-400">→</span>
                    <Select value={p.fin} onChange={(e) => update(i, { fin: e.target.value })} className="w-28 py-2">
                      {HEURES.map((h) => (
                        <option key={h}>{h}</option>
                      ))}
                    </Select>
                    {/* Visualisation de la plage horaire */}
                    <div className="relative ml-2 hidden h-2 flex-1 rounded-full bg-slate-100 md:block">
                      <span
                        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-brand-600 to-sky-brand transition-all duration-500"
                        style={{ left: `${((parseInt(p.debut) - 6) / 14) * 100}%`, right: `${100 - ((parseInt(p.fin) - 6) / 14) * 100}%` }}
                      />
                    </div>
                  </div>
                  {!p.actif && <span className="text-xs font-semibold text-slate-400">Indisponible</span>}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Absences et congés</h2>
              <Button variant="outline" size="sm" onClick={() => setConges([...conges, { du: "", au: "", motif: "", cle: Date.now() }])}>
                <Plus className="size-4" /> Ajouter
              </Button>
            </div>
            {conges.length === 0 && <p className="text-sm text-slate-400">Aucune absence prévue.</p>}
            <Reveal className="space-y-2" deps={[conges.length]} y={8}>
              {conges.map((c) => (
                <div key={c.cle} className="grid items-center gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-[auto_1fr_1fr_1.5fr_auto]">
                  <CalendarOff className="hidden size-5 text-accent-500 md:block" />
                  <Input type="date" value={c.du} onChange={(e) => majConge(c.cle, { du: e.target.value })} aria-label="Du" />
                  <Input type="date" value={c.au} min={c.du || undefined} onChange={(e) => majConge(c.cle, { au: e.target.value })} aria-label="Au" />
                  <Input value={c.motif ?? ""} maxLength={80} onChange={(e) => majConge(c.cle, { motif: e.target.value })} placeholder="Motif (optionnel)" />
                  <button onClick={() => setConges(conges.filter((x) => x.cle !== c.cle))} className="justify-self-end rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Supprimer">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </Reveal>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card className={cn("p-6 transition-colors duration-500", dispoMaintenant ? "bg-emerald-50/60 ring-emerald-200" : "")}>
            <Toggle checked={dispoMaintenant} onChange={basculer} label="Disponible maintenant" description="Les clients voient le badge vert sur votre profil." />
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <span className={cn("size-2.5 rounded-full", dispoMaintenant ? "animate-pulse bg-emerald-500" : "bg-slate-400")} />
              {dispoMaintenant ? "Vous apparaissez comme disponible" : "Vous apparaissez comme indisponible"}
            </div>
          </Card>
          <Card className="p-6">
            <Toggle checked={urgences} onChange={setUrgences} label="Accepter les urgences" description="Recevoir les demandes urgentes en dehors de vos horaires." />
            {urgences && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-accent-50 p-3 text-xs text-accent-600">
                <Zap className="size-4 shrink-0" /> Les demandes urgentes sont mises en avant dans votre liste de demandes reçues.
              </p>
            )}
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-slate-900">Délai de prévenance</h3>
            <p className="mb-3 text-sm text-slate-500">Temps minimum avant une intervention planifiée.</p>
            <Select value={delai} onChange={(e) => setDelai(e.target.value as Agenda["delai"])}>
              <option value="1h">1 heure</option>
              <option value="2h">2 heures</option>
              <option value="24h">24 heures</option>
              <option value="48h">48 heures</option>
            </Select>
          </Card>
          <Button size="lg" className="w-full" onClick={enregistrer} disabled={envoi}>
            {envoi ? "Enregistrement…" : "Enregistrer mes disponibilités"}
          </Button>
        </Reveal>
      </div>
    </>
  );
}
