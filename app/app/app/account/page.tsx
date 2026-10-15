"use client";
import { useState } from "react";
import { FileSignature, KeyRound, Receipt, Ticket, Wallet } from "lucide-react";
import { Button, Card, EmptyState, SectionTitle, SourceTag } from "@/components/ui";
import { GeoNotice } from "@/components/disclaimers";
import { useWallet, WalletButton } from "@/components/wallet";
import { useWalletHoldings } from "@/lib/hooks";

export default function Account() {
  const { connected, setOpen } = useWallet();
  const w = useWalletHoldings(connected?.address ?? null, null);
  const [notif, setNotif] = useState({ email: true, telegram: false, discord: false, webhook: false });
  return <div className="space-y-5">
    <SectionTitle title="Account" sub={connected ? `Connected: ${connected.name}` : "Connect a wallet to load your pass and delegations"} right={<WalletButton />} />
    <div className="grid gap-5 xl:grid-cols-[1fr_2fr]">
      <div className="border-brand rounded-[16px] p-6">
        <span className="text-sm text-muted">SoviPass</span>
        <EmptyState icon={Ticket} title="No active pass" body="Passes are one-time (30, 90 or 365 days) and live in your wallet as a non-transferable token. Checkout isn't live in v1." action={<Button href="/pricing">See passes</Button>} />
      </div>
      <Card><SectionTitle title="Session keys & smart wallet" sub="Delegations your Swig smart wallet has granted the SoviTrade keeper" />
        <EmptyState icon={KeyRound} title="No session keys" body="When you create a bot in Sovereign Mode you will grant a time-limited capped session key." />
      </Card>
    </div>
    <Card><SectionTitle title="Notifications" />
      <div className="space-y-2 text-sm">{Object.entries(notif).map(([k, v]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={v} onChange={() => setNotif({ ...notif, [k]: !v })} />{k}</label>)}</div>
    </Card>
  </div>;
}
