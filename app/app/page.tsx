import { Ban, KeyRound, ShieldCheck, Timer } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/marketing";
import { Button, Card, Pill } from "@/components/ui";
import { LiveTicker } from "@/components/live-ticker";
import { GeoNotice, LaunchGate, RiskDisclaimer } from "@/components/disclaimers";
import { PASSES } from "@/lib/config";

const VENUES: { name: string; job: string; keys: string; auto: string; cap: string; ours?: boolean }[] = [
  { name: "xStocks", job: "1:1 stock and ETF tokens. 24/7. Many chains.", keys: "Yours after you withdraw", auto: "No", cap: "No" },
  { name: "Ondo", job: "Institutional stock tokens. Mint and redeem if you qualify.", keys: "Transferable tokens", auto: "No", cap: "No" },
  { name: "Robinhood", job: "Stock tokens inside the European brokerage.", keys: "Held at Robinhood", auto: "Brokerage recurring, not an onchain session", cap: "No" },
  { name: "Backpack", job: "A Solana venue. Stocks sit next to crypto and margin.", keys: "Exchange account", auto: "You place the order", cap: "No" },
  { name: "Dinari", job: "Regulated dShares, including a path for US persons.", keys: "Transferable, with KYC gates", auto: "An API for other apps", cap: "Compliance gates, not a spend cap" },
  { name: "SoviTrade", job: "Scheduled USDC buys of those tokens.", keys: "Root key stays in your wallet", auto: "Every 1 hour, 4 hours, or day", cap: "USDC cap, a clock, six programs", ours: true },
];

const FAQ = [
  ["Is SoviTrade an issuer?", "No. xStocks, Ondo, Backpack and others issue or list the token. This app schedules a Jupiter swap into a token you can already hold, and it refuses the swap when the risk check fails."],
  ["Who holds the tokens?", "You do. Sovereign Mode asks your wallet to sign a Swig session. The bot record stores the session public key and an encrypted reference. The root key is never written down here."],
  ["What can the session actually do?", "Spend up to the USDC cap you set, until the clock runs out, and only through Jupiter, Token, Token-2022, the associated-token program, Compute Budget and System. It cannot be told to do something else from this page."],
  ["Does the first bot send a trade?", "No. Dry-run is the default. The keeper quotes the swap, runs the risk check, and logs the trade without sending it. A live send stays off unless you opt out and load session material out of band."],
  ["What if the stock price and the token price disagree?", "The keeper wants an issuer print. The public xStocks route currently exposes a multiplier, not that print, so the check fails closed and the swap is not sent. A missing quote is a skip, not a guess."],
  ["Who can use it?", "Not US persons, and not residents of the UK, Canada, Australia, Switzerland or sanctioned regions. Issuers add their own rules. Ondo, for example, is often limited to professional investors in the EEA."],
  ["What does it cost?", "Listed passes are Scout $29 for 30 days, Pilot $69 for 90 days, and Sovereign $199 for 365 days, in USDC or SOL. No subscription and no performance fee on the pass. Checkout is not live in this preview, so a dry-run bot can be opened without paying."],
];

export default function Landing() {
  return <div>
    <SiteNav />
    <GeoNotice />
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.15fr_0.85fr] md:py-20">
      <div>
        <Pill tone="teal">Dry-run by default</Pill>
        <h1 className="mt-4 max-w-xl text-4xl font-bold tracking-tight md:text-6xl">A DCA bot that cannot outspend the cap.</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">Tokenized US stocks already trade on Solana. SoviTrade buys a fixed amount of USDC on a schedule. Your wallet holds the tokens. The session key gets a clock, a spend cap, and six programs. Then it expires.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LaunchGate href="/app/bots/new" className="rounded-xl bg-violet px-5 py-3 text-sm font-medium text-white">Start a dry-run bot</LaunchGate>
          <Button href="/app/markets" variant="secondary">See live listings</Button>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[["Cap", "USDC you set"], ["Clock", "Up to 14 days"], ["Programs", "Six, listed"], ["Keys", "Root stays put"]].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-surface px-3 py-3">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-1 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Card className="border-brand">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs text-muted">Example session · not a live account</p>
          <Pill tone="ember">Dry-run</Pill>
        </div>
        <p className="mt-4 font-display text-2xl font-bold">50 USDC → AAPLx</p>
        <p className="text-sm text-muted">Every day, until the session expires</p>
        <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
          {[["Duration", "24 hours · 216,000 slots"], ["USDC spend cap", "500"], ["Allowed", "Jupiter, Token, Token-2022, ATA"], ["Last check", "Issuer print missing · not sent"], ["Stored", "Session public key + sealed reference"]].map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </section>

    <LiveTicker />

    <section className="mx-auto max-w-6xl px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-wider text-teal">The category</p>
      <h2 className="mt-2 max-w-2xl text-3xl font-bold md:text-4xl">The issuers already made the token. The weekly buy is still manual.</h2>
      <p className="mt-4 max-w-2xl text-muted">RedStone counted about $3.2 billion of tokenized stocks onchain in September 2026, with roughly 2.6% of that supply used in DeFi. The venues below are where the token comes from. None of them is a session key with a hard USDC cap.</p>
    </section>

    <section id="compare" className="scroll-mt-20 mx-auto max-w-6xl px-4 pb-16">
      <h2 className="text-3xl font-bold">Five places to get the token. One cap on the bot.</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted">Compared by the job, not by a borrowed user count. Catalog sizes move. Confirm eligibility on the issuer’s own site.</p>
      <div className="mt-6 space-y-3 md:hidden">
        {VENUES.map((v) => <article key={v.name} className={`rounded-[16px] border p-4 ${v.ours ? "border-violet bg-violet/10" : "border-line bg-surface"}`}>
          <h3 className="font-bold">{v.name}</h3>
          <p className="mt-1 text-sm text-muted">{v.job}</p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted">Keys</dt><dd className="text-right">{v.keys}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Schedule</dt><dd className="text-right">{v.auto}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Spend cap</dt><dd className="text-right">{v.cap}</dd></div>
          </dl>
        </article>)}
      </div>
      <div className="mt-6 hidden max-w-full overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-3 pr-4 font-medium">Venue</th>
              <th className="py-3 pr-4 font-medium">Job</th>
              <th className="py-3 pr-4 font-medium">Keys</th>
              <th className="py-3 pr-4 font-medium">Scheduled buys</th>
              <th className="py-3 font-medium">Hard session cap</th>
            </tr>
          </thead>
          <tbody>
            {VENUES.map((v) => <tr key={v.name} className={`border-b border-line ${v.ours ? "bg-violet/10" : ""}`}>
              <th className="py-3 pr-4 font-bold">{v.name}</th>
              <td className="py-3 pr-4">{v.job}</td>
              <td className="py-3 pr-4">{v.keys}</td>
              <td className="py-3 pr-4">{v.auto}</td>
              <td className="py-3">{v.cap}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="text-3xl font-bold">What you sign, and what happens next</h2>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["01", "Pick the buy", "A ticker Jupiter actually lists, a USDC amount, and an interval of one hour, four hours, or a day. Decimals come from the listing, not a hardcoded guess."],
          ["02", "Grant a session", "Duration, spend cap, and the program list are on the review step. Dry-run builds the Swig transaction and does not send it. Sign and grant uses your wallet."],
          ["03", "The keeper ticks", "One quote per interval. Slippage and price impact are checked. If the issuer print is missing, the swap is skipped. Nothing is sent while dry-run is on."],
        ].map(([n, title, body]) => <Card key={n}>
          <p className="font-mono text-xs text-teal">{n}</p>
          <h3 className="mt-2 text-xl font-bold">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
        </Card>)}
      </ol>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-3xl font-bold">Limits the bot cannot talk its way around</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          [ShieldCheck, "Spend cap", "The session’s USDC limit is set before the first tick. A later click on this site cannot raise it."],
          [Timer, "It expires", "You choose the hours, up to 14 days. When the slot passes, that authority is done."],
          [KeyRound, "Root key stays in the wallet", "The browser seals the session secret. The bot row keeps a public key and a reference, never the root key."],
          [Ban, "No quote, no send", "A bad price impact, a program outside the list, or a missing issuer print stops the swap. The same interval is not quoted twice."],
        ].map(([Icon, title, body]) => {
          const I = Icon as typeof ShieldCheck;
          return <Card key={title as string}>
            <I className="text-teal" size={20} />
            <h3 className="mt-3 font-bold">{title as string}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{body as string}</p>
          </Card>;
        })}
      </div>
      <p className="mt-4 text-sm text-muted">Grid, trend, and rebalance are not executed in this version. The kill switch stops the bot on this device. An onchain remove-authority transaction is still to come.</p>
    </section>

    <section id="access" className="scroll-mt-20 mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-2">
      <Card>
        <h2 className="text-2xl font-bold">This is for you if</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed">
          <li>You already buy tokenized names such as AAPLx or NVDAx and want the purchase to happen when you are not at the screen.</li>
          <li>You will not paste a seed phrase into a trading bot.</li>
          <li>You want the quote and the risk reason written down before a swap can leave.</li>
        </ul>
      </Card>
      <Card>
        <h2 className="text-2xl font-bold">Go somewhere else if</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <li>You need a US brokerage account. Dinari is the regulated path. This app is not.</li>
          <li>You want to mint or redeem the underlying share. That is the issuer, not a keeper.</li>
          <li>You live in a restricted region. The notice at the top is the rule, not a suggestion.</li>
        </ul>
      </Card>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-3xl font-bold">Passes, when checkout exists</h2>
        <Button href="/pricing" variant="secondary">Full pricing</Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {PASSES.map((p) => <Card key={p.id}>
          <p className="text-sm text-muted">{p.days} days</p>
          <p className="mt-1 font-display text-3xl font-bold">${p.price}</p>
          <h3 className="mt-2 font-bold">{p.name}</h3>
          <p className="mt-2 text-sm text-muted">{p.bots} bots · {p.strategies}</p>
        </Card>)}
      </div>
      <p className="mt-4 text-sm text-muted">Checkout is not live in this preview. Opening a dry-run bot does not charge a pass.</p>
    </section>

    <section id="faq" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-8">
      <h2 className="text-3xl font-bold">Questions worth answering before you connect a wallet</h2>
      <div className="mt-6 divide-y divide-line border-y border-line">
        {FAQ.map(([q, a]) => <details key={q} className="group py-4">
          <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">{q}</summary>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{a}</p>
        </details>)}
      </div>
    </section>

    <section id="risk" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-12">
      <Card>
        <h2 className="text-xl font-bold">Read this before the bot</h2>
        <div className="mt-3"><RiskDisclaimer /></div>
        <p className="mt-3 text-sm text-muted">Off-hours, the token can trade away from the stock. Liquidity is thinner when the US market is closed. A session can be revoked locally today. The matching onchain instruction is not in this build. You can lose money.</p>
        <div className="mt-6">
          <LaunchGate href="/app/bots/new" className="rounded-xl bg-violet px-5 py-3 text-sm font-medium text-white">Start a dry-run bot</LaunchGate>
        </div>
      </Card>
    </section>
    <SiteFooter />
  </div>;
}