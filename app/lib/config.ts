/**
 * Static product & reference configuration (not market data).
 * Live data comes from lib/server/* (Jupiter, Pyth, GeckoTerminal, Solana RPC).
 */
export type IssuerId = "xstocks" | "ondo" | "backpack";

/** Curated underlying allow-list. Listings per issuer are discovered live from the Jupiter Token API. */
export const UNDERLYINGS: { ticker: string; name: string; kind: "Stock" | "ETF"; sector: string }[] = [
  { ticker: "SPY", name: "SPDR S&P 500 ETF", kind: "ETF", sector: "Index" },
  { ticker: "QQQ", name: "Invesco QQQ (Nasdaq-100)", kind: "ETF", sector: "Index" },
  { ticker: "NVDA", name: "NVIDIA", kind: "Stock", sector: "Semis" },
  { ticker: "TSLA", name: "Tesla", kind: "Stock", sector: "Auto" },
  { ticker: "AAPL", name: "Apple", kind: "Stock", sector: "Tech" },
  { ticker: "GOOGL", name: "Alphabet", kind: "Stock", sector: "Tech" },
  { ticker: "MSFT", name: "Microsoft", kind: "Stock", sector: "Tech" },
  { ticker: "AMZN", name: "Amazon", kind: "Stock", sector: "Consumer" },
  { ticker: "META", name: "Meta Platforms", kind: "Stock", sector: "Tech" },
  { ticker: "CRCL", name: "Circle Internet", kind: "Stock", sector: "Fintech" },
  { ticker: "COIN", name: "Coinbase", kind: "Stock", sector: "Fintech" },
  { ticker: "HOOD", name: "Robinhood Markets", kind: "Stock", sector: "Fintech" },
  { ticker: "MSTR", name: "Strategy", kind: "Stock", sector: "Tech" },
  { ticker: "AVGO", name: "Broadcom", kind: "Stock", sector: "Semis" },
  { ticker: "TSM", name: "Taiwan Semiconductor", kind: "Stock", sector: "Semis" },
  { ticker: "MU", name: "Micron Technology", kind: "Stock", sector: "Semis" },
  { ticker: "GLD", name: "SPDR Gold Trust", kind: "ETF", sector: "Commodity" },
];

export const ISSUERS: Record<IssuerId, { name: string; entity: string; structure: string; docs: string; por: string; eligibility: string; tag: string }> = {
  xstocks: { name: "xStocks", entity: "Backed Assets (JE) Ltd", tag: "xstocks", structure: "1:1 collateralised by shares at regulated custodians, bankruptcy-remote", docs: "https://docs.xstocks.fi/docs/frequently-asked-questions", por: "https://xstocks.fi", eligibility: "Not for US persons; excluded: US, UK, CA, AU, sanctioned" },
  ondo: { name: "Ondo Stocks", entity: "Ondo Global Markets (BVI) Ltd", tag: "ondo", structure: "Tokenised exposure, RFQ/JIT liquidity, USDC-quoted", docs: "https://docs.ondo.finance/ondo-stocks/eligibility", por: "https://ondo.finance", eligibility: "Reg S, no US/CA; EEA, UK, HK, SG, CH professional only" },
  backpack: { name: "Backpack", entity: "Backpack Securities", tag: "backpack", structure: "1:1 by shares held at Backpack Securities", docs: "https://docs.jup.ag/user-docs/trade/spot/tokenized-stocks", por: "https://backpack.exchange", eligibility: "Per issuer terms" },
};

/** Issuer trading-hours notes (from issuer docs, see SPEC §1.2). On-chain DEX liquidity itself is always on. */
const ONDO_247 = ["SPY", "QQQ", "NVDA", "TSLA", "GOOGL", "CRCL"];
export const issuerHours = (issuer: IssuerId, ticker: string): "24/7" | "24/5" | "Issuer terms" =>
  issuer === "xstocks" ? "24/7" : issuer === "ondo" ? (ONDO_247.includes(ticker) ? "24/7" : "24/5") : "Issuer terms";

export type StrategyId = "dca" | "grid" | "trend" | "rebalance";
export const STRATEGIES: { id: StrategyId; name: string; blurb: string; fit: string; tier: string; native: string; risks: string }[] = [
  { id: "dca", name: "Smart DCA", blurb: "Buy a fixed USDC amount on a schedule. Buys more on dips below the EMA, skips above your cap.", fit: "Long-term accumulation", tier: "All passes", native: "Jupiter DCA available", risks: "Keeps buying in a sustained downtrend; off-hours premium." },
  { id: "grid", name: "Grid", blurb: "Ladder buys and sells across a price range and earn each grid step in sideways markets.", fit: "Sideways markets", tier: "Pilot+", native: "Jupiter limit ladder available", risks: "Breakouts strand inventory; tight grids get eaten by fees." },
  { id: "trend", name: "Trend (EMA cross)", blurb: "Go long when the fast EMA crosses above the slow EMA; exit to USDC on the reverse or a trailing stop.", fit: "Trending markets", tier: "Pilot+", native: "Exits only (OCO)", risks: "Whipsaw in choppy markets; lag." },
  { id: "rebalance", name: "Rebalancing", blurb: "Hold target weights and rebalance when drift exceeds your threshold, with an optional mean-reversion overlay.", fit: "Multi-asset portfolios", tier: "All (2 assets on Scout)", native: "Sovereign Mode only", risks: "Fees in volatile markets; liquidity differs by issuer." },
];

export const PASSES = [
  { id: "scout", name: "Scout", days: 30, price: 29, perMonth: "$29/mo", bots: 2, strategies: "DCA, Rebalance (≤2 assets)", backtests: "10/day · 6-month history", alerts: "Email / in-app", priority: "Standard" },
  { id: "pilot", name: "Pilot", days: 90, price: 69, perMonth: "≈$23/mo (−21%)", bots: 6, strategies: "All 4", backtests: "50/day · 2 years", alerts: "+ Telegram / Discord", priority: "Priority fee “High”", popular: true },
  { id: "sovereign", name: "Sovereign", days: 365, price: 199, perMonth: "≈$16.6/mo (−43%)", bots: 20, strategies: "All 4 + advanced params", backtests: "Unlimited · CSV export", alerts: "+ webhooks", priority: "“VeryHigh” + dedicated lane" },
] as const;

export const BLOCKED_REGIONS = ["United States", "United Kingdom", "Canada", "Australia", "Switzerland", "OFAC/UN-sanctioned & occupied regions"];
export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
