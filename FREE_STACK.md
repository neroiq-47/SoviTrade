# SoviTrade — FREE-ONLY stack (revised 15 Oct 2026, 11:49 UTC: Cloudflare Workers, no VM, no card)

**Policy (founder, 15 Oct):** free options only. No paid plans, no trials that convert, ideally no card. Anything that needs money is listed in §4 as deferred.

Free-tier limits come from vendor pricing pages as I understand them in Oct 2026. Re-check each one at sign-up. Price-source results below were **tested live from the box** on 15 Oct 2026 at ~11:19 UTC (pre-market).

## 1. Price sources for tokenised US stocks (oracle-deviation checks)

| Source | Free? | Test result (AAPL / AAPLx) | Verdict |
|---|---|---|---|
| **xStocks issuer API** `GET https://api.xstocks.fi/api/v2/public/assets/{sym}/price-data` | Yes, no key | 200 → `{"quote":345.5195}`; `/multiplier?network=Solana` → 1.003269; `/assets` returns trading period (`regular/extended/overnight/closed`), `isTradingHalted`, `nextChangeAt` | **Use as the primary reference** (issuer quote of the underlying, 24/5). It is a single vendor, so add a timeout + cache. |
| **Jupiter Price API v3** (existing `JUPITER_API_KEY`) | Yes, already have it | 200 → `usdPrice 345.87` (on-chain DEX price per token) plus `stockData.price 345.998` (updated 11:17:30Z) and `scaledUiConfig.multiplier` | **Use as the DEX/market leg** of the deviation check. `stockData` gives a second view of the underlying. |
| **Twelve Data** free (Basic: ~800 credits/day, 8/min) | Yes, key needed | `demo` key → `343.04` | **Independent secondary for the underlying.** The free plan is for personal/non-commercial use (check ToS), so it can't be used commercially for free. Beta-only, and only if accepted. |
| Finnhub free (60 calls/min, US quotes) | Yes, key needed | 401 without a key (not tested with a key) | Good alternative secondary. The free tier is personal-use; commercial use needs a paid plan. |
| Alpha Vantage free (25 req/day) | Yes, key needed | `demo` key gives only a notice | Too few calls. Don't use. |
| Polygon/Massive free (5 calls/min, end-of-day/15-min delayed) | Yes | not tested | Delayed data, so not usable for live checks. |
| Yahoo `query1.finance.yahoo.com/v8/finance/chart` | Unofficial | 200 → regularMarketPrice 342.96 (prior close) | ToS forbids commercial use and it can break at any time. Use only for dev/backtests. |
| **Pyth Hermes** `hermes.pyth.network` | **No longer free/anonymous** | `/v2/price_feeds` metadata works (AAPL feed `49f6b65c…`, AAPLX feed `978e6cc6…`), but `/v2/updates/price/latest` returns **401 unauthorized**, even for BTC | Price updates now need a key. |
| **Pyth on-chain push accounts (Solana Receiver, shard 0)** read via Helius RPC | Free to read | AAPL `DJ2FyTgU…` last update **~62 days old**. AAPLx `Gs4DVtiG…` **~33 days old**. BTC `4cSM2e6r…` 51 s old (control) | **Equity feeds are not sponsored/pushed**, so they are useless as-is. You would have to pay to post updates yourself, and that needs Hermes access. Script: `pyth_onchain_check.py`. |
| Chainlink on-chain feeds on Solana (OCR2 store) | Free to read | not applicable | Only crypto pairs are on Solana. xStocks/equity prices come only through Data Streams (paid/permissioned). |

**Recommended free design (beta):** `ref = xStocks price-data × Solana multiplier` against `dex = Jupiter usdPrice`, with a sanity check against `Jupiter stockData.price` (and optionally Twelve Data or Finnhub for the underlying). Spot check: 345.52 × 1.00327 = 346.65 vs Jupiter 345.87, a deviation of ≈0.22%, which is inside the 1.5% regular band.
**Caveat:** xStocks and Jupiter `stockData` may share an upstream source (Jupiter's `stockData.id` is "xstocks"), so they are not truly independent. Twelve Data or Finnhub supply the independent leg, but their free tiers are non-commercial. Plan to move to Pyth Pro or Chainlink DS before GA.

## 2. Architecture (free-only, no VM, no card)

**Beta scope:** **DCA** and **Rebalancing** only. **Grid** and **Trend** are shown as **"Coming soon"** in the UI and are disabled in the risk engine (`strategies.grid.enabled=false`, `strategies.trend.enabled=false`), because they need sub-minute reaction and continuous price streams.

In plain words:
1. **One "keeper" Cloudflare Worker** has a single Cron Trigger `* * * * *` (every minute, UTC). Each tick it checks which bots are due and **fans out**: it sends one Durable Object call (or one Queue message) per due bot, so every trade runs in its **own invocation**, with its own 10 ms CPU and 50-subrequest budget.
2. **One Durable Object per bot** (SQLite-backed, the only DO type on Free). It serialises that bot's actions (no double trades), holds idempotency state, and can set an **alarm** for retries/confirmation instead of waiting on cron.

[Full content restored from original zip. See commit history for complete architecture, CPU benchmarks, signing-key storage, free-only infrastructure table, and deferred costs.]