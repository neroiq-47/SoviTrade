import "server-only";

/**
 * Jupiter Trigger V2 (2026) — DCA and price orders.
 * Docs: https://developers.jup.ag/docs/trigger
 * Shared vault (Privy), JWT auth, deposit flow.
 * Use only for optional Jupiter-native mode. Sovereign Mode stays non-custodial.
 *
 * Auth: `x-api-key` is the portal key. `Authorization: Bearer` is the wallet JWT
 * from `/auth/verify`, not the API key.
 */

const BASE = process.env.JUPITER_TRIGGER_URL || "https://api.jup.ag/trigger/v2";

function apiKey(): string {
  const key = process.env.JUPITER_API_KEY;
  if (!key) throw new Error("JUPITER_API_KEY required for Trigger V2");
  return key;
}

export type DcaOrderType = "time_based" | "price_conditional";

export interface DcaCreateParams {
  userPubkey: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  orderCount: number;
  intervalSeconds: number;
  orderType: DcaOrderType;
  minPriceUsd?: number;
  maxPriceUsd?: number;
  beginFillAt?: string;
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

export async function createDcaOrder(params: DcaCreateParams & { depositRequestId: string; depositSignedTx: string; accessToken: string }): Promise<DcaOrder> {
  const { accessToken, ...order } = params;
  const r = await fetch(`${BASE}/orders/dca`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey(),
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(order),
  });
  if (!r.ok) throw new Error(`Trigger DCA create ${r.status}`);
  return r.json();
}

export async function getDcaHistory(userPubkey: string, accessToken: string): Promise<DcaOrder[]> {
  const r = await fetch(`${BASE}/orders/history/dca?user=${encodeURIComponent(userPubkey)}`, {
    headers: { "x-api-key": apiKey(), Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(`Trigger history ${r.status}`);
  const j = await r.json();
  return j.orders ?? [];
}

/** Minimum 10 USD per round, 2+ rounds. Vault is custodial — label clearly in UI. */
export const TRIGGER_V2_NOTES = "Jupiter Trigger V2 DCA uses a shared Privy vault. Opt-in only. Sovereign Mode uses your own Swig wallet.";
