// Service worker minimal — sert uniquement à rendre le site installable
// (condition requise par les navigateurs pour proposer "Ajouter à l'écran
// d'accueil"). Pas de cache complexe : on passe par le réseau, avec repli
// sur le cache seulement si le réseau échoue (hors-ligne).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
