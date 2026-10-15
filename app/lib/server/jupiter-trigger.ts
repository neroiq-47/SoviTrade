import "server-only";

/**
 * Jupiter Trigger V2 (2026) — DCA and price orders.
 * Docs: https://developers.jup.ag/docs/trigger
 * Shared vault (Privy), JWT auth, deposit flow.
 * Use only for optional Jupiter-native mode. Sovereign Mode stays non-custodial.
 */

const BASE = process.env.JUPITER_TRIGGER_URL || "https://api.jup.ag/trigger/v2";
const API_KEY = process.env.JUPITER_API_KEY;

export type DcaOrderType = "time_based" | "price_conditional";

export interface DcaCreateParams {
  userPubkey: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string; // lamports / smallest units
  orderCount: number; // >= 2
  intervalSeconds: number; // 60 – 31536000
  orderType: DcaOrderType;
  minPriceUsd?: number;
  maxPriceUsd?: number;
  beginFillAt?: string; // ISO
}

export interface DcaOrder {
  id: string;
  state: string;
  displayState?: string;
  roundsFilled?: number;
  fillPercent?: number;
  nextFillAt?: string;
  inputAmountRemaining?: string;
}

export async function createDcaOrder(params: DcaCreateParams & { depositRequestId: string; depositSignedTx: string }): Promise<DcaOrder> {
  if (!API_KEY) throw new Error("JUPITER_API_KEY required for Trigger V2");
  const r = await fetch(`${BASE}/orders/dca`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(params),
  });
  if (!r.ok) throw new Error(`Trigger DCA create ${r.status}`);
  return r.json();
}

export async function getDcaHistory(userPubkey: string): Promise<DcaOrder[]> {
  const r = await fetch(`${BASE}/orders/history/dca?user=${userPubkey}`, {
    headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
  });
  if (!r.ok) throw new Error(`Trigger history ${r.status}`);
  const j = await r.json();
  return j.orders ?? [];
}

/** Minimum 10 USD per round, 2+ rounds. Vault is custodial — label clearly in UI. */
export const TRIGGER_V2_NOTES = "Jupiter Trigger V2 DCA uses a shared Privy vault. Opt-in only. Sovereign Mode uses your own Swig wallet.";
