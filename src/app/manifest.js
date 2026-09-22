// Manifest PWA — convention Next.js (App Router) : ce fichier est servi
// automatiquement sur /manifest.webmanifest, et la balise <link rel="manifest">
// est ajoutée toute seule dans le <head> (comme pour icon.png, sitemap.js…).
// Permet au navigateur de proposer "Ajouter à l'écran d'accueil".
export default function manifest() {
  return {
    name: "Pronos Foot",
    short_name: "Pronos Foot",
    description: "Analyses IA du football — championnats en cours, mis à jour en continu.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "fr",
    background_color: "#0a0f0c",
    theme_color: "#0a0f0c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
