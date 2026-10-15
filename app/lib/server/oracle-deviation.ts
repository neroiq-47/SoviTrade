import "server-only";

/**
 * 2026 free-tier oracle deviation check for tokenised stocks.
 * Primary: xStocks issuer quote × Solana multiplier vs Jupiter usdPrice.
 * Optional secondary: Chainlink Tokenized Equity Feeds (multiplier-aware) or Pyth (paid for live).
 */

export interface DeviationInput {
  issuerQuote: number;      // e.g. xStocks price-data quote
  multiplier: number;       // e.g. 1.003269
  jupiterUsdPrice: number;
  toleranceBps?: number;    // default 150 = 1.5%
}

export interface DeviationResult {
  refPrice: number;
  dexPrice: number;
  deviationPct: number;
  withinBand: boolean;
  note: string;
}

export function checkDeviation(input: DeviationInput): DeviationResult {
  const tolerance = (input.toleranceBps ?? 150) / 100;
  const ref = input.issuerQuote * input.multiplier;
  const dex = input.jupiterUsdPrice;
  const deviationPct = ((dex - ref) / ref) * 100;
  const withinBand = Math.abs(deviationPct) <= tolerance;
  return {
    refPrice: ref,
    dexPrice: dex,
    deviationPct,
    withinBand,
    note: withinBand
      ? "Within deviation band"
      : `Outside ${tolerance}% band — reject trade or widen for off-hours`,
  };
}

/** Example from Oct 2026 live test: 345.52 × 1.00327 ≈ 346.65 vs Jupiter 345.87 → ~0.22% */
export const EXAMPLE_AAPL = checkDeviation({
  issuerQuote: 345.5195,
  multiplier: 1.003269,
  jupiterUsdPrice: 345.87,
});
