"use client";
import { useMarkets } from "@/lib/hooks";
import { Delta, SourceTag } from "./ui";
import { usd } from "@/lib/utils";

export function LiveTicker() {
  const { data, error, loading, updatedAt } = useMarkets();
  const items = (data ?? []).flatMap((r) => r.listings.filter((l) => l.issuer === "xstocks" && l.price != null));
  return <div className="relative border-y border-line bg-surface/60 py-3">
    <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-surface">{items.length ? <SourceTag source="Jupiter" at={updatedAt} /> : null}</div>
    <div className="animate-ticker flex gap-8 whitespace-nowrap px-4 text-sm">
      {items.length === 0 && <span className="text-muted">{loading ? "Loading live prices…" : error ? "Price feed unavailable" : "No listings"}</span>}
      {items.map((l) => <span key={l.mint} className="inline-flex items-center gap-2"><span className="font-medium">{l.ticker}</span><span className="font-mono tnum">{usd(l.price!)}</span><Delta v={l.change24h ?? 0} /></span>)}
    </div>
  </div>;
}
