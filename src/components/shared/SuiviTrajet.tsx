"use client";

import type { Marker, Polyline } from "leaflet";
import { Bike, Clock, ExternalLink, MapPin, Navigation, Phone, RotateCcw, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/components/motion/gsap";
import { toast } from "@/components/motion/Toaster";
import { useLeaflet } from "@/components/map/useLeaflet";
import { Avatar, Badge, Button, Card, cn } from "@/components/ui";
import type { StatutDemande, Technicien } from "@/lib/data";
import { centreZone, itineraire, lienGoogleMaps, pointSurTrace, traceParcourue, type Itineraire, type Point } from "@/lib/geo";

const DUREE = 16; // secondes de démonstration pour parcourir le trajet complet

type Phase = "attente" | "en_route" | "arrive";

interface Props {
  tech: Technicien;
  destination: string;
  statut: StatutDemande;
  vue?: "client" | "technicien";
  client?: string;
}

// Point de départ du technicien : sa zone, ou une zone voisine s'il intervient dans la sienne.
function depart(tech: Technicien, destination: string): Point {
  const zone = tech.zone === destination ? (destination === "Dixinn" ? "Matam" : "Dixinn") : tech.zone;
  return centreZone(zone);
}

// Photo en image de fond : les règles de Leaflet sur les <img> des marqueurs la déformeraient.
const iconeTechnicien = (photo: string) =>
  `<div style="width:44px;height:44px;transform:translate(-50%,-50%);border-radius:9999px;border:3px solid #0066cc;background:#fff url('${photo}') center 25%/cover no-repeat;box-shadow:0 10px 25px rgba(11,42,91,.35)"></div>`;
const ICONE_ARRIVEE = `<div class="-translate-x-1/2 -translate-y-1/2"><span class="flex size-5 items-center justify-center rounded-full bg-accent-500 shadow-lg ring-4 ring-accent-500/30"><span class="size-2 rounded-full bg-[#fff]"></span></span></div>`;
const ICONE_DEPART = `<div class="-translate-x-1/2 -translate-y-1/2"><span class="block size-3.5 rounded-full border-[3px] border-[#0066cc] bg-[#fff] shadow"></span></div>`;

/** Suivi en temps réel du trajet du technicien jusqu'au lieu d'intervention, sur carte OpenStreetMap. */
export default function SuiviTrajet({ tech, destination, statut, vue = "client", client }: Props) {
  const enDirect = statut === "acceptee" || statut === "en_cours";
  const termine = statut === "terminee";
  const debut = useMemo(() => depart(tech, destination), [tech, destination]);
  const arrivee = useMemo(() => centreZone(destination), [destination]);

  const { conteneur, carte, L, pret } = useLeaflet(arrivee, 14);
  const eta = useRef<HTMLSpanElement>(null);
  const distance = useRef<HTMLSpanElement>(null);
  const barre = useRef<HTMLSpanElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const [route, setRoute] = useState<Itineraire | null>(null);
  const [phase, setPhase] = useState<Phase>(termine ? "arrive" : "attente");

  // Itinéraire réel par les rues.
  useEffect(() => {
    let annule = false;
    itineraire(debut, arrivee).then((r) => {
      if (!annule) setRoute(r);
    });
    return () => {
      annule = true;
    };
  }, [debut, arrivee]);

  // Tracés, repères et déplacement du technicien le long de l'itinéraire.
  useEffect(() => {
    if (!pret || !route || !carte.current || !L.current) return;
    const map = carte.current;
    const leaflet = L.current;
    const coords = route.trace.map((p) => [p.lat, p.lng] as [number, number]);
    const icone = (html: string) => leaflet.divIcon({ html, className: "", iconSize: [0, 0] });

    const reste: Polyline = leaflet.polyline(coords, { color: "#94a3b8", weight: 5, opacity: 0.7, dashArray: "2 10", lineCap: "round" }).addTo(map);
    const fait: Polyline = leaflet.polyline([coords[0]], { color: "#0066cc", weight: 6, opacity: 0.95, lineCap: "round", lineJoin: "round" }).addTo(map);
    const pointDepart: Marker = leaflet.marker(coords[0], { icon: icone(ICONE_DEPART), interactive: false }).addTo(map);
    const pointArrivee: Marker = leaflet.marker(coords[coords.length - 1], { icon: icone(ICONE_ARRIVEE), interactive: false }).addTo(map);
    const moto: Marker = leaflet.marker(coords[0], { icon: icone(iconeTechnicien(tech.photo)), zIndexOffset: 1000 }).addTo(map);
    // La carte peut être mesurée avant la fin de l'animation d'entrée : on recalcule sa taille avant de cadrer.
    const cadrer = () => {
      map.invalidateSize();
      map.fitBounds(reste.getBounds(), { padding: [28, 28], maxZoom: 16 });
    };
    cadrer();
    const recadrage = window.setTimeout(cadrer, 700);

    const placer = (t: number) => {
      moto.setLatLng(pointSurTrace(route.trace, t));
      fait.setLatLngs(traceParcourue(route.trace, t).map((q) => [q.lat, q.lng] as [number, number]));
      if (eta.current) eta.current.textContent = String(Math.max(0, Math.ceil(route.dureeMin * (1 - t))));
      if (distance.current) distance.current.textContent = (route.distanceKm * (1 - t)).toFixed(1).replace(".", ",");
      if (barre.current) barre.current.style.transform = `scaleX(${t})`;
    };

    if (!enDirect || prefersReducedMotion()) {
      placer(termine || prefersReducedMotion() ? 1 : 0);
    } else {
      const etat = { t: 0 };
      placer(0);
      tween.current = gsap.to(etat, {
        t: 1,
        duration: DUREE,
        ease: "power1.inOut",
        delay: 0.8,
        onStart: () => setPhase("en_route"),
        onUpdate: () => placer(etat.t),
        onComplete: () => setPhase("arrive"),
      });
    }

    return () => {
      window.clearTimeout(recadrage);
      tween.current?.kill();
      tween.current = null;
      [reste, fait, pointDepart, pointArrivee, moto].forEach((c) => c.remove());
    };
  }, [pret, route, carte, L, enDirect, termine, tech.photo]);

  async function partager() {
    const url = window.location.href;
    const titre = `Suivi de l'intervention de ${tech.nom}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: titre, text: `${titre} – GDC`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Lien de suivi copié");
    } catch (e) {
      // Partage annulé par l'utilisateur : rien à signaler.
      if ((e as Error).name !== "AbortError") toast("Impossible de partager le lien.", "error");
    }
  }

  function rejouer() {
    setPhase("en_route");
    tween.current?.restart(true);
  }

  const titre = vue === "client" ? "Suivi du trajet" : `Itinéraire vers ${client ?? "le client"}`;
  const statutTexte =
    !enDirect && !termine
      ? "Le suivi démarre dès que le technicien se met en route."
      : phase === "arrive"
        ? statut === "en_cours"
          ? `Arrivé à ${destination} · intervention en cours`
          : `Arrivé à ${destination}`
        : phase === "en_route"
          ? vue === "client"
            ? `${tech.nom.split(" ")[0]} est en route vers vous`
            : `En route vers ${destination}`
          : "Calcul de l'itinéraire…";

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="font-bold text-slate-900">{titre}</h2>
          <p className="text-sm text-slate-500">{statutTexte}</p>
        </div>
        {enDirect && phase !== "arrive" && (
          <Badge tone="red" className="gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
            En direct
          </Badge>
        )}
        {phase === "arrive" && (
          <Badge tone="green" dot>
            Arrivé
          </Badge>
        )}
      </div>

      <div className="relative mt-4">
        <div ref={conteneur} className="h-80 w-full bg-slate-100" aria-label="Carte du trajet du technicien" />
        <div className="absolute left-3 top-3 z-[400] flex items-center gap-3 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur sm:left-4 sm:top-4">
          <Avatar nom={tech.nom} className="size-10" />
          <div className="text-sm">
            <p className="font-bold text-slate-900">{vue === "client" ? tech.nom : "Vous"}</p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Bike className="size-3.5" /> Moto · RC-4521-GN
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 text-center">
        <div className="py-4">
          <p className="text-2xl font-extrabold text-brand-950">
            <span ref={eta}>{route ? (termine ? 0 : route.dureeMin) : "–"}</span> <span className="text-sm font-semibold text-slate-500">min</span>
          </p>
          <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
            <Clock className="size-3" /> Arrivée estimée
          </p>
        </div>
        <div className="py-4">
          <p className="text-2xl font-extrabold text-brand-950">
            <span ref={distance}>{route ? (termine ? "0,0" : route.distanceKm.toFixed(1).replace(".", ",")) : "–"}</span>{" "}
            <span className="text-sm font-semibold text-slate-500">km</span>
          </p>
          <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
            <Navigation className="size-3" /> Distance restante
          </p>
        </div>
        <div className="py-4">
          <p className="text-2xl font-extrabold text-brand-950">10h15</p>
          <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
            <MapPin className="size-3" /> {phase === "arrive" ? "Arrivé à" : "Arrivée prévue"}
          </p>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="relative h-1.5 rounded-full bg-slate-100">
          <span ref={barre} className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-brand-600 to-accent-500" style={{ transform: `scaleX(${termine ? 1 : 0})` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs font-semibold">
          <span className="text-brand-700">Départ · 10h02</span>
          <span className={cn(phase !== "attente" ? "text-brand-700" : "text-slate-400")}>En route</span>
          <span className={cn(phase === "arrive" ? "text-accent-600" : "text-slate-400")}>Arrivée</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {vue === "client" && (
            <a
              href={`tel:${tech.telephone.replace(/\s/g, "")}`}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-50 px-3 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              <Phone className="size-4" /> Appeler
            </a>
          )}
          <a
            href={lienGoogleMaps(arrivee, vue === "technicien" ? undefined : debut)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <ExternalLink className="size-4" /> Ouvrir dans Google Maps
          </a>
          <Button size="sm" variant="ghost" onClick={partager}>
            <Share2 className="size-4" /> Partager le suivi
          </Button>
          {enDirect && phase === "arrive" && (
            <Button size="sm" variant="ghost" className="ml-auto" onClick={rejouer}>
              <RotateCcw className="size-4" /> Revoir le trajet
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
