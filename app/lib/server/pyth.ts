import "server-only";
const META = "https://hermes.pyth.network";
const HERMES = process.env.PYTH_HERMES_URL || "https://pyth.dourolabs.app/hermes";
const KEY = process.env.PYTH_API_KEY;

export type OracleData = {
  feedId: string | null; description?: string; marketOpen?: boolean; nextOpen?: number; nextClose?: number;
  price: { status: "ok"; price: number; conf: number; ema: number; publishTime: number } | { status: "key_required" | "error"; message: string };
};

export async function getOracle(ticker: string): Promise<OracleData> {
  const r = await fetch(`${META}/v2/price_feeds?query=${encodeURIComponent(ticker)}&asset_type=equity`, { next: { revalidate: 600 } });
  if (!r.ok) throw new Error(`Pyth feed list ${r.status}`);
  const feeds = await r.json() as { id: string; attributes?: { description?: string } }[];
  const feed = feeds.find(f => f.attributes?.description?.includes(ticker)) ?? feeds[0];
  if (!feed) return { feedId: null, price: { status: "error", message: "No feed" } };
  if (!KEY) return { feedId: feed.id, description: feed.attributes?.description, price: { status: "key_required", message: "PYTH_API_KEY required for live prices" } };
  // Live price fetch would go here with KEY
  return { feedId: feed.id, description: feed.attributes?.description, price: { status: "key_required", message: "Set PYTH_API_KEY" } };
}
