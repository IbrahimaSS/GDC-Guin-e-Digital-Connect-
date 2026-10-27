"use client";

import { CalendarDays, Camera, CheckCircle2, MapPin, Send, Wallet, X, Zap } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { enter, gsap, useGSAP } from "@/components/motion/gsap";
import Reveal from "@/components/motion/Reveal";
import { Avatar, Button, Card, cn, Field, Input, LinkButton, MetierIcon, PageHeader, Rating, Select, Textarea } from "@/components/ui";
import { Toggle } from "@/components/ui/interactive";
import AdressePicker from "@/components/map/AdressePicker";
import { CLIENT_CONNECTE, formatGNF, getMetier, getTechnicien, METIERS, ZONES, type MetierId } from "@/lib/data";
import type { Point } from "@/lib/geo";

export default function NouvelleDemandeForm() {
  const params = useSearchParams();
  const tech = getTechnicien(params.get("technicien") ?? "");
  const root = useRef<HTMLDivElement>(null);

  const [metier, setMetier] = useState<MetierId>(tech?.metier ?? "electricite");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [zone, setZone] = useState("Kaloum");
  const [adresse, setAdresse] = useState(CLIENT_CONNECTE.adresse);
  const [point, setPoint] = useState<Point | null>(null);
  const [date, setDate] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [budget, setBudget] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [envoyee, setEnvoyee] = useState(false);

  useGSAP(
    () => {
      if (!envoyee) return;
      gsap
        .timeline()
        .add(enter(".ok-card", { scale: 0.8, autoAlpha: 0, duration: 0.6, ease: "back.out(1.6)" }))
        .from(".ok-circle", { drawSVG: "0%", duration: 0.7, ease: "power2.inOut" }, "-=0.2")
        .from(".ok-check", { drawSVG: "0%", duration: 0.4, ease: "power2.out" })
        .add(enter(".ok-text > *", { y: 14, autoAlpha: 0, stagger: 0.08, duration: 0.4 }), "-=0.2");
      gsap.fromTo(".ok-burst span", { scale: 0, x: 0, y: 0, opacity: 1 }, {
        scale: 1,
        x: () => gsap.utils.random(-160, 160),
        y: () => gsap.utils.random(-140, 60),
        opacity: 0,
        rotate: () => gsap.utils.random(-180, 180),
        duration: 1.4,
        ease: "power3.out",
        stagger: 0.01,
        delay: 0.5,
      });
    },
    { dependencies: [envoyee], scope: root },
  );

  function envoyer(e: FormEvent) {
    e.preventDefault();
    setEnvoyee(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (envoyee) {
    return (
      <div ref={root} className="flex min-h-[70vh] items-center justify-center">
        <Card className="ok-card relative w-full max-w-lg overflow-visible p-10 text-center">
          <div className="ok-burst pointer-events-none absolute left-1/2 top-20" aria-hidden>
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} className={cn("absolute size-2 rounded-sm", ["bg-accent-500", "bg-brand-600", "bg-emerald-500", "bg-yellow-400"][i % 4])} />
            ))}
          </div>
          <svg viewBox="0 0 80 80" className="mx-auto size-20" aria-hidden>
            <circle className="ok-circle" cx="40" cy="40" r="36" fill="none" stroke="#10b981" strokeWidth="5" />
            <path className="ok-check" d="M24 41l11 11 21-23" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="ok-text">
            <h1 className="mt-6 text-2xl font-extrabold text-brand-950">Demande envoyée !</h1>
            <p className="mt-2 text-slate-500">
              {tech ? `${tech.nom} a été notifié et vous répondra rapidement.` : "Les professionnels vérifiés de votre zone ont été notifiés."} Vous recevrez une
              notification par SMS dès qu&apos;un technicien accepte.
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <LinkButton href="/client/demandes" size="lg">
                Suivre mes demandes
              </LinkButton>
              <Button variant="ghost" size="lg" onClick={() => setEnvoyee(false)}>
                Nouvelle demande
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div ref={root}>
      <PageHeader title="Créer une demande d'intervention" subtitle="Plus votre description est précise, plus les réponses seront rapides." />
      <form onSubmit={envoyer} className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Reveal className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">1. Quel type de travaux ?</h2>
            <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
              {METIERS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetier(m.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-[11px] font-semibold transition duration-200",
                    metier === m.id ? "scale-105 border-accent-500 bg-accent-50 text-accent-600 shadow-md" : "border-slate-200 text-slate-600 hover:border-brand-300",
                  )}
                >
                  <MetierIcon metier={m.id} className="size-5" />
                  {m.label}
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Titre de la demande *">
                <Input required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. : Réparation de climatisation" />
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
                    <div key={p} className="relative flex size-20 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 text-[10px] font-medium text-brand-700">
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
                        if (f) setPhotos([...photos, f.name.slice(0, 10)]);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">2. Où et quand ?</h2>
            <div className="grid gap-4 md:grid-cols-2">
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
              <Field label="Créneau">
                <Select defaultValue="matin">
                  <option value="matin">Matin (8h – 12h)</option>
                  <option value="aprem">Après-midi (12h – 17h)</option>
                  <option value="soir">Soir (17h – 20h)</option>
                  <option value="flex">Flexible</option>
                </Select>
              </Field>
            </div>
            <div className="mt-5">
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
            </div>
            <div className={cn("mt-5 rounded-xl border p-4 transition-colors", urgent ? "border-red-200 bg-red-50/60" : "border-slate-200")}>
              <Toggle checked={urgent} onChange={setUrgent} label="Intervention urgente" description="Votre demande sera mise en avant auprès des techniciens disponibles." />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">3. Budget indicatif</h2>
            <Field label="Montant estimé (GNF)" hint="Optionnel : le technicien vous proposera un devis.">
              <Input type="number" min={0} step={10000} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="300 000" />
            </Field>
          </Card>
        </Reveal>

        {/* Récapitulatif en direct */}
        <div>
          <Card className="sticky top-24 p-6">
            <h2 className="font-bold text-slate-900">Récapitulatif</h2>
            {tech && (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-50 p-3">
                <Avatar nom={tech.nom} className="size-10 text-xs" />
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
              <li className="flex items-center gap-3 text-slate-600">
                <MapPin className="ml-2 size-4 shrink-0 text-slate-400" /> {adresse ? `${adresse}, ${zone}` : `${zone}, Conakry`}
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <CalendarDays className="ml-2 size-4 text-slate-400" /> {date ? new Date(date).toLocaleDateString("fr-FR", { dateStyle: "long" }) : "Date à convenir"}
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <Wallet className="ml-2 size-4 text-slate-400" /> {budget ? formatGNF(Number(budget)) : "Sur devis"}
              </li>
              {urgent && (
                <li className="flex items-center gap-3 font-semibold text-red-600">
                  <Zap className="ml-2 size-4" /> Urgent
                </li>
              )}
            </ul>
            <p className="mt-4 line-clamp-3 min-h-10 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{titre || description || "Votre description apparaîtra ici."}</p>
            <Button type="submit" size="lg" className="mt-5 w-full">
              <Send className="size-4" /> Envoyer la demande
            </Button>
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" /> Gratuit et sans engagement. Seuls des professionnels vérifiés reçoivent votre demande.
            </p>
            <Link href="/client/demandes" className="mt-4 block text-center text-sm font-semibold text-slate-500 hover:text-slate-800">
              Annuler
            </Link>
          </Card>
        </div>
      </form>
    </div>
  );
}
