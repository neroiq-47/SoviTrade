"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, FlaskConical, KeyRound, ShieldCheck, Vault } from "lucide-react";
import { Button, Card, EmptyState, ErrorState, Pill, Skeleton, SourceTag } from "./ui";
import { DEFAULT_SAFEGUARDS, type Safeguards } from "./safeguards";
import { RiskDisclaimer } from "./disclaimers";
import { useWallet } from "./wallet";
import { ISSUERS, STRATEGIES, type IssuerId, type StrategyId } from "@/lib/config";
import { useMarkets } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const STEPS = ["Asset & issuer", "Strategy", "Guardrails", "Execution mode", "Review & sign"];
type Mode = "sovereign" | "jupiter";
const BETA_STRATEGIES = new Set<StrategyId>(["dca", "rebalance"]);

export function BotWizard() {
  const sp = useSearchParams(); const { connected, setOpen } = useWallet(); const markets = useMarkets();
  const [step, setStep] = useState(0);
  const initial = sp.get("strategy");
  const [strategy, setStrategy] = useState<StrategyId>(BETA_STRATEGIES.has(initial as StrategyId) ? (initial as StrategyId) : "dca");
  const [ticker, setTicker] = useState(sp.get("asset") ?? "SPY");
  const [safeguards, setSafeguards] = useState<Safeguards>(DEFAULT_SAFEGUARDS);
  const [mode, setMode] = useState<Mode>("sovereign");

  return <div className="mx-auto max-w-2xl space-y-6">
    <div className="flex gap-2">{STEPS.map((s, i) => <div key={s} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-violet" : "bg-surface-2")} />)}</div>
    <Card>
      <h2 className="text-xl font-bold">{STEPS[step]}</h2>
      {step === 0 && <div className="mt-4 space-y-3">
        <label className="block text-sm">Ticker<input className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-2" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} /></label>
        <div className="flex gap-2">{Object.entries(ISSUERS).map(([id, info]) => <button key={id} className={cn("rounded-xl border px-3 py-2 text-sm", "border-line")} onClick={() => {}}>{info.name}</button>)}</div>
      </div>}
      {step === 1 && <div className="mt-4 grid gap-2">{STRATEGIES.map(s => <button key={s.id} disabled={!BETA_STRATEGIES.has(s.id)} className={cn("rounded-xl border p-3 text-left", strategy === s.id ? "border-violet" : "border-line", !BETA_STRATEGIES.has(s.id) && "opacity-50")} onClick={() => setStrategy(s.id)}>
        <div className="flex justify-between"><span className="font-bold">{s.name}</span>{!BETA_STRATEGIES.has(s.id) && <Pill>Coming soon</Pill>}</div>
        <p className="text-sm text-muted">{s.blurb}</p>
      </button>)}</div>}
      {step === 2 && <p className="mt-4 text-sm text-muted">Guardrails (safeguards) will be configured here. Defaults applied.</p>}
      {step === 3 && <div className="mt-4 space-y-3">
        <button className={cn("w-full rounded-xl border p-4 text-left", mode === "sovereign" && "border-violet")} onClick={() => setMode("sovereign")}><ShieldCheck className="inline" /> Sovereign Mode (your Swig wallet)</button>
        <button className={cn("w-full rounded-xl border p-4 text-left", mode === "jupiter" && "border-violet")} onClick={() => setMode("jupiter")}><Vault className="inline" /> Jupiter vault (third-party)</button>
      </div>}
      {step === 4 && <div className="mt-4 space-y-2 text-sm">
        <p>Strategy: <b>{strategy}</b></p><p>Asset: <b>{ticker}</b></p><p>Mode: <b>{mode}</b></p>
        {!connected && <Button onClick={() => setOpen(true)}>Connect wallet to continue</Button>}
      </div>}
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
        <Button onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} disabled={step === STEPS.length - 1}>Next</Button>
      </div>
    </Card>
    <RiskDisclaimer compact />
  </div>;
}
