"use client";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart } from "recharts";
import type { Candle } from "@/lib/server/gecko";
import type { StrategyId } from "@/lib/config";

const tip = { contentStyle: { background: "#14121F", border: "1px solid #2A2640", borderRadius: 12, fontSize: 12 }, labelStyle: { color: "#9A96B5" } };

export function Donut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return <div className="flex items-center gap-4">
    <div className="h-36 w-36 shrink-0"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" innerRadius={44} outerRadius={64} stroke="#14121F" strokeWidth={2} isAnimationActive={false}>{data.map((d) => <Cell key={d.name} fill={d.color} />)}</Pie></PieChart></ResponsiveContainer></div>
    <ul className="w-full space-y-1 text-sm">{data.map((d) => <li key={d.name} className="flex justify-between"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ background: d.color }} />{d.name}</span><span className="font-mono text-muted">{((d.value / total) * 100).toFixed(1)}%</span></li>)}</ul>
  </div>;
}

/** Real OHLCV close-price chart with EMA 12/26 computed from the same candles. */
export function CandleChart({ candles, height = 300 }: { candles: Candle[]; height?: number }) {
  const data = useMemo(() => candles.map((c, i, arr) => {
    const slice = arr.slice(Math.max(0, i - 25), i + 1);
    const ema = (period: number) => {
      if (slice.length < period) return c.c;
      const k = 2 / (period + 1);
      let e = slice[0].c;
      for (let j = 1; j < slice.length; j++) e = slice[j].c * k + e * (1 - k);
      return e;
    };
    return { t: c.t * 1000, close: c.c, ema12: ema(12), ema26: ema(26) };
  }), [candles]);
  return <ResponsiveContainer width="100%" height={height}><AreaChart data={data}><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7B5CFF" stopOpacity={0.4} /><stop offset="100%" stopColor="#7B5CFF" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#2A2640" strokeDasharray="3 3" /><XAxis dataKey="t" hide /><YAxis domain={['auto', 'auto']} hide /><Tooltip {...tip} /><Area type="monotone" dataKey="close" stroke="#7B5CFF" fill="url(#c)" strokeWidth={2} /><Line type="monotone" dataKey="ema12" stroke="#2DE2C7" strokeWidth={1} dot={false} /><Line type="monotone" dataKey="ema26" stroke="#FFB547" strokeWidth={1} dot={false} /></AreaChart></ResponsiveContainer>;
}

export function StrategyDiagram({ id, className }: { id: StrategyId; className?: string }) {
  return <div className={className}><svg viewBox="0 0 100 40" className="w-full h-full text-violet"><path d="M5 30 Q 25 10 50 20 T 95 10" fill="none" stroke="currentColor" strokeWidth="2" /></svg></div>;
}
