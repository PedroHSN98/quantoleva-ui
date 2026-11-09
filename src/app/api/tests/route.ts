import { NextResponse } from "next/server";
import { createTest, listLocations, rateLimited } from "@/lib/data";
import { checkUrl } from "@/lib/validate-url";

export async function POST(req: Request) {
  let body: { url?: unknown; location?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  if (typeof body.url !== "string") return NextResponse.json({ error: "invalid_url" }, { status: 400 });

  const check = checkUrl(body.url);
  if (!check.ok) return NextResponse.json({ error: check.code }, { status: 400 });

  const locations = await listLocations();
  const slug = typeof body.location === "string" ? body.location : locations[0].slug;
  if (!locations.some((l) => l.slug === slug)) return NextResponse.json({ error: "invalid_location" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const test = await createTest(check.url, slug);
  return NextResponse.json({ publicId: test.publicId }, { status: 201 });
}
