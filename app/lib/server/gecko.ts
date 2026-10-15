import "server-only";
const GT = "https://api.geckoterminal.com/api/v2/networks/solana";
export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };
export async function getCandles(mint: string, tf: "hour" | "day" = "hour", limit = 168): Promise<{ pool: string; poolName: string; candles: Candle[] }> {
  const h = { headers: { accept: "application/json" }, next: { revalidate: 300 } };
  const pr = await fetch(`${GT}/tokens/${mint}/pools?page=1`, h);
  if (!pr.ok) throw new Error(`GeckoTerminal pools ${pr.status}`);
  const pools = (await pr.json()).data as { attributes: { address: string; name: string; reserve_in_usd: string } }[];
  if (!pools?.length) throw new Error("No pools");
  const top = [...pools].sort((a, b) => +b.attributes.reserve_in_usd - +a.attributes.reserve_in_usd)[0].attributes;
  const or = await fetch(`${GT}/pools/${top.address}/ohlcv/${tf}?limit=${limit}&currency=usd&token=${mint}`, h);
  if (!or.ok) throw new Error(`GeckoTerminal OHLCV ${or.status}`);
  const list = (await or.json()).data.attributes.ohlcv_list as number[][];
  return { pool: top.address, poolName: top.name, candles: list.map(([t, o, hi, l, c, v]) => ({ t, o, h: hi, l, c, v })).reverse() };
}
