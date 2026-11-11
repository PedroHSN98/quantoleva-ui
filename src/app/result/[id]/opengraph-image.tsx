import { ImageResponse } from "next/og";
import { getTest } from "@/lib/data";
import { BRAND } from "@/lib/brand";

// Runs on the server (reads the database), so it needs the Node runtime, not edge.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `Resultado no ${BRAND.name}`;

const GRADE_COLOR: Record<string, string> = { A: "#1f7a4d", B: "#4d7a1f", C: "#8a5a00", D: "#b24a12", E: "#c62f2f", F: "#8f1d1d" };
const VERDICT: Record<string, string> = { A: "Excelente", B: "Bom", C: "Razoável", D: "Fraco", E: "Ruim", F: "Muito ruim" };

const LOGO =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#5fd9cc"/><path d="M7.5 21a8.5 8.5 0 0 1 17 0" fill="none" stroke="#05211f" stroke-opacity=".35" stroke-width="2.6" stroke-linecap="round"/><path d="M7.5 21a8.5 8.5 0 0 1 5.4-7.9" fill="none" stroke="#05211f" stroke-width="2.6" stroke-linecap="round"/><path d="M16 21l5.2-6.2" fill="none" stroke="#05211f" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="21" r="2.1" fill="#05211f"/></svg>`,
  ).toString("base64");

const seconds = (ms?: number) => (ms == null ? "—" : `${(ms / 1000).toFixed(2)} s`);
const bytes = (b?: number) => (b == null ? "—" : b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${Math.round(b / 1024)} KB`);
function hostOf(url?: string) {
  try {
    return new URL(url ?? "").host;
  } catch {
    return url ?? BRAND.name;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const test = await getTest(id).catch(() => null);
  const done = test?.status === "done" && !!test.grade;
  const grade = test?.grade ?? "?";
  const color = GRADE_COLOR[grade] ?? "#5fd9cc";
  const host = hostOf(test?.url);

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
          padding: "64px",
          color: "#ffffff",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img src={LOGO} width={56} height={56} alt="" />
          <span style={{ fontSize: 34, fontWeight: 700 }}>{BRAND.name}</span>
        </div>

        {/* Grade + details */}
        <div style={{ display: "flex", alignItems: "center", gap: "56px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "240px",
              height: "240px",
              borderRadius: "999px",
              border: `16px solid ${color}`,
              backgroundColor: "#0e3330",
            }}
          >
            <span style={{ fontSize: 120, fontWeight: 800, lineHeight: 1, color }}>{done ? grade : "–"}</span>
            {done && <span style={{ fontSize: 30, color: "#aacdc9" }}>{test!.score}/100</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: "720px" }}>
            <span style={{ fontSize: 30, color: "#aacdc9" }}>{done ? VERDICT[grade] : "Resultado do teste"}</span>
            <span style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.05, marginTop: "6px" }}>{host}</span>
            <div style={{ display: "flex", gap: "40px", marginTop: "28px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 24, color: "#aacdc9" }}>Tempo</span>
                <span style={{ fontSize: 44, fontWeight: 700 }}>{seconds(test?.loadMs)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 24, color: "#aacdc9" }}>Peso</span>
                <span style={{ fontSize: 44, fontWeight: 700 }}>{bytes(test?.pageBytes)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex" }}>
          <span style={{ fontSize: 26, color: "#aacdc9" }}>{BRAND.tagline}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
