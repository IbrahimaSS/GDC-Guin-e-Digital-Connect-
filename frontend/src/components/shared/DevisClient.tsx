"use client";

import { CheckCircle2, FileText, Lock, Printer, Smartphone, ThumbsDown, Wallet } from "lucide-react";
import { useRef, useState } from "react";
import { enter, gsap, useGSAP } from "@/components/motion/gsap";
import { toast } from "@/components/motion/Toaster";
import { Badge, Button, Card, cn, inputClass } from "@/components/ui";
import { Modal } from "@/components/ui/interactive";
import { apiActive, texteErreur } from "@/lib/api";
import { formatGNF, type Demande } from "@/lib/data";
import { MOYENS, sousTotal, totalDevis, type MoyenPaiement, type Paiement } from "@/lib/devis";
import { useDevisClient } from "@/lib/devisApi";
import { useSession } from "@/lib/session";
import { STATUTS_DEVIS } from "./DevisEditeur";

type Etape = "choix" | "validation" | "succes";

/** Devis reçu par le client : acceptation, refus et paiement mobile. */
export default function DevisClient({ demande, technicien }: { demande: Demande; technicien: string }) {
  const { devis, chargement, accepter: accepterDevis, refuser: refuserDevis, payer: payerDevis } = useDevisClient(demande, technicien);
  const session = useSession();
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState<Etape>("choix");
  const [moyen, setMoyen] = useState<MoyenPaiement>("orange");
  // Par défaut, le numéro du compte connecté (celui de la maquette en démonstration).
  const [numeroSaisi, setNumero] = useState<string | null>(null);
  const numero = numeroSaisi ?? (apiActive ? (session?.utilisateur.telephone.replace(/^\+224\s?/, "") ?? "") : "621 11 22 33");
  const [erreur, setErreur] = useState("");
  const [action, setAction] = useState(false);
  const [paiementFait, setPaiementFait] = useState<Paiement | null>(null);
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

  if (chargement) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />;

  if (devis.statut === "brouillon") {
    return (
      <Card className="flex items-center gap-4 border-dashed p-6">
        <FileText className="size-6 shrink-0 text-slate-400" />
        <p className="text-sm text-slate-500">Le technicien vous enverra un devis après le diagnostic. Vous serez prévenu par SMS.</p>
      </Card>
    );
  }

  async function accepter() {
    setAction(true);
    try {
      await accepterDevis();
      ouvrirPaiement();
    } catch (e) {
      toast(texteErreur(e), "error");
    } finally {
      setAction(false);
    }
  }

  async function refuser() {
    setAction(true);
    try {
      await refuserDevis();
      toast("Devis refusé : le technicien peut vous en proposer un nouveau.", "info");
    } catch (e) {
      toast(texteErreur(e), "error");
    } finally {
      setAction(false);
    }
  }

  function ouvrirPaiement() {
    setEtape("choix");
    setErreur("");
    setOuvert(true);
  }

  async function payer() {
    if (moyen !== "especes" && !/^6\d{8}$/.test(numero.replace(/\D/g, ""))) return setErreur("Numéro mobile invalide (9 chiffres).");
    setErreur("");
    setEtape("validation");
    try {
      setPaiementFait(await payerDevis(moyen, numero));
      setEtape("succes");
    } catch (e) {
      setErreur(texteErreur(e));
      setEtape("choix");
    }
  }

  // Espèces avec l'API : le paiement attend que le technicien confirme avoir reçu l'argent.
  const especesEnAttente = devis.statut === "accepte" && devis.paiement?.enAttente;
  const recu = paiementFait ?? devis.paiement;

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
          <Button variant="ghost" size="lg" onClick={refuser} disabled={action}>
            <ThumbsDown className="size-4" /> Refuser
          </Button>
          <Button size="lg" onClick={accepter} disabled={action}>
            <CheckCircle2 className="size-4" /> Accepter et payer
          </Button>
        </div>
      )}
      {devis.statut === "accepte" && !especesEnAttente && (
        <Button size="lg" className="mt-5 w-full" onClick={ouvrirPaiement}>
          <Wallet className="size-4" /> Payer {formatGNF(total)}
        </Button>
      )}
      {especesEnAttente && (
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <Wallet className="mt-0.5 size-4 shrink-0" /> Paiement en espèces enregistré (réf. {devis.paiement!.reference}). Remettez {formatGNF(total)} à {technicien} :
          il confirmera la réception dans l&apos;application.
        </div>
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

          {etape === "succes" && recu && (
            <div className="text-center">
              <svg viewBox="0 0 80 80" className="mx-auto size-16" aria-hidden>
                <circle className="pay-ok-circle" cx="40" cy="40" r="36" fill="none" stroke="#10b981" strokeWidth="5" />
                <path className="pay-ok-check" d="M24 41l11 11 21-23" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="pay-ok-texte">
                <p className="mt-4 text-2xl font-extrabold text-brand-950">{formatGNF(total)}</p>
                <p className="text-sm text-slate-500">
                  {MOYENS[recu.moyen].label} · réf. {recu.reference}
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  {recu.enAttente
                    ? `Remettez le montant à ${technicien} : il confirmera la réception dans l'application.`
                    : `Le montant est conservé par GDC et versé à ${technicien} à la fin de la mission.`}
                </p>
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
