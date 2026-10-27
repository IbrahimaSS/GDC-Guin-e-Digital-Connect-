"use client";

import QRCode from "qrcode";
import { BadgeCheck, Copy, Download, MapPin, Phone, Printer, Share2, Star } from "lucide-react";
import { useSyncExternalStore } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { Avatar, Button, Card, Logo, PageHeader, VerificationBadge } from "@/components/ui";
import QrCode, { OPTIONS_QR } from "@/components/ui/QrCode";
import { getMetier, NIVEAUX, TECHNICIEN_CONNECTE as moi } from "@/lib/data";

const IDEES = [
  { titre: "Carte de visite", texte: "Imprimez votre carte et laissez-la à chaque client." },
  { titre: "Autocollant moto ou véhicule", texte: "Les passants scannent et découvrent vos avis." },
  { titre: "Vitrine de l'atelier", texte: "Affichez le QR code à l'entrée de votre boutique." },
  { titre: "Statut WhatsApp", texte: "Partagez l'image du QR code à vos contacts." },
];

/** Carte professionnelle du technicien avec QR code vers son profil public. */
export default function CarteQr() {
  // L'adresse du profil dépend du domaine sur lequel le site est servi (inconnu lors du rendu serveur).
  const origine = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const url = origine ? `${origine}/techniciens/${moi.id}?source=qr` : "";

  async function telechargerPng() {
    const data = await QRCode.toDataURL(url, { ...OPTIONS_QR, width: 1200 });
    const a = document.createElement("a");
    a.href = data;
    a.download = `gdc-qr-${moi.id}.png`;
    a.click();
    toast("QR code téléchargé");
  }

  async function partager() {
    try {
      if (navigator.share) return await navigator.share({ title: `${moi.nom} sur GDC`, text: `Mon profil vérifié sur GDC`, url });
      await navigator.clipboard.writeText(url);
      toast("Lien du profil copié");
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast("Partage impossible", "error");
    }
  }

  return (
    <>
      <div className="no-print">
      <PageHeader
        title="Mon QR code"
        subtitle="Vos clients scannent ce code et arrivent directement sur votre profil vérifié."
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Imprimer la carte
            </Button>
            <Button onClick={telechargerPng} disabled={!url}>
              <Download className="size-4" /> Télécharger le QR code
            </Button>
          </>
        }
      />
      </div>

      <div className="grid gap-6 xl:grid-cols-[auto_1fr]">
        <Reveal>
          {/* Carte imprimable (format carte de visite agrandi) */}
          <div className="carte-qr mx-auto w-full max-w-[560px] overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 p-6 text-white shadow-2xl shadow-brand-950/30 print:shadow-none">
            <div className="flex items-start justify-between">
              <Logo light className="h-12" />
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-white/20">Profil vérifié</span>
            </div>
            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Avatar nom={moi.nom} className="size-16 ring-2 ring-white/40" />
                  <div>
                    <p className="flex items-center gap-1.5 text-xl font-extrabold">
                      {moi.nom} <BadgeCheck className="size-5 text-accent-400" />
                    </p>
                    <p className="text-sm text-brand-100">{getMetier(moi.metier).label}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-brand-100">
                  <li className="flex items-center gap-2">
                    <Star className="size-4 fill-amber-400 text-amber-400" /> {moi.note.toFixed(1).replace(".", ",")} · {moi.nbAvis} avis
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="size-4 text-accent-400" /> Niveau {moi.niveau} – {NIVEAUX[moi.niveau].label}
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="size-4 text-accent-400" /> {moi.zonesIntervention.join(", ")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="size-4 text-accent-400" /> {moi.telephone}
                  </li>
                </ul>
              </div>
              <div className="text-center">
                {url && <QrCode valeur={url} className="mx-auto size-44" />}
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-brand-100">Scannez pour voir mon profil</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="space-y-6 no-print" delay={0.1}>
          <Card className="p-6">
            <h2 className="font-bold text-slate-900">Lien de votre profil</h2>
            <p className="mt-1 text-sm text-slate-500">Le même lien que le QR code, à envoyer par SMS ou WhatsApp.</p>
            <div className="mt-4 flex gap-2">
              <input readOnly value={url} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600" aria-label="Lien du profil" />
              <Button
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(url);
                  toast("Lien copié");
                }}
                aria-label="Copier le lien"
              >
                <Copy className="size-4" />
              </Button>
              <Button variant="secondary" onClick={partager}>
                <Share2 className="size-4" /> Partager
              </Button>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <VerificationBadge niveau={moi.niveau} /> Le badge de vérification s&apos;affiche sur votre profil public.
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-bold text-slate-900">Où l&apos;utiliser ?</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {IDEES.map((i) => (
                <li key={i.titre} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">{i.titre}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{i.texte}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex items-center gap-4 p-6">
            <span className="text-3xl font-extrabold text-brand-950">37</span>
            <p className="text-sm text-slate-500">
              visites de votre profil via le QR code ce mois-ci <span className="font-semibold text-emerald-600">(+12)</span>
            </p>
          </Card>
        </Reveal>
      </div>
    </>
  );
}
