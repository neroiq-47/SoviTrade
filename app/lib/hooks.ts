"use client";
import { useEffect, useState } from "react";
import type { MarketRow } from "@/lib/server/jupiter";
import type { Candle } from "@/lib/server/gecko";
import type { OracleData } from "@/lib/server/pyth";
import { session as usSession } from "@/lib/nyse";
import { SOL_MINT } from "@/lib/config";

export type Remote<T> = { data: T | null; error: string | null; loading: boolean; updatedAt: number | null };

export function useRemote<T>(url: string | null, refreshMs = 0, pick: (j: any) => T = (j) => j): Remote<T> {
  const [s, setS] = useState<Remote<T>>({ data: null, error: null, loading: !!url, updatedAt: null });
  useEffect(() => {
    if (!url) return; let alive = true;
    const run = () => fetch(url).then(async (r) => { const j = await r.json(); if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`); return j; })
      .then((j) => alive && setS({ data: pick(j), error: null, loading: false, updatedAt: Date.now() }))
      .catch((e) => alive && setS((p) => ({ ...p, error: e.message, loading: false })));
    run(); const id = refreshMs ? setInterval(run, refreshMs) : undefined;
    return () => { alive = false; if (id) clearInterval(id); };
  }, [url, refreshMs]);
  return s;
}

export const useMarkets = () => useRemote<MarketRow[]>("/api/markets", 30000, (j) => j.rows);
export const useCandles = (mint: string | null, tf: "hour" | "day" = "hour") => useRemote<{ candles: Candle[] }>(mint ? `/api/chart?mint=${mint}&tf=${tf}` : null, 60000, (j) => j);
export const useOracle = (ticker: string | null) => useRemote<OracleData>(ticker ? `/api/oracle?ticker=${ticker}` : null, 60000);
export const useSolPrice = () => useRemote<number>(`/api/prices?ids=${SOL_MINT}`, 30000, (j) => j.prices?.[SOL_MINT]?.usdPrice ?? null);

export function useSession() {
  const [s, setS] = useState<{ label: string; tone: "gain" | "ember"; detail: string } | null>(null);
  useEffect(() => {
    const update = () => {
      const sess = usSession();
      setS({ label: sess.label, tone: sess.status === "open" ? "gain" : "ember", detail: sess.label });
    };
    update(); const id = setInterval(update, 30000); return () => clearInterval(id);
  }, []);
  return s;
}

export function useRpcLatency() {
  const [ms, setMs] = useState<number | "err" | null>(null);
  useEffect(() => {
    const run = async () => {
      const t = performance.now();
      try {
        const r = await fetch("/api/rpc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot", params: [] }) });
        if (!r.ok) throw new Error();
        setMs(Math.round(performance.now() - t));
      } catch { setMs("err"); }
    };
    run(); const id = setInterval(run, 15000); return () => clearInterval(id);
  }, []);
  return ms;
}

export function useWalletHoldings(address: string | null, markets: MarketRow[] | null) {
  const [holdings] = useState<{ mint: string; amount: number; value: number | null; isStock: boolean }[]>([]);
  // Placeholder: real balance fetch via RPC would go here
  return { holdings, loading: false, error: null as string | null };
}
