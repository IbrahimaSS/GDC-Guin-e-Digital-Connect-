import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GDC – Guinée Digital Connect",
    short_name: "GDC",
    description: "Trouvez le bon technicien ou artisan en Guinée, suivez vos missions.",
    lang: "fr",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#071a3a",
    theme_color: "#0066cc",
    categories: ["business", "productivity", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Publier une demande", url: "/publier-une-demande", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Mes demandes", url: "/client/demandes", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Espace technicien", url: "/technicien", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
