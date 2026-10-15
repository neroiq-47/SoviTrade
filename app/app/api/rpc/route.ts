import { NextRequest, NextResponse } from "next/server";

const ALLOWED = new Set([
  "getSlot",
  "getLatestBlockhash",
  "getAccountInfo",
  "getBalance",
  "getTokenAccountsByOwner",
  "getSignatureStatuses",
  "sendTransaction",
]);

const MAX_BODY = 16_384;

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Request too large" } }, { status: 413 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Invalid JSON" } }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid request" } }, { status: 400 });
  }
  const { id, method, params } = body as { id?: unknown; method?: unknown; params?: unknown };
  if (typeof method !== "string" || !ALLOWED.has(method) || !Array.isArray(params)) {
    return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code: -32601, message: "Method not allowed" } }, { status: 400 });
  }
  const rpc = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const upstream = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: id ?? 1, method, params }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const text = await upstream.text();
    try {
      const parsed = JSON.parse(text) as unknown;
      return NextResponse.json(parsed, { headers: { "cache-control": "no-store" } });
    } catch {
      return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code: -32603, message: "RPC error" } }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code: -32603, message: "RPC unavailable" } }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
