"use client";
import { useState } from "react";
import { OctagonX } from "lucide-react";
import { revokeSessions, useBots } from "@/lib/bot-store";

/** Stops local sessions immediately. On-chain removal still requires a wallet signature. */
export function KillSwitch() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const bots = useBots();
  const count = bots.filter((bot) => bot.session.status !== "revoked").length;
  return <>
    <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full bg-loss px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110" aria-label="Global kill switch">
      <OctagonX size={16} /><span className="hidden sm:inline">Kill switch</span>
    </button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-void/70 p-4 backdrop-blur-md" role="dialog" aria-modal onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-2xl border border-loss/50 bg-surface/90 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="flex items-center gap-2 text-xl font-bold text-loss"><OctagonX />Global kill switch</h3>
        <p className="mt-2 text-sm text-muted">The keeper will refuse every session you revoke here. Removing the authority from the Swig still needs a transaction you sign. Nothing is sent automatically.</p>
        {count === 0 ? <p className="mt-4 rounded-lg bg-surface-2 p-3 text-sm">You have no running bots, open orders or session keys, so there is nothing to stop.</p> : <p className="mt-4 rounded-lg bg-surface-2 p-3 text-sm">{count} session{count === 1 ? "" : "s"} on this device can be stopped.</p>}
        {note && <p className="mt-3 text-sm text-loss">{note}</p>}
        <div className="mt-5 flex justify-end gap-2">
          {count > 0 && <button className="rounded-xl bg-loss px-4 py-2 text-sm font-semibold text-white" onClick={() => { const n = revokeSessions(); setNote(`${n} session${n === 1 ? "" : "s"} marked revoked. The keeper will not tick them.`); }}>Revoke sessions</button>}
          <button className="rounded-xl px-4 py-2 text-sm text-muted" onClick={() => setOpen(false)}>Close</button>
        </div>
      </div></div>}
  </>;
}
