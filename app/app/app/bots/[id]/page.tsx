"use client";
import { useParams } from "next/navigation";
import { BotRoster } from "@/components/bot-roster";
import { Card } from "@/components/ui";
import { useBots } from "@/lib/bot-store";

export default function BotDetail() {
  const params = useParams<{ id: string }>();
  const bots = useBots();
  const bot = bots.find((row) => row.id === params.id);
  if (!bot) return <div className="space-y-4"><h1 className="text-2xl font-bold">Bot</h1><p className="text-sm text-muted">No session has been granted for this id.</p><Card><BotRoster emptyTitle="This bot is not on this device" emptyBody="Sessions stay in this browser until you grant one." /></Card></div>;
  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">{bot.ticker} {bot.strategy.toUpperCase()}</h1>
    <Card>
      <p>Session status: <b>{bot.session.status}</b></p>
      <p className="mt-2 break-all text-sm">Public key {bot.session.sessionPublicKey}</p>
      <p className="mt-1 text-sm text-muted">Key material reference {bot.session.keyMaterialRef}. The secret is not stored on the bot.</p>
      <p className="mt-3 text-sm">Next tick {new Date(bot.nextTickAt).toLocaleString()}</p>
      <p className="mt-1 text-sm">Last risk check: {bot.lastRisk ? `${bot.lastRisk.action ?? ""} ${bot.lastRisk.reasons.join("; ")}` : "Not run yet"}</p>
      {bot.session.signature && <p className="mt-2 break-all text-xs text-muted">Grant signature {bot.session.signature}</p>}
    </Card>
  </div>;
}
