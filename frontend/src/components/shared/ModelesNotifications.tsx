"use client";

import { MessageCircle, MessageSquare, RotateCcw, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/motion/Toaster";
import { Badge, Button, Card, cn, EmptyState, Textarea } from "@/components/ui";
import { Toggle } from "@/components/ui/interactive";
import { Table, Td, Th } from "@/components/ui/table";
import { CLE_JOURNAL, CLE_MODELES, MODELES, notifier, type Canal, type Envoi, type Evenement, type Modele } from "@/lib/notifier";
import { usePersistant } from "@/lib/stockage";

const AUCUN: Envoi[] = [];
const PERSO: Partial<Record<Evenement, Partial<Modele>>> = {};
const EXEMPLE = { client: "Mohamed Camara", technicien: "Mamadou Diallo", mission: "Réparation de climatisation", montant: "350 000 GNF", code: "4821" };
const apercu = (t: string) => t.replace(/\{(\w+)\}/g, (_, k: keyof typeof EXEMPLE) => EXEMPLE[k] ?? "");

/** Back-office : modèles des SMS / WhatsApp envoyés à chaque étape et journal des envois. */
export default function ModelesNotifications() {
  const [perso, setPerso] = usePersistant(CLE_MODELES, PERSO);
  const [journal, setJournal] = usePersistant(CLE_JOURNAL, AUCUN);
  const [choix, setChoix] = useState<Evenement>("demande_acceptee");
  const modele: Modele = { ...MODELES[choix], ...perso[choix] };

  const maj = (patch: Partial<Modele>) => setPerso((p) => ({ ...p, [choix]: { ...p[choix], ...patch } }));
  const basculerCanal = (c: Canal, actif: boolean) => maj({ canaux: actif ? Array.from(new Set([...modele.canaux, c])) : modele.canaux.filter((x) => x !== c) });

  return (
    <div className="grid gap-6 lg:col-span-2 xl:grid-cols-[260px_1fr_300px]">
      <Card className="p-3">
        <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wider text-slate-400">Étapes</p>
        <ul className="space-y-0.5">
          {(Object.keys(MODELES) as Evenement[]).map((e) => {
            const m = { ...MODELES[e], ...perso[e] };
            return (
              <li key={e}>
                <button
                  type="button"
                  onClick={() => setChoix(e)}
                  className={cn("flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors", choix === e ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-600 hover:bg-slate-50")}
                >
                  {m.libelle}
                  <span className="flex gap-1 text-slate-400">
                    {m.canaux.includes("sms") && <MessageSquare className="size-3.5" />}
                    {m.canaux.includes("whatsapp") && <MessageCircle className="size-3.5 text-emerald-500" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-slate-900">{modele.libelle}</h2>
          <Badge tone="blue">Envoyé au {modele.destinataire}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3">
            <Toggle checked={modele.canaux.includes("sms")} onChange={(v) => basculerCanal("sms", v)} label="SMS" description="Tous les téléphones, même sans internet." />
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <Toggle checked={modele.canaux.includes("whatsapp")} onChange={(v) => basculerCanal("whatsapp", v)} label="WhatsApp" description="Via WhatsApp Business." />
          </div>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-slate-700">Texte du message</span>
          <Textarea value={modele.texte} onChange={(e) => maj({ texte: e.target.value })} className="min-h-28 font-mono text-[13px]" />
          <span className="flex justify-between text-xs text-slate-400">
            <span>Variables : {"{client} {technicien} {mission} {montant} {code}"}</span>
            <span className={cn(apercu(modele.texte).length > 160 && "font-semibold text-amber-600")}>
              {apercu(modele.texte).length} car. · {Math.ceil(apercu(modele.texte).length / 160)} SMS
            </span>
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              notifier(choix, { ...EXEMPLE, numero: "+224 620 00 00 00" });
              toast("Message de test envoyé au +224 620 00 00 00");
            }}
          >
            <Send className="size-4" /> Envoyer un test
          </Button>
          {perso[choix] && (
            <Button
              variant="ghost"
              onClick={() =>
                setPerso((p) => {
                  const { [choix]: _retire, ...reste } = p;
                  void _retire;
                  return reste;
                })
              }
            >
              <RotateCcw className="size-4" /> Texte d&apos;origine
            </Button>
          )}
        </div>
      </Card>

      {/* Aperçu téléphone */}
      <div className="mx-auto w-full max-w-[300px]">
        <div className="rounded-[2.2rem] border-[10px] border-slate-900 bg-slate-100 p-3 shadow-2xl">
          <p className="mb-3 text-center text-[11px] font-semibold text-slate-500">{modele.canaux.includes("whatsapp") && !modele.canaux.includes("sms") ? "WhatsApp · GDC" : "Messages · GDC"}</p>
          {modele.canaux.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">Aucun canal actif pour cette étape.</p>
          ) : (
            modele.canaux.map((c) => (
              <div key={c} className={cn("mb-2 max-w-[90%] rounded-2xl rounded-tl-md px-3 py-2 text-[13px] leading-snug shadow-sm", c === "whatsapp" ? "bg-[#dcf8c6] text-[#111]" : "bg-[#fff] text-[#111]")}>
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0066cc]">{c === "sms" ? "SMS" : "WhatsApp"}</p>
                {apercu(modele.texte)}
              </div>
            ))
          )}
        </div>
      </div>

      <Card className="xl:col-span-3">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-bold text-slate-900">Journal des envois</h2>
            <p className="text-sm text-slate-500">SMS et WhatsApp envoyés par la plateforme.</p>
          </div>
          {journal.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setJournal([])}>
              Vider
            </Button>
          )}
        </div>
        <div className="mt-4">
          {journal.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={MessageSquare} title="Aucun envoi pour l'instant" text="Acceptez une demande, envoyez un devis ou démarrez une mission : les messages apparaîtront ici." />
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Canal</Th>
                  <Th>Destinataire</Th>
                  <Th>Message</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>
              <tbody>
                {journal.slice(0, 30).map((e) => (
                  <tr key={e.id}>
                    <Td className="whitespace-nowrap text-slate-500">{e.date}</Td>
                    <Td>
                      <Badge tone={e.canal === "sms" ? "blue" : "green"}>{e.canal === "sms" ? "SMS" : "WhatsApp"}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="font-semibold capitalize text-slate-900">{e.destinataire}</span>
                      <span className="block text-xs text-slate-500">{e.numero}</span>
                    </Td>
                    <Td className="max-w-md text-slate-600">{e.texte}</Td>
                    <Td>
                      <Badge tone="green" dot>
                        Envoyé
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
