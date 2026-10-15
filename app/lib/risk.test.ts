import assert from "node:assert/strict";
import test from "node:test";
import { claimIdempotency, tickIdempotencyKey } from "./idempotency.ts";
import { jupiterImpactPercent } from "./price-impact.ts";
import { checkDeviation, evaluateRisk } from "./risk.ts";

test("150 bps is 1.5 percent, not 150 percent", () => {
  const inside = checkDeviation({ issuerQuote: 100, multiplier: 1, jupiterUsdPrice: 101, toleranceBps: 150 });
  assert.equal(inside.withinBand, true);
  const outside = checkDeviation({ issuerQuote: 100, multiplier: 1, jupiterUsdPrice: 103, toleranceBps: 150 });
  assert.equal(outside.withinBand, false);
  assert.ok(Math.abs(outside.deviationPct - 3) < 1e-9);
});

test("zero or non-finite oracle inputs reject", () => {
  assert.equal(checkDeviation({ issuerQuote: 0, multiplier: 1, jupiterUsdPrice: 10 }).withinBand, false);
  assert.equal(checkDeviation({ issuerQuote: 10, multiplier: 0, jupiterUsdPrice: 10 }).withinBand, false);
  assert.equal(checkDeviation({ issuerQuote: Number.NaN, multiplier: 1, jupiterUsdPrice: 10 }).withinBand, false);
});

test("published AAPL example stays inside the default band", () => {
  const result = checkDeviation({ issuerQuote: 345.5195, multiplier: 1.003269, jupiterUsdPrice: 345.87 });
  assert.equal(result.withinBand, true);
});

test("risk engine fails closed on zero value, missing issuer, and tight slippage", () => {
  const base = {
    positionValue: 0,
    totalBotValue: 100,
    dailyPnlPct: 0,
    lifetimeDrawdownPct: 0,
    slippageBps: 30,
    priceImpactPct: 0.1,
    issuerQuote: 100,
    multiplier: 1,
    jupiterPrice: 100,
    safeguards: { positionCap: 20, dailyLoss: 5, drawdown: 20, slippageBps: 50, priceImpactPct: 1, deviationBps: 150 },
  };
  assert.equal(evaluateRisk(base).allowed, true);
  assert.equal(evaluateRisk({ ...base, totalBotValue: 0 }).allowed, false);
  assert.equal(evaluateRisk({ ...base, issuerQuote: null }).allowed, false);
  assert.match(evaluateRisk({ ...base, slippageBps: 80 }).reasons.join(" "), /Slippage/);
  assert.match(evaluateRisk({ ...base, positionValue: 40 }).reasons.join(" "), /Position cap/);
});

test("Jupiter price impact is a fraction, so 0.67 is 67 percent", () => {
  assert.ok(Math.abs(jupiterImpactPercent("0.669447") - 66.9447) < 1e-6);
  assert.ok(jupiterImpactPercent("0.000288") < 0.1);
});

test("idempotency key is stable inside an interval and claims once", () => {
  const hour = 3_600_000;
  assert.equal(tickIdempotencyKey("bot", 3600, hour), tickIdempotencyKey("bot", 3600, hour + 1000));
  assert.notEqual(tickIdempotencyKey("bot", 3600, hour), tickIdempotencyKey("bot", 3600, hour * 2));
  const store = new Map<string, number>();
  assert.equal(claimIdempotency(store, "a", hour), "new");
  assert.equal(claimIdempotency(store, "a", hour + 1), "duplicate");
});

