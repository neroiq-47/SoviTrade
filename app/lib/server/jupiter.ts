import "server-only";
import { ISSUERS, UNDERLYINGS, issuerHours, type IssuerId } from "@/lib/config";

const JUP = process.env.JUPITER_API_URL || "https://lite-api.jup.ag";

type JupToken = {
  id: string;
  symbol: string;
  name: string;
  icon?: string;
  decimals?: number;
  tokenProgram?: string;
  usdPrice?: number;
  tags?: string[];
  liquidity?: number;
  holderCount?: number;
  stats24h?: { priceChange?: number; buyVolume?: number; sellVolume?: number };
};

export type Listing = {
  mint: string; symbol: string; name: string; icon?: string; decimals: number; tokenProgram: string;
  issuer: IssuerId; ticker: string; price: number | null; refPrice: number | null; premiumPct: number | null;
  change24h: number | null; volume24h: number | null; liquidity: number | null; holders: number | null;
  hours: ReturnType<typeof issuerHours>; multiplier: number | null;
};
export type MarketRow = (typeof UNDERLYINGS)[number] & { listings: Listing[] };

function issuerFromToken(t: JupToken): IssuerId | null {
  const tags = (t.tags ?? []).map((tag) => tag.toLowerCase());
  const blob = `${t.name} ${t.symbol}`.toLowerCase();
  if (tags.includes("xstocks") || blob.includes("xstock")) return "xstocks";
  if (tags.includes("ondo") || blob.includes("ondo")) return "ondo";
  if (tags.includes("backpack") || blob.includes("backpack")) return "backpack";
  if (tags.includes("securitize") || blob.includes("securitize")) return "securitize";
  return null;
}

function symbolMatches(symbol: string, ticker: string): boolean {
  const compact = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const t = ticker.toUpperCase();
  return compact === t || compact === `${t}X`;
}

function toListing(t: JupToken, ticker: string, issuer: IssuerId): Listing {
  const buy = t.stats24h?.buyVolume ?? 0;
  const sell = t.stats24h?.sellVolume ?? 0;
  const volume = buy + sell;
  return {
    mint: t.id,
    symbol: t.symbol,
    name: t.name,
    icon: t.icon,
    decimals: typeof t.decimals === "number" ? t.decimals : 6,
    tokenProgram: t.tokenProgram || "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    issuer,
    ticker,
    price: t.usdPrice ?? null,
    refPrice: null,
    premiumPct: null,
    change24h: t.stats24h?.priceChange ?? null,
    volume24h: volume > 0 ? volume : null,
    liquidity: t.liquidity ?? null,
    holders: t.holderCount ?? null,
    hours: issuerHours(issuer, ticker),
    multiplier: null,
  };
}

export async function getMarkets(): Promise<MarketRow[]> {
  const searches = await Promise.allSettled(UNDERLYINGS.map(async (u) => {
    const r = await fetch(`${JUP}/tokens/v2/search?query=${encodeURIComponent(u.ticker)}`, { next: { revalidate: 60 } });
    if (!r.ok) throw new Error(`Jupiter tokens ${r.status}`);
    const tokens = (await r.json()) as JupToken[];
    return { ticker: u.ticker, tokens: Array.isArray(tokens) ? tokens : [] };
  }));
  const byTicker = new Map<string, JupToken[]>();
  const failures: string[] = [];
  for (const result of searches) {
    if (result.status === "fulfilled") byTicker.set(result.value.ticker, result.value.tokens);
    else failures.push(result.reason instanceof Error ? result.reason.message : "search failed");
  }
  if (byTicker.size === 0) throw new Error(failures[0] || "Jupiter tokens unavailable");

  return UNDERLYINGS.map((u) => {
    const tokens = byTicker.get(u.ticker) ?? [];
    const listings = tokens.flatMap((t) => {
      const issuer = issuerFromToken(t);
      if (!issuer || !symbolMatches(t.symbol, u.ticker) || !(issuer in ISSUERS)) return [];
      return [toListing(t, u.ticker, issuer)];
    });
    const seen = new Set<string>();
    const unique = listings.filter((listing) => {
      if (seen.has(listing.mint)) return false;
      seen.add(listing.mint);
      return true;
    }).slice(0, 4);
    return { ...u, listings: unique };
  });
}

export async function jupPrices(ids: string[]) {
  const r = await fetch(`${JUP}/price/v3?ids=${ids.join(",")}`, { next: { revalidate: 15 } });
  if (!r.ok) throw new Error(`Jupiter prices ${r.status}`);
  return r.json();
}
