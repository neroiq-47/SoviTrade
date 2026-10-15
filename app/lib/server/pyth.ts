import "server-only";

const META = "https://hermes.pyth.network";
const HERMES = (process.env.PYTH_HERMES_URL || "https://pyth.dourolabs.app/hermes").replace(/\/$/, "");
const KEY = process.env.PYTH_API_KEY;

export type OracleData = {
  feedId: string | null;
  description?: string;
  marketOpen?: boolean;
  nextOpen?: number;
  nextClose?: number;
  price: { status: "ok"; price: number; conf: number; ema: number; publishTime: number } | { status: "key_required" | "error"; message: string };
};

type Feed = { id: string; attributes?: { description?: string; symbol?: string } };
type Px = { price?: string; conf?: string; expo?: number; publish_time?: number };

function scaled(raw: string | undefined, expo: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return Number.NaN;
  return n * 10 ** expo;
}

export async function getOracle(ticker: string): Promise<OracleData> {
  const r = await fetch(`${META}/v2/price_feeds?query=${encodeURIComponent(ticker)}&asset_type=equity`, { next: { revalidate: 600 } });
  if (!r.ok) throw new Error(`Pyth feed list ${r.status}`);
  const feeds = (await r.json()) as Feed[];
  const feed = feeds.find((f) => f.attributes?.symbol?.toUpperCase() === ticker || f.attributes?.description?.includes(ticker)) ?? null;
  if (!feed) return { feedId: null, price: { status: "error", message: "No feed" } };
  if (!KEY) {
    return { feedId: feed.id, description: feed.attributes?.description, price: { status: "key_required", message: "PYTH_API_KEY required for live prices" } };
  }
  const pr = await fetch(`${HERMES}/v2/updates/price/latest?parsed=true&ids[]=${feed.id}`, {
    headers: { Authorization: `Bearer ${KEY}` },
    next: { revalidate: 30 },
  });
  if (!pr.ok) {
    return { feedId: feed.id, description: feed.attributes?.description, price: { status: "error", message: "Pyth price request failed" } };
  }
  const body = (await pr.json()) as { parsed?: { price?: Px; ema_price?: Px }[] };
  const row = body.parsed?.[0];
  const px = row?.price;
  if (px?.price == null || px.expo == null) {
    return { feedId: feed.id, description: feed.attributes?.description, price: { status: "error", message: "Pyth price payload missing" } };
  }
  const price = scaled(px.price, px.expo);
  const conf = scaled(px.conf ?? "0", px.expo);
  const ema = row?.ema_price?.price != null && row.ema_price.expo != null ? scaled(row.ema_price.price, row.ema_price.expo) : price;
  if (!Number.isFinite(price) || price <= 0) {
    return { feedId: feed.id, description: feed.attributes?.description, price: { status: "error", message: "Pyth price is not a number" } };
  }
  return {
    feedId: feed.id,
    description: feed.attributes?.description,
    price: { status: "ok", price, conf: Number.isFinite(conf) ? conf : 0, ema: Number.isFinite(ema) ? ema : price, publishTime: px.publish_time ?? 0 },
  };
}
