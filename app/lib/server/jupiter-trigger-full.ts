import "server-only";

/**
 * Full Jupiter Trigger V2 flow for optional Jupiter-native mode.
 * Auth (challenge-response JWT) + vault + deposit/craft + create DCA.
 * Vault is custodial (Privy) — label clearly. Not used by Sovereign Mode.
 */

const BASE = "https://api.jup.ag/trigger/v2";

function apiKey(): string {
  const key = process.env.JUPITER_API_KEY;
  if (!key) throw new Error("JUPITER_API_KEY required for Trigger V2");
  return key;
}

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json", "x-api-key": apiKey() };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function getChallenge(walletPubkey: string): Promise<{ challenge: string }> {
  const r = await fetch(`${BASE}/auth/challenge`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ walletPubkey, type: "message" }),
  });
  if (!r.ok) throw new Error(`challenge ${r.status}`);
  return r.json();
}

export async function verifyChallenge(walletPubkey: string, signature: string): Promise<{ accessToken: string }> {
  const r = await fetch(`${BASE}/auth/verify`, {
    method: "POST",
    headers: headers(),
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
    headers: headers(token),
    body: JSON.stringify(params),
  });
  if (!r.ok) throw new Error(`craft ${r.status}`);
  return r.json();
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
    headers: headers(token),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`create DCA ${r.status}`);
  return r.json();
}
