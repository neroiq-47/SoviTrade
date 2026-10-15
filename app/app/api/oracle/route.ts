import { NextRequest, NextResponse } from "next/server";
import { getOracle } from "@/lib/server/pyth";
export async function GET(req: NextRequest) {
  const t = (req.nextUrl.searchParams.get("ticker") ?? "").toUpperCase();
  if (!/^[A-Z.]{1,8}$/.test(t)) return NextResponse.json({ ok: false, error: "bad ticker" }, { status: 400 });
  try { return NextResponse.json({ ok: true, ...(await getOracle(t)) }); }
  catch (e) { return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 }); }
}
