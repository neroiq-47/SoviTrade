/**
 * Pure guardrails. No I/O, safe to unit-test and to import from the keeper worker.
 * Basis points: 100 bps = 1%. `checkDeviation` compares a percent move to bps/100.
 */

export interface DeviationInput {
  issuerQuote: number;
  multiplier: number;
  jupiterUsdPrice: number;
  /** Default 150 = 1.5 percent. */
  toleranceBps?: number;
}

export interface DeviationResult {
  refPrice: number;
  dexPrice: number;
  deviationPct: number;
  withinBand: boolean;
  note: string;
}

export function checkDeviation(input: DeviationInput): DeviationResult {
  const tolerancePct = (input.toleranceBps ?? 150) / 100;
  const ref = input.issuerQuote * input.multiplier;
  const dex = input.jupiterUsdPrice;
  const finite = Number.isFinite(ref) && Number.isFinite(dex) && Number.isFinite(tolerancePct);
  if (!finite || ref <= 0 || dex <= 0 || tolerancePct < 0) {
    return {
      refPrice: ref,
      dexPrice: dex,
      deviationPct: Number.NaN,
      withinBand: false,
      note: "Invalid oracle inputs — reject trade",
    };
  }
  const deviationPct = ((dex - ref) / ref) * 100;
  const withinBand = Math.abs(deviationPct) <= tolerancePct;
  return {
    refPrice: ref,
    dexPrice: dex,
    deviationPct,
    withinBand,
    note: withinBand
      ? "Within deviation band"
      : `Outside ${tolerancePct}% band — reject trade or widen for off-hours`,
  };
}

export interface RiskCheckInput {
  positionValue: number;
  totalBotValue: number;
  dailyPnlPct: number;
  lifetimeDrawdownPct: number;
  slippageBps: number;
  priceImpactPct: number;
  /** Null when the issuer print is missing. Live trades must fail closed. */
  issuerQuote: number | null;
  multiplier: number | null;
  jupiterPrice: number;
  safeguards: {
    positionCap: number;
    dailyLoss: number;
    drawdown: number;
    slippageBps: number;
    priceImpactPct: number;
    deviationBps: number;
  };
}

export interface RiskResult {
  allowed: boolean;
  reasons: string[];
}

export function evaluateRisk(input: RiskCheckInput): RiskResult {
  const reasons: string[] = [];
  const s = input.safeguards;
  if (!(input.totalBotValue > 0) || !Number.isFinite(input.totalBotValue)) {
    reasons.push("Bot value is zero or invalid");
  } else if (!Number.isFinite(input.positionValue) || input.positionValue < 0) {
    reasons.push("Position value is invalid");
  } else {
    const posPct = (input.positionValue / input.totalBotValue) * 100;
    if (posPct > s.positionCap) reasons.push(`Position cap exceeded (${posPct.toFixed(1)}%)`);
  }
  if (!Number.isFinite(input.dailyPnlPct)) reasons.push("Daily P&L is invalid");
  else if (input.dailyPnlPct < -s.dailyLoss) reasons.push("Daily loss limit hit");
  if (!Number.isFinite(input.lifetimeDrawdownPct)) reasons.push("Drawdown is invalid");
  else if (input.lifetimeDrawdownPct > s.drawdown) reasons.push("Max drawdown hit");
  if (!Number.isFinite(input.slippageBps) || input.slippageBps < 0) reasons.push("Slippage is invalid");
  else if (input.slippageBps > s.slippageBps) reasons.push("Slippage too high");
  if (!Number.isFinite(input.priceImpactPct) || input.priceImpactPct < 0) reasons.push("Price impact is invalid");
  else if (input.priceImpactPct > s.priceImpactPct) reasons.push("Price impact too high");

  if (input.issuerQuote == null || input.multiplier == null) {
    reasons.push("Issuer reference quote unavailable — reject trade");
  } else {
    const dev = checkDeviation({
      issuerQuote: input.issuerQuote,
      multiplier: input.multiplier,
      jupiterUsdPrice: input.jupiterPrice,
      toleranceBps: s.deviationBps,
    });
    if (!dev.withinBand) reasons.push(dev.note);
  }

  return { allowed: reasons.length === 0, reasons };
}
