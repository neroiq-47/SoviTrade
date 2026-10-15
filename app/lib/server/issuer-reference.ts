import { assertNotBrowser } from "./boundary";

assertNotBrowser();

/**
 * xStocks publishes the Solana multiplier without a key.
 * The underlying print is not on that public route, so callers must fail closed
 * when `issuerQuote` stays null.
 */
export async function xstocksReference(ticker: string): Promise<{ multiplier: number | null; issuerQuote: number | null }> {
  const symbol = `${ticker.toUpperCase()}x`;
  try {
    const r = await fetch(`https://api.xstocks.fi/api/v2/public/assets/${encodeURIComponent(symbol)}/multiplier?network=Solana`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!r.ok) return { multiplier: null, issuerQuote: null };
    const body = (await r.json()) as { currentMultiplier?: number };
    const multiplier = Number(body.currentMultiplier);
    return {
      multiplier: Number.isFinite(multiplier) && multiplier > 0 ? multiplier : null,
      issuerQuote: null,
    };
  } catch {
    return { multiplier: null, issuerQuote: null };
  }
}
