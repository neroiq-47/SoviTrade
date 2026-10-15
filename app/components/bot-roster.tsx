"use client";
import { Bot } from "lucide-react";
import { useBots } from "@/lib/bot-store";
import { Button, Card, EmptyState, Pill } from "./ui";

function when(ts: number) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(ts);
}

export function BotRoster({ emptyTitle = "No bots yet. Create one", emptyBody = "Pick a template or start from scratch. Bots appear here after a session is granted." }: { emptyTitle?: string; emptyBody?: string }) {
  const bots = useBots();
  if (bots.length === 0) {
    return <EmptyState icon={Bot} title={emptyTitle} body={emptyBody} action={<Button href="/app/bots/new">Create your first bot</Button>} />;
  }
  return <div className="space-y-3">
    {bots.map((bot) => <div key={bot.id} className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold">{bot.ticker} · {bot.strategy.toUpperCase()}</p>
          <p className="text-xs text-muted">{bot.amountUsdc} USDC · session {bot.session.sessionPublicKey.slice(0, 4)}…{bot.session.sessionPublicKey.slice(-4)}</p>
        </div>
        <Pill tone={bot.session.status === "revoked" ? "loss" : bot.session.status === "active" ? "gain" : "ember"}>{bot.session.status}</Pill>
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <p><span className="text-muted">Next tick</span><br />{bot.session.status === "revoked" ? "Stopped" : when(bot.nextTickAt)}</p>
        <p><span className="text-muted">Spend cap</span><br />{bot.session.maxSpendUsdc} USDC · {bot.session.durationHours}h</p>
        <p><span className="text-muted">Last risk check</span><br />{bot.lastRisk ? (bot.lastRisk.allowed ? "Passed (dry-run)" : bot.lastRisk.reasons[0]) : "Not run yet"}</p>
      </div>
      <div className="mt-3"><Button href={`/app/bots/${bot.id}`} variant="secondary">Details</Button></div>
    </div>)}
  </div>;
}

export function SessionRoster() {
  const bots = useBots();
  if (bots.length === 0) {
    return <EmptyState icon={Bot} title="No session keys" body="When you create a bot in Sovereign Mode you will grant a time-limited capped session key." />;
  }
  return <div className="space-y-2 text-sm">
    {bots.map((bot) => <div key={bot.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
      <span className="font-mono text-xs">{bot.session.sessionPublicKey}</span>
      <span className="text-muted">{bot.session.status} · ref {bot.session.keyMaterialRef.slice(0, 10)}</span>
    </div>)}
  </div>;
}

export function RosterCard({ title = "Your bots" }: { title?: string }) {
  const bots = useBots();
  return <Card>
    <div className="mb-4 flex items-end justify-between"><h2 className="text-xl font-bold">{title}</h2></div>
    {bots.length === 0
      ? <EmptyState icon={Bot} title="No bots yet. Create one" body="Pick a template above or start from scratch. Your bots will show status, the next tick, and the last risk check here." action={<Button href="/app/bots/new">Create your first bot</Button>} />
      : <BotRoster />}
  </Card>;
}
