import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sistema POS",
    short_name: "Sistema POS",
    description: "Punto de Venta y Gestión Comercial",
    start_url: "/pos",
    display: "standalone",
    background_color: "#d4d0c8",
    theme_color: "#000080",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    screenshots: [
      {
        src: "/icons/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        // @ts-ignore — form_factor is valid in PWA spec
        form_factor: "wide",
      },
    ],
    categories: ["business", "productivity"],
  }
}
