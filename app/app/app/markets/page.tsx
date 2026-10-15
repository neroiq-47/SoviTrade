"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, Delta, ErrorState, Pill, SectionTitle, Skeleton, SourceTag } from "@/components/ui";
import { ISSUERS, type IssuerId } from "@/lib/config";
import { useMarkets } from "@/lib/hooks";
import { compact, usd } from "@/lib/utils";

export default function Markets() {
  const m = useMarkets();
  const [issuer, setIssuer] = useState<IssuerId | "all">("all");
  const [kind, setKind] = useState<"all" | "Stock" | "ETF">("all");
  const [q, setQ] = useState("");
  const rows = useMemo(() => (m.data ?? []).flatMap((a) => a.listings.map((l) => ({ a, l }))).filter(({ a, l }) =>
    (issuer === "all" || l.issuer === issuer) && (kind === "all" || a.kind === kind) &&
    (!q || a.ticker.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase()))
  ), [m.data, issuer, kind, q]);
  return <div className="space-y-6">
    <SectionTitle title="Markets" sub="Tokenised US stocks & ETFs" right={<SourceTag source="Jupiter Token + Price API" />} />
    {m.error && <ErrorState message={m.error} />}
    {m.loading && <Skeleton className="h-64" />}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.slice(0, 24).map(({ a, l }) => <Link key={l.mint} href={`/app/markets/${a.ticker}`}>
      <Card className="hover:border-violet"><div className="flex justify-between"><span className="font-bold">{a.ticker}</span><Pill>{l.issuer}</Pill></div>
      <p className="text-sm text-muted">{a.name}</p>
      <div className="mt-2 flex items-end justify-between"><span className="text-lg font-mono">{l.price != null ? usd(l.price) : "—"}</span><Delta v={l.change24h ?? 0} /></div>
      </Card>
    </Link>)}</div>
  </div>;
}
