"use client";

import { ArrowLeft, ArrowRight, Check, FileUp, IdCard, ImagePlus, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import EtapeCode from "@/components/auth/EtapeCode";
import { useVerificationNumero } from "@/components/auth/useVerificationNumero";
import { enter, gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { toast } from "@/components/motion/Toaster";
import { Button, cn, Field, Input, MetierIcon, Select, Textarea } from "@/components/ui";
import { apiActive, texteErreur } from "@/lib/api";
import { idZone, inscrire, useZonesApi } from "@/lib/auth";
import { METIERS, ZONES, type MetierId } from "@/lib/data";
import { ESPACE_ROLE, formaterNumero, useNumeroVerifie } from "@/lib/session";

const ETAPES = ["Identité", "Métier", "Documents"];
const SPECIALITES = ["Installation", "Dépannage", "Maintenance", "Rénovation", "Conseil", "Urgences"];

function DropZone({ icon: Icon, titre, texte }: { icon: typeof IdCard; titre: string; texte: string }) {
  const [fichier, setFichier] = useState<string | null>(null);
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition",
        fichier ? "border-emerald-400 bg-emerald-50/60" : "border-slate-300 hover:border-brand-400 hover:bg-brand-50/40",
      )}
    >
      <span className={cn("rounded-xl p-3", fichier ? "bg-emerald-500 text-white" : "bg-brand-50 text-brand-600")}>
        {fichier ? <Check className="size-5" /> : <Icon className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-900">{titre}</span>
        <span className="block truncate text-xs text-slate-500">{fichier ?? texte}</span>
      </span>
      <span className="text-xs font-semibold text-brand-600">{fichier ? "Changer" : "Ajouter"}</span>
      <input type="file" className="sr-only" accept="image/*,.pdf" onChange={(e) => setFichier(e.target.files?.[0]?.name ?? null)} />
    </label>
  );
}

export default function InscriptionTechnicienForm() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [etape, setEtape] = useState(0);
  const [direction, setDirection] = useState(1);
  const [metier, setMetier] = useState<MetierId>("electricite");
  const [specialites, setSpecialites] = useState<string[]>(["Installation"]);
  const [zones, setZones] = useState<string[]>(["Kaloum"]);
  // Les étapes se remplacent à l'écran : les valeurs saisies sont gardées ici.
  const [infos, setInfos] = useState({ nom: "", prenom: "", zone: "Kaloum", entreprise: "", experience: 3, bio: "" });
  // Numéro déjà vérifié sur la page de connexion : prérempli tant que l'utilisateur ne le modifie pas.
  const verifie = useNumeroVerifie();
  const [telephoneSaisi, setTelephone] = useState<string | null>(null);
  const telephone = telephoneSaisi ?? (verifie ? formaterNumero(verifie.telephone) : "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const zonesApi = useZonesApi(apiActive);
  const champ = (cle: keyof typeof infos) => ({
    value: infos[cle],
    onChange: (e: { target: { value: string } }) => setInfos((i) => ({ ...i, [cle]: cle === "experience" ? Number(e.target.value) : e.target.value })),
  });

  const verification = useVerificationNumero({
    async creerCompte(jetonInscription) {
      const ids = (noms: string[]) => noms.map((z) => idZone(zonesApi, z)).filter((id): id is string => Boolean(id));
      await inscrire({
        jetonInscription,
        nom: infos.nom.trim(),
        prenom: infos.prenom.trim(),
        role: "TECHNICIEN",
        zoneId: idZone(zonesApi, infos.zone),
        entreprise: infos.entreprise.trim() || undefined,
        technicien: { metierId: metier, specialites, experience: infos.experience, zones: ids(zones), bio: infos.bio.trim() || undefined },
      });
      toast("Profil créé ! Envoyez vos pièces depuis « Vérification » pour être visible des clients.");
      router.push("/technicien");
    },
    compteExistant(utilisateur) {
      toast(`Ce numéro avait déjà un compte : vous êtes connecté, ${utilisateur.prenom}.`, "info");
      router.push(ESPACE_ROLE[utilisateur.role]);
    },
  });

  useGSAP(
    () => {
      gsap.to(".st-progress", { scaleX: etape / (ETAPES.length - 1), duration: 0.6, ease: "power3.inOut" });
      if (prefersReducedMotion()) return;
      enter(".wizard-step > *", { x: 50 * direction, autoAlpha: 0, stagger: 0.05, duration: 0.5 });
      gsap.fromTo(`.st-dot-${etape}`, { scale: 0.6 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
    },
    { dependencies: [etape], scope: ref },
  );

  const aller = (n: number) => {
    setDirection(n > etape ? 1 : -1);
    setEtape(n);
  };

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function suivant(e: FormEvent) {
    e.preventDefault();
    if (etape < ETAPES.length - 1) return aller(etape + 1);
    if (!apiActive) {
      toast("Profil créé ! Votre dossier de vérification niveau 1 est en cours.");
      return router.push("/technicien");
    }
    setErreur("");
    setEnvoi(true);
    try {
      await verification.demarrer(telephone);
    } catch (err) {
      setErreur(texteErreur(err));
    } finally {
      setEnvoi(false);
    }
  }

  if (verification.telephone) {
    return (
      <EtapeCode
        titre="Vérifiez votre numéro"
        telephone={telephone}
        onValider={verification.valider}
        onRenvoyer={verification.renvoyer}
        onRetour={() => {
          verification.annuler();
          aller(0);
        }}
      />
    );
  }

  return (
    <div ref={ref}>
      <Link href="/inscription" className="text-sm font-semibold text-slate-500 hover:text-brand-600">
        ← Changer de type de compte
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950">Créer votre compte technicien</h1>
      <p className="mt-2 text-slate-500">Inscription gratuite. Votre profil sera visible après la vérification de niveau 1.</p>

      {/* Indicateur d'étapes */}
      <div className="relative mt-8 flex justify-between">
        <span className="absolute left-4 right-4 top-4 h-0.5 bg-slate-200" />
        <span className="st-progress absolute left-4 right-4 top-4 h-0.5 origin-left bg-accent-500" style={{ transform: "scaleX(0)" }} />
        {ETAPES.map((label, i) => (
          <button key={label} type="button" onClick={() => i < etape && aller(i)} className="relative z-10 flex flex-col items-center gap-2">
            <span
              className={cn(
                `st-dot-${i} flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300`,
                i < etape ? "bg-accent-500 text-white" : i === etape ? "bg-brand-600 text-white ring-4 ring-brand-100" : "bg-white text-slate-400 ring-2 ring-slate-200",
              )}
            >
              {i < etape ? <Check className="size-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn("text-xs font-semibold", i <= etape ? "text-slate-900" : "text-slate-400")}>{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={suivant} className="mt-8">
        <div key={etape} className="wizard-step space-y-4">
          {etape === 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom *">
                  <Input required placeholder="Diallo" autoComplete="family-name" {...champ("nom")} />
                </Field>
                <Field label="Prénom *">
                  <Input required placeholder="Mamadou" autoComplete="given-name" {...champ("prenom")} />
                </Field>
                <Field label="Téléphone *" hint="Un code de vérification vous sera envoyé.">
                  <Input
                    required
                    type="tel"
                    placeholder="620 12 34 56"
                    autoComplete="tel-national"
                    pattern="\s*(\+?224)?[\s.]*6(\s*\d){8}\s*"
                    title="Numéro mobile guinéen à 9 chiffres, ex. 620 12 34 56"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                  />
                </Field>
                <Field label="Zone principale *">
                  <Select required {...champ("zone")}>
                    {ZONES.map((z) => (
                      <option key={z}>{z}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Entreprise (optionnel)">
                <Input placeholder="Nom de votre atelier ou entreprise" {...champ("entreprise")} />
              </Field>
            </>
          )}

          {etape === 1 && (
            <>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Métier principal *</p>
                <div className="grid grid-cols-4 gap-2">
                  {METIERS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetier(m.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-[11px] font-semibold transition",
                        metier === m.id ? "border-accent-500 bg-accent-50 text-accent-600" : "border-slate-200 text-slate-600 hover:border-brand-300",
                      )}
                    >
                      <MetierIcon metier={m.id} className="size-5" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Spécialités</p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALITES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggle(specialites, setSpecialites, s)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                        specialites.includes(s) ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-slate-600 hover:border-brand-500",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Années d'expérience *">
                  <Input required type="number" min={0} max={60} {...champ("experience")} />
                </Field>
                <Field label="Disponibilité">
                  <Select defaultValue="semaine">
                    <option value="semaine">Lundi – Samedi</option>
                    <option value="tous">Tous les jours</option>
                    <option value="weekend">Week-end uniquement</option>
                  </Select>
                </Field>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Zones d&apos;intervention</p>
                <div className="flex flex-wrap gap-2">
                  {ZONES.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => toggle(zones, setZones, z)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                        zones.includes(z) ? "border-accent-500 bg-accent-50 text-accent-600" : "border-slate-300 text-slate-600 hover:border-accent-400",
                      )}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Description">
                <Textarea placeholder="Présentez votre expérience, vos points forts…" maxLength={1000} {...champ("bio")} />
              </Field>
            </>
          )}

          {etape === 2 && (
            <>
              <p className="text-sm text-slate-500">Ces documents servent uniquement à la vérification de votre profil. Ils ne sont jamais publiés.</p>
              <DropZone icon={IdCard} titre="Pièce d'identité *" texte="CNI ou passeport – photo recto/verso" />
              <DropZone icon={GraduationCap} titre="Diplômes ou attestations" texte="Recommandé pour le niveau 2" />
              <DropZone icon={ImagePlus} titre="Photos de réalisations" texte="Jusqu'à 10 photos de vos travaux" />
              <DropZone icon={FileUp} titre="Photo de profil" texte="Visage bien visible, fond clair" />
              <label className="flex items-start gap-3 pt-2 text-sm text-slate-600">
                <input required type="checkbox" className="mt-0.5 size-4 accent-brand-600" />
                Je certifie l&apos;exactitude des informations et j&apos;accepte les conditions d&apos;utilisation de GDC.
              </label>
            </>
          )}
        </div>

        {erreur && <p className="mt-6 text-sm font-medium text-red-600">{erreur}</p>}
        <div className="mt-8 flex gap-3">
          {etape > 0 && (
            <Button variant="ghost" size="lg" onClick={() => aller(etape - 1)}>
              <ArrowLeft className="size-4" /> Retour
            </Button>
          )}
          <Button type="submit" size="lg" className="flex-1" disabled={envoi}>
            {envoi ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Envoi du code…
              </>
            ) : etape < ETAPES.length - 1 ? (
              <>
                Suivant <ArrowRight className="size-4" />
              </>
            ) : (
              "Créer mon profil"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
