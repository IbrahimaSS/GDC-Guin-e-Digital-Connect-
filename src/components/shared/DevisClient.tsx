"use client";

import { CheckCircle2, FileText, Lock, Printer, Smartphone, ThumbsDown, Wallet } from "lucide-react";
import { useRef, useState } from "react";
import { enter, gsap, useGSAP } from "@/components/motion/gsap";
import { toast } from "@/components/motion/Toaster";
import { Badge, Button, Card, cn, inputClass } from "@/components/ui";
import { Modal } from "@/components/ui/interactive";
import { formatGNF, type Demande } from "@/lib/data";
import { MOYENS, referencePaiement, sousTotal, totalDevis, useDevis, type MoyenPaiement } from "@/lib/devis";
import { notifier } from "@/lib/notifier";
import { STATUTS_DEVIS } from "./DevisEditeur";

type Etape = "choix" | "validation" | "succes";

/** Devis reçu par le client : acceptation, refus et paiement mobile. */
export default function DevisClient({ demande, technicien }: { demande: Demande; technicien: string }) {
  const [devis, setDevis] = useDevis(demande.id);
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState<Etape>("choix");
  const [moyen, setMoyen] = useState<MoyenPaiement>("orange");
  const [numero, setNumero] = useState("621 11 22 33");
  const [erreur, setErreur] = useState("");
  const modal = useRef<HTMLDivElement>(null);
  const total = totalDevis(devis);

  useGSAP(
    () => {
      if (etape === "succes") {
        gsap
          .timeline()
          .from(".pay-ok-circle", { drawSVG: "0%", duration: 0.6, ease: "power2.inOut" })
          .from(".pay-ok-check", { drawSVG: "0%", duration: 0.35 })
          .add(enter(".pay-ok-texte > *", { y: 12, autoAlpha: 0, stagger: 0.08, duration: 0.4 }), "-=0.1");
      } else if (etape === "validation") {
        gsap.to(".pay-phone", { y: -6, duration: 0.6, repeat: -1, yoyo: true, ease: "sine.inOut" });
      }
    },
    { dependencies: [etape], scope: modal, revertOnUpdate: true },
  );

  if (devis.statut === "brouillon") {
    return (
      <Card className="flex items-center gap-4 border-dashed p-6">
        <FileText className="size-6 shrink-0 text-slate-400" />
        <p className="text-sm text-slate-500">Le technicien vous enverra un devis après le diagnostic. Vous serez prévenu par SMS.</p>
      </Card>
    );
  }

  function accepter() {
    setDevis((d) => ({ ...d, statut: "accepte" }));
    notifier("devis_accepte", { client: demande.client, technicien, mission: demande.titre, montant: formatGNF(total) });
    ouvrirPaiement();
  }

  function refuser() {
    setDevis((d) => ({ ...d, statut: "refuse" }));
    toast("Devis refusé : le technicien peut vous en proposer un nouveau.", "info");
  }

  function ouvrirPaiement() {
    setEtape("choix");
    setErreur("");
    setOuvert(true);
  }

  function payer() {
    if (moyen !== "especes" && !/^6\d{8}$/.test(numero.replace(/\D/g, ""))) return setErreur("Numéro mobile invalide (9 chiffres).");
    setErreur("");
    setEtape("validation");
    // TODO : appel à l'API de paiement (Orange Money / MTN MoMo), confirmation par webhook.
    window.setTimeout(() => {
      const date = `Aujourd'hui · ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
      setDevis((d) => ({ ...d, statut: "paye", paiement: { moyen, numero: moyen === "especes" ? undefined : numero, reference: referencePaiement(moyen), date } }));
      notifier("paiement_recu", { client: demande.client, technicien, mission: demande.titre, montant: formatGNF(total) });
      setEtape("succes");
    }, 3200);
  }

  const [tone, label] = STATUTS_DEVIS[devis.statut];

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <FileText className="size-5 text-brand-600" /> Devis de {technicien}
          </h2>
          {devis.envoyeLe && <p className="text-xs text-slate-500">Reçu le {devis.envoyeLe}</p>}
        </div>
        <Badge tone={tone} dot>
          {devis.statut === "envoye" ? "À valider" : label}
        </Badge>
      </div>

      <ul className="divide-y divide-slate-100 text-sm">
        {devis.lignes.map((l) => (
          <li key={l.id} className="flex justify-between gap-3 py-2.5">
            <span className="text-slate-700">
              {l.libelle} {l.quantite > 1 && <span className="text-slate-400">× {l.quantite}</span>}
            </span>
            <span className="whitespace-nowrap font-semibold text-slate-900">{formatGNF(l.quantite * l.prix)}</span>
          </li>
        ))}
        <li className="flex justify-between py-2.5 text-slate-500">
          <span>Déplacement</span>
          <span>{formatGNF(devis.deplacement)}</span>
        </li>
      </ul>
      {devis.note && <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{devis.note}</p>}
      <div className="mt-4 flex items-baseline justify-between rounded-xl bg-brand-50 px-4 py-3">
        <span className="text-sm font-semibold text-brand-800">Total à payer</span>
        <span className="text-xl font-extrabold text-brand-950">{formatGNF(total)}</span>
      </div>
      <p className="mt-2 text-xs text-slate-400">Prestations : {formatGNF(sousTotal(devis))} · aucun frais supplémentaire pour le client.</p>

      {devis.statut === "envoye" && (
        <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
          <Button variant="ghost" size="lg" onClick={refuser}>
            <ThumbsDown className="size-4" /> Refuser
          </Button>
          <Button size="lg" onClick={accepter}>
            <CheckCircle2 className="size-4" /> Accepter et payer
          </Button>
        </div>
      )}
      {devis.statut === "accepte" && (
        <Button size="lg" className="mt-5 w-full" onClick={ouvrirPaiement}>
          <Wallet className="size-4" /> Payer {formatGNF(total)}
        </Button>
      )}
      {devis.statut === "paye" && devis.paiement && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4" /> Payé par {MOYENS[devis.paiement.moyen].label} · réf. {devis.paiement.reference}
          </span>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 font-semibold hover:underline">
            <Printer className="size-4" /> Reçu
          </button>
        </div>
      )}
      <p className="mt-3 flex items-start gap-2 text-xs text-slate-400">
        <Lock className="mt-0.5 size-3.5 shrink-0" /> Paiement sécurisé : GDC conserve le montant et le verse au technicien une fois la mission terminée.
      </p>

      <Modal open={ouvert} onClose={() => etape !== "validation" && setOuvert(false)} title={etape === "succes" ? "Paiement confirmé" : `Payer ${formatGNF(total)}`}>
        <div ref={modal}>
          {etape === "choix" && (
            <div className="space-y-3">
              {(Object.keys(MOYENS) as MoyenPaiement[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMoyen(m)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors",
                    moyen === m ? "border-brand-600 bg-brand-50/60" : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-[#fff]" style={{ background: MOYENS[m].couleur }}>
                    {m === "orange" ? "OM" : m === "mtn" ? "MoMo" : <Wallet className="size-5" />}
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-slate-900">{MOYENS[m].label}</span>
                    <span className="block text-xs text-slate-500">{MOYENS[m].detail}</span>
                  </span>
                  <span className={cn("flex size-5 items-center justify-center rounded-full border-2", moyen === m ? "border-brand-600" : "border-slate-300")}>
                    {moyen === m && <span className="size-2.5 rounded-full bg-brand-600" />}
                  </span>
                </button>
              ))}
              {moyen !== "especes" && (
                <label className="block space-y-1.5 pt-1">
                  <span className="text-sm font-semibold text-slate-700">Numéro {MOYENS[moyen].label}</span>
                  <div className="flex">
                    <span className="inline-flex items-center gap-1.5 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
                      <Smartphone className="size-4" /> +224
                    </span>
                    <input value={numero} onChange={(e) => setNumero(e.target.value)} inputMode="numeric" className={cn(inputClass, "rounded-l-none")} />
                  </div>
                </label>
              )}
              {erreur && <p className="text-sm font-medium text-red-600">{erreur}</p>}
              <Button size="lg" className="mt-2 w-full" onClick={payer}>
                {moyen === "especes" ? "Confirmer le paiement en espèces" : `Payer ${formatGNF(total)}`}
              </Button>
            </div>
          )}

          {etape === "validation" && (
            <div className="py-6 text-center">
              <div className="pay-phone mx-auto flex h-28 w-16 items-center justify-center rounded-2xl border-4 border-slate-800 bg-slate-900 text-[10px] font-bold text-white">
                <span className="rounded bg-[#ff7900] px-1 py-0.5">{moyen === "especes" ? "GDC" : MOYENS[moyen].label.split(" ")[0]}</span>
              </div>
              <p className="mt-5 font-bold text-slate-900">{moyen === "especes" ? "Confirmation auprès du technicien…" : "Validez le paiement sur votre téléphone"}</p>
              <p className="mt-1 text-sm text-slate-500">
                {moyen === "especes" ? "Le technicien confirme la réception des espèces." : `Composez votre code secret ${MOYENS[moyen].label} sur le message reçu au +224 ${numero}.`}
              </p>
              <span className="mx-auto mt-5 block size-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            </div>
          )}

          {etape === "succes" && devis.paiement && (
            <div className="text-center">
              <svg viewBox="0 0 80 80" className="mx-auto size-16" aria-hidden>
                <circle className="pay-ok-circle" cx="40" cy="40" r="36" fill="none" stroke="#10b981" strokeWidth="5" />
                <path className="pay-ok-check" d="M24 41l11 11 21-23" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="pay-ok-texte">
                <p className="mt-4 text-2xl font-extrabold text-brand-950">{formatGNF(total)}</p>
                <p className="text-sm text-slate-500">
                  {MOYENS[devis.paiement.moyen].label} · réf. {devis.paiement.reference}
                </p>
                <p className="mt-3 text-sm text-slate-600">Le montant est conservé par GDC et versé à {technicien} à la fin de la mission.</p>
                <Button size="lg" className="mt-5 w-full" onClick={() => setOuvert(false)}>
                  Terminé
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Card>
  );
}
