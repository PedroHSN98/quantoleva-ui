import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

// Lets a phone "install" the site to the home screen. Next serves it at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — ${BRAND.tagline}`,
    short_name: BRAND.name,
    description: "Teste de velocidade de páginas: tempo, peso e cada arquivo que a página pede.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#0a2927", // the dark hero color, used on the splash screen
    theme_color: "#0b6e69", // the brand accent, tints the phone's status bar
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
