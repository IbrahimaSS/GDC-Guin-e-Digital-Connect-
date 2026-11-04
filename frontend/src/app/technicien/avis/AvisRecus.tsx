"use client";

import { CornerDownRight, MessageSquareReply, Star } from "lucide-react";
import { useRef, useState } from "react";
import { ProgressBar } from "@/components/motion/Charts";
import Counter from "@/components/motion/Counter";
import { gsap, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Avatar, Button, Card, cn, PageHeader, Stars, Textarea } from "@/components/ui";
import { api, apiActive, texteErreur } from "@/lib/api";
import { TECHNICIEN_CONNECTE as moi } from "@/lib/data";
import { useApi } from "@/lib/useApi";

const REPARTITION = [
  { n: 5, c: 25 },
  { n: 4, c: 5 },
  { n: 3, c: 1 },
  { n: 2, c: 1 },
  { n: 1, c: 0 },
];

const CRITERES = [
  { l: "Ponctualité", v: 4.6 },
  { l: "Qualité du travail", v: 4.9 },
  { l: "Rapport qualité / prix", v: 4.7 },
  { l: "Communication", v: 4.8 },
];

function Reponse({ id, reponse, onSave }: { id: string; reponse?: string; onSave: (id: string, txt: string) => Promise<boolean> }) {
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (ouvert) gsap.fromTo(ref.current, { height: 0, autoAlpha: 0 }, { height: "auto", autoAlpha: 1, duration: 0.4 });
    },
    { dependencies: [ouvert] },
  );

  if (reponse)
    return (
      <div className="mt-3 flex gap-2 rounded-xl bg-brand-50 p-3 text-sm">
        <CornerDownRight className="size-4 shrink-0 text-brand-600" />
        <p>
          <span className="font-semibold text-brand-800">Votre réponse : </span>
          <span className="text-slate-700">{reponse}</span>
        </p>
      </div>
    );

  return (
    <>
      {!ouvert && (
        <button onClick={() => setOuvert(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
          <MessageSquareReply className="size-4" /> Répondre
        </button>
      )}
      {ouvert && (
        <div ref={ref} className="mt-3 overflow-hidden">
          <Textarea value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Remerciez votre client…" className="min-h-20" autoFocus />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={!texte.trim()}
              onClick={async () => {
                if (await onSave(id, texte)) toast("Réponse publiée");
              }}
            >
              Publier
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

interface AvisApi {
  id: string;
  note: number;
  criteres: { ponctualite: number; qualite: number; prix: number; communication: number } | null;
  commentaire: string | null;
  reponse: string | null;
  statut: "PUBLIE" | "EN_ATTENTE" | "MASQUE";
  createdAt: string;
  auteur: { prenom: string; nom: string };
  demande: { titre: string };
}

const moyenne = (valeurs: number[]) => (valeurs.length ? Math.round((valeurs.reduce((s, v) => s + v, 0) / valeurs.length) * 10) / 10 : 0);

export default function AvisRecus() {
  const distants = useApi<AvisApi[]>(apiActive ? "/avis/recus" : null);
  const [filtre, setFiltre] = useState(0);
  const [reponses, setReponses] = useState<Record<string, string>>(apiActive ? {} : { a2: "Merci beaucoup Fatoumata, au plaisir de vous aider à nouveau !" });

  // Avec l'API : avis publiés uniquement, répartition et notes détaillées calculées à partir d'eux.
  const publies = (distants.donnees ?? []).filter((a) => a.statut === "PUBLIE");
  const tous = apiActive
    ? publies.map((a) => ({
        id: a.id,
        auteur: `${a.auteur.prenom} ${a.auteur.nom}`,
        note: a.note,
        commentaire: a.commentaire ?? "",
        mission: a.demande.titre,
        date: new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
        reponse: a.reponse ?? undefined,
      }))
    : moi.avis.map((a) => ({ ...a, reponse: undefined as string | undefined }));
  const repartition = apiActive ? [5, 4, 3, 2, 1].map((n) => ({ n, c: publies.filter((a) => a.note === n).length })) : REPARTITION;
  const avecCriteres = publies.filter((a) => a.criteres);
  const criteres = apiActive
    ? [
        { l: "Ponctualité", v: moyenne(avecCriteres.map((a) => a.criteres!.ponctualite)) },
        { l: "Qualité du travail", v: moyenne(avecCriteres.map((a) => a.criteres!.qualite)) },
        { l: "Rapport qualité / prix", v: moyenne(avecCriteres.map((a) => a.criteres!.prix)) },
        { l: "Communication", v: moyenne(avecCriteres.map((a) => a.criteres!.communication)) },
      ]
    : CRITERES;
  const note = apiActive ? moyenne(publies.map((a) => a.note)) : moi.note;
  const nbAvis = apiActive ? publies.length : moi.nbAvis;
  const total = repartition.reduce((s, r) => s + r.c, 0);
  const avis = tous.filter((a) => !filtre || a.note === filtre);

  async function repondre(id: string, texte: string) {
    if (apiActive) {
      try {
        await api(`/avis/${id}/reponse`, { methode: "POST", corps: { reponse: texte.trim() } });
      } catch (e) {
        toast(texteErreur(e), "error");
        return false;
      }
    }
    setReponses({ ...reponses, [id]: texte.trim() });
    return true;
  }

  if (distants.chargement) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />;

  return (
    <>
      <PageHeader title="Avis reçus" subtitle="Les avis sont publiés uniquement après une mission terminée." />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Reveal className="space-y-6">
          <Card className="p-6 text-center">
            <p className="text-6xl font-extrabold text-brand-950">
              <Counter value={note} decimals={1} />
            </p>
            <div className="mt-2 flex justify-center">
              <Stars note={Math.round(note)} className="size-5" />
            </div>
            <p className="mt-1 text-sm text-slate-500">{nbAvis} avis</p>
            <ul className="mt-6 space-y-2">
              {repartition.map((r) => (
                <li key={r.n}>
                  <button
                    onClick={() => setFiltre(filtre === r.n ? 0 : r.n)}
                    className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs transition", filtre === r.n ? "bg-amber-50" : "hover:bg-slate-50")}
                  >
                    <span className="flex w-6 items-center gap-0.5 font-semibold">
                      {r.n} <Star className="size-3 fill-amber-400 text-amber-400" />
                    </span>
                    <ProgressBar value={total ? (r.c / total) * 100 : 0} color="bg-amber-400" />
                    <span className="w-6 text-right text-slate-500">{r.c}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Notes détaillées</h2>
            {apiActive && !avecCriteres.length && <p className="text-sm text-slate-400">Aucun client n&apos;a encore détaillé sa note.</p>}
            <ul className="space-y-4">
              {(apiActive && !avecCriteres.length ? [] : criteres).map((c) => (
                <li key={c.l}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-slate-600">{c.l}</span>
                    <span className="font-bold text-slate-900">{c.v}</span>
                  </div>
                  <ProgressBar value={(c.v / 5) * 100} />
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">{filtre ? `Avis ${filtre} étoiles` : "Tous les avis"}</h2>
            {filtre > 0 && (
              <button onClick={() => setFiltre(0)} className="text-sm font-semibold text-slate-500 underline">
                Voir tout
              </button>
            )}
          </div>
          {avis.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              {tous.length ? "Aucun avis avec cette note." : "Vos premiers avis apparaîtront ici après vos missions terminées."}
            </p>
          ) : (
            <Reveal as="ul" className="space-y-4" deps={[filtre]} y={14}>
              {avis.map((a) => (
                <li key={a.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start gap-3">
                    <Avatar nom={a.auteur} className="size-10 text-xs" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-slate-900">{a.auteur}</p>
                        <span className="text-xs text-slate-400">{a.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stars note={a.note} className="size-3.5" />
                        <span className="text-xs text-slate-500">{a.mission}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{a.commentaire}</p>
                      <Reponse id={a.id} reponse={reponses[a.id] ?? a.reponse} onSave={repondre} />
                    </div>
                  </div>
                </li>
              ))}
            </Reveal>
          )}
        </Card>
      </div>
    </>
  );
}
