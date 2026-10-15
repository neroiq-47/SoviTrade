import { NextRequest, NextResponse } from "next/server";
import { jupPrices } from "@/lib/server/jupiter";
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "").split(",").filter((s) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)).slice(0, 100);
  if (!ids.length) return NextResponse.json({ ok: false, error: "ids required" }, { status: 400 });
  try { return NextResponse.json({ ok: true, prices: await jupPrices(ids) }); }
  catch (e) { return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 }); }
}
