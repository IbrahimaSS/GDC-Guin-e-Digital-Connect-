"use client";

import { CheckCircle2, FileText, Plus, Send, Trash2, Wallet, XCircle } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import { Badge, Button, Card, cn, Input, Textarea, type Tone } from "@/components/ui";
import { formatGNF, type Demande } from "@/lib/data";
import { COMMISSION, MOYENS, sousTotal, totalDevis, useDevis, type StatutDevis } from "@/lib/devis";
import { notifier } from "@/lib/notifier";

export const STATUTS_DEVIS: Record<StatutDevis, [Tone, string]> = {
  brouillon: ["slate", "Brouillon"],
  envoye: ["amber", "En attente du client"],
  accepte: ["blue", "Accepté · paiement attendu"],
  refuse: ["red", "Refusé"],
  paye: ["green", "Payé"],
};

/** Rédaction et envoi du devis par le technicien. */
export default function DevisEditeur({ mission, technicien }: { mission: Demande; technicien: string }) {
  const [devis, setDevis] = useDevis(mission.id);
  const modifiable = devis.statut === "brouillon" || devis.statut === "refuse";
  const total = totalDevis(devis);
  const net = Math.round(total * (1 - COMMISSION));

  const majLigne = (id: string, champ: "libelle" | "quantite" | "prix", v: string) =>
    setDevis((d) => ({ ...d, lignes: d.lignes.map((l) => (l.id === id ? { ...l, [champ]: champ === "libelle" ? v : Math.max(0, Number(v) || 0) } : l)) }));

  function envoyer() {
    if (!devis.lignes.length || devis.lignes.some((l) => !l.libelle.trim())) return;
    const heure = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setDevis((d) => ({ ...d, statut: "envoye", envoyeLe: `Aujourd'hui · ${heure}` }));
    notifier("devis_envoye", { technicien, client: mission.client, mission: mission.titre, montant: formatGNF(total), numero: mission.clientTel });
  }

  const [tone, label] = STATUTS_DEVIS[devis.statut];

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <FileText className="size-5 text-brand-600" /> Devis
        </h2>
        <Badge tone={tone} dot>
          {label}
        </Badge>
      </div>

      {devis.statut === "refuse" && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <XCircle className="size-4 shrink-0" /> Le client a refusé ce devis. Ajustez-le puis renvoyez-le.
        </p>
      )}

      <div className="space-y-2">
        <div className="hidden grid-cols-[1fr_70px_130px_32px] gap-2 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:grid">
          <span>Prestation</span>
          <span>Qté</span>
          <span>Prix unitaire</span>
          <span />
        </div>
        <Reveal className="space-y-2" deps={[devis.lignes.length]} y={8}>
          {devis.lignes.map((l) => (
            <div key={l.id} className="grid grid-cols-[1fr_70px] gap-2 sm:grid-cols-[1fr_70px_130px_32px]">
              <Input value={l.libelle} disabled={!modifiable} onChange={(e) => majLigne(l.id, "libelle", e.target.value)} placeholder="Ex. : Remplacement du disjoncteur" aria-label="Prestation" />
              <Input type="number" min={1} value={l.quantite} disabled={!modifiable} onChange={(e) => majLigne(l.id, "quantite", e.target.value)} aria-label="Quantité" />
              <Input type="number" min={0} step={5000} value={l.prix} disabled={!modifiable} onChange={(e) => majLigne(l.id, "prix", e.target.value)} aria-label="Prix unitaire (GNF)" />
              {modifiable && (
                <button
                  type="button"
                  onClick={() => setDevis((d) => ({ ...d, lignes: d.lignes.filter((x) => x.id !== l.id) }))}
                  className="flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </Reveal>
        {modifiable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDevis((d) => ({ ...d, lignes: [...d.lignes, { id: `l${Date.now()}`, libelle: "", quantite: 1, prix: 0 }] }))}
          >
            <Plus className="size-4" /> Ajouter une prestation
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-slate-700">Frais de déplacement (GNF)</span>
          <Input type="number" min={0} step={5000} value={devis.deplacement} disabled={!modifiable} onChange={(e) => setDevis((d) => ({ ...d, deplacement: Math.max(0, Number(e.target.value) || 0) }))} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-slate-700">Conditions (optionnel)</span>
          <Textarea className="min-h-10" value={devis.note ?? ""} disabled={!modifiable} onChange={(e) => setDevis((d) => ({ ...d, note: e.target.value }))} placeholder="Garantie, matériel fourni…" />
        </label>
      </div>

      <dl className="mt-5 space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm">
        <div className="flex justify-between text-slate-600">
          <dt>Prestations</dt>
          <dd>{formatGNF(sousTotal(devis))}</dd>
        </div>
        <div className="flex justify-between text-slate-600">
          <dt>Déplacement</dt>
          <dd>{formatGNF(devis.deplacement)}</dd>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-900">
          <dt>Total client</dt>
          <dd>{formatGNF(total)}</dd>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <dt>Vous recevrez (commission GDC {COMMISSION * 100} % déduite)</dt>
          <dd className="font-semibold text-emerald-600">{formatGNF(net)}</dd>
        </div>
      </dl>

      {modifiable ? (
        <Button size="lg" className="mt-5 w-full" onClick={envoyer} disabled={!devis.lignes.length || devis.lignes.some((l) => !l.libelle.trim())}>
          <Send className="size-4" /> {devis.statut === "refuse" ? "Renvoyer le devis" : "Envoyer le devis au client"}
        </Button>
      ) : (
        <p className={cn("mt-5 flex items-center gap-2 text-sm", devis.statut === "paye" ? "text-emerald-600" : "text-slate-500")}>
          {devis.statut === "paye" ? (
            <>
              <CheckCircle2 className="size-4" /> Payé par {MOYENS[devis.paiement!.moyen].label} le {devis.paiement!.date} · versement à la fin de la mission.
            </>
          ) : devis.statut === "accepte" ? (
            <>
              <Wallet className="size-4" /> Devis accepté, en attente du paiement du client.
            </>
          ) : (
            <>Envoyé {devis.envoyeLe} · en attente de la réponse du client.</>
          )}
        </p>
      )}
    </Card>
  );
}
