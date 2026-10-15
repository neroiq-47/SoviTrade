"use client";
/**
 * Wallet connection via the Wallet Standard (Phantom, Solflare, Backpack, Jupiter Wallet).
 * Signing is used only for the Sovereign session-grant transaction. The root key never leaves the wallet.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";

type Connected = { name: string; icon?: string; address: string };
type SignFeature = {
  signTransaction: (...inputs: { account: WalletAccount; transaction: Uint8Array; chain?: string }[]) => Promise<{ signedTransaction: Uint8Array }[]>;
};
type Ctx = {
  wallets: Wallet[];
  connected: Connected | null;
  open: boolean;
  setOpen: (b: boolean) => void;
  connect: (w: Wallet) => Promise<void>;
  disconnect: () => void;
  signTransaction: (transaction: Uint8Array) => Promise<Uint8Array>;
  error: string | null;
};
const WalletCtx = createContext<Ctx | null>(null);
export const useWallet = () => { const c = useContext(WalletCtx); if (!c) throw new Error("WalletProvider missing"); return c; };

type ConnectFeature = { connect: () => Promise<{ accounts: readonly WalletAccount[] }> };
type DisconnectFeature = { disconnect: () => Promise<void> };

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [connected, setConnected] = useState<Connected | null>(null);
  const [active, setActive] = useState<Wallet | null>(null);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = getWallets();
    const refresh = () => setWallets(api.get().filter((w) => w.chains.some((c) => c.startsWith("solana:")) && "standard:connect" in w.features));
    refresh();
    const off1 = api.on("register", refresh); const off2 = api.on("unregister", refresh);
    return () => { off1(); off2(); };
  }, []);

  const connect = useCallback(async (w: Wallet) => {
    setError(null);
    try {
      const res = await (w.features["standard:connect"] as ConnectFeature).connect();
      const acc = res.accounts[0] ?? w.accounts[0];
      if (!acc) throw new Error("No account");
      setConnected({ name: w.name, icon: w.icon, address: acc.address });
      setAccount(acc);
      setActive(w);
      setOpen(false);
    } catch (e) { setError((e as Error).message); }
  }, []);

  const disconnect = useCallback(async () => {
    if (active && "standard:disconnect" in active.features) {
      try { await (active.features["standard:disconnect"] as DisconnectFeature).disconnect(); } catch { /* wallet already closed */ }
    }
    setConnected(null); setActive(null); setAccount(null);
  }, [active]);

  const signTransaction = useCallback(async (transaction: Uint8Array) => {
    if (!active || !account) throw new Error("Connect a wallet first");
    const feature = active.features["solana:signTransaction"] as SignFeature | undefined;
    if (!feature?.signTransaction) throw new Error("This wallet cannot sign transactions");
    const [out] = await feature.signTransaction({ account, transaction, chain: "solana:mainnet" });
    if (!out?.signedTransaction) throw new Error("Wallet returned no signature");
    return out.signedTransaction;
  }, [active, account]);

  return <WalletCtx.Provider value={{ wallets, connected, open, setOpen, connect, disconnect, signTransaction, error }}>
    {children}
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-void/70 p-4 backdrop-blur-md" role="dialog" aria-modal onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold">Connect a wallet</h3>
        <p className="mt-1 text-sm text-muted">SoviTrade never receives your root key. A session grant is a separate transaction you sign.</p>
        <div className="mt-4 space-y-2">
          {wallets.length === 0 && <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">No Solana wallet detected. Install Phantom, Solflare, Backpack, or Jupiter Wallet, then reload.</p>}
          {wallets.map((w) => <button key={w.name} className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-2 text-left hover:border-violet" onClick={() => connect(w)}>
            {w.icon && <img src={w.icon} alt="" className="h-6 w-6 rounded" />}
            <span className="font-medium">{w.name}</span>
          </button>)}
        </div>
        {error && <p className="mt-3 text-sm text-loss">{error}</p>}
        <div className="mt-4 flex justify-end"><button className="rounded-xl px-4 py-2 text-sm text-muted" onClick={() => setOpen(false)}>Close</button></div>
      </div>
    </div>}
  </WalletCtx.Provider>;
}

export function WalletButton() {
  const { connected, setOpen, disconnect } = useWallet();
  if (connected) return <button onClick={disconnect} className="rounded-full border border-line px-3 py-1.5 text-sm">{connected.address.slice(0, 4)}…{connected.address.slice(-4)}</button>;
  return <button onClick={() => setOpen(true)} className="rounded-full bg-violet px-4 py-1.5 text-sm font-medium text-white">Connect wallet</button>;
}
