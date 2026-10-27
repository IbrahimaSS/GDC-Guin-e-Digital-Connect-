"use client";

import { ArrowLeft, ArrowRight, Camera, Check, ClipboardList, LogIn, MapPin, Send, UserPlus, X, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { enter, gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { Avatar, Button, Card, cn, Field, Input, LinkButton, MetierIcon, Rating, Select, Textarea } from "@/components/ui";
import { Modal, Toggle } from "@/components/ui/interactive";
import AdressePicker from "@/components/map/AdressePicker";
import { formatGNF, getMetier, getTechnicien, METIERS, ZONES, type MetierId } from "@/lib/data";
import type { Point } from "@/lib/geo";
import { notifier } from "@/lib/notifier";

const ETAPES = ["Votre besoin", "Lieu et date"];
const CLE_BROUILLON = "gdc:demande-brouillon";

interface Brouillon {
  technicien?: string;
  metier: MetierId;
  titre: string;
  description: string;
  zone: string;
  adresse: string;
  point: Point | null;
  date: string;
  urgent: boolean;
  budget: string;
}

// Le brouillon survit à l'aller-retour vers la connexion ou l'inscription.
function lireBrouillon(): Brouillon | null {
  try {
    const brut = sessionStorage.getItem(CLE_BROUILLON);
    return brut ? (JSON.parse(brut) as Brouillon) : null;
  } catch {
    return null;
  }
}

function ecrireBrouillon(b: Brouillon | null) {
  try {
    if (b) sessionStorage.setItem(CLE_BROUILLON, JSON.stringify(b));
    else sessionStorage.removeItem(CLE_BROUILLON);
  } catch {
    // Stockage indisponible (navigation privée) : la demande sera simplement à ressaisir.
  }
}

/**
 * Publication d'une demande par un visiteur. Le besoin se décrit librement ; à l'envoi, le visiteur
 * se connecte ou crée son compte, puis revient ici avec `?envoi=1` pour finaliser l'envoi.
 */
function Wizard() {
  const params = useSearchParams();
  const retourAuth = params.get("envoi") === "1";
  // Rendu côté client uniquement (useSearchParams sous Suspense) : la lecture du stockage est sûre ici.
  const [initial] = useState(() => (retourAuth ? lireBrouillon() : null));
  const tech = getTechnicien(initial?.technicien ?? params.get("technicien") ?? "");
  const root = useRef<HTMLDivElement>(null);

  const [etape, setEtape] = useState(0);
  const [direction, setDirection] = useState(1);
  const [metier, setMetier] = useState<MetierId>(initial?.metier ?? tech?.metier ?? "electricite");
  const [titre, setTitre] = useState(initial?.titre ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [photos, setPhotos] = useState<string[]>([]);
  const [zone, setZone] = useState(initial?.zone ?? "Kaloum");
  const [adresse, setAdresse] = useState(initial?.adresse ?? "");
  const [point, setPoint] = useState<Point | null>(initial?.point ?? null);
  const [date, setDate] = useState(initial?.date ?? "");
  const [urgent, setUrgent] = useState(initial?.urgent ?? false);
  const [budget, setBudget] = useState(initial?.budget ?? "");
  const [authRequise, setAuthRequise] = useState(false);
  const envoyee = initial !== null;

  // Une fois la demande envoyée après connexion : SMS de confirmation, puis le brouillon n'a plus lieu d'être.
  useEffect(() => {
    if (!envoyee) return;
    ecrireBrouillon(null);
    notifier("demande_publiee", { mission: initial?.titre });
  }, [envoyee, initial]);

  useGSAP(
    () => {
      gsap.to(".pd-progress", { scaleX: (etape + 1) / ETAPES.length, duration: 0.6, ease: "power3.inOut" });
      if (prefersReducedMotion()) return;
      enter(".pd-step > *", { x: 40 * direction, autoAlpha: 0, stagger: 0.05, duration: 0.45 });
    },
    { dependencies: [etape], scope: root },
  );

  useGSAP(
    () => {
      if (!envoyee) return;
      gsap
        .timeline()
        .add(enter(".ok-card", { scale: 0.9, autoAlpha: 0, duration: 0.5, ease: "back.out(1.6)" }))
        .from(".ok-circle", { drawSVG: "0%", duration: 0.7, ease: "power2.inOut" }, "-=0.2")
        .from(".ok-check", { drawSVG: "0%", duration: 0.4 })
        .add(enter(".ok-text > *", { y: 14, autoAlpha: 0, stagger: 0.08, duration: 0.4 }), "-=0.2");
    },
    { dependencies: [envoyee], scope: root },
  );

  const aller = (n: number) => {
    setDirection(n > etape ? 1 : -1);
    setEtape(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function suivant(e: FormEvent) {
    e.preventDefault();
    if (etape < ETAPES.length - 1) return aller(etape + 1);
    // Fin du formulaire : on garde la demande et on demande au visiteur de s'identifier.
    ecrireBrouillon({ technicien: tech?.id, metier, titre, description, zone, adresse, point, date, urgent, budget });
    setAuthRequise(true);
  }

  const retour = encodeURIComponent("/publier-une-demande?envoi=1");

  if (envoyee) {
    return (
      <div ref={root} className="mx-auto max-w-xl py-10">
        <Card className="ok-card p-10 text-center">
          <svg viewBox="0 0 80 80" className="mx-auto size-20" aria-hidden>
            <circle className="ok-circle" cx="40" cy="40" r="36" fill="none" stroke="#10b981" strokeWidth="5" />
            <path className="ok-check" d="M24 41l11 11 21-23" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="ok-text">
            <h2 className="mt-6 text-2xl font-extrabold text-brand-950">Votre demande est envoyée !</h2>
            <p className="mt-2 font-semibold text-slate-800">« {initial.titre} »</p>
            <p className="mt-2 text-slate-500">
              {tech ? `${tech.nom} a été prévenu et vous répondra rapidement.` : "Les professionnels vérifiés de votre zone ont été prévenus."} Suivez les
              réponses et l&apos;avancement de la mission depuis votre espace client.
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <LinkButton href="/client/demandes" size="lg">
                Suivre ma demande
              </LinkButton>
              <LinkButton href="/" size="lg" variant="ghost">
                Retour à l&apos;accueil
              </LinkButton>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div ref={root} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <form onSubmit={suivant}>
        <Card className="p-6 md:p-8">
          {/* Étapes */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-semibold">
              {ETAPES.map((e, i) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => i < etape && aller(i)}
                  className={cn("flex items-center gap-2", i <= etape ? "text-brand-700" : "text-slate-400", i < etape && "hover:underline")}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-[11px]",
                      i < etape ? "bg-brand-600 text-white" : i === etape ? "bg-accent-500 text-white" : "bg-slate-200 text-slate-500",
                    )}
                  >
                    {i < etape ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="pd-progress h-full origin-left rounded-full bg-gradient-to-r from-brand-600 to-accent-500" style={{ transform: "scaleX(0.5)" }} />
            </div>
          </div>

          <div key={etape} className="pd-step space-y-5">
            {etape === 0 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">De quel type de travaux avez-vous besoin ?</h2>
                  <p className="mt-1 text-sm text-slate-500">Choisissez le métier puis décrivez votre problème.</p>
                </div>
                <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
                  {METIERS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetier(m.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-[11px] font-semibold transition duration-200",
                        metier === m.id ? "border-accent-500 bg-accent-50 text-accent-600" : "border-slate-200 text-slate-600 hover:border-brand-300",
                      )}
                    >
                      <MetierIcon metier={m.id} className="size-5" />
                      {m.label}
                    </button>
                  ))}
                </div>
                <Field label="Titre de la demande *">
                  <Input required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. : Fuite d'eau sous l'évier" />
                </Field>
                <Field label="Description du besoin *" hint={`${description.length}/500 caractères`}>
                  <Textarea
                    required
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez le problème, depuis quand, l'équipement concerné…"
                  />
                </Field>
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">Photos (optionnel)</p>
                  <div className="flex flex-wrap gap-3">
                    {photos.map((p) => (
                      <div key={p} className="relative flex size-20 items-center justify-center rounded-xl bg-brand-50 px-1 text-center text-[10px] font-medium text-brand-700">
                        {p}
                        <button type="button" onClick={() => setPhotos(photos.filter((x) => x !== p))} className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-900 p-0.5 text-white" aria-label="Retirer">
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-500 transition hover:border-brand-500 hover:text-brand-600">
                      <Camera className="size-5" />
                      Ajouter
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setPhotos([...photos, f.name.slice(0, 12)]);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {etape === 1 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Où et quand ?</h2>
                  <p className="mt-1 text-sm text-slate-500">Ces informations permettent de prévenir les professionnels proches de chez vous.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Zone *">
                    <Select value={zone} onChange={(e) => setZone(e.target.value)}>
                      {ZONES.map((z) => (
                        <option key={z}>{z}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Date souhaitée">
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </Field>
                </div>
                <AdressePicker
                  zone={zone}
                  point={point}
                  adresse={adresse}
                  onAdresseChange={setAdresse}
                  onChange={(v) => {
                    setPoint(v.point);
                    if (v.adresse) setAdresse(v.adresse);
                  }}
                />
                <Field label="Budget indicatif (GNF)" hint="Optionnel : le professionnel vous proposera un devis.">
                  <Input type="number" min={0} step={10000} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="300 000" />
                </Field>
                <div className={cn("rounded-xl border p-4 transition-colors", urgent ? "border-red-200 bg-red-50/60" : "border-slate-200")}>
                  <Toggle checked={urgent} onChange={setUrgent} label="Intervention urgente" description="Votre demande est mise en avant auprès des professionnels disponibles." />
                </div>
              </>
            )}
          </div>

          <div className="mt-8 flex gap-3 border-t border-slate-100 pt-6">
            {etape > 0 && (
              <Button variant="ghost" size="lg" onClick={() => aller(etape - 1)}>
                <ArrowLeft className="size-4" /> Retour
              </Button>
            )}
            <Button type="submit" size="lg" className="flex-1">
              {etape < ETAPES.length - 1 ? (
                <>
                  Continuer <ArrowRight className="size-4" />
                </>
              ) : (
                <>
                  <Send className="size-4" /> Envoyer la demande
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>

      {/* Récapitulatif */}
      <aside>
        <Card className="sticky top-24 p-6">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <ClipboardList className="size-5 text-brand-600" /> Récapitulatif
          </h2>
          {tech && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-50 p-3">
              <Avatar nom={tech.nom} className="size-10" />
              <div>
                <p className="text-xs text-brand-700">Demande adressée à</p>
                <p className="text-sm font-bold text-slate-900">{tech.nom}</p>
                <Rating note={tech.note} className="text-xs" />
              </div>
            </div>
          )}
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="rounded-lg bg-accent-50 p-2 text-accent-500">
                <MetierIcon metier={metier} className="size-4" />
              </span>
              <span className="font-semibold">{getMetier(metier).label}</span>
            </li>
            <li className="flex items-start gap-3 text-slate-600">
              <MapPin className="ml-2 mt-0.5 size-4 shrink-0 text-slate-400" /> {adresse ? `${adresse}, ${zone}` : `${zone}, Conakry`}
            </li>
            {budget && <li className="pl-9 text-slate-600">{formatGNF(Number(budget))}</li>}
            {urgent && (
              <li className="flex items-center gap-3 font-semibold text-red-600">
                <Zap className="ml-2 size-4" /> Urgent
              </li>
            )}
          </ul>
          <p className="mt-4 line-clamp-3 min-h-10 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{titre || description || "Votre description apparaîtra ici."}</p>
          <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-emerald-500" /> Gratuit et sans engagement
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-emerald-500" /> Uniquement des professionnels vérifiés
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-emerald-500" /> Suivi de la demande dans votre espace
            </li>
          </ul>
        </Card>
      </aside>

      <Modal open={authRequise} onClose={() => setAuthRequise(false)} title="Connectez-vous pour envoyer votre demande">
        <p>Votre demande est prête. Connectez-vous ou créez votre compte client : elle sera envoyée automatiquement juste après.</p>
        <div className="mt-6 space-y-3">
          <LinkButton href={`/connexion?redirect=${retour}`} size="lg" className="w-full">
            <LogIn className="size-4" /> Se connecter
          </LinkButton>
          <LinkButton href={`/inscription/client?redirect=${retour}`} size="lg" variant="outline" className="w-full">
            <UserPlus className="size-4" /> Créer un compte
          </LinkButton>
          <button type="button" onClick={() => setAuthRequise(false)} className="w-full py-1 text-sm font-semibold text-slate-500 hover:text-slate-800">
            Modifier ma demande
          </button>
        </div>
      </Modal>
    </div>
  );
}

/** Next conserve la page entre deux navigations : la clé force un nouvel état au retour de la connexion. */
export default function PublierDemandeWizard() {
  const envoi = useSearchParams().get("envoi");
  return <Wizard key={envoi ?? "nouvelle"} />;
}
