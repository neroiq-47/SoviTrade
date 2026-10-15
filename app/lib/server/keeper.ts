import "server-only";
import { checkDeviation } from "./oracle-deviation";

/**
 * Cloudflare Durable Object skeleton for per-bot execution (Sovereign Mode).
 * One DO per bot. Serialises actions, holds idempotency, sets alarms.
 */

export interface BotConfig {
  id: string;
  strategy: "dca" | "rebalance";
  ticker: string;
  mint: string;
  safeguards: {
    positionCap: number;
    dailyLoss: number;
    slippageBps: number;
    deviationBps: number;
  };
  sessionPublicKey: string;
  expirySlot: bigint;
}

export interface TradeIntent {
  botId: string;
  side: "buy" | "sell";
  amountUsdc: number;
  reason: string;
}

export async function evaluateBot(bot: BotConfig, currentPrice: number, issuerQuote: number, multiplier: number): Promise<TradeIntent | null> {
  const dev = checkDeviation({
    issuerQuote,
    multiplier,
    jupiterUsdPrice: currentPrice,
    toleranceBps: bot.safeguards.deviationBps,
  });
  if (!dev.withinBand) return null;

  // Simplified DCA: buy every interval if within band
  if (bot.strategy === "dca") {
    return {
      botId: bot.id,
      side: "buy",
      amountUsdc: 50, // from bot config
      reason: "DCA interval + deviation OK",
    };
  }
  return null;
}

/**
 * Keeper tick (called by Worker cron).
 * Fan-out to DOs. Each DO runs evaluateBot + execute via Swig session if due.
 */
export async function keeperTick(dueBots: BotConfig[]) {
  const intents = [];
  for (const bot of dueBots) {
    // fetch prices, call evaluateBot
    // if intent, build Jupiter swap tx, sign with session key, send
  }
  return intents;
}
