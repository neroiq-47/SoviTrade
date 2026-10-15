"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Vault } from "lucide-react";
import { Button, Card, Pill } from "./ui";
import { DEFAULT_SAFEGUARDS, SafeguardsPanel, type Safeguards } from "./safeguards";
import { RiskDisclaimer } from "./disclaimers";
import { useWallet } from "./wallet";
import { ISSUERS, STRATEGIES, UNDERLYINGS, type StrategyId } from "@/lib/config";
import { cn } from "@/lib/utils";

const STEPS = ["Asset & issuer", "Strategy", "Guardrails", "Execution mode", "Review & sign"];
type Mode = "sovereign" | "jupiter";
const BETA_STRATEGIES = new Set<StrategyId>(["dca", "rebalance"]);

export function BotWizard() {
  const sp = useSearchParams();
  const { connected, setOpen } = useWallet();
  const [step, setStep] = useState(0);
  const initial = sp.get("strategy");
  const [strategy, setStrategy] = useState<StrategyId>(BETA_STRATEGIES.has(initial as StrategyId) ? (initial as StrategyId) : "dca");
  const [ticker, setTicker] = useState(sp.get("asset") ?? "SPY");
  const [issuer, setIssuer] = useState("xstocks");
  const [safeguards, setSafeguards] = useState<Safeguards>(DEFAULT_SAFEGUARDS);
  const [mode, setMode] = useState<Mode>("sovereign");

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
              <select className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-2" value={ticker} onChange={e => setTicker(e.target.value)}>
                {UNDERLYINGS.map(u => <option key={u.ticker} value={u.ticker}>{u.ticker} — {u.name}</option>)}
              </select>
            </label>
            <div>
              <p className="text-sm mb-2">Issuer</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ISSUERS).map(([id, info]) => (
                  <button key={id} className={cn("rounded-xl border px-3 py-2 text-sm", issuer === id ? "border-violet bg-violet/10" : "border-line")} onClick={() => setIssuer(id)}>
                    {info.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="mt-4 grid gap-2">
            {STRATEGIES.map(s => (
              <button key={s.id} disabled={!BETA_STRATEGIES.has(s.id)} className={cn("rounded-xl border p-3 text-left", strategy === s.id ? "border-violet" : "border-line", !BETA_STRATEGIES.has(s.id) && "opacity-50")} onClick={() => BETA_STRATEGIES.has(s.id) && setStrategy(s.id)}>
                <div className="flex justify-between"><span className="font-bold">{s.name}</span>{!BETA_STRATEGIES.has(s.id) && <Pill>Coming soon</Pill>}</div>
                <p className="text-sm text-muted">{s.blurb}</p>
              </button>
            ))}
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
              <ShieldCheck className="inline mr-2" /> Sovereign Mode (your Swig wallet) — recommended
            </button>
            <button className={cn("w-full rounded-xl border p-4 text-left", mode === "jupiter" && "border-violet")} onClick={() => setMode("jupiter")}>
              <Vault className="inline mr-2" /> Jupiter vault (third-party custody, labelled)
            </button>
          </div>
        )}
        {step === 4 && (
          <div className="mt-4 space-y-3 text-sm">
            <p>Strategy: <b>{strategy}</b></p>
            <p>Asset: <b>{ticker}</b> via {issuer}</p>
            <p>Mode: <b>{mode}</b></p>
            <p>Position cap: <b>{safeguards.positionCap}%</b> · Daily loss: <b>{safeguards.dailyLoss}%</b></p>
            {!connected ? (
              <Button onClick={() => setOpen(true)}>Connect wallet to continue</Button>
            ) : (
              <Button>Review & create bot (v1 preview — no execution yet)</Button>
            )}
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
