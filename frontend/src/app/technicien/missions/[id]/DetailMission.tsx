"use client";

import { CalendarDays, Check, ChevronLeft, KeyRound, MapPin, MessageCircle, MessageSquareText, Navigation, Phone, Play, Undo2, User, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { StatutDemandeBadge } from "@/components/shared/status";
import SuiviTrajet from "@/components/shared/SuiviTrajet";
import Timeline from "@/components/shared/Timeline";
import DevisEditeur from "@/components/shared/DevisEditeur";
import { Modal } from "@/components/ui/interactive";
import ScannerQr from "@/components/ui/ScannerQr";
import { codeMission, verifierCode } from "@/lib/mission";
import { notifier } from "@/lib/notifier";
import { useStatutDemande } from "@/lib/stockage";
import { Avatar, Button, Card, cn, Field, Input, LinkButton, MetierIcon, Textarea } from "@/components/ui";
import { apiActive, texteErreur } from "@/lib/api";
import { formatGNF, TECHNICIEN_CONNECTE as maquette, type Demande, type StatutDemande } from "@/lib/data";
import { technicienDe } from "@/lib/demandes";
import { accepterMission, demarrerMission, desisterMission, signalerEnRoute, terminerMission } from "@/lib/missions";

const ETAPES = ["Demande créée", "Acceptée par le technicien", "Intervention en cours", "Mission terminée", "Évaluation"];
const RANG: Record<StatutDemande, number> = { envoyee: 1, acceptee: 2, en_cours: 3, terminee: 4, annulee: 1 };

/** `onChange` : recharger la mission après une action (avec l'API). */
export default function DetailMission({ mission, onChange }: { mission: Demande; onChange?: () => void }) {
  const router = useRouter();
  // En démonstration, le statut vit dans le navigateur ; avec l'API, il vient du serveur.
  const [statutLocal, setStatutLocal] = useStatutDemande<StatutDemande>(mission.id, mission.statut);
  const statut = apiActive ? mission.statut : statutLocal;
  const moi = (apiActive && technicienDe(mission)) || maquette;
  const [arrivee, setArrivee] = useState(false);
  const [code, setCode] = useState("");
  const [erreurCode, setErreurCode] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const vars = { client: mission.client, technicien: moi.nom, mission: mission.titre, code: codeMission(mission.id), numero: mission.clientTel };
  const telClient = mission.clientTel.replace(/\D/g, "");

  /** Exécute une étape auprès de l'API puis recharge la mission ; en démonstration, met à jour le statut local. */
  async function etape(appel: () => Promise<unknown>, succes: string) {
    setEnvoi(true);
    try {
      await appel();
      toast(succes);
      onChange?.();
      return true;
    } catch (e) {
      toast(texteErreur(e), "error");
      return false;
    } finally {
      setEnvoi(false);
    }
  }

  // Passage à l'étape suivante + notification SMS / WhatsApp du client.
  function avancer(suivant: StatutDemande, msg: string) {
    if (apiActive) {
      if (suivant === "acceptee") return etape(() => accepterMission(mission.id), msg);
      if (suivant === "terminee") return etape(() => terminerMission(mission.id), msg);
      return;
    }
    setStatutLocal(suivant);
    if (suivant === "acceptee") notifier("demande_acceptee", vars);
    if (suivant === "en_cours") notifier("intervention_demarree", vars);
    if (suivant === "terminee") notifier("mission_terminee", vars);
    toast(msg);
  }

  async function confirmerArrivee(saisie: string) {
    if (apiActive) {
      // Le serveur vérifie le code (ou le QR code) : c'est la preuve de passage.
      setEnvoi(true);
      try {
        await demarrerMission(mission.id, saisie);
      } catch (e) {
        return setErreurCode(texteErreur(e));
      } finally {
        setEnvoi(false);
      }
      onChange?.();
    } else {
      if (!verifierCode(mission.id, saisie)) {
        setErreurCode("Code incorrect. Demandez au client le code affiché dans son application.");
        return;
      }
      setStatutLocal("en_cours");
      notifier("intervention_demarree", vars);
    }
    setArrivee(false);
    setCode("");
    setErreurCode("");
    toast("Arrivée confirmée : l'intervention commence");
  }

  function enRoute() {
    if (!apiActive) {
      notifier("technicien_en_route", vars);
      return toast("Le client est prévenu que vous êtes en route.");
    }
    etape(() => signalerEnRoute(mission.id), "Le client est prévenu que vous êtes en route.");
  }

  async function desister() {
    if (await etape(() => desisterMission(mission.id), "Vous vous êtes retiré de la mission : elle est de nouveau proposée aux autres professionnels.")) {
      router.push("/technicien/demandes");
    }
  }
  const [checklist, setChecklist] = useState([
    { label: "Diagnostic réalisé", fait: statut !== "envoyee" && statut !== "acceptee" },
    { label: "Devis validé par le client", fait: statut !== "envoyee" },
    { label: "Pièces / matériel disponibles", fait: false },
    { label: "Tests de fonctionnement", fait: statut === "terminee" },
  ]);

  const chronologie = apiActive
    ? mission.chronologie
    : ETAPES.map((label, i) => ({
        label,
        fait: i < RANG[statut],
        date: i < RANG[statut] ? (mission.chronologie[i]?.date ?? "22 oct. · à l'instant") : undefined,
      }));

  const action =
    statut === "envoyee"
      ? { label: "Accepter la mission", icon: Check, next: "acceptee" as const, msg: "Mission acceptée" }
      : statut === "acceptee"
        ? { label: "Démarrer l'intervention", icon: Play, next: "en_cours" as const, msg: "Intervention démarrée, le client est notifié" }
        : statut === "en_cours"
          ? { label: "Marquer comme terminée", icon: Check, next: "terminee" as const, msg: "Mission terminée ! Le client va pouvoir vous évaluer." }
          : null;

  return (
    <>
      <Link href="/technicien/demandes" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-600">
        <ChevronLeft className="size-4" /> Demandes reçues
      </Link>
      <Modal open={arrivee} onClose={() => setArrivee(false)} title="Confirmer votre arrivée">
        <p className="mb-4">Scannez le QR code affiché par {mission.client} ou saisissez son code à 4 chiffres.</p>
        <div className="space-y-4">
          {arrivee && <ScannerQr onCode={confirmerArrivee} />}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              confirmerArrivee(code);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="Code à 4 chiffres" className="pl-9 font-mono tracking-[0.3em]" aria-label="Code d'intervention" />
            </div>
            <Button type="submit" disabled={code.length !== 4 || envoi}>
              {envoi ? "Vérification…" : "Valider"}
            </Button>
          </form>
          {erreurCode && <p className="text-sm font-medium text-red-600">{erreurCode}</p>}
        </div>
      </Modal>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="rounded-2xl bg-accent-50 p-3.5 text-accent-500">
            <MetierIcon metier={mission.metier} className="size-6" />
          </span>
          <div>
            <p className="text-sm text-slate-500">Mission {mission.reference}</p>
            <h1 className="text-2xl font-extrabold text-brand-950">{mission.titre}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatutDemandeBadge statut={statut} />
          {statut === "acceptee" && (
            <>
              {apiActive && (
                <Button variant="ghost" onClick={desister} disabled={envoi}>
                  <Undo2 className="size-4" /> Me retirer
                </Button>
              )}
              <Button variant="outline" onClick={enRoute} disabled={envoi}>
                <Navigation className="size-4" /> Je suis en route
              </Button>
            </>
          )}
          {action && (
            <Button
              size="lg"
              disabled={envoi}
              onClick={() => {
                // Le démarrage exige le code du client, preuve de la présence sur place.
                if (action.next === "en_cours") return setArrivee(true);
                avancer(action.next, action.msg);
              }}
            >
              <action.icon className="size-4" /> {action.label}
            </Button>
          )}
        </div>
      </div>
      {statut === "annulee" && (
        <Card className="mb-6 border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">Cette demande a été annulée par le client.</Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Reveal className="space-y-6">
          {statut !== "envoyee" && <SuiviTrajet tech={moi} destination={mission.zone} statut={statut} vue="technicien" client={mission.client} />}
          {statut !== "envoyee" && statut !== "annulee" && <DevisEditeur mission={mission} technicien={moi.nom} />}
          <Card className="p-6">
            <h2 className="font-bold text-slate-900">Description</h2>
            <p className="mt-2 text-slate-600">{mission.description}</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { icon: CalendarDays, l: "Créneau", v: mission.creneau },
                { icon: Wallet, l: "Budget client", v: mission.budget ? formatGNF(mission.budget) : "Sur devis" },
                { icon: MapPin, l: "Adresse", v: `${mission.adresse}, ${mission.zone}` },
                { icon: Zap, l: "Urgence", v: mission.urgence === "urgente" ? "Urgente" : "Normale" },
              ].map(({ icon: Icon, l, v }) => (
                <div key={l} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                  <Icon className="mt-0.5 size-4 text-brand-600" />
                  <div>
                    <dt className="text-xs text-slate-500">{l}</dt>
                    <dd className="text-sm font-semibold text-slate-900">{v}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Liste de contrôle</h2>
            <ul className="space-y-2">
              {checklist.map((c, i) => (
                <li key={c.label}>
                  <button
                    onClick={() => setChecklist(checklist.map((x, k) => (k === i ? { ...x, fait: !x.fait } : x)))}
                    className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition", c.fait ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 hover:bg-slate-50")}
                  >
                    <span className={cn("flex size-5 items-center justify-center rounded-md border-2 transition", c.fait ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300")}>
                      {c.fait && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className={cn("font-medium", c.fait ? "text-emerald-800 line-through decoration-emerald-400" : "text-slate-700")}>{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Montant final (GNF)">
                <Input type="number" defaultValue={mission.budget} />
              </Field>
              <Field label="Durée de l'intervention">
                <Input placeholder="Ex. : 2 h 30" />
              </Field>
            </div>
            <Field label="Notes pour le client" className="mt-4">
              <Textarea placeholder="Travaux effectués, conseils d'entretien…" />
            </Field>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Client</h2>
            <div className="flex items-center gap-3">
              <Avatar nom={mission.client} className="size-12 text-sm" />
              <div className="flex-1">
                <p className="font-bold text-slate-900">{mission.client}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <User className="size-3" /> Client vérifié · {mission.zone}
                </p>
              </div>
            </div>
            {telClient ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={`tel:+${telClient}`} className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-600 hover:text-white">
                  <Phone className="size-4" /> Appeler
                </a>
                <a
                  href={`https://wa.me/${telClient}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500 hover:text-white"
                >
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Le numéro du client vous sera communiqué dès que vous aurez accepté la mission.</p>
            )}
            {statut !== "envoyee" && (
              <LinkButton href={`/technicien/messages?c=${mission.id}`} variant="outline" className="mt-2 w-full">
                <MessageSquareText className="size-4" /> Écrire au client
              </LinkButton>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="mb-5 font-bold text-slate-900">Suivi de la mission</h2>
            {/* La clé force le rejeu de l'animation à chaque changement d'étape. */}
            <Timeline key={statut} etapes={chronologie} />
          </Card>
        </Reveal>
      </div>
    </>
  );
}
