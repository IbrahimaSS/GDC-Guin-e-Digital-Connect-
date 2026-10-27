// Géolocalisation : coordonnées des zones, recherche d'adresse (Nominatim) et itinéraire routier (OSRM).
// Services OpenStreetMap gratuits et sans clé. Pour la production : héberger ses propres instances
// ou passer par un fournisseur (les serveurs publics ne garantissent ni débit ni disponibilité).

export interface Point {
  lat: number;
  lng: number;
}

/** Centre approximatif de chaque zone couverte. */
export const ZONES_COORDS: Record<string, Point> = {
  Kaloum: { lat: 9.5092, lng: -13.7122 },
  Dixinn: { lat: 9.5459, lng: -13.6732 },
  Matam: { lat: 9.5538, lng: -13.6474 },
  Ratoma: { lat: 9.6032, lng: -13.6365 },
  Matoto: { lat: 9.5803, lng: -13.6105 },
  Kagbelen: { lat: 9.675, lng: -13.555 },
  "Dubréka": { lat: 9.7906, lng: -13.5144 },
  Coyah: { lat: 9.7069, lng: -13.3866 },
};

export const CONAKRY: Point = { lat: 9.5716, lng: -13.6476 };

export const centreZone = (zone: string): Point => ZONES_COORDS[zone] ?? CONAKRY;

const NOMINATIM = "https://nominatim.openstreetmap.org";

export interface ResultatAdresse {
  libelle: string;
  point: Point;
}

/**
 * Recherche d'adresses en Guinée. La politique d'usage de Nominatim interdit l'autocomplétion :
 * on n'appelle cette fonction que sur validation explicite (bouton ou Entrée).
 */
export async function chercherAdresse(requete: string): Promise<ResultatAdresse[]> {
  const params = new URLSearchParams({ q: requete, format: "jsonv2", countrycodes: "gn", limit: "5", "accept-language": "fr" });
  const res = await fetch(`${NOMINATIM}/search?${params}`);
  if (!res.ok) throw new Error("Recherche d'adresse indisponible");
  const data: { display_name: string; lat: string; lon: string }[] = await res.json();
  return data.map((d) => ({ libelle: d.display_name, point: { lat: Number(d.lat), lng: Number(d.lon) } }));
}

/** Adresse lisible d'un point (rue, quartier, commune). */
export async function adresseDuPoint(p: Point, essai = 0): Promise<string | null> {
  const params = new URLSearchParams({ lat: String(p.lat), lon: String(p.lng), format: "jsonv2", zoom: "17", "accept-language": "fr" });
  try {
    const res = await fetch(`${NOMINATIM}/reverse?${params}`);
    if (res.status === 429 && essai < 2) {
      await new Promise((r) => setTimeout(r, 1200));
      return adresseDuPoint(p, essai + 1);
    }
    if (!res.ok) return null;
    const data: { address?: Record<string, string>; display_name?: string } = await res.json();
    const a = data.address ?? {};
    const morceaux = [a.road, a.neighbourhood ?? a.suburb ?? a.quarter, a.city_district ?? a.city ?? a.town].filter(Boolean);
    return morceaux.length ? morceaux.join(", ") : (data.display_name ?? null);
  } catch {
    return null;
  }
}

export interface Itineraire {
  trace: Point[];
  distanceKm: number;
  dureeMin: number;
}

/** Itinéraire routier ; en cas d'échec du service, ligne droite avec une estimation (25 km/h en ville). */
export async function itineraire(depart: Point, arrivee: Point): Promise<Itineraire> {
  const url = `https://router.project-osrm.org/route/v1/driving/${depart.lng},${depart.lat};${arrivee.lng},${arrivee.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data: { routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] } = await res.json();
    const r = data.routes?.[0];
    if (!r) throw new Error();
    return {
      trace: r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: r.distance / 1000,
      dureeMin: Math.max(1, Math.round(r.duration / 60)),
    };
  } catch {
    const km = distanceKm(depart, arrivee) * 1.3;
    return { trace: [depart, arrivee], distanceKm: km, dureeMin: Math.max(1, Math.round((km / 25) * 60)) };
  }
}

/** Distance à vol d'oiseau (formule de haversine). */
export function distanceKm(a: Point, b: Point) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Point situé à la fraction `t` (0 → 1) de la longueur d'un tracé. */
export function pointSurTrace(trace: Point[], t: number): Point {
  if (trace.length < 2) return trace[0];
  const longueurs = trace.slice(1).map((p, i) => distanceKm(trace[i], p));
  const total = longueurs.reduce((s, l) => s + l, 0);
  let cible = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < longueurs.length; i++) {
    if (cible <= longueurs[i] || i === longueurs.length - 1) {
      const f = longueurs[i] ? Math.min(cible / longueurs[i], 1) : 0;
      return { lat: trace[i].lat + (trace[i + 1].lat - trace[i].lat) * f, lng: trace[i].lng + (trace[i + 1].lng - trace[i].lng) * f };
    }
    cible -= longueurs[i];
  }
  return trace[trace.length - 1];
}

/** Partie du tracé déjà parcourue, jusqu'à la fraction `t`. */
export function traceParcourue(trace: Point[], t: number): Point[] {
  if (t <= 0) return [trace[0]];
  const longueurs = trace.slice(1).map((p, i) => distanceKm(trace[i], p));
  const total = longueurs.reduce((s, l) => s + l, 0);
  let cible = Math.min(t, 1) * total;
  const out: Point[] = [trace[0]];
  for (let i = 0; i < longueurs.length; i++) {
    if (cible <= longueurs[i]) {
      out.push(pointSurTrace([trace[i], trace[i + 1]], longueurs[i] ? cible / longueurs[i] : 0));
      return out;
    }
    cible -= longueurs[i];
    out.push(trace[i + 1]);
  }
  return out;
}

/** Lien d'itinéraire Google Maps (ouvre l'application sur téléphone). */
export const lienGoogleMaps = (arrivee: Point, depart?: Point) =>
  `https://www.google.com/maps/dir/?api=1&destination=${arrivee.lat},${arrivee.lng}${depart ? `&origin=${depart.lat},${depart.lng}` : ""}&travelmode=driving`;
