"use client";
import { useState } from "react";
import { OctagonX } from "lucide-react";

/** Global kill switch. v1 has no bots, orders or session keys yet, so there is nothing to stop. */
export function KillSwitch() {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full bg-loss px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110" aria-label="Global kill switch">
      <OctagonX size={16} /><span className="hidden sm:inline">Kill switch</span>
    </button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-void/70 p-4 backdrop-blur-md" role="dialog" aria-modal onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-2xl border border-loss/50 bg-surface/90 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="flex items-center gap-2 text-xl font-bold text-loss"><OctagonX />Global kill switch</h3>
        <p className="mt-2 text-sm text-muted">When active, one transaction you sign will:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted"><li>Cancel every open Jupiter order</li><li>Stop all bots immediately</li><li>Revoke the keeper session key on-chain</li><li>Optionally swap all positions to USDC</li></ul>
        <p className="mt-4 rounded-lg bg-surface-2 p-3 text-sm">You have no running bots, open orders or session keys, so there is nothing to stop.</p>
        <div className="mt-5 flex justify-end"><button className="rounded-xl px-4 py-2 text-sm text-muted" onClick={() => setOpen(false)}>Close</button></div>
      </div></div>}
  </>;
}
