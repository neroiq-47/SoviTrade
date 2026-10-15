"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Keypair } from "@solana/web3.js";
import { ShieldCheck, Vault } from "lucide-react";
import { Button, Card, Pill } from "./ui";
import { DEFAULT_SAFEGUARDS, SafeguardsPanel, type Safeguards } from "./safeguards";
import { RiskDisclaimer } from "./disclaimers";
import { useWallet } from "./wallet";
import { ISSUERS, STRATEGIES, UNDERLYINGS, type StrategyId } from "@/lib/config";
import { useMarkets } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { DEFAULT_SESSION, hoursToSlots } from "@/lib/swig-session";
import { prepareSessionGrant, swigAddressFor, type SessionSummary } from "@/lib/swig-grant";
import { loadOrCreateSwigId, saveBot, updateBot, type StoredBot } from "@/lib/bot-store";
import { sealSessionSecret } from "@/lib/session-seal";

const STEPS = ["Asset & issuer", "Strategy", "Guardrails", "Execution mode", "Review & sign"];
type Mode = "sovereign" | "jupiter";
const BETA_STRATEGIES = new Set<StrategyId>(["dca", "rebalance"]);
const JUPITER_VAULT_NOTE = "Jupiter Trigger V2 uses a shared third-party vault. It is opt-in and not part of Sovereign Mode. This dry-run does not create a vault order.";

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const r = await fetch("/api/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || "RPC failed");
  return j.result as T;
}

function paperPayer(): string {
  const key = "sovitrade.paper-payer";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const kp = Keypair.generate();
  const pub = kp.publicKey.toBase58();
  kp.secretKey.fill(0);
  sessionStorage.setItem(key, pub);
  return pub;
}

function bytesFromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function BotWizard() {
  const sp = useSearchParams();
  const { connected, setOpen, signTransaction } = useWallet();
  const markets = useMarkets();
  const [step, setStep] = useState(0);
  const initial = sp.get("strategy");
  const [strategy, setStrategy] = useState<StrategyId>(BETA_STRATEGIES.has(initial as StrategyId) ? (initial as StrategyId) : "dca");
  const [ticker, setTicker] = useState(sp.get("asset") ?? "SPY");
  const [issuer, setIssuer] = useState("xstocks");
  const [safeguards, setSafeguards] = useState<Safeguards>(DEFAULT_SAFEGUARDS);
  const [mode, setMode] = useState<Mode>("sovereign");
  const [amountUsdc, setAmountUsdc] = useState(50);
  const [intervalHours, setIntervalHours] = useState(24);
  const [durationHours, setDurationHours] = useState(DEFAULT_SESSION.durationHours);
  const [maxSpend, setMaxSpend] = useState(DEFAULT_SESSION.maxSpendUsdc);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const listing = useMemo(() => {
    const row = markets.data?.find((market) => market.ticker === ticker);
    return row?.listings.find((item) => item.issuer === issuer) ?? row?.listings[0] ?? null;
  }, [markets.data, ticker, issuer]);

  async function buildGrant(payer: string) {
    const swigId = loadOrCreateSwigId(payer);
    const swigAddress = swigAddressFor(swigId);
    const [block, slot, info] = await Promise.all([
      rpc<{ value: { blockhash: string } }>("getLatestBlockhash", [{ commitment: "confirmed" }]),
      rpc<number>("getSlot", [{ commitment: "confirmed" }]),
      rpc<{ value: { data?: [string, string] } | null }>("getAccountInfo", [swigAddress, { encoding: "base64" }]),
    ]);
    const raw = info.value?.data?.[0];
    const prepared = await prepareSessionGrant({
      userPublicKey: payer,
      durationSlots: hoursToSlots(durationHours),
      maxSpendUsdc: maxSpend,
      allowedPrograms: [...DEFAULT_SESSION.allowedPrograms],
      recentBlockhash: block.value.blockhash,
      currentSlot: BigInt(slot),
      swigId,
      swigAccountData: raw ? bytesFromBase64(raw) : null,
    });
    setSummary(prepared.summary);
    return prepared;
  }

  function toBot(prepared: Awaited<ReturnType<typeof buildGrant>>, ref: string, signature: string | null, status: "dry-run" | "active"): StoredBot {
    if (!listing) throw new Error("No listing");
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      strategy: strategy === "rebalance" ? "rebalance" : "dca",
      ticker,
      issuer,
      mint: listing.mint,
      decimals: listing.decimals,
      mode: "sovereign",
      amountUsdc,
      intervalSec: Math.max(1, intervalHours) * 3600,
      safeguards: {
        positionCap: safeguards.positionCap,
        dailyLoss: safeguards.dailyLoss,
        drawdown: safeguards.drawdown,
        slippageBps: safeguards.slippage,
        priceImpactPct: safeguards.priceImpact,
        deviationBps: Math.round(safeguards.deviation * 100),
      },
      session: {
        sessionPublicKey: prepared.summary.sessionPublicKey,
        keyMaterialRef: ref,
        swigAddress: prepared.summary.swigAddress,
        expirySlot: prepared.summary.expirySlot,
        durationHours,
        maxSpendUsdc: maxSpend,
        allowedPrograms: prepared.summary.allowedPrograms,
        grantedAt: now,
        signature,
        status,
        phase: prepared.summary.phase,
      },
      nextTickAt: now,
      lastRisk: null,
      createdAt: now,
    };
  }

  async function rememberRisk(bot: StoredBot) {
    const r = await fetch("/api/keeper/tick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dryRun: true,
        bots: [{
          id: bot.id,
          strategy: bot.strategy,
          ticker: bot.ticker,
          issuer: bot.issuer,
          mint: bot.mint,
          amountUsdc: bot.amountUsdc,
          intervalSec: bot.intervalSec,
          nextTickAt: bot.nextTickAt,
          safeguards: bot.safeguards,
          sessionPublicKey: bot.session.sessionPublicKey,
          expirySlot: bot.session.expirySlot,
          allowedPrograms: bot.session.allowedPrograms,
          status: bot.session.status,
        }],
      }),
    });
    const j = await r.json();
    const result = j.results?.[0];
    if (!result) return;
    updateBot(bot.id, {
      lastRisk: { allowed: result.action === "dry-run", reasons: result.reasons ?? [], at: Date.now(), action: result.action },
      nextTickAt: result.action === "error" ? bot.nextTickAt : Date.now() + bot.intervalSec * 1000,
    });
  }

  async function grant(kind: "dry-run" | "sign") {
    setError(null);
    setDone(null);
    if (!listing) { setError("No live listing for this ticker and issuer yet."); return; }
    if (strategy === "rebalance") { setError("Rebalance stays on the template. This sprint executes DCA only."); return; }
    if (amountUsdc <= 0 || amountUsdc > maxSpend) { setError("Each buy must be within the session spend cap."); return; }
    setBusy(true);
    try {
      const payer = kind === "sign" ? connected?.address : (connected?.address ?? paperPayer());
      if (!payer) throw new Error("Connect a wallet to sign");
      const prepared = await buildGrant(payer);
      if (kind === "dry-run") {
        const ref = await sealSessionSecret(prepared.sessionKeypair.secretKey);
        const bot = toBot(prepared, ref, null, "dry-run");
        saveBot(bot);
        try { await rememberRisk(bot); } catch { /* session is saved; the keeper can be retried */ }
        setDone(bot.id);
        return;
      }
      const signed = await signTransaction(prepared.transaction.serialize());
      let binary = "";
      for (const byte of signed) binary += String.fromCharCode(byte);
      const sig = await rpc<string>("sendTransaction", [btoa(binary), { encoding: "base64", skipPreflight: false }]);
      const ref = await sealSessionSecret(prepared.sessionKeypair.secretKey);
      const bot = toBot(prepared, ref, sig, "active");
      saveBot(bot);
      try { await rememberRisk(bot); } catch { /* session is saved; the keeper can be retried */ }
      setDone(bot.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not prepare the session");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-violet" : "bg-surface-2")} />
        ))}
      </div>
      <Card>
        <h2 className="text-xl font-bold">{STEPS[step]}</h2>
        {step === 0 && (
          <div className="mt-4 space-y-4">
            <label className="block text-sm">
              Ticker
              <select className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-2" value={ticker} onChange={(e) => setTicker(e.target.value)}>
                {UNDERLYINGS.map((u) => <option key={u.ticker} value={u.ticker}>{u.ticker} — {u.name}</option>)}
              </select>
            </label>
            <div>
              <p className="mb-2 text-sm">Issuer</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ISSUERS).map(([id, info]) => (
                  <button key={id} className={cn("rounded-xl border px-3 py-2 text-sm", issuer === id ? "border-violet bg-violet/10" : "border-line")} onClick={() => setIssuer(id)}>
                    {info.name}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted">{listing ? `${listing.symbol} · ${listing.decimals} decimals · mint ${listing.mint.slice(0, 4)}…${listing.mint.slice(-4)}` : markets.loading ? "Looking up the live listing…" : "No live listing yet for this pair."}</p>
          </div>
        )}
        {step === 1 && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-2">
              {STRATEGIES.map((s) => (
                <button key={s.id} disabled={!BETA_STRATEGIES.has(s.id)} className={cn("rounded-xl border p-3 text-left", strategy === s.id ? "border-violet" : "border-line", !BETA_STRATEGIES.has(s.id) && "opacity-50")} onClick={() => BETA_STRATEGIES.has(s.id) && setStrategy(s.id)}>
                  <div className="flex justify-between"><span className="font-bold">{s.name}</span>{!BETA_STRATEGIES.has(s.id) && <Pill>Coming soon</Pill>}</div>
                  <p className="text-sm text-muted">{s.blurb}</p>
                </button>
              ))}
            </div>
            {strategy === "dca" && <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">USDC per buy
                <input className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-2" type="number" min={1} max={maxSpend} value={amountUsdc} onChange={(e) => setAmountUsdc(Number(e.target.value))} />
              </label>
              <label className="text-sm">Every
                <select className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-2" value={intervalHours} onChange={(e) => setIntervalHours(Number(e.target.value))}>
                  <option value={1}>1 hour</option>
                  <option value={4}>4 hours</option>
                  <option value={24}>1 day</option>
                </select>
              </label>
            </div>}
          </div>
        )}
        {step === 2 && (
          <div className="mt-4">
            <SafeguardsPanel value={safeguards} onChange={setSafeguards} />
          </div>
        )}
        {step === 3 && (
          <div className="mt-4 space-y-3">
            <button className={cn("w-full rounded-xl border p-4 text-left", mode === "sovereign" && "border-violet")} onClick={() => setMode("sovereign")}>
              <ShieldCheck className="mr-2 inline" /> Sovereign Mode (your Swig wallet) — recommended
            </button>
            <button className={cn("w-full rounded-xl border p-4 text-left", mode === "jupiter" && "border-violet")} onClick={() => setMode("jupiter")}>
              <Vault className="mr-2 inline" /> Jupiter vault (third-party custody, labelled)
            </button>
          </div>
        )}
        {step === 4 && (
          <div className="mt-4 space-y-3 text-sm">
            <p>Strategy: <b>{strategy}</b> · {amountUsdc} USDC every {intervalHours}h</p>
            <p>Asset: <b>{ticker}</b> via {ISSUERS[issuer as keyof typeof ISSUERS]?.name ?? issuer}</p>
            <p>Mode: <b>{mode === "sovereign" ? "Sovereign" : "Jupiter vault (third-party)"}</b></p>
            <p>Position cap: <b>{safeguards.positionCap}%</b> · Daily loss: <b>{safeguards.dailyLoss}%</b> · Slippage: <b>{safeguards.slippage} bps</b></p>
            {mode === "jupiter" ? <p className="rounded-xl border border-ember/40 bg-ember/10 p-3 text-ember">{JUPITER_VAULT_NOTE}</p> : <>
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="font-bold">Session the root wallet will grant</p>
                <p className="mt-2">Duration: <b>{durationHours} hours</b> ({durationHours > 0 && durationHours <= 336 ? `${hoursToSlots(durationHours)} slots` : "set a duration"})</p>
                <p>USDC spend cap: <b>{maxSpend}</b></p>
                <p className="mt-2 text-xs text-muted">Allowed programs (top-level only; Jupiter CPIs into the AMMs):</p>
                <div className="mt-2 flex flex-wrap gap-1">{DEFAULT_SESSION.allowedPrograms.map((program) => <Pill key={program}>{program.slice(0, 4)}…{program.slice(-4)}</Pill>)}</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label>Duration (hours)
                    <input className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2" type="number" min={1} max={336} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} />
                  </label>
                  <label>Spend cap (USDC)
                    <input className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2" type="number" min={1} max={1000000} value={maxSpend} onChange={(e) => setMaxSpend(Number(e.target.value))} />
                  </label>
                </div>
              </div>
              {summary && <div className="rounded-xl border border-violet/40 p-3">
                <p>Phase: <b>{summary.phase === "create-swig-and-session" ? "Create Swig and session" : "Add session to your Swig"}</b></p>
                <p>Session: <span className="font-mono text-xs">{summary.sessionPublicKey}</span></p>
                <p>Swig: <span className="font-mono text-xs">{summary.swigAddress}</span></p>
                <p>Expires at slot <b>{summary.expirySlot}</b> · {summary.instructionCount} instructions · {summary.transactionBytes} bytes</p>
                <p className="text-xs text-muted">Only the session public key and an encrypted key-material reference are stored. The root key stays in your wallet.</p>
              </div>}
              {done && <p className="text-gain">Session stored. <a className="underline" href={`/app/bots/${done}`}>Open the bot</a></p>}
              {error && <p className="text-loss">{error}</p>}
              <div className="flex flex-wrap gap-2">
                {!connected && <Button onClick={() => setOpen(true)}>Connect wallet</Button>}
                <Button disabled={busy} onClick={() => grant("dry-run")}>{busy ? "Working…" : "Save dry-run session"}</Button>
                <Button disabled={busy || !connected} onClick={() => grant("sign")}>Sign and grant</Button>
              </div>
              {!connected && <p className="text-xs text-muted">Dry-run builds the real grant transaction against a paper payer and does not send it. Sign and grant uses your wallet.</p>}
            </>}
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
          {step < STEPS.length - 1 && <Button onClick={() => setStep(step + 1)}>Next</Button>}
        </div>
      </Card>
      <RiskDisclaimer compact />
    </div>
  );
}
