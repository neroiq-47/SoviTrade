"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, CandlestickChart, LayoutDashboard, Search, Ticket, UserCog } from "lucide-react";
import { Logo } from "./ui";
import { WalletButton } from "./wallet";
import { KillSwitch } from "./kill-switch";
import { useRpcLatency, useSession } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/bots", label: "Bots", icon: Bot },
  { href: "/app/markets", label: "Markets", icon: CandlestickChart },
  { href: "/app/account", label: "Account", icon: UserCog },
];

export function AppShell({ children }: { children: React.ReactNode }) { return <Shell>{children}</Shell>; }

function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const session = useSession();
  const latency = useRpcLatency();
  const active = (h: string) => (h === "/app" ? path === "/app" : path.startsWith(h));
  return <div className="min-h-screen pb-16 md:pb-0 md:pl-16">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col items-center gap-2 border-r border-line bg-surface py-3 md:flex">
      <Link href="/" aria-label="Home" className="mb-3"><img src="/brand/sovitrade-icon-shield.svg" alt="SoviTrade" className="h-9 w-9" /></Link>
      {NAV.map(({ href, label, icon: I }) => <Link key={href} href={href} title={label} aria-label={label} className={cn("grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-text", active(href) && "bg-violet/15 text-violet")}><I size={20} strokeWidth={1.75} /></Link>)}
      <Link href="/pricing" title="Pricing" className="mt-auto grid h-11 w-11 place-items-center rounded-xl text-muted hover:text-text"><Ticket size={20} strokeWidth={1.75} /></Link>
    </aside>
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-void/80 px-4 backdrop-blur-md">
      <Logo className="md:hidden" />
      <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 text-sm text-muted lg:flex lg:max-w-xs"><Search size={14} />Search assets <kbd className="ml-auto rounded border border-line px-1.5 text-[10px]">⌘K</kbd></div>
      <div className="ml-auto flex items-center gap-2">
        {session && <span title={session.detail} className={cn("hidden rounded-full px-2.5 py-1 text-xs sm:inline", session.tone === "gain" ? "bg-gain/12 text-gain" : "bg-ember/12 text-ember")}>{session.label}</span>}
        <span className="hidden items-center gap-1 text-xs text-muted xl:flex" title="Solana RPC round-trip (getSlot)"><i className={cn("h-2 w-2 rounded-full", latency === "err" ? "bg-loss" : latency == null ? "bg-line" : "bg-gain")} />{latency === "err" ? "RPC error" : latency == null ? "RPC…" : `${latency}ms`}</span>
        <Link href="/pricing" className="hidden rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:text-text sm:inline">No active pass</Link>
        <WalletButton />
        <KillSwitch />
      </div>
    </header>
    <main className="mx-auto max-w-[1400px] p-4 md:p-6">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface md:hidden">
      {NAV.map(({ href, label, icon: I }) => <Link key={href} href={href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted", active(href) && "text-violet")}><I size={20} />{label}</Link>)}
    </nav>
  </div>;
}
