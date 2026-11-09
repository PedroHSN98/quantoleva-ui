import { NextResponse } from "next/server";
import { createTest, hashIp, listLocations, rateLimited } from "@/lib/data";
import { MAX_URLS_PER_SUBMIT } from "@/lib/limits";
import { checkUrl } from "@/lib/validate-url";

/** Body: { url: string, location? } for one site, or { urls: string[], location? } for up to 5.
 *  Answers { publicId } for one, { publicIds } for several (same order as sent, duplicates removed). */
export async function POST(req: Request) {
  let body: { url?: unknown; urls?: unknown; location?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const rawList = Array.isArray(body.urls) ? body.urls : typeof body.url === "string" ? [body.url] : null;
  if (!rawList || rawList.length === 0 || rawList.some((u) => typeof u !== "string")) {
    return NextResponse.json({ error: "invalid_url", index: 0 }, { status: 400 });
  }
  if (rawList.length > MAX_URLS_PER_SUBMIT) {
    return NextResponse.json({ error: "too_many_urls", max: MAX_URLS_PER_SUBMIT }, { status: 400 });
  }

  // Validate everything before creating anything, so a bad line does not leave half a batch behind.
  const urls: string[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const check = checkUrl(rawList[i] as string);
    if (!check.ok) return NextResponse.json({ error: check.code, index: i }, { status: 400 });
    if (!urls.includes(check.url)) urls.push(check.url);
  }

  const locations = await listLocations();
  const slug = typeof body.location === "string" ? body.location : locations[0]?.slug;
  if (!slug || !locations.some((l) => l.slug === slug)) {
    return NextResponse.json({ error: "invalid_location" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const ipHash = hashIp(ip);
  if (await rateLimited(ipHash, urls.length)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  try {
    const ids: string[] = [];
    for (const u of urls) ids.push((await createTest(u, slug, ipHash)).publicId);
    return NextResponse.json(ids.length === 1 && !Array.isArray(body.urls) ? { publicId: ids[0] } : { publicIds: ids }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
