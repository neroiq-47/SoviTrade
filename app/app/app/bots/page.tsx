import { Plus } from "lucide-react";
import { StrategyDiagram } from "@/components/charts";
import { RosterCard } from "@/components/bot-roster";
import { Button, Card, Pill, SectionTitle } from "@/components/ui";
import { STRATEGIES } from "@/lib/config";

export default function Bots() {
  return <div className="space-y-6">
    <SectionTitle title="Bots" sub="Strategy templates and your bots. Every bot runs inside the guardrails you set." right={<Button href="/app/bots/new"><Plus size={16} />New bot</Button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{STRATEGIES.map((s) => <Card key={s.id} className="flex flex-col">
      <div className="flex items-center justify-between"><h3 className="font-bold">{s.name}</h3><Pill tone="violet">{s.id === "grid" || s.id === "trend" ? "Coming soon" : s.tier}</Pill></div>
      <p className="mt-2 text-sm text-muted">{s.blurb}</p>
      <p className="mt-2 text-xs"><span className="text-muted">Best for:</span> {s.fit} · <span className="text-muted">{s.native}</span></p>
      <div className="mt-3"><StrategyDiagram id={s.id} className="h-16 w-full" /></div>
      {s.id === "grid" || s.id === "trend" ? <Button variant="secondary" className="mt-auto" disabled>Coming soon</Button> : <Button href={`/app/bots/new?strategy=${s.id}`} variant="secondary" className="mt-auto">Use template</Button>}
    </Card>)}</div>
    <RosterCard />
  </div>;
}