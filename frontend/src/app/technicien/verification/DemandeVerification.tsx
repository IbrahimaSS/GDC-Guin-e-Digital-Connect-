"use client";

import { BadgeCheck, Check, FileText, GraduationCap, IdCard, Images, Lock, Send, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, cn, Field, PageHeader, Textarea } from "@/components/ui";
import { NIVEAUX, TECHNICIEN_CONNECTE as moi, type Niveau } from "@/lib/data";

const PIECES: Record<Niveau, { icon: typeof IdCard; label: string }[]> = {
  1: [
    { icon: IdCard, label: "Pièce d'identité (recto / verso)" },
    { icon: Users, label: "Selfie de contrôle" },
  ],
  2: [
    { icon: GraduationCap, label: "Diplôme, CAP ou attestation de formation" },
    { icon: FileText, label: "Attestation d'employeur ou d'apprentissage" },
    { icon: Images, label: "Photos de réalisations (3 minimum)" },
  ],
  3: [
    { icon: Users, label: "2 recommandations de clients ou d'entreprises" },
    { icon: Images, label: "Portfolio de 6 réalisations" },
    { icon: FileText, label: "Justificatif de 20 missions réussies (automatique)" },
  ],
};

export default function DemandeVerification() {
  const router = useRouter();
  const [niveau, setNiveau] = useState<Niveau>(3);
  const [fichiers, setFichiers] = useState<Record<string, string>>({});

  const pieces = PIECES[niveau];
  const complet = pieces.every((p) => fichiers[p.label] || p.label.includes("automatique"));

  return (
    <>
      <PageHeader
        title="Demande de vérification"
        subtitle="Augmentez la confiance des clients en faisant vérifier vos compétences."
        actions={
          <Link href="/technicien/verification/suivi" className="text-sm font-semibold text-brand-600 hover:underline">
            Suivre mes demandes →
          </Link>
        }
      />
      <Reveal className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-slate-900">1. Niveau souhaité</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {([1, 2, 3] as Niveau[]).map((n) => {
              const acquis = n <= moi.niveau;
              const actif = niveau === n;
              return (
                <button
                  key={n}
                  disabled={acquis}
                  onClick={() => setNiveau(n)}
                  className={cn(
                    "relative rounded-2xl border-2 p-5 text-left transition duration-300",
                    acquis ? "cursor-default border-emerald-200 bg-emerald-50/60" : actif ? "border-accent-500 bg-accent-50/50 shadow-lg shadow-accent-500/10" : "border-slate-200 hover:border-brand-300",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className={cn("flex size-10 items-center justify-center rounded-xl text-lg font-extrabold", acquis ? "bg-emerald-500 text-white" : actif ? "bg-accent-500 text-white" : "bg-brand-50 text-brand-700")}>
                      {acquis ? <Check className="size-5" strokeWidth={3} /> : n}
                    </span>
                    {acquis && <span className="text-xs font-bold text-emerald-700">Acquis</span>}
                  </span>
                  <span className="mt-4 block font-bold text-slate-900">
                    Niveau {n} – {NIVEAUX[n].label}
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">{NIVEAUX[n].description}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-1 font-bold text-slate-900">2. Justificatifs</h2>
          <p className="mb-4 flex items-center gap-1.5 text-sm text-slate-500">
            <Lock className="size-3.5" /> Documents chiffrés, consultés uniquement par l&apos;équipe de vérification.
          </p>
          <Reveal className="space-y-3" deps={[niveau]} x={20} y={0}>
            {pieces.map(({ icon: Icon, label }) => {
              const auto = label.includes("automatique");
              const f = fichiers[label];
              return (
                <label
                  key={label}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition",
                    auto ? "cursor-default border-slate-200 bg-slate-50" : "cursor-pointer",
                    f ? "border-emerald-400 bg-emerald-50/60" : !auto && "border-slate-300 hover:border-brand-400",
                  )}
                >
                  <span className={cn("rounded-xl p-3", f || auto ? "bg-emerald-500 text-white" : "bg-brand-50 text-brand-600")}>
                    {f || auto ? <Check className="size-5" /> : <Icon className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900">{label}</span>
                    <span className="block truncate text-xs text-slate-500">{auto ? `${moi.missions} missions réussies détectées ✓` : (f ?? "PDF, JPG ou PNG – 10 Mo max.")}</span>
                  </span>
                  {!auto && <span className="text-xs font-bold text-brand-600">{f ? "Remplacer" : "Téléverser"}</span>}
                  {!auto && (
                    <input type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && setFichiers({ ...fichiers, [label]: e.target.files[0].name })} />
                  )}
                </label>
              );
            })}
          </Reveal>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-bold text-slate-900">3. Message à l&apos;équipe (optionnel)</h2>
          <Field label="Précisions">
            <Textarea placeholder="Expliquez votre parcours, vos certifications…" />
          </Field>
        </Card>

        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-brand-950 p-6 text-white md:flex-row">
          <p className="flex items-center gap-3">
            <BadgeCheck className="size-8 text-accent-400" />
            <span>
              <span className="block font-bold">Délai moyen d&apos;évaluation : 3 à 5 jours</span>
              <span className="text-sm text-brand-100/70">Vous serez notifié par SMS à chaque étape.</span>
            </span>
          </p>
          <Button
            size="lg"
            disabled={!complet}
            onClick={() => {
              toast(`Demande de vérification niveau ${niveau} envoyée`);
              router.push("/technicien/verification/suivi");
            }}
          >
            <Send className="size-4" /> Soumettre la demande
          </Button>
        </div>
      </Reveal>
    </>
  );
}
