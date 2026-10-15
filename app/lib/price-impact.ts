/**
 * Jupiter names the field `priceImpactPct`, but the live value is a fraction.
 * 0.01 means 1 percent. A 500k USDC clip into AAPLx returned ~0.67, and the
 * token out was about a third of fair value, so this is not already a percent.
 */
export function jupiterImpactPercent(raw: string | number): number {
  const fraction = Math.abs(Number(raw));
  if (!Number.isFinite(fraction)) return Number.NaN;
  return fraction * 100;
}
