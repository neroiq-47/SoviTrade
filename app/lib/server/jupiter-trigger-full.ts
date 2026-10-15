import "server-only";

/**
 * Full Jupiter Trigger V2 flow for optional Jupiter-native mode.
 * Auth (challenge-response JWT) + vault + deposit/craft + create DCA.
 * Vault is custodial (Privy) — label clearly.
 */

const BASE = "https://api.jup.ag/trigger/v2";
const API_KEY = process.env.JUPITER_API_KEY!;

export async function getChallenge(walletPubkey: string): Promise<{ challenge: string }> {
  const r = await fetch(`${BASE}/auth/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ walletPubkey, type: "message" }),
  });
  if (!r.ok) throw new Error(`challenge ${r.status}`);
  return r.json();
}

export async function verifyChallenge(walletPubkey: string, signature: string): Promise<{ accessToken: string }> {
  const r = await fetch(`${BASE}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ type: "message", walletPubkey, signature, authMode: "access_refresh" }),
  });
  if (!r.ok) throw new Error(`verify ${r.status}`);
  return r.json();
}

export async function craftDeposit(token: string, params: {
  inputMint: string; outputMint: string; userAddress: string; amount: string; orderType: "dca" | "price";
}) {
  const r = await fetch(`${BASE}/deposit/craft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
  if (!r.ok) throw new Error(`craft ${r.status}`);
  return r.json(); // { transaction, requestId, ... }
}

export async function createDca(token: string, body: {
  depositRequestId: string;
  depositSignedTx: string;
  userPubkey: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  orderCount: number;
  intervalSeconds: number;
  orderType: "time_based" | "price_conditional";
}) {
  const r = await fetch(`${BASE}/orders/dca`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`create DCA ${r.status}`);
  return r.json();
}
