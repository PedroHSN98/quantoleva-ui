import { NextResponse } from "next/server";
import { listLocations } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await listLocations());
}
