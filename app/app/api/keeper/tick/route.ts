import { NextRequest, NextResponse } from "next/server";
import { keeperTick, type BotConfig } from "@/lib/server/keeper";

export const dynamic = "force-dynamic";

const MAX_BODY = 32_000;

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sanitize(raw: unknown): BotConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.mint !== "string" || typeof row.sessionPublicKey !== "string") return null;
  if ("secretKey" in row || "sessionSecret" in row || "privateKey" in row) return null;
  const guards = (row.safeguards ?? {}) as Record<string, unknown>;
  const strategy = row.strategy === "rebalance" ? "rebalance" : "dca";
  return {
    id: row.id.slice(0, 80),
    strategy,
    ticker: String(row.ticker ?? "").slice(0, 12),
    issuer: String(row.issuer ?? "").slice(0, 32),
    mint: row.mint,
    amountUsdc: num(row.amountUsdc),
    intervalSec: Math.max(60, num(row.intervalSec, 86_400)),
    nextTickAt: row.nextTickAt == null ? null : num(row.nextTickAt),
    safeguards: {
      positionCap: num(guards.positionCap, 20),
      dailyLoss: num(guards.dailyLoss, 5),
      drawdown: num(guards.drawdown, 20),
      slippageBps: num(guards.slippageBps, 50),
      priceImpactPct: num(guards.priceImpactPct, 1),
      deviationBps: num(guards.deviationBps, 150),
    },
    sessionPublicKey: row.sessionPublicKey,
    expirySlot: String(row.expirySlot ?? "0"),
    allowedPrograms: Array.isArray(row.allowedPrograms) ? row.allowedPrograms.filter((p): p is string => typeof p === "string").slice(0, 12) : [],
    status: row.status === "revoked" || row.status === "active" || row.status === "dry-run" ? row.status : "dry-run",
  };
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, error: "Request too large" }, { status: 413 });
  if (/"sessionSecret"|"secretKey"|"privateKey"/i.test(raw)) {
    return NextResponse.json({ ok: false, error: "Refusing session secrets" }, { status: 400 });
  }
  let body: { bots?: unknown; dryRun?: unknown };
  try {
    body = JSON.parse(raw) as { bots?: unknown; dryRun?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const authed = Boolean(process.env.KEEPER_CRON_SECRET) && req.headers.get("authorization") === `Bearer ${process.env.KEEPER_CRON_SECRET}`;
  const dryRun = body.dryRun !== false || !authed;
  const bots = (Array.isArray(body.bots) ? body.bots : []).slice(0, 20).map(sanitize).filter((bot): bot is BotConfig => bot !== null);
  const results = await keeperTick(bots, { dryRun, rpcUrl: process.env.SOLANA_RPC_URL });
  return NextResponse.json({ ok: true, dryRun, results }, { headers: { "cache-control": "no-store" } });
}
