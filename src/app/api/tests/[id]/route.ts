import { NextResponse } from "next/server";
import { getRules, getTest } from "@/lib/data";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const test = await getTest(id);
  if (!test) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ test, rules: await getRules(id) });
}
