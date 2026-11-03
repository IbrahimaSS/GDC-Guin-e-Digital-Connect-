"use client";

import { BadgeCheck, Check, FileText, GraduationCap, IdCard, Images, Lock, Send, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, cn, Field, LinkButton, PageHeader, Textarea } from "@/components/ui";
import { api, apiActive, texteErreur } from "@/lib/api";
import { NIVEAUX, TECHNICIEN_CONNECTE as moi, type Niveau } from "@/lib/data";
import { ACCEPTE, televerser, verifierFichier } from "@/lib/fichiers";
import { useMonProfil } from "@/lib/monProfil";
import { useApi } from "@/lib/useApi";

/** Pièces demandées par niveau. `type` : nature de la pièce transmise à l'équipe GDC ; `auto` : critère vérifié d'office. */
const PIECES: Record<Niveau, { icon: typeof IdCard; label: string; type: string; auto?: "portfolio" | "missions" }[]> = {
  1: [
    { icon: IdCard, label: "Pièce d'identité (recto / verso)", type: "piece_identite" },
    { icon: Users, label: "Selfie de contrôle", type: "selfie" },
  ],
  2: [
    { icon: GraduationCap, label: "Diplôme, CAP ou attestation de formation", type: "diplome" },
    { icon: FileText, label: "Attestation d'employeur ou d'apprentissage", type: "attestation" },
    { icon: Images, label: "Photos de réalisations (3 minimum)", type: "photos_realisations" },
  ],
  3: [
    { icon: Users, label: "2 recommandations de clients ou d'entreprises", type: "recommandation" },
    { icon: Images, label: "Portfolio de 6 réalisations", type: "portfolio", auto: "portfolio" },
    { icon: FileText, label: "Justificatif de 20 missions réussies (automatique)", type: "missions", auto: "missions" },
  ],
};

interface VerificationApi {
  statut: "EN_ATTENTE" | "EN_COURS" | "APPROUVEE" | "REFUSEE";
}

export default function DemandeVerification() {
  const router = useRouter();
  const profil = useMonProfil().donnees;
  const enCours = (useApi<VerificationApi[]>(apiActive ? "/verifications" : null).donnees ?? []).some((v) => v.statut === "EN_ATTENTE" || v.statut === "EN_COURS");
  // Avec l'API, seul le niveau suivant peut être demandé (les niveaux se valident dans l'ordre).
  const niveauActuel = apiActive ? (profil?.niveau ?? 0) : moi.niveau;
  const prochain = Math.min(3, niveauActuel + 1) as Niveau;
  const [choix, setChoix] = useState<Niveau | null>(null);
  const niveau = choix ?? (apiActive ? prochain : 3);
  const [fichiers, setFichiers] = useState<Record<string, File>>({});
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const pieces = PIECES[niveau];
  const nbMissions = apiActive ? (profil?.nbMissions ?? 0) : moi.missions;
  const nbRealisations = profil?.realisations.length ?? 0;
  /** Critère automatique rempli ? (en démonstration, le portfolio se téléverse comme une pièce) */
  const autoRempli = (auto?: "portfolio" | "missions") =>
    auto === "missions" ? !apiActive || nbMissions >= 20 : auto === "portfolio" && apiActive ? nbRealisations >= 6 : false;
  const estAuto = (p: (typeof pieces)[number]) => p.auto === "missions" || (apiActive && p.auto === "portfolio");
  const complet = pieces.every((p) => (estAuto(p) ? autoRempli(p.auto) : fichiers[p.label]));
  const maximal = apiActive && niveauActuel >= 3;

  async function soumettre() {
    if (!apiActive) {
      toast(`Demande de vérification niveau ${niveau} envoyée`);
      return router.push("/technicien/verification/suivi");
    }
    setEnvoi(true);
    try {
      const envoyees = await Promise.all(
        pieces.filter((p) => fichiers[p.label]).map(async (p) => ({ type: p.type, url: await televerser(fichiers[p.label], "piece") })),
      );
      await api("/verifications", { methode: "POST", corps: { niveau, pieces: envoyees, message: message.trim() || undefined } });
      toast(`Demande de vérification niveau ${niveau} envoyée`);
      router.push("/technicien/verification/suivi");
    } catch (e) {
      toast(texteErreur(e), "error");
    } finally {
      setEnvoi(false);
    }
  }

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
      {(enCours || maximal) && (
        <Card className="mb-6 flex flex-col gap-3 border-brand-100 bg-brand-50 p-5 text-sm text-brand-800 sm:flex-row sm:items-center">
          <BadgeCheck className="size-6 shrink-0 text-brand-600" />
          <p className="flex-1">
            {maximal ? "Vous avez atteint le niveau maximal : Recommandé." : "Une demande de vérification est déjà en cours d'examen. Vous pourrez en déposer une nouvelle après la décision."}
          </p>
          {enCours && (
            <LinkButton href="/technicien/verification/suivi" size="sm" variant="outline">
              Suivre ma demande
            </LinkButton>
          )}
        </Card>
      )}
      <Reveal className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-slate-900">1. Niveau souhaité</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {([1, 2, 3] as Niveau[]).map((n) => {
              const acquis = n <= niveauActuel;
              const actif = niveau === n;
              // Avec l'API, les niveaux se demandent dans l'ordre.
              const bloque = apiActive && n > prochain;
              return (
                <button
                  key={n}
                  disabled={acquis || bloque}
                  onClick={() => setChoix(n)}
                  className={cn(
                    "relative rounded-2xl border-2 p-5 text-left transition duration-300",
                    acquis
                      ? "cursor-default border-emerald-200 bg-emerald-50/60"
                      : bloque
                        ? "cursor-not-allowed border-slate-200 opacity-50"
                        : actif
                          ? "border-accent-500 bg-accent-50/50 shadow-lg shadow-accent-500/10"
                          : "border-slate-200 hover:border-brand-300",
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
            {pieces.map((p) => {
              const { icon: Icon, label } = p;
              const auto = estAuto(p);
              const rempli = auto && autoRempli(p.auto);
              const f = fichiers[label]?.name;
              return (
                <label
                  key={label}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition",
                    auto ? "cursor-default border-slate-200 bg-slate-50" : "cursor-pointer",
                    f ? "border-emerald-400 bg-emerald-50/60" : !auto && "border-slate-300 hover:border-brand-400",
                  )}
                >
                  <span className={cn("rounded-xl p-3", f || rempli ? "bg-emerald-500 text-white" : auto ? "bg-slate-200 text-slate-500" : "bg-brand-50 text-brand-600")}>
                    {f || rempli ? <Check className="size-5" /> : <Icon className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900">{label}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {p.auto === "missions" && auto
                        ? `${nbMissions} mission${nbMissions > 1 ? "s" : ""} réussie${nbMissions > 1 ? "s" : ""}${rempli ? " ✓" : " sur 20 requises"}`
                        : p.auto === "portfolio" && auto
                          ? `${nbRealisations} réalisation${nbRealisations > 1 ? "s" : ""} au portfolio${rempli ? " ✓" : " sur 6 requises"}`
                          : (f ?? "PDF, JPG, PNG ou WebP – 8 Mo max.")}
                    </span>
                  </span>
                  {!auto && <span className="text-xs font-bold text-brand-600">{f ? "Remplacer" : "Téléverser"}</span>}
                  {!auto && (
                    <input
                      type="file"
                      accept={ACCEPTE.piece}
                      className="sr-only"
                      onChange={(e) => {
                        const fi = e.target.files?.[0];
                        e.target.value = "";
                        if (!fi) return;
                        const probleme = verifierFichier(fi, "piece");
                        if (probleme) return toast(probleme, "error");
                        setFichiers({ ...fichiers, [label]: fi });
                      }}
                    />
                  )}
                </label>
              );
            })}
          </Reveal>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-bold text-slate-900">3. Message à l&apos;équipe (optionnel)</h2>
          <Field label="Précisions">
            <Textarea maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Expliquez votre parcours, vos certifications…" />
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
          <Button size="lg" disabled={!complet || envoi || enCours || maximal} onClick={soumettre}>
            <Send className="size-4" /> {envoi ? "Envoi des pièces…" : "Soumettre la demande"}
          </Button>
        </div>
      </Reveal>
    </>
  );
}
