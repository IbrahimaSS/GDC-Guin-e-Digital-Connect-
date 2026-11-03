"use client";

import { ChevronLeft, Heart, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Avatar, Button, Card, cn, EmptyState, Field, LinkButton, Textarea } from "@/components/ui";
import { StarInput } from "@/components/ui/interactive";
import { api, apiActive, texteErreur } from "@/lib/api";
import { getMetier, getTechnicien, type Demande } from "@/lib/data";
import { technicienDe, useDemande } from "@/lib/demandes";

// Critère affiché → champ attendu par l'API.
const CRITERES = { Ponctualité: "ponctualite", "Qualité du travail": "qualite", "Rapport qualité / prix": "prix", Communication: "communication" } as const;
const TAGS = ["Travail soigné", "Rapide", "Bons conseils", "Très poli", "Prix honnête", "Matériel de qualité"];

/** Évaluation d'une demande chargée depuis l'API. */
export function EvaluationApi({ id }: { id: string }) {
  const { demande, chargement, erreur } = useDemande(id);
  if (chargement) return <div className="mx-auto h-80 max-w-2xl animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />;
  if (!demande) return <EmptyState icon={Star} title="Demande introuvable" text={erreur ?? "Cette demande n'existe pas ou ne vous appartient pas."} />;
  if (demande.statut !== "terminee" || demande.evaluee) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <EmptyState
          icon={Star}
          title={demande.evaluee ? "Avis déjà publié" : "Mission pas encore terminée"}
          text={demande.evaluee ? "Merci, vous avez déjà donné votre avis sur cette mission." : "Vous pourrez donner votre avis une fois l'intervention terminée."}
        />
        <LinkButton href={`/client/demandes/${demande.id}`} variant="outline">
          Retour à la demande
        </LinkButton>
      </div>
    );
  }
  return <EvaluationForm demande={demande} />;
}

export default function EvaluationForm({ demande }: { demande: Demande }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const tech = technicienDe(demande) ?? getTechnicien("mamadou-diallo")!;
  const [note, setNote] = useState(0);
  const [criteres, setCriteres] = useState<Record<string, number>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [commentaire, setCommentaire] = useState("");
  const [recommande, setRecommande] = useState<boolean | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useGSAP(
    () => {
      if (note) gsap.fromTo(".eval-details", { height: 0, autoAlpha: 0 }, { height: "auto", autoAlpha: 1, duration: 0.6, ease: "power3.out" });
    },
    { dependencies: [note > 0], scope: ref },
  );

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!note) return toast("Choisissez une note globale", "error");
    if (apiActive) {
      // Le détail des critères n'est transmis que s'il est complet.
      const detail = Object.entries(CRITERES).map(([libelle, cle]) => [cle, criteres[libelle]] as const);
      setEnvoi(true);
      try {
        await api(`/demandes/${encodeURIComponent(demande.id)}/avis`, {
          methode: "POST",
          corps: {
            note,
            criteres: detail.every(([, v]) => v) ? Object.fromEntries(detail) : undefined,
            tags,
            commentaire: commentaire.trim() || undefined,
            recommande: recommande ?? undefined,
          },
        });
      } catch (err) {
        setEnvoi(false);
        return toast(texteErreur(err), "error");
      }
    }
    toast("Merci ! Votre avis aide toute la communauté GDC.");
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
                  {Object.keys(CRITERES).map((c) => (
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
                  <Textarea
                    maxLength={1000}
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Votre avis aidera d'autres clients à faire leur choix…"
                  />
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
            <Button type="submit" size="lg" className="flex-1" disabled={!note || envoi}>
              <Heart className="size-4" /> {envoi ? "Publication…" : "Publier mon avis"}
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
