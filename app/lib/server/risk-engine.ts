import "server-only";
import { checkDeviation } from "./oracle-deviation";

export interface RiskCheckInput {
  positionValue: number;
  totalBotValue: number;
  dailyPnlPct: number;
  lifetimeDrawdownPct: number;
  slippageBps: number;
  priceImpactPct: number;
  issuerQuote: number;
  multiplier: number;
  jupiterPrice: number;
  safeguards: {
    positionCap: number;
    dailyLoss: number;
    drawdown: number;
    slippage: number;
    priceImpact: number;
    deviation: number;
  };
}

export interface RiskResult {
  allowed: boolean;
  reasons: string[];
}

export function evaluateRisk(input: RiskCheckInput): RiskResult {
  const reasons: string[] = [];
  const posPct = (input.positionValue / input.totalBotValue) * 100;
  if (posPct > input.safeguards.positionCap) reasons.push(`Position cap exceeded (${posPct.toFixed(1)}%)`);
  if (input.dailyPnlPct < -input.safeguards.dailyLoss) reasons.push("Daily loss limit hit");
  if (input.lifetimeDrawdownPct > input.safeguards.drawdown) reasons.push("Max drawdown hit");
  if (input.slippageBps > input.safeguards.slippage) reasons.push("Slippage too high");
  if (input.priceImpactPct > input.safeguards.priceImpact) reasons.push("Price impact too high");

  const dev = checkDeviation({
    issuerQuote: input.issuerQuote,
    multiplier: input.multiplier,
    jupiterUsdPrice: input.jupiterPrice,
    toleranceBps: input.safeguards.deviation * 100,
  });
  if (!dev.withinBand) reasons.push(dev.note);

  return { allowed: reasons.length === 0, reasons };
}
