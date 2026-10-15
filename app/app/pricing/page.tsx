"use client";
import { useState } from "react";
import { Check, QrCode, X } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/marketing";
import { Button, Card, Pill } from "@/components/ui";
import { GeoNotice, RiskDisclaimer } from "@/components/disclaimers";
import { PASSES } from "@/lib/config";
import { useSolPrice } from "@/lib/hooks";
import { WalletButton, useWallet } from "@/components/wallet";

export default function Pricing() {
  const [sel, setSel] = useState(1);
  const sol = useSolPrice();
  return <div>
    <SiteNav />
    <GeoNotice />
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-center text-4xl font-bold">Simple passes. No subscriptions.</h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-muted">Pay once in USDC or SOL. Your bots keep running for the duration. No performance fees.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">{PASSES.map((p, i) => <Card key={p.id} className={i === sel ? "border-violet" : ""} onClick={() => setSel(i)}>
        <div className="flex items-center justify-between"><h3 className="text-xl font-bold">{p.name}</h3><Pill>{p.days} days</Pill></div>
        <p className="mt-2 text-3xl font-bold">${p.price}<span className="text-base font-normal text-muted"> {p.perMonth}</span></p>
        <ul className="mt-4 space-y-2 text-sm">{p.strategies && <li className="flex gap-2"><Check size={16} className="text-gain" />{p.strategies}</li>}</ul>
        <Button className="mt-6 w-full" variant={i === sel ? "primary" : "secondary"}>Select</Button>
      </Card>)}</div>
      <RiskDisclaimer className="mt-12" />
    </div>
    <SiteFooter />
  </div>;
}
