import Link from "next/link";
import { Logo } from "./ui";
import { LaunchGate } from "./disclaimers";

const FOOTER = [
  ["/app/markets", "Markets"],
  ["/pricing", "Pricing"],
  ["/#compare", "Compare"],
  ["/#faq", "FAQ"],
  ["/#risk", "Risk"],
  ["/#access", "Access"],
];

export function SiteNav() {
  return <header className="sticky top-0 z-30 border-b border-line/60 bg-void/80 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
      <Logo />
      <nav className="ml-auto hidden items-center gap-6 text-sm text-muted md:flex">
        <Link href="/app/markets" className="hover:text-text">Markets</Link>
        <Link href="/#compare" className="hover:text-text">Compare</Link>
        <Link href="/pricing" className="hover:text-text">Pricing</Link>
        <Link href="/#faq" className="hover:text-text">FAQ</Link>
      </nav>
      <LaunchGate className="ml-auto rounded-xl bg-violet px-4 py-2 text-sm font-medium text-white md:ml-0">Launch app</LaunchGate>
    </div>
  </header>;
}
export function SiteFooter() {
  return <footer className="border-t border-line">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-8 text-sm text-muted">
      <Logo />
      {FOOTER.map(([href, label]) => <Link key={label} href={href} className="hover:text-text">{label}</Link>)}
      <span className="md:ml-auto text-xs">© 2026 SoviTrade · preview · dry-run by default</span>
    </div>
  </footer>;
}