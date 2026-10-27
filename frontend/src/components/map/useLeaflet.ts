"use client";

import type { Map as CarteLeaflet } from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { Point } from "@/lib/geo";
import "leaflet/dist/leaflet.css";

type Leaflet = typeof import("leaflet");

// Tuiles OpenStreetMap standard (sans clé). En mode sombre, elles sont assombries en CSS (globals.css).
// Pour un trafic réel, prévoir un fournisseur de tuiles : le serveur public OSM n'est pas fait pour la production.
const TUILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Crée une carte Leaflet dans l'élément référencé (Leaflet n'est chargé que côté navigateur)
 * `pret` passe à vrai une fois la carte disponible.
 */
export function useLeaflet(centre: Point, zoom = 14) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<CarteLeaflet | null>(null);
  const L = useRef<Leaflet | null>(null);
  const [pret, setPret] = useState(false);
  // Centre initial uniquement : les recentrages se font ensuite via la carte elle-même.
  const depart = useRef(centre);
  const zoomInitial = useRef(zoom);

  useEffect(() => {
    let annule = false;

    import("leaflet").then((mod) => {
      if (annule || !conteneur.current) return;
      const leaflet = (mod as unknown as { default?: Leaflet }).default ?? (mod as Leaflet);
      L.current = leaflet;
      const map = leaflet.map(conteneur.current, { zoomControl: false, attributionControl: true }).setView(depart.current, zoomInitial.current);
      leaflet.control.zoom({ position: "bottomright" }).addTo(map);
      leaflet.tileLayer(TUILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
      carte.current = map;
      setPret(true);
    });

    return () => {
      annule = true;
      carte.current?.remove();
      carte.current = null;
      setPret(false);
    };
  }, []);

  return { conteneur, carte, L, pret };
}
