"use client";
import { useState } from "react";
import { Plus, Wallet, Bot, LineChart } from "lucide-react";
import { Button, Card, EmptyState, ErrorState, SectionTitle, Skeleton, SourceTag } from "@/components/ui";
import { Donut } from "@/components/charts";
import { RiskDisclaimer } from "@/components/disclaimers";
import { useWallet } from "@/components/wallet";
import { useMarkets, useSession, useWalletHoldings, RPC_URL } from "@/lib/hooks";
import { ISSUERS, type IssuerId } from "@/lib/config";
import { usd } from "@/lib/utils";

const TABS = ["Positions", "Open orders", "Activity log", "Alerts"] as const;
const COLORS = ["#7B5CFF", "#4F6BFF", "#2DE2C7", "#FFB547", "#3DDC97", "#9A96B5", "#FF5C7A"];

export default function Dashboard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Positions");
  const { connected, setOpen } = useWallet();
  const markets = useMarkets();
  const w = useWalletHoldings(connected?.address ?? null, markets.data);
  const session = useSession();
  const total = w.holdings.reduce((a, h) => a + (h.value ?? 0), 0);
  return <div className="space-y-6">
    <SectionTitle title="Dashboard" sub="Your portfolio and bot activity" right={connected ? <SourceTag source="Jupiter + RPC" /> : <Button onClick={() => setOpen(true)}>Connect wallet</Button>} />
    {!connected && <EmptyState icon={Wallet} title="Connect a wallet" body="SoviTrade is non-custodial. Connect to see balances and create bots." action={<Button onClick={() => setOpen(true)}>Connect</Button>} />}
    {connected && <div className="grid gap-4 md:grid-cols-3">
      <Card><p className="text-sm text-muted">Total value</p><p className="text-2xl font-bold">{usd(total)}</p></Card>
      <Card><p className="text-sm text-muted">Stock / ETF exposure</p><p className="text-2xl font-bold">{usd(w.holdings.filter(h => h.isStock).reduce((a,h)=>a+(h.value??0),0))}</p></Card>
      <Card><p className="text-sm text-muted">Session</p><p className="text-lg">{session?.label ?? "—"}</p></Card>
    </div>}
    <RiskDisclaimer compact />
  </div>;
}
