import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { evaluateRisk } from "../risk";
import { claimIdempotency } from "../idempotency";
import { assertNotBrowser } from "./boundary";
import { evaluateBot, type BotConfig, type MarketSnapshot, type TickResult } from "./keeper";
import { programsAllowed, quoteAndBuildUsdcSwap } from "./jupiter-swap";

assertNotBrowser();

export interface TickBotOptions {
  dryRun: boolean;
  now: number;
  idempotencyKey: string;
  seen?: Map<string, number>;
  rpcUrl?: string;
  /** Present only for a live send. Wiped after signing. Never from the browser body. */
  sessionSecret?: Uint8Array;
}

function empty(botId: string, idempotencyKey: string, action: TickResult["action"], reasons: string[]): TickResult {
  return { botId, idempotencyKey, action, reasons, intent: null, quote: null, submitted: false, signature: null };
}

function signSwap(txBase64: string, secret: Uint8Array): string {
  const tx = VersionedTransaction.deserialize(Buffer.from(txBase64, "base64"));
  const kp = Keypair.fromSecretKey(secret);
  tx.sign([kp]);
  secret.fill(0);
  kp.secretKey.fill(0);
  return Buffer.from(tx.serialize()).toString("base64");
}

async function sendSigned(rpcUrl: string, signedB64: string): Promise<string> {
  const r = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "sendTransaction",
      params: [signedB64, { encoding: "base64", skipPreflight: false, maxRetries: 2 }],
    }),
    cache: "no-store",
  });
  const body = (await r.json()) as { result?: string; error?: { message?: string } };
  if (!r.ok || body.error || !body.result) {
    throw new Error("RPC rejected the swap");
  }
  return body.result;
}

/**
 * One bot, one tick. Quotes Jupiter, runs the risk engine, and either logs
 * the swap (dry-run) or signs with the session key and submits.
 */
export async function tickBot(bot: BotConfig, market: MarketSnapshot, opts: TickBotOptions): Promise<TickResult> {
  const key = opts.idempotencyKey;
  try {
    if (bot.status === "revoked") return empty(bot.id, key, "skip", ["Session revoked"]);
    const intent = evaluateBot(bot, opts.now);
    if (!intent) {
      return { ...empty(bot.id, key, "hold", [bot.strategy === "dca" ? "Not due" : "Rebalance execution is not in this sprint"]), intent };
    }

    const built = await quoteAndBuildUsdcSwap({
      outputMint: bot.mint,
      amountUsdc: intent.amountUsdc,
      slippageBps: bot.safeguards.slippageBps,
      priceImpactPct: bot.safeguards.priceImpactPct,
      userPublicKey: bot.sessionPublicKey,
    });
    const quote = {
      inAmount: built.quote.inAmount,
      outAmount: built.quote.outAmount,
      slippageBps: built.assessment.slippageBps,
      priceImpactPct: built.assessment.priceImpactPct,
      programs: built.programs,
    };
    if (opts.seen && claimIdempotency(opts.seen, key, opts.now) === "duplicate") {
      return { botId: bot.id, idempotencyKey: key, action: "duplicate", reasons: ["Already ticked in this interval"], intent, quote: null, submitted: false, signature: null };
    }
    const risk = evaluateRisk({
      positionValue: market.positionValue,
      totalBotValue: market.totalValue,
      dailyPnlPct: market.dailyPnlPct,
      lifetimeDrawdownPct: market.drawdownPct,
      slippageBps: built.assessment.slippageBps,
      priceImpactPct: built.assessment.priceImpactPct,
      issuerQuote: market.issuerQuote,
      multiplier: market.multiplier,
      jupiterPrice: market.jupiterPrice,
      safeguards: bot.safeguards,
    });
    const blockedPrograms = programsAllowed(built.programs, bot.allowedPrograms);
    const reasons = [...risk.reasons, ...built.assessment.reasons];
    if (blockedPrograms.length) reasons.push(`Program not on the session allow-list: ${blockedPrograms.join(", ")}`);
    const base: TickResult = { botId: bot.id, idempotencyKey: key, action: "skip", reasons, intent, quote, submitted: false, signature: null };
    if (reasons.length) {
      console.info(JSON.stringify({ keeper: "skip", botId: bot.id, idempotencyKey: key, reasons, quote, dryRun: opts.dryRun }));
      return base;
    }

    console.info(JSON.stringify({
      keeper: opts.dryRun ? "dry-run" : "send",
      botId: bot.id,
      idempotencyKey: key,
      intent,
      quote,
      session: bot.sessionPublicKey,
    }));
    if (opts.dryRun) return { ...base, action: "dry-run", reasons: ["Dry-run: swap logged and not sent"] };

    if (!opts.sessionSecret || opts.sessionSecret.length === 0) {
      return { ...base, action: "blocked", reasons: ["Refusing to send: session key material is not loaded"] };
    }
    const rpc = opts.rpcUrl || process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    const signed = signSwap(built.swapTransaction, opts.sessionSecret);
    const signature = await sendSigned(rpc, signed);
    return { ...base, action: "submitted", reasons: [], submitted: true, signature };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tick failed";
    console.info(JSON.stringify({ keeper: "error", botId: bot.id, idempotencyKey: key, message }));
    return empty(bot.id, key, "error", [message]);
  }
}
