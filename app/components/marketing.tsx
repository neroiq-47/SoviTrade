import Link from "next/link";
import { Logo, Button } from "./ui";
import { LaunchGate } from "./disclaimers";

export function SiteNav() {
  return <header className="sticky top-0 z-30 border-b border-line/60 bg-void/80 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
      <Logo />
      <nav className="ml-auto hidden items-center gap-6 text-sm text-muted md:flex">
        <Link href="/app/markets" className="hover:text-text">Markets</Link><Link href="/pricing" className="hover:text-text">Pricing</Link><a href="#faq" className="hover:text-text">Docs</a>
      </nav>
      <LaunchGate className="ml-auto rounded-xl bg-violet px-4 py-2 text-sm font-medium text-white md:ml-0">Launch app</LaunchGate>
    </div>
  </header>;
}
export function SiteFooter() {
  return <footer className="border-t border-line">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-8 text-sm text-muted">
      <Logo />
      {["Terms", "Privacy", "Risk Disclosure", "Restricted Jurisdictions", "Status", "X / Twitter", "Discord"].map((l) => <a key={l} href="#" className="hover:text-text">{l}</a>)}
      <span className="ml-auto text-xs">© 2026 SoviTrade.xyz · v1 preview</span>
    </div>
  </footer>;
}
export { Button };
