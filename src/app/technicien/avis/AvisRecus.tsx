"use client";

import { CornerDownRight, MessageSquareReply, Star } from "lucide-react";
import { useRef, useState } from "react";
import { ProgressBar } from "@/components/motion/Charts";
import Counter from "@/components/motion/Counter";
import { gsap, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Avatar, Button, Card, cn, PageHeader, Stars, Textarea } from "@/components/ui";
import { TECHNICIEN_CONNECTE as moi } from "@/lib/data";

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

function Reponse({ id, reponse, onSave }: { id: string; reponse?: string; onSave: (id: string, txt: string) => void }) {
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
              onClick={() => {
                onSave(id, texte);
                toast("Réponse publiée");
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

export default function AvisRecus() {
  const [filtre, setFiltre] = useState(0);
  const [reponses, setReponses] = useState<Record<string, string>>({ a2: "Merci beaucoup Fatoumata, au plaisir de vous aider à nouveau !" });
  const total = REPARTITION.reduce((s, r) => s + r.c, 0);
  const avis = moi.avis.filter((a) => !filtre || a.note === filtre);

  return (
    <>
      <PageHeader title="Avis reçus" subtitle="Les avis sont publiés uniquement après une mission terminée." />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Reveal className="space-y-6">
          <Card className="p-6 text-center">
            <p className="text-6xl font-extrabold text-brand-950">
              <Counter value={moi.note} decimals={1} />
            </p>
            <div className="mt-2 flex justify-center">
              <Stars note={5} className="size-5" />
            </div>
            <p className="mt-1 text-sm text-slate-500">{moi.nbAvis} avis</p>
            <ul className="mt-6 space-y-2">
              {REPARTITION.map((r) => (
                <li key={r.n}>
                  <button
                    onClick={() => setFiltre(filtre === r.n ? 0 : r.n)}
                    className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs transition", filtre === r.n ? "bg-amber-50" : "hover:bg-slate-50")}
                  >
                    <span className="flex w-6 items-center gap-0.5 font-semibold">
                      {r.n} <Star className="size-3 fill-amber-400 text-amber-400" />
                    </span>
                    <ProgressBar value={(r.c / total) * 100} color="bg-amber-400" />
                    <span className="w-6 text-right text-slate-500">{r.c}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Notes détaillées</h2>
            <ul className="space-y-4">
              {CRITERES.map((c) => (
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
            <p className="py-10 text-center text-sm text-slate-500">Aucun avis avec cette note.</p>
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
                      <Reponse id={a.id} reponse={reponses[a.id]} onSave={(id, txt) => setReponses({ ...reponses, [id]: txt })} />
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
