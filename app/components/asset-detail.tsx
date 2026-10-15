"use client";
import { useState } from "react";
import { ExternalLink, LineChart } from "lucide-react";
import { ISSUERS, UNDERLYINGS } from "@/lib/config";
import { useCandles, useMarkets, useOracle } from "@/lib/hooks";
import { Button, Card, Delta, EmptyState, ErrorState, Pill, SectionTitle, Skeleton, SourceTag } from "./ui";
import { CandleChart } from "./charts";
import { RiskDisclaimer } from "./disclaimers";
import { compact, usd } from "@/lib/utils";

export function AssetDetail({ ticker }: { ticker: string }) {
  const u = UNDERLYINGS.find((x) => x.ticker === ticker);
  const m = useMarkets(); const o = useOracle(ticker);
  const row = m.data?.find((r) => r.ticker === ticker);
  const best = row ? [...row.listings].sort((a, b) => (b.liquidity ?? 0) - (a.liquidity ?? 0))[0] : undefined;
  const candles = useCandles(best?.mint ?? null);

  if (!u) return <EmptyState title="Unknown ticker" />;
  return <div className="space-y-6">
    <SectionTitle title={u.ticker} sub={u.name} right={<SourceTag source="Jupiter + GeckoTerminal" />} />
    {m.error && <ErrorState message={m.error} />}
    {best && <Card>
      <div className="flex items-end justify-between"><span className="text-3xl font-mono">{best.price != null ? usd(best.price) : "—"}</span><Delta v={best.change24h ?? 0} /></div>
      <p className="text-sm text-muted">{best.issuer} · {best.hours}</p>
    </Card>}
    {candles.data && <Card><CandleChart candles={candles.data.candles} /></Card>}
    {candles.loading && <Skeleton className="h-64" />}
    <RiskDisclaimer compact />
  </div>;
}
