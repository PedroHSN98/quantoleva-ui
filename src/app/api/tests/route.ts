import { NextResponse } from "next/server";
import { createTest, hashIp, listLocations, rateLimited } from "@/lib/data";
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
  const ipHash = hashIp(ip);
  if (await rateLimited(ipHash)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  try {
    const test = await createTest(check.url, slug, ipHash);
    return NextResponse.json({ publicId: test.publicId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
