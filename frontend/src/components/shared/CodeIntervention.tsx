"use client";

import { CheckCircle2, KeyRound } from "lucide-react";
import { Card } from "@/components/ui";
import QrCode from "@/components/ui/QrCode";
import type { StatutDemande } from "@/lib/data";
import { codeMission, qrMission } from "@/lib/mission";

/** Code présenté par le client à l'arrivée du technicien : il valide le début de l'intervention. */
export default function CodeIntervention({ demandeId, statut, technicien }: { demandeId: string; statut: StatutDemande; technicien: string }) {
  if (statut !== "acceptee") {
    if (statut !== "en_cours" && statut !== "terminee") return null;
    return (
      <Card className="flex items-center gap-3 p-5 text-sm text-emerald-700">
        <CheckCircle2 className="size-5 shrink-0" /> Arrivée de {technicien} confirmée par le code d&apos;intervention.
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col items-center gap-5 p-6 sm:flex-row">
        <QrCode valeur={qrMission(demandeId)} className="size-36 shrink-0 ring-1 ring-slate-200" />
        <div className="text-center sm:text-left">
          <h2 className="flex items-center justify-center gap-2 font-bold text-slate-900 sm:justify-start">
            <KeyRound className="size-5 text-accent-500" /> Code d&apos;intervention
          </h2>
          <p className="mt-1 text-sm text-slate-500">À l&apos;arrivée de {technicien}, montrez ce QR code ou donnez-lui le code ci-dessous. Ne le communiquez qu&apos;en sa présence.</p>
          <p className="mt-3 font-mono text-3xl font-extrabold tracking-[0.35em] text-brand-950">{codeMission(demandeId)}</p>
        </div>
      </div>
    </Card>
  );
}
