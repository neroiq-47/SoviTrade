"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "./ui";

export function GeoNotice() {
  return <div className="border-b border-line bg-surface-2/80 px-4 py-2 text-center text-xs text-muted">
    Not available to US persons or residents of the UK, Canada, Australia, Switzerland or sanctioned regions. Tokenised stocks are not shares.
  </div>;
}
export function RiskDisclaimer({ compact, className }: { compact?: boolean; className?: string }) {
  return <p className={compact ? `text-xs text-muted ${className ?? ""}` : `text-sm text-muted ${className ?? ""}`}>
    Nothing on SoviTrade is investment, legal or tax advice. Past performance is not indicative of future results. You can lose money. Bots can fail. Keep your keys.
  </p>;
}
export function LaunchGate({ children, className, href = "/app" }: { children: React.ReactNode; className?: string; href?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return <>
    <button type="button" className={className} onClick={() => setOpen(true)}>{children}</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-void/80 p-4" onClick={() => setOpen(false)}>
      <Card className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Before you continue</h3>
        <p className="mt-2 text-sm text-muted">SoviTrade is not available to US persons or residents of the UK, Canada, Australia, Switzerland or sanctioned regions. Tokenised stocks are not the shares themselves.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => router.push(href)}>I am not in a restricted region</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
        </div>
      </Card>
    </div>}
  </>;
}