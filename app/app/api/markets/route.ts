import { NextResponse } from "next/server";
import { getMarkets } from "@/lib/server/jupiter";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json({ ok: true, source: "Jupiter Token API v2 + Price API v3", updatedAt: Date.now(), rows: await getMarkets() }); }
  catch (e) { return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 }); }
}
