"use client";
import { useState } from "react";
import { Ticket } from "lucide-react";
import { Button, Card, EmptyState, SectionTitle } from "@/components/ui";
import { useWallet, WalletButton } from "@/components/wallet";
import { SessionRoster } from "@/components/bot-roster";

export default function Account() {
  const { connected } = useWallet();
  const [notif, setNotif] = useState({ email: true, telegram: false, discord: false, webhook: false });
  return <div className="space-y-5">
    <SectionTitle title="Account" sub={connected ? `Connected: ${connected.name}` : "Connect a wallet to load your pass and delegations"} right={<WalletButton />} />
    <div className="grid gap-5 xl:grid-cols-[1fr_2fr]">
      <div className="border-brand rounded-[16px] p-6">
        <span className="text-sm text-muted">SoviPass</span>
        <EmptyState icon={Ticket} title="No active pass" body="Passes are one-time (30, 90 or 365 days) and live in your wallet as a non-transferable token. Checkout isn't live in v1." action={<Button href="/pricing">See passes</Button>} />
      </div>
      <Card><SectionTitle title="Session keys & smart wallet" sub="Delegations your Swig smart wallet has granted the SoviTrade keeper" />
        <SessionRoster />
      </Card>
    </div>
    <Card><SectionTitle title="Notifications" />
      <div className="space-y-2 text-sm">{Object.entries(notif).map(([k, v]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={v} onChange={() => setNotif({ ...notif, [k]: !v })} />{k}</label>)}</div>
    </Card>
  </div>;
}
