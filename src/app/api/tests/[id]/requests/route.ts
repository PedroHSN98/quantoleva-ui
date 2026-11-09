import { NextResponse } from "next/server";
import { getRequests, getTest } from "@/lib/data";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!(await getTest(id))) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(await getRequests(id));
}
