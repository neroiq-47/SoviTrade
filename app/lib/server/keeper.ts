import { tickIdempotencyKey } from "../idempotency";
import { assertNotBrowser } from "./boundary";
import { xstocksReference } from "./issuer-reference";
import { jupiterUsdPrice } from "./jupiter-swap";

assertNotBrowser();

/**
 * Per-bot keeper tick for Sovereign Mode.
 * Dry-run is the default: the intended Jupiter swap is logged and not sent.
 */

export interface BotConfig {
  id: string;
  strategy: "dca" | "rebalance";
  ticker: string;
  issuer: string;
  mint: string;
  amountUsdc: number;
  intervalSec: number;
  nextTickAt?: number | null;
  safeguards: {
    positionCap: number;
    dailyLoss: number;
    drawdown: number;
    slippageBps: number;
    priceImpactPct: number;
    deviationBps: number;
  };
  sessionPublicKey: string;
  expirySlot: bigint | string;
  allowedPrograms: string[];
  status?: "dry-run" | "active" | "revoked";
}

export interface TradeIntent {
  botId: string;
  side: "buy" | "sell";
  amountUsdc: number;
  reason: string;
}

export interface MarketSnapshot {
  jupiterPrice: number;
  issuerQuote: number | null;
  multiplier: number | null;
  positionValue: number;
  totalValue: number;
  dailyPnlPct: number;
  drawdownPct: number;
}

export type TickAction = "duplicate" | "skip" | "hold" | "dry-run" | "blocked" | "submitted" | "error";

export interface TickResult {
  botId: string;
  idempotencyKey: string;
  action: TickAction;
  reasons: string[];
  intent: TradeIntent | null;
  quote: {
    inAmount: string;
    outAmount: string;
    slippageBps: number;
    priceImpactPct: number;
    programs: string[];
  } | null;
  submitted: boolean;
  signature: string | null;
}

export interface KeeperTickOptions {
  dryRun?: boolean;
  now?: number;
  rpcUrl?: string;
  seen?: Map<string, number>;
  /** Look up sealed session material. Never log the returned bytes. */
  sessionSecretFor?: (sessionPublicKey: string) => Uint8Array | undefined;
}

const seenTicks = new Map<string, number>();

export function evaluateBot(bot: BotConfig, now = Date.now()): TradeIntent | null {
  if (bot.nextTickAt != null && now < bot.nextTickAt) return null;
  if (bot.strategy !== "dca") return null;
  if (!(bot.amountUsdc > 0)) return null;
  return {
    botId: bot.id,
    side: "buy",
    amountUsdc: bot.amountUsdc,
    reason: "DCA interval elapsed",
  };
}

export async function loadBotMarket(bot: BotConfig): Promise<MarketSnapshot | { error: string }> {
  let jupiterPrice: number | null;
  try {
    jupiterPrice = await jupiterUsdPrice(bot.mint);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Jupiter price failed" };
  }
  if (jupiterPrice == null) return { error: `No Jupiter price for ${bot.ticker}` };
  const ref = bot.issuer === "xstocks" ? await xstocksReference(bot.ticker) : { multiplier: null, issuerQuote: null };
  return {
    jupiterPrice,
    issuerQuote: ref.issuerQuote,
    multiplier: ref.multiplier,
    positionValue: 0,
    totalValue: Math.max(bot.amountUsdc, 1),
    dailyPnlPct: 0,
    drawdownPct: 0,
  };
}

/**
 * Fan-out for a cron tick. Each bot is quoted at most once per interval.
 * Signing happens inside `tickBot` and only when dry-run is explicitly off.
 */
export async function keeperTick(dueBots: BotConfig[], opts: KeeperTickOptions = {}): Promise<TickResult[]> {
  const dryRun = opts.dryRun !== false;
  const now = opts.now ?? Date.now();
  const seen = opts.seen ?? seenTicks;
  const { tickBot } = await import("./execute-bot");
  const results: TickResult[] = [];
  for (const bot of dueBots) {
    const idempotencyKey = tickIdempotencyKey(bot.id, bot.intervalSec, now);
    const market = await loadBotMarket(bot);
    if ("error" in market) {
      results.push({ botId: bot.id, idempotencyKey, action: "error", reasons: [market.error], intent: null, quote: null, submitted: false, signature: null });
      continue;
    }
    results.push(await tickBot(bot, market, {
      dryRun,
      now,
      idempotencyKey,
      seen,
      rpcUrl: opts.rpcUrl,
      sessionSecret: dryRun ? undefined : opts.sessionSecretFor?.(bot.sessionPublicKey),
    }));
  }
  return results;
}
