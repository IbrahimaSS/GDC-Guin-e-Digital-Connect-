"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/components/motion/gsap";
import { toast } from "@/components/motion/Toaster";
import { api, apiActive, texteErreur } from "@/lib/api";
import { televerser } from "@/lib/fichiers";
import { mettreAJourUtilisateur, type UtilisateurApi } from "@/lib/session";
import { Avatar, cn } from "./index";

const TAILLE_MAX = 5 * 1024 * 1024;

/**
 * Photo de profil modifiable : choix d'une image, contrôle du format et aperçu immédiat.
 * Avec l'API, la photo est enregistrée sur le serveur et dans le compte connecté.
 */
export default function PhotoUpload({ nom, photo, className = "size-28 text-3xl", anneau }: { nom: string; photo?: string | null; className?: string; anneau?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const cadre = useRef<HTMLDivElement>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Libère l'aperçu précédent.
  useEffect(() => () => {
    if (apercu) URL.revokeObjectURL(apercu);
  }, [apercu]);

  async function choisir(fichier?: File) {
    if (!fichier) return;
    if (!fichier.type.startsWith("image/")) return toast("Choisissez une image (JPG, PNG ou WebP).", "error");
    if (fichier.size > TAILLE_MAX) return toast("Image trop lourde : 5 Mo maximum.", "error");
    setApercu(URL.createObjectURL(fichier));
    gsap.fromTo(cadre.current, { scale: 0.85 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    if (!apiActive) return toast("Photo de profil mise à jour");
    setEnvoi(true);
    try {
      const photoUrl = await televerser(fichier, "photo");
      mettreAJourUtilisateur(await api<UtilisateurApi>("/moi", { methode: "PATCH", corps: { photoUrl } }));
      toast("Photo de profil mise à jour");
    } catch (e) {
      setApercu(null);
      toast(texteErreur(e), "error");
    } finally {
      setEnvoi(false);
    }
  }

  const affichee = apercu ?? photo;

  return (
    <div className="relative mx-auto w-fit">
      <div ref={cadre} className={cn("rounded-full", anneau)}>
        {affichee ? (
          <span className={cn("relative block overflow-hidden rounded-full", className, envoi && "opacity-60")}>
            <Image src={affichee} alt="" fill unoptimized className="object-cover" />
          </span>
        ) : (
          <Avatar nom={nom} className={className} />
        )}
      </div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={envoi}
        className="absolute bottom-1 right-1 rounded-full bg-accent-500 p-2 text-white shadow-lg transition hover:scale-110"
        aria-label="Changer la photo"
      >
        <Camera className="size-4" />
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          choisir(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
