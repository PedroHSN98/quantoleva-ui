import { NextResponse } from "next/server";
import { queueStats } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Queue size, for monitoring and for tests that need an idle worker. Counts only, no URLs. */
export async function GET() {
  return NextResponse.json(await queueStats(), { headers: { "cache-control": "no-store" } });
}
