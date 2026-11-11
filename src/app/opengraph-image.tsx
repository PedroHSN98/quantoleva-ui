import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

// The card social apps show when the home link is shared. 1200x630 is the standard size.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${BRAND.name} — ${BRAND.tagline}`;

const LOGO =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#5fd9cc"/><path d="M7.5 21a8.5 8.5 0 0 1 17 0" fill="none" stroke="#05211f" stroke-opacity=".35" stroke-width="2.6" stroke-linecap="round"/><path d="M7.5 21a8.5 8.5 0 0 1 5.4-7.9" fill="none" stroke="#05211f" stroke-width="2.6" stroke-linecap="round"/><path d="M16 21l5.2-6.2" fill="none" stroke="#05211f" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="21" r="2.1" fill="#05211f"/></svg>`,
  ).toString("base64");

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a2927",
          backgroundImage: "linear-gradient(135deg, #0a2927 0%, #124542 100%)",
          padding: "72px",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <img src={LOGO} width={72} height={72} alt="" />
          <span style={{ fontSize: 44, fontWeight: 700 }}>{BRAND.name}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, maxWidth: "960px" }}>{BRAND.tagline}</span>
          <span style={{ fontSize: 32, color: "#aacdc9", marginTop: "20px", maxWidth: "900px" }}>
            Tempo, peso e cada arquivo que a página pede — num navegador de verdade, sem cache.
          </span>
        </div>
        <div style={{ display: "flex" }}>
          <span style={{ backgroundColor: "#5fd9cc", color: "#05211f", padding: "12px 24px", borderRadius: "999px", fontSize: 28, fontWeight: 700 }}>
            Grátis e sem conta
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
