"use client";

import { ImageUp, Info, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, cn } from "@/components/ui";
import { Modal } from "@/components/ui/interactive";
import { CLE_LOGO_CLAIR, CLE_LOGO_SOMBRE, useLogos } from "@/components/ui/Logo";
import { ecrire } from "@/lib/stockage";

const TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const TAILLE_MAX = 2 * 1024 * 1024;
const LARGEUR_MAX = 800;

/** Lit l'image, la redimensionne (800 px de large au plus) et la convertit en PNG pour l'enregistrer. */
function preparer(fichier: File): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      const echelle = Math.min(1, LARGEUR_MAX / (img.naturalWidth || LARGEUR_MAX));
      const w = Math.round((img.naturalWidth || LARGEUR_MAX) * echelle);
      const h = Math.round((img.naturalHeight || LARGEUR_MAX * 0.75) * echelle);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resoudre(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rejeter(new Error("Image illisible"));
    };
    img.src = url;
  });
}

function Emplacement({ titre, aide, src, fond, cle }: { titre: string; aide: string; src: string; fond: "clair" | "sombre"; cle: string }) {
  const [glisse, setGlisse] = useState(false);

  async function importer(fichier?: File) {
    if (!fichier) return;
    if (!TYPES.includes(fichier.type)) return toast("Format non pris en charge : PNG, JPG, WebP ou SVG.", "error");
    if (fichier.size > TAILLE_MAX) return toast("Fichier trop lourd : 2 Mo maximum.", "error");
    try {
      // TODO : envoyer le fichier à l'API (stockage du logo pour tous les visiteurs).
      ecrire(cle, await preparer(fichier));
      toast(`Logo ${fond === "clair" ? "pour fond clair" : "pour fond sombre"} mis à jour`);
    } catch {
      toast("Impossible de lire cette image.", "error");
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="font-bold text-slate-900">{titre}</p>
        <p className="text-xs text-slate-500">{aide}</p>
      </div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setGlisse(true);
        }}
        onDragLeave={() => setGlisse(false)}
        onDrop={(e) => {
          e.preventDefault();
          setGlisse(false);
          importer(e.dataTransfer.files[0]);
        }}
        className={cn(
          "group relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-6 transition-colors",
          fond === "clair" ? "bg-[#ffffff]" : "bg-[#071a3a]",
          glisse ? "border-accent-500" : "border-slate-300 hover:border-brand-500",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- aperçu d'une image importée (data URL) */}
        <img src={src} alt={titre} className="max-h-full max-w-full object-contain" />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-brand-950/75 py-2 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ImageUp className="size-4" /> Cliquer ou déposer une image
        </span>
        <input
          type="file"
          accept={TYPES.join(",")}
          className="sr-only"
          onChange={(e) => {
            importer(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

/** Paramètres › Identité visuelle : remplacement du logo par l'administrateur. */
export default function LogoEditeur() {
  const { clair, sombre, personnalise } = useLogos();
  const [confirmation, setConfirmation] = useState(false);

  return (
    <Card className="p-6 lg:col-span-2">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <ImageUp className="size-5 text-brand-600" /> Logo de la plateforme
          </h2>
          <p className="mt-1 text-sm text-slate-500">Le logo s&apos;affiche dans toutes les barres de navigation, le pied de page, les pages de connexion et l&apos;onglet du navigateur.</p>
        </div>
        {personnalise && (
          <Button variant="ghost" onClick={() => setConfirmation(true)}>
            <RotateCcw className="size-4" /> Logo d&apos;origine
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Emplacement titre="Logo pour fond clair" aide="Barre du haut, pages de connexion. Texte en couleur sombre." src={clair} fond="clair" cle={CLE_LOGO_CLAIR} />
        <Emplacement titre="Logo pour fond sombre" aide="Barres latérales, pied de page, mode sombre. Texte en blanc." src={sombre} fond="sombre" cle={CLE_LOGO_SOMBRE} />
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
        <Info className="mt-0.5 size-4 shrink-0" />
        Conseil : un PNG à fond transparent, recadré au plus près du dessin, d&apos;au moins 800 px de large. PNG, JPG, WebP ou SVG, 2 Mo maximum.
      </p>

      <Modal
        open={confirmation}
        onClose={() => setConfirmation(false)}
        title="Revenir au logo d'origine ?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmation(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                ecrire(CLE_LOGO_CLAIR, null);
                ecrire(CLE_LOGO_SOMBRE, null);
                setConfirmation(false);
                toast("Logo d'origine rétabli", "info");
              }}
            >
              Rétablir
            </Button>
          </>
        }
      >
        Les deux logos importés seront remplacés par le logo GDC d&apos;origine.
      </Modal>
    </Card>
  );
}
