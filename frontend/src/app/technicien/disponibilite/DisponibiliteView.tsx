"use client";

import { CalendarOff, Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, cn, Input, PageHeader, Select } from "@/components/ui";
import { Toggle } from "@/components/ui/interactive";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const HEURES = Array.from({ length: 15 }, (_, i) => `${String(i + 6).padStart(2, "0")}:00`);

export default function DisponibiliteView() {
  const [dispoMaintenant, setDispoMaintenant] = useState(true);
  const [urgences, setUrgences] = useState(true);
  const [planning, setPlanning] = useState(
    JOURS.map((j, i) => ({ jour: j, actif: i < 6, debut: "08:00", fin: i === 5 ? "14:00" : "18:00" })),
  );
  const [conges, setConges] = useState([{ id: 1, du: "2026-12-24", au: "2026-12-26", motif: "Fêtes de fin d'année" }]);

  const update = (i: number, patch: Partial<(typeof planning)[0]>) => setPlanning(planning.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const heuresSemaine = planning.filter((p) => p.actif).reduce((s, p) => s + (parseInt(p.fin) - parseInt(p.debut)), 0);

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
              <Button variant="outline" size="sm" onClick={() => setConges([...conges, { id: Date.now(), du: "", au: "", motif: "" }])}>
                <Plus className="size-4" /> Ajouter
              </Button>
            </div>
            <Reveal className="space-y-2" deps={[conges.length]} y={8}>
              {conges.map((c) => (
                <div key={c.id} className="grid items-center gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-[auto_1fr_1fr_1.5fr_auto]">
                  <CalendarOff className="hidden size-5 text-accent-500 md:block" />
                  <Input type="date" defaultValue={c.du} aria-label="Du" />
                  <Input type="date" defaultValue={c.au} aria-label="Au" />
                  <Input defaultValue={c.motif} placeholder="Motif (optionnel)" />
                  <button onClick={() => setConges(conges.filter((x) => x.id !== c.id))} className="justify-self-end rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Supprimer">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </Reveal>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card className={cn("p-6 transition-colors duration-500", dispoMaintenant ? "bg-emerald-50/60 ring-emerald-200" : "")}>
            <Toggle checked={dispoMaintenant} onChange={setDispoMaintenant} label="Disponible maintenant" description="Les clients voient le badge vert sur votre profil." />
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <span className={cn("size-2.5 rounded-full", dispoMaintenant ? "animate-pulse bg-emerald-500" : "bg-slate-400")} />
              {dispoMaintenant ? "Vous apparaissez comme disponible" : "Vous apparaissez comme indisponible"}
            </div>
          </Card>
          <Card className="p-6">
            <Toggle checked={urgences} onChange={setUrgences} label="Accepter les urgences" description="Recevoir les demandes urgentes en dehors de vos horaires." />
            {urgences && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-accent-50 p-3 text-xs text-accent-600">
                <Zap className="size-4 shrink-0" /> Les interventions urgentes sont mieux rémunérées et boostent votre visibilité.
              </p>
            )}
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-slate-900">Délai de prévenance</h3>
            <p className="mb-3 text-sm text-slate-500">Temps minimum avant une intervention planifiée.</p>
            <Select defaultValue="2h">
              <option value="1h">1 heure</option>
              <option value="2h">2 heures</option>
              <option value="24h">24 heures</option>
              <option value="48h">48 heures</option>
            </Select>
          </Card>
          <Button size="lg" className="w-full" onClick={() => toast("Disponibilités enregistrées")}>
            Enregistrer mes disponibilités
          </Button>
        </Reveal>
      </div>
    </>
  );
}
