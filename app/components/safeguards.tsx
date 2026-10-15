"use client";
import { useState } from "react";
import { Info, Lock } from "lucide-react";

export type Safeguards = { positionCap: number; dailyLoss: number; drawdown: number; stopLoss: number; takeProfit: number; slippage: number; slippageOff: number; priceImpact: number; deviation: number; sessionMode: boolean; volBreaker: number; flattenOnStop: boolean };
export const DEFAULT_SAFEGUARDS: Safeguards = { positionCap: 20, dailyLoss: 5, drawdown: 20, stopLoss: 8, takeProfit: 0, slippage: 50, slippageOff: 100, priceImpact: 1, deviation: 1.5, sessionMode: true, volBreaker: 5, flattenOnStop: true };

const FIELDS: { k: keyof Safeguards; label: string; plain: (v: number) => string; min: number; max: number; step: number; unit: string; advanced?: boolean }[] = [
  { k: "positionCap", label: "Max position per asset", plain: (v) => `No single asset above ${v}% of this bot's allocation.`, min: 5, max: 50, step: 1, unit: "%" },
  { k: "dailyLoss", label: "Daily loss limit", plain: (v) => `Pauses if you lose ${v}% in a day (resumes 00:00 UTC).`, min: 1, max: 15, step: 0.5, unit: "%" },
  { k: "drawdown", label: "Max drawdown (lifetime)", plain: (v) => `Stops the bot if it falls ${v}% from its peak.`, min: 5, max: 50, step: 1, unit: "%" },
  { k: "stopLoss", label: "Stop loss", plain: (v) => `Exits a position if it drops ${v}% from entry.`, min: 1, max: 30, step: 0.5, unit: "%" },
  { k: "slippage", label: "Max slippage", plain: (v) => `Rejects swaps worse than ${v} bps.`, min: 10, max: 200, step: 10, unit: "bps" },
];

export function SafeguardsPanel({ value, onChange }: { value: Safeguards; onChange: (s: Safeguards) => void }) {
  const [adv, setAdv] = useState(false);
  return <div className="space-y-4">
    {FIELDS.filter(f => adv || !f.advanced).map(f => <div key={f.k}>
      <div className="flex justify-between text-sm"><span>{f.label}</span><span className="font-mono">{value[f.k]}{f.unit}</span></div>
      <input type="range" min={f.min} max={f.max} step={f.step} value={value[f.k] as number} onChange={e => onChange({ ...value, [f.k]: +e.target.value })} className="w-full" />
      <p className="text-xs text-muted">{f.plain(value[f.k] as number)}</p>
    </div>)}
    <button className="text-xs text-violet" onClick={() => setAdv(!adv)}>{adv ? "Hide advanced" : "Show advanced"}</button>
  </div>;
}
