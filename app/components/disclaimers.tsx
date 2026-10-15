"use client";
import { useState } from "react";
import { Button, Card } from "./ui";

export function GeoNotice() {
  return <div className="border-b border-line bg-surface-2/80 px-4 py-2 text-center text-xs text-muted">
    Not available to US persons or residents of the UK, Canada, Australia, Switzerland or sanctioned regions. Tokenised stocks are not shares.
  </div>;
}
export function RiskDisclaimer({ compact }: { compact?: boolean }) {
  return <p className={compact ? "text-xs text-muted" : "text-sm text-muted"}>
    Nothing on SoviTrade is investment, legal or tax advice. Past performance is not indicative of future results. You can lose money. Bots can fail. Keep your keys.
  </p>;
}
export function LaunchGate({ children, className }: { children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className={className} onClick={() => setOpen(true)}>{children}</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setOpen(false)}>
      <Card className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Restricted jurisdictions</h3>
        <p className="mt-2 text-sm text-muted">SoviTrade is not available to US persons or residents of the UK, Canada, Australia, Switzerland or sanctioned regions.</p>
        <div className="mt-4 flex gap-2"><Button onClick={() => setOpen(false)}>I understand</Button></div>
      </Card>
    </div>}
  </>;
}
