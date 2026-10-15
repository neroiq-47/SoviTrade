import "server-only";
import { ISSUERS, UNDERLYINGS, issuerHours, type IssuerId } from "@/lib/config";

const JUP = process.env.JUPITER_API_URL || "https://lite-api.jup.ag";

export type Listing = {
  mint: string; symbol: string; name: string; icon?: string; decimals: number; tokenProgram: string;
  issuer: IssuerId; ticker: string; price: number | null; refPrice: number | null; premiumPct: number | null;
  change24h: number | null; volume24h: number | null; liquidity: number | null; holders: number | null;
  hours: ReturnType<typeof issuerHours>; multiplier: number | null;
};
export type MarketRow = (typeof UNDERLYINGS)[number] & { listings: Listing[] };

export async function getMarkets(): Promise<MarketRow[]> {
  const r = await fetch(`${JUP}/tokens/v2/search?query=xstocks,ondo,backpack`, { next: { revalidate: 60 } });
  if (!r.ok) throw new Error(`Jupiter tokens ${r.status}`);
  const tokens = await r.json() as { id: string; symbol: string; name: string; usdPrice?: number; stats24h?: { priceChange?: number } }[];
  return UNDERLYINGS.map(u => ({
    ...u,
    listings: tokens.filter(t => t.symbol.toUpperCase().includes(u.ticker)).slice(0, 3).map(t => ({
      mint: t.id, symbol: t.symbol, name: t.name, decimals: 6, tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      issuer: "xstocks" as IssuerId, ticker: u.ticker, price: t.usdPrice ?? null, refPrice: null, premiumPct: null,
      change24h: t.stats24h?.priceChange ?? null, volume24h: null, liquidity: null, holders: null,
      hours: issuerHours("xstocks", u.ticker), multiplier: null,
    }))
  }));
}

export async function jupPrices(ids: string[]) {
  const r = await fetch(`${JUP}/price/v3?ids=${ids.join(",")}`, { next: { revalidate: 15 } });
  if (!r.ok) throw new Error(`Jupiter prices ${r.status}`);
  return r.json();
}
