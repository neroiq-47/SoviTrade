import "server-only";
import { checkDeviation } from "../risk";

export { checkDeviation };
export type { DeviationInput, DeviationResult } from "../risk";

/** Example from Oct 2026 live test: 345.52 × 1.00327 ≈ 346.65 vs Jupiter 345.87 → ~0.22% */
export const EXAMPLE_AAPL = checkDeviation({
  issuerQuote: 345.5195,
  multiplier: 1.003269,
  jupiterUsdPrice: 345.87,
});
