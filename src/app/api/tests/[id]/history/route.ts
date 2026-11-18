import { NextResponse } from "next/server";
import { getHistory } from "@/lib/data";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json(await getHistory(id));
}
