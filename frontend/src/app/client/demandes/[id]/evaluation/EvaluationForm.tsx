"use client";

import { ChevronLeft, Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Avatar, Button, Card, cn, Field, Textarea } from "@/components/ui";
import { StarInput } from "@/components/ui/interactive";
import { getMetier, getTechnicien, type Demande } from "@/lib/data";

const CRITERES = ["Ponctualité", "Qualité du travail", "Rapport qualité / prix", "Communication"];
const TAGS = ["Travail soigné", "Rapide", "Bons conseils", "Très poli", "Prix honnête", "Matériel de qualité"];

export default function EvaluationForm({ demande }: { demande: Demande }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const tech = getTechnicien(demande.technicienId ?? "mamadou-diallo")!;
  const [note, setNote] = useState(0);
  const [criteres, setCriteres] = useState<Record<string, number>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [recommande, setRecommande] = useState<boolean | null>(null);

  useGSAP(
    () => {
      if (note) gsap.fromTo(".eval-details", { height: 0, autoAlpha: 0 }, { height: "auto", autoAlpha: 1, duration: 0.6, ease: "power3.out" });
    },
    { dependencies: [note > 0], scope: ref },
  );

  function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!note) return toast("Choisissez une note globale", "error");
    toast("Merci ! Votre avis aide toute la communauté GDC 🙏");
    router.push(`/client/demandes/${demande.id}`);
  }

  return (
    <div ref={ref} className="mx-auto max-w-2xl">
      <Link href={`/client/demandes/${demande.id}`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-600">
        <ChevronLeft className="size-4" /> Retour à la demande
      </Link>
      <form onSubmit={envoyer}>
        <Reveal stagger={0.1}>
          <Card className="p-8 text-center">
            <Avatar nom={tech.nom} className="mx-auto size-20 text-xl" />
            <p className="mt-3 text-sm text-slate-500">
              {demande.titre} · {demande.date}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-brand-950">Comment s&apos;est passée l&apos;intervention de {tech.nom.split(" ")[0]} ?</h1>
            <p className="mt-1 text-sm text-slate-500">{getMetier(tech.metier).label}</p>
            <div className="mt-6 flex justify-center">
              <StarInput value={note} onChange={setNote} size="size-11" />
            </div>
          </Card>

          {note > 0 && (
            <div className="eval-details space-y-5 overflow-hidden">
              <Card className="mt-5 p-6">
                <h2 className="mb-4 font-bold text-slate-900">Détaillez votre note</h2>
                <ul className="space-y-4">
                  {CRITERES.map((c) => (
                    <li key={c} className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-slate-700">{c}</span>
                      <StarInput value={criteres[c] ?? 0} onChange={(v) => setCriteres({ ...criteres, [c]: v })} size="size-6" />
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <h2 className="mb-3 font-bold text-slate-900">Ce que vous avez apprécié</h2>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                        tags.includes(t) ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-slate-600 hover:border-brand-500",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Field label="Commentaire (optionnel)" className="mt-5">
                  <Textarea placeholder="Votre avis aidera d'autres clients à faire leur choix…" />
                </Field>
                <p className="mb-2 mt-5 text-sm font-semibold text-slate-700">Recommanderiez-vous ce professionnel ?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: true, label: "Oui", icon: ThumbsUp, on: "border-emerald-500 bg-emerald-50 text-emerald-700" },
                    { v: false, label: "Non", icon: ThumbsDown, on: "border-red-400 bg-red-50 text-red-600" },
                  ].map(({ v, label, icon: Icon, on }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setRecommande(v)}
                      className={cn("flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold transition", recommande === v ? on : "border-slate-200 text-slate-600")}
                    >
                      <Icon className="size-4" /> {label}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
            <Button type="submit" size="lg" className="flex-1" disabled={!note}>
              <Heart className="size-4" /> Publier mon avis
            </Button>
            <Button variant="ghost" size="lg" onClick={() => router.push("/client/demandes")}>
              Plus tard
            </Button>
          </div>
        </Reveal>
      </form>
    </div>
  );
}
