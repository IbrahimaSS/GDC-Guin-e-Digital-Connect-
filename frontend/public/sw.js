// Service worker GDC : l'application reste utilisable avec une connexion lente ou coupée.
// - Pages : réseau d'abord, copie en cache en secours, page hors-ligne en dernier recours.
// - Fichiers statiques (JS, CSS, polices, images) : cache d'abord, mis à jour en arrière-plan.
// - Tuiles de carte : cache limité, pour revoir les zones déjà consultées.

const VERSION = "gdc-v1";
const CACHE_PAGES = `${VERSION}-pages`;
const CACHE_STATIQUE = `${VERSION}-statique`;
const CACHE_TUILES = `${VERSION}-tuiles`;
const MAX_TUILES = 300;
const HORS_LIGNE = "/hors-ligne";
const A_PRECHARGER = [HORS_LIGNE, "/", "/recherche", "/publier-une-demande", "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_PAGES)
      .then((cache) => cache.addAll(A_PRECHARGER))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => !c.startsWith(VERSION)).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

async function limiter(nomCache, max) {
  const cache = await caches.open(nomCache);
  const cles = await cache.keys();
  for (let i = 0; i < cles.length - max; i++) await cache.delete(cles[i]);
}

async function reseauDabord(requete) {
  const cache = await caches.open(CACHE_PAGES);
  try {
    const reponse = await fetch(requete);
    if (reponse.ok) cache.put(requete, reponse.clone());
    return reponse;
  } catch {
    return (await cache.match(requete, { ignoreSearch: true })) || (await cache.match(HORS_LIGNE)) || Response.error();
  }
}

async function cacheDabord(requete, nomCache) {
  const cache = await caches.open(nomCache);
  const enCache = await cache.match(requete);
  const reseau = fetch(requete)
    .then((reponse) => {
      if (reponse.ok || reponse.type === "opaque") cache.put(requete, reponse.clone());
      return reponse;
    })
    .catch(() => undefined);
  return enCache || (await reseau) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.hostname === "tile.openstreetmap.org") {
    event.respondWith(cacheDabord(request, CACHE_TUILES).finally(() => limiter(CACHE_TUILES, MAX_TUILES)));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Données de navigation Next.js (RSC) et pages HTML.
  if (request.mode === "navigate" || request.headers.get("RSC")) {
    event.respondWith(reseauDabord(request));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/_next/image") || /\.(png|jpe?g|webp|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheDabord(request, CACHE_STATIQUE));
  }
});
