import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-[16px] border border-line bg-surface p-5", className)}>{children}</div>;
}
export function Button({ href, variant = "primary", className, children, ...p }: { href?: string; variant?: "primary" | "secondary" | "danger" | "ghost"; className?: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition duration-150 disabled:opacity-50",
    variant === "primary" && "bg-violet text-white hover:shadow-[0_0_0_1px_#2DE2C7,0_0_24px_#7B5CFF55]",
    variant === "secondary" && "border border-line bg-surface-2 hover:border-violet",
    variant === "danger" && "bg-loss text-white hover:brightness-110",
    variant === "ghost" && "text-muted hover:text-text", className);
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...p}>{children}</button>;
}
export function Pill({ tone = "muted", children, className }: { tone?: "gain" | "loss" | "ember" | "teal" | "violet" | "muted"; children: React.ReactNode; className?: string }) {
  const map = { gain: "bg-gain/12 text-gain", loss: "bg-loss/12 text-loss", ember: "bg-ember/12 text-ember", teal: "bg-teal/12 text-teal", violet: "bg-violet/15 text-violet", muted: "bg-surface-2 text-muted" };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", map[tone], className)}>{children}</span>;
}
export function SourceTag({ source, at, className }: { source: string; at?: number | null; className?: string }) {
  return <span title={at ? `Updated ${new Date(at).toLocaleTimeString()}` : undefined} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-2 py-0.5 text-[11px] text-muted", className)}><i className="h-1.5 w-1.5 rounded-full bg-gain" />Live · {source}</span>;
}
export function EmptyState({ icon: Icon = Inbox, title, body, action }: { icon?: React.ComponentType<{ size?: number; className?: string }>; title: string; body?: React.ReactNode; action?: React.ReactNode }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-10 text-center"><Icon size={28} className="text-muted" /><p className="mt-3 font-medium">{title}</p>{body && <p className="mt-1 max-w-md text-sm text-muted">{body}</p>}{action && <div className="mt-4">{action}</div>}</div>;
}
export function ErrorState({ message }: { message: string }) {
  return <EmptyState icon={AlertTriangle} title="Data source unavailable" body={<>Couldn&apos;t load live data: <span className="font-mono text-loss">{message}</span>. No fallback data is shown.</>} />;
}
export function Skeleton({ className }: { className?: string }) { return <div className={cn("animate-pulse rounded-lg bg-surface-2", className)} />; }
export function Delta({ v, suffix = "%", className }: { v: number; suffix?: string; className?: string }) {
  const up = v >= 0; const I = up ? ArrowUpRight : ArrowDownRight;
  return <span className={cn("inline-flex items-center gap-0.5 font-mono tnum", up ? "text-gain" : "text-loss", className)}><I size={14} aria-label={up ? "up" : "down"} />{up ? "+" : ""}{v.toFixed(2)}{suffix}</span>;
}
export function Bar({ value, tone = "teal", label }: { value: number; tone?: "teal" | "ember" | "loss"; label?: string }) {
  const c = value > 70 ? "bg-loss" : value > 45 ? "bg-ember" : tone === "teal" ? "bg-teal" : `bg-${tone}`;
  return <div>{label && <div className="mb-1 flex justify-between text-xs text-muted"><span>{label}</span><span className="font-mono">{value}%</span></div>}<div className="h-1.5 rounded-full bg-surface-2"><div className={cn("h-full rounded-full", c)} style={{ width: `${Math.min(100, value)}%` }} /></div></div>;
}
export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">{title}</h2>{sub && <p className="text-sm text-muted">{sub}</p>}</div>{right}</div>;
}
export function Logo({ className }: { className?: string }) {
  return <Link href="/" className={cn("flex items-center gap-2", className)} aria-label="SoviTrade home">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/brand/sovitrade-icon-shield.svg" alt="" className="h-8 w-8" />
    <span className="hidden font-display text-lg sm:inline font-bold tracking-tight">Sovi<span className="text-brand">Trade</span></span>
  </Link>;
}
