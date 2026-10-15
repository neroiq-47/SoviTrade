import { VersionedTransaction } from "@solana/web3.js";
import { USDC_MINT } from "../config";
import { jupiterImpactPercent } from "../price-impact";
import { assertNotBrowser } from "./boundary";

assertNotBrowser();

const JUP = () => (process.env.JUPITER_API_URL || "https://lite-api.jup.ag").replace(/\/$/, "");
const SWAP = () => (process.env.JUPITER_SWAP_URL || `${JUP()}/swap/v1`).replace(/\/$/, "");

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  slippageBps: number;
  priceImpactPct: string;
  swapMode: string;
  routePlan: unknown[];
}

export interface QuoteAssessment {
  slippageBps: number;
  priceImpactPct: number;
  allowed: boolean;
  reasons: string[];
}

export interface BuiltSwap {
  quote: SwapQuote;
  swapTransaction: string;
  lastValidBlockHeight: number | null;
  assessment: QuoteAssessment;
  programs: string[];
}

function headers(): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };
  if (process.env.JUPITER_API_KEY) h["x-api-key"] = process.env.JUPITER_API_KEY;
  return h;
}

export function usdcToRaw(amountUsdc: number): bigint {
  if (!Number.isFinite(amountUsdc) || amountUsdc <= 0 || amountUsdc > 1_000_000) {
    throw new Error("USDC amount must be between 0 and 1,000,000");
  }
  return BigInt(Math.round(amountUsdc * 1_000_000));
}

/** Convert Jupiter's fractional `priceImpactPct` into a percent (0.01 → 1). */
export function assessQuote(quote: SwapQuote, limits: { slippageBps: number; priceImpactPct: number }): QuoteAssessment {
  const impact = jupiterImpactPercent(quote.priceImpactPct);
  const reasons: string[] = [];
  if (!Number.isFinite(impact)) reasons.push("Price impact missing");
  else if (impact > limits.priceImpactPct) reasons.push(`Price impact ${impact}% exceeds ${limits.priceImpactPct}%`);
  if (!Number.isFinite(quote.slippageBps) || quote.slippageBps < 0) reasons.push("Slippage missing");
  else if (quote.slippageBps > limits.slippageBps) reasons.push(`Slippage ${quote.slippageBps} bps exceeds ${limits.slippageBps} bps`);
  return { slippageBps: quote.slippageBps, priceImpactPct: impact, allowed: reasons.length === 0, reasons };
}

export function swapProgramIds(txBase64: string): { programs: string[]; unresolved: boolean } {
  const tx = VersionedTransaction.deserialize(Buffer.from(txBase64, "base64"));
  const keys = tx.message.staticAccountKeys;
  const programs: string[] = [];
  let unresolved = false;
  for (const ix of tx.message.compiledInstructions) {
    const key = keys[ix.programIdIndex];
    if (!key) {
      unresolved = true;
      continue;
    }
    programs.push(key.toBase58());
  }
  return { programs: [...new Set(programs)], unresolved };
}

export async function getSwapQuote(args: {
  inputMint?: string;
  outputMint: string;
  amountRaw: bigint;
  slippageBps: number;
}): Promise<SwapQuote> {
  const q = new URLSearchParams({
    inputMint: args.inputMint ?? USDC_MINT,
    outputMint: args.outputMint,
    amount: args.amountRaw.toString(),
    slippageBps: String(Math.max(0, Math.floor(args.slippageBps))),
    swapMode: "ExactIn",
  });
  const r = await fetch(`${SWAP()}/quote?${q}`, { headers: headers(), cache: "no-store" });
  if (!r.ok) throw new Error(`Jupiter quote ${r.status}`);
  const quote = (await r.json()) as SwapQuote;
  if (!quote?.outAmount || !quote.inAmount) throw new Error("Jupiter quote was empty");
  return quote;
}

export async function buildSwapTransaction(quote: SwapQuote, userPublicKey: string): Promise<{ swapTransaction: string; lastValidBlockHeight: number | null }> {
  const r = await fetch(`${SWAP()}/swap`, {
    method: "POST",
    headers: { ...headers() as Record<string, string>, "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      dynamicComputeUnitLimit: true,
      wrapAndUnwrapSol: false,
    }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Jupiter swap build ${r.status}`);
  const body = (await r.json()) as { swapTransaction?: string; lastValidBlockHeight?: number };
  if (!body.swapTransaction) throw new Error("Jupiter swap response missing transaction");
  return { swapTransaction: body.swapTransaction, lastValidBlockHeight: body.lastValidBlockHeight ?? null };
}

/** Quote a USDC → tokenised-stock swap and return the unsigned versioned transaction. */
export async function quoteAndBuildUsdcSwap(args: {
  outputMint: string;
  amountUsdc: number;
  slippageBps: number;
  priceImpactPct: number;
  userPublicKey: string;
}): Promise<BuiltSwap> {
  const quote = await getSwapQuote({
    outputMint: args.outputMint,
    amountRaw: usdcToRaw(args.amountUsdc),
    slippageBps: args.slippageBps,
  });
  const assessment = assessQuote(quote, { slippageBps: args.slippageBps, priceImpactPct: args.priceImpactPct });
  const built = await buildSwapTransaction(quote, args.userPublicKey);
  const { programs, unresolved } = swapProgramIds(built.swapTransaction);
  if (unresolved) assessment.reasons.push("Swap transaction has an unresolved program id");
  return {
    quote,
    swapTransaction: built.swapTransaction,
    lastValidBlockHeight: built.lastValidBlockHeight,
    assessment: { ...assessment, allowed: assessment.allowed && !unresolved },
    programs,
  };
}

export async function jupiterUsdPrice(mint: string): Promise<number | null> {
  const r = await fetch(`${JUP()}/price/v3?ids=${encodeURIComponent(mint)}`, { headers: headers(), cache: "no-store" });
  if (r.status === 429) throw new Error("Jupiter price is rate limited. The tick was not sent.");
  if (!r.ok) return null;
  const body = (await r.json()) as Record<string, { usdPrice?: number }>;
  const price = body[mint]?.usdPrice;
  return typeof price === "number" && Number.isFinite(price) && price > 0 ? price : null;
}

export function programsAllowed(programs: string[], allow: string[]): string[] {
  const ok = new Set(allow);
  return programs.filter((p) => !ok.has(p));
}
