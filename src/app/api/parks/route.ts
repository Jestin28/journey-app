import { NextResponse } from "next/server";
import { getNationalParks } from "@/lib/nps";

export const dynamic = "force-dynamic";

export async function GET() {
  const parks = await getNationalParks();

  return NextResponse.json({ parks });
}
