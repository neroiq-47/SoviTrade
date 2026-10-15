"use client";

import { useEffect, useState } from "react";

export type StoredSession = {
  sessionPublicKey: string;
  keyMaterialRef: string;
  swigAddress: string;
  expirySlot: string;
  durationHours: number;
  maxSpendUsdc: number;
  allowedPrograms: string[];
  grantedAt: number;
  signature: string | null;
  status: "dry-run" | "active" | "revoked";
  phase: string;
};

export type StoredBot = {
  id: string;
  strategy: "dca" | "rebalance";
  ticker: string;
  issuer: string;
  mint: string;
  decimals: number;
  mode: "sovereign";
  amountUsdc: number;
  intervalSec: number;
  safeguards: {
    positionCap: number;
    dailyLoss: number;
    drawdown: number;
    slippageBps: number;
    priceImpactPct: number;
    deviationBps: number;
  };
  session: StoredSession;
  nextTickAt: number;
  lastRisk: { allowed: boolean; reasons: string[]; at: number; action?: string } | null;
  createdAt: number;
};

const KEY = "sovitrade.bots.v1";
const SWIG = "sovitrade.swig-id.v1";

function read(): StoredBot[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((bot): bot is StoredBot => {
      if (!bot || typeof bot !== "object") return false;
      const row = bot as StoredBot;
      return Boolean(row.id && row.session?.sessionPublicKey && row.session.keyMaterialRef && !("secretKey" in (row.session as object)));
    });
  } catch {
    return [];
  }
}

function write(bots: StoredBot[]) {
  localStorage.setItem(KEY, JSON.stringify(bots));
  window.dispatchEvent(new Event("sovitrade-bots"));
}

export function listBots(): StoredBot[] {
  return read();
}

export function saveBot(bot: StoredBot) {
  const bots = read().filter((row) => row.id !== bot.id);
  bots.unshift(bot);
  write(bots);
}

export function updateBot(id: string, patch: Partial<StoredBot>) {
  write(read().map((bot) => (bot.id === id ? { ...bot, ...patch, session: patch.session ?? bot.session } : bot)));
}

export function revokeSessions(): number {
  const bots = read();
  let n = 0;
  const next = bots.map((bot) => {
    if (bot.session.status === "revoked") return bot;
    n += 1;
    return { ...bot, session: { ...bot.session, status: "revoked" as const } };
  });
  write(next);
  return n;
}

export function loadOrCreateSwigId(wallet: string): Uint8Array {
  const map = JSON.parse(localStorage.getItem(SWIG) || "{}") as Record<string, string>;
  const existing = map[wallet];
  if (existing) {
    const bytes = Uint8Array.from(atob(existing), (c) => c.charCodeAt(0));
    if (bytes.length === 32) return bytes;
  }
  const id = crypto.getRandomValues(new Uint8Array(32));
  let s = "";
  for (const b of id) s += String.fromCharCode(b);
  map[wallet] = btoa(s);
  localStorage.setItem(SWIG, JSON.stringify(map));
  return id;
}

export function useBots(): StoredBot[] {
  const [bots, setBots] = useState<StoredBot[]>([]);
  useEffect(() => {
    const pull = () => setBots(read());
    pull();
    window.addEventListener("sovitrade-bots", pull);
    window.addEventListener("storage", pull);
    return () => {
      window.removeEventListener("sovitrade-bots", pull);
      window.removeEventListener("storage", pull);
    };
  }, []);
  return bots;
}
