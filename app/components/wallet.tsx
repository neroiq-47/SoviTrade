"use client";
/**
 * Wallet connection via the Wallet Standard (auto-discovers Phantom, Solflare, Backpack, Jupiter Wallet...).
 * Only `standard:connect` / `standard:disconnect` are used: SoviTrade v1 never requests a signature or transaction.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getWallets } from "@wallet-standard/app";
import type { Wallet } from "@wallet-standard/base";

type Connected = { name: string; icon?: string; address: string };
type Ctx = {
  wallets: Wallet[]; connected: Connected | null; open: boolean; setOpen: (b: boolean) => void;
  connect: (w: Wallet) => Promise<void>; disconnect: () => void; error: string | null;
};
const WalletCtx = createContext<Ctx | null>(null);
export const useWallet = () => { const c = useContext(WalletCtx); if (!c) throw new Error("WalletProvider missing"); return c; };

type ConnectFeature = { connect: () => Promise<{ accounts: readonly { address: string }[] }> };
type DisconnectFeature = { disconnect: () => Promise<void> };

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [connected, setConnected] = useState<Connected | null>(null);
  const [active, setActive] = useState<Wallet | null>(null);
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
      setActive(w);
      setOpen(false);
    } catch (e) { setError((e as Error).message); }
  }, []);

  const disconnect = useCallback(async () => {
    if (active && "standard:disconnect" in active.features) {
      try { await (active.features["standard:disconnect"] as DisconnectFeature).disconnect(); } catch {}
    }
    setConnected(null); setActive(null);
  }, [active]);

  return <WalletCtx.Provider value={{ wallets, connected, open, setOpen, connect, disconnect, error }}>{children}</WalletCtx.Provider>;
}

export function WalletButton() {
  const { connected, setOpen, disconnect } = useWallet();
  if (connected) return <button onClick={disconnect} className="rounded-full border border-line px-3 py-1.5 text-sm">{connected.address.slice(0, 4)}…{connected.address.slice(-4)}</button>;
  return <button onClick={() => setOpen(true)} className="rounded-full bg-violet px-4 py-1.5 text-sm font-medium text-white">Connect wallet</button>;
}
