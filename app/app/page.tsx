import { Activity, KeyRound, Layers, OctagonX, ShieldCheck, SlidersHorizontal, Wallet } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/marketing";
import { Button, Card, Pill } from "@/components/ui";
import { StrategyDiagram } from "@/components/charts";
import { LiveTicker } from "@/components/live-ticker";
import { GeoNotice, LaunchGate, RiskDisclaimer } from "@/components/disclaimers";
import { PASSES, STRATEGIES } from "@/lib/config";

const FAQ = [
  ["Do tokenised stocks really trade 24/7?", "The tokens are ordinary Solana assets, so DEX pools and RFQ makers quote them any time. When US markets are closed the on-chain price floats freely and can trade at a premium or discount; liquidity is thinner. SoviTrade's market-session mode halves size and widens checks off-hours."],
  ["Who can use SoviTrade?", "Not US persons, and not residents of the UK, Canada, Australia, Switzerland or sanctioned regions. Each issuer has its own eligibility rules (e.g. Ondo requires professional status in the EEA). You self-attest with a wallet signature."],
  ["Who holds my funds?", "In Sovereign Mode (default) funds stay in your own Swig smart wallet. You grant our keeper a time-limited session key with spending caps and a program allow-list, and you can revoke it anytime. Optional Jupiter-native mode uses a third-party Privy-managed vault, which is custodial and clearly labelled."],
  ["What does it cost?", "One-time passes: Scout $29 / 30 days, Pilot $69 / 90 days, Sovereign $199 / 365 days, paid in USDC or SOL. No subscriptions, no performance fees, no default trade fees."],
];

export default function Landing() {
  return <div>
    <SiteNav />
    <GeoNotice />
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-violet/20 blur-[120px]" />
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <Pill tone="violet">v1 preview · Live market data</Pill>
        <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">Your keys.<br /><span className="text-brand">Your limits.</span><br />Always on.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">Non-custodial auto-trading for tokenised US stocks & ETFs on Solana. Smart DCA, Grid, Trend, Rebalancing — with guardrails the bots can't break.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><LaunchGate className="rounded-xl bg-violet px-6 py-3 font-medium text-white">Launch app</LaunchGate><Button href="/pricing" variant="secondary">See pricing</Button></div>
      </div>
    </section>
    <LiveTicker />
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-3xl font-bold">Strategies</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{STRATEGIES.map((s) => <Card key={s.id}>
        <h3 className="font-bold">{s.name}</h3><p className="mt-2 text-sm text-muted">{s.blurb}</p>
        <StrategyDiagram id={s.id} className="mt-4 h-20" />
      </Card>)}</div>
    </section>
    <SiteFooter />
  </div>;
}
