"use client";
import { Wallet } from "lucide-react";
import { Button, Card, EmptyState, SectionTitle, SourceTag } from "@/components/ui";
import { RiskDisclaimer } from "@/components/disclaimers";
import { useWallet } from "@/components/wallet";
import { useMarkets, useSession, useWalletHoldings } from "@/lib/hooks";
import { usd } from "@/lib/utils";
import { BotRoster } from "@/components/bot-roster";

export default function Dashboard() {
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
      <Card><p className="text-sm text-muted">US market</p><p className="text-lg">{session?.label ?? "—"}</p></Card>
    </div>}
    {connected && w.error && <p className="text-sm text-loss">Balances unavailable: {w.error}</p>}
    <RiskDisclaimer compact />
    <Card><SectionTitle title="Sovereign bots" sub="Empty until a session is granted. Dry-run sessions stay on this device." /><BotRoster emptyBody="Connect a wallet and grant a session, or save a dry-run session from the bot wizard." /></Card>
  </div>;
}
