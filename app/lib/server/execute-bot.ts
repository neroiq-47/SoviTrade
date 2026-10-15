import "server-only";
import { evaluateBot, type BotConfig } from "./keeper";
import { evaluateRisk } from "./risk-engine";

/**
 * High-level orchestrator for a single bot tick.
 * Used by the Durable Object or Worker.
 */
export async function tickBot(bot: BotConfig, market: {
  jupiterPrice: number;
  issuerQuote: number;
  multiplier: number;
  positionValue: number;
  totalValue: number;
  dailyPnlPct: number;
  drawdownPct: number;
}) {
  const risk = evaluateRisk({
    positionValue: market.positionValue,
    totalBotValue: market.totalValue,
    dailyPnlPct: market.dailyPnlPct,
    lifetimeDrawdownPct: market.drawdownPct,
    slippageBps: 30,
    priceImpactPct: 0.3,
    issuerQuote: market.issuerQuote,
    multiplier: market.multiplier,
    jupiterPrice: market.jupiterPrice,
    safeguards: {
      positionCap: bot.safeguards.positionCap,
      dailyLoss: bot.safeguards.dailyLoss,
      drawdown: 20,
      slippage: bot.safeguards.slippageBps,
      priceImpact: 1,
      deviation: bot.safeguards.deviationBps / 100,
    },
  });

  if (!risk.allowed) return { action: "skip", reasons: risk.reasons };

  const intent = await evaluateBot(bot, market.jupiterPrice, market.issuerQuote, market.multiplier);
  if (!intent) return { action: "hold" };

  // TODO: build Jupiter swap tx, sign with session key, send, confirm
  return { action: "execute", intent };
}
