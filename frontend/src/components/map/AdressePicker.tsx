"use client";

import type { Marker } from "leaflet";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/motion/Toaster";
import { cn, inputClass } from "@/components/ui";
import { adresseDuPoint, centreZone, chercherAdresse, type Point, type ResultatAdresse } from "@/lib/geo";
import { useLeaflet } from "./useLeaflet";

// Repère orange du lieu d'intervention (icône HTML : pas d'images à charger).
const ICONE_LIEU = `<div class="relative -translate-x-1/2 -translate-y-full">
  <div class="flex size-9 items-center justify-center rounded-full rounded-bl-none -rotate-45 bg-accent-500 shadow-lg ring-4 ring-white">
    <span class="size-3 rotate-45 rounded-full bg-white"></span>
  </div>
</div>`;

interface Props {
  zone: string;
  point: Point | null;
  adresse: string;
  onChange: (v: { point: Point; adresse?: string }) => void;
  onAdresseChange: (adresse: string) => void;
}

/** Choix du lieu d'intervention : recherche, clic sur la carte, repère déplaçable ou position actuelle. */
export default function AdressePicker({ zone, point, adresse, onChange, onAdresseChange }: Props) {
  const { conteneur, carte, L, pret } = useLeaflet(point ?? centreZone(zone), point ? 16 : 14);
  const marqueur = useRef<Marker | null>(null);
  const [requete, setRequete] = useState("");
  const [resultats, setResultats] = useState<ResultatAdresse[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [localisation, setLocalisation] = useState(false);
  const [adresseEnCours, setAdresseEnCours] = useState(false);
  const rappel = useRef(onChange);
  useEffect(() => {
    rappel.current = onChange;
  });

  // Pose le point, remplit l'adresse lisible et notifie le parent.
  const choisir = useRef((p: Point, libelle?: string) => {
    rappel.current({ point: p, adresse: libelle });
    if (libelle) return;
    setAdresseEnCours(true);
    adresseDuPoint(p)
      .then((a) => a && rappel.current({ point: p, adresse: a }))
      .finally(() => setAdresseEnCours(false));
  });

  // Clic sur la carte = nouveau lieu.
  useEffect(() => {
    if (!pret || !carte.current) return;
    const map = carte.current;
    const surClic = (e: { latlng: { lat: number; lng: number } }) => choisir.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    map.on("click", surClic);
    return () => {
      map.off("click", surClic);
    };
  }, [pret, carte]);

  // Repère synchronisé avec le point choisi.
  useEffect(() => {
    if (!pret || !carte.current || !L.current || !point) return;
    if (!marqueur.current) {
      marqueur.current = L.current
        .marker(point, { draggable: true, icon: L.current.divIcon({ html: ICONE_LIEU, className: "", iconSize: [0, 0] }) })
        .addTo(carte.current)
        .on("dragend", (e) => {
          const ll = (e.target as Marker).getLatLng();
          choisir.current({ lat: ll.lat, lng: ll.lng });
        });
    } else {
      marqueur.current.setLatLng(point);
    }
    carte.current.flyTo(point, Math.max(carte.current.getZoom(), 16), { duration: 0.8 });
  }, [point, pret, carte, L]);

  // Changement de zone sans point choisi : on recentre sur la zone.
  useEffect(() => {
    if (pret && carte.current && !point) carte.current.flyTo(centreZone(zone), 14, { duration: 0.8 });
  }, [zone, pret, carte, point]);

  useEffect(
    () => () => {
      marqueur.current = null;
    },
    [],
  );

  async function rechercher() {
    if (!requete.trim()) return;
    setRecherche(true);
    try {
      const r = await chercherAdresse(`${requete}, ${zone}, Conakry`);
      setResultats(r);
      if (!r.length) toast("Adresse introuvable : placez le repère directement sur la carte.", "info");
    } catch {
      toast("Recherche indisponible : placez le repère sur la carte.", "error");
    } finally {
      setRecherche(false);
    }
  }

  function maPosition() {
    if (!navigator.geolocation) return toast("Géolocalisation non disponible sur cet appareil.", "error");
    setLocalisation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalisation(false);
        choisir.current({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocalisation(false);
        toast("Position refusée ou indisponible.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                rechercher();
              }
            }}
            placeholder="Rechercher une rue, un quartier, un lieu connu…"
            className={cn(inputClass, "pl-9")}
            aria-label="Rechercher une adresse"
          />
        </div>
        <button
          type="button"
          onClick={rechercher}
          disabled={recherche}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {recherche ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          <span className="hidden sm:inline">Chercher</span>
        </button>
      </div>

      {resultats.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-lg">
          {resultats.map((r) => (
            <li key={`${r.point.lat},${r.point.lng}`}>
              <button
                type="button"
                onClick={() => {
                  choisir.current(r.point, r.libelle.split(",").slice(0, 3).join(","));
                  setResultats([]);
                }}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent-500" />
                <span className="text-slate-700">{r.libelle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <div ref={conteneur} className="h-72 w-full bg-slate-100" aria-label="Carte : cliquez pour placer le lieu d'intervention" />
        <button
          type="button"
          onClick={maPosition}
          className="absolute left-3 top-3 z-[400] inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg transition-colors hover:text-brand-600"
        >
          {localisation ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />} Ma position
        </button>
        {!point && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 z-[400] mx-auto w-fit rounded-full bg-brand-950/80 px-3 py-1.5 text-xs font-medium text-white">
            Cliquez sur la carte pour placer le lieu d&apos;intervention
          </p>
        )}
      </div>

      <label className="block space-y-1.5">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          Adresse ou repère *
          {adresseEnCours && (
            <span className="inline-flex items-center gap-1 text-xs font-normal text-slate-400">
              <Loader2 className="size-3 animate-spin" /> recherche de l&apos;adresse…
            </span>
          )}
        </span>
        <input
          required
          value={adresse}
          onChange={(e) => onAdresseChange(e.target.value)}
          placeholder="Ex. : Almamya, près de la pharmacie"
          className={inputClass}
        />
        {point && (
          <span className="block text-xs text-slate-400">
            Position : {point.lat.toFixed(5)}, {point.lng.toFixed(5)} · vous pouvez déplacer le repère
          </span>
        )}
      </label>
    </div>
  );
}
