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
  const [holdings, setHoldings] = useState<{ mint: string; amount: number; value: number | null; isStock: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!address) { setHoldings([]); setError(null); return; }
    let alive = true;
    setLoading(true);
    const programs = ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"];
    Promise.all(programs.map((programId) => fetch("/api/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getTokenAccountsByOwner", params: [address, { programId }, { encoding: "jsonParsed" }] }),
    }).then(async (r) => {
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error?.message || "RPC failed");
      return (j.result?.value ?? []) as { account?: { data?: { parsed?: { info?: { mint?: string; tokenAmount?: { uiAmount?: number | null } } } } } }[];
    }))).then((groups) => {
      if (!alive) return;
      const priceByMint = new Map<string, { price: number | null; stock: boolean }>();
      for (const row of markets ?? []) {
        for (const listing of row.listings) priceByMint.set(listing.mint, { price: listing.price, stock: true });
      }
      const rows = groups.flat().map((item) => {
        const info = item.account?.data?.parsed?.info;
        const mint = info?.mint ?? "";
        const amount = info?.tokenAmount?.uiAmount ?? 0;
        const known = priceByMint.get(mint);
        return { mint, amount, value: known?.price != null ? amount * known.price : null, isStock: Boolean(known?.stock) };
      }).filter((row) => row.mint && row.amount > 0);
      setHoldings(rows);
      setError(null);
      setLoading(false);
    }).catch((e: Error) => {
      if (!alive) return;
      setError(e.message);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [address, markets]);
  return { holdings, loading, error };
}
