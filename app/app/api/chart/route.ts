import { NextRequest, NextResponse } from "next/server";
import { getCandles } from "@/lib/server/gecko";
export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get("mint") ?? ""; const tf = req.nextUrl.searchParams.get("tf") === "day" ? "day" : "hour";
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) return NextResponse.json({ ok: false, error: "bad mint" }, { status: 400 });
  try { return NextResponse.json({ ok: true, source: "GeckoTerminal OHLCV", ...(await getCandles(mint, tf, tf === "day" ? 90 : 168)) }); }
  catch (e) { return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 }); }
}
