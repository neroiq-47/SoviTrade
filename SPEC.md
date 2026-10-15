# SoviTrade — Product Spec & Brand Package
**Domain:** SoviTrade.xyz · **Status:** Planning only (no build) · **Version:** 1.1 · 15 Oct 2026

> SoviTrade is a non-custodial auto-trading dashboard for tokenised US stocks and ETFs on Solana. You keep your keys, choose a strategy (DCA, grid, trend, rebalance), and set limits the bots can't break. Trading runs 24/7, and the risk controls are the same on every plan.

---

## 0. TL;DR of key decisions

**v1.1 changes (15 Oct 2026):**
1. Switchboard removed (deprecated). Secondary oracle is Chainlink Data Streams.
2. Pyth is paid for live prices; metadata is free.
3. Beta scope: Smart DCA and Rebalancing only. Grid and Trend are "Coming soon".
4. Default custody: Sovereign Mode (user's own Swig smart wallet + time-limited capped session key).
5. Pricing: one-time passes (Scout $29/30d, Pilot $69/90d, Sovereign $199/365d). No subscriptions, no performance fees.

## 1. Research & market context
- Tokenised US stocks/ETFs on Solana via xStocks, Ondo, Backpack (Jupiter).
- On-chain DEX liquidity is 24/7; underlying markets are not. Session mode adjusts size and checks off-hours.
- Eligibility: not for US persons or residents of UK, Canada, Australia, Switzerland, or sanctioned regions.

## 2. Strategies & safeguards
- **Smart DCA**: scheduled buys, more on dips, skip above cap.
- **Rebalancing**: target weights, rebalance on drift.
- **Grid / Trend**: shown but disabled in beta.
- Guardrails (cannot be broken by bots): position cap, daily loss, max drawdown, stop-loss, slippage, price impact, oracle deviation, session mode, volatility breaker.

## 3. Pricing
One-time passes paid in USDC or SOL. Live in wallet as non-transferable token. Checkout not live in v1.

## 4. UI & sitemap
- `/` landing
- `/app` dashboard
- `/app/bots` + `/new` wizard + `/[id]`
- `/app/markets` + `/[ticker]`
- `/pricing`
- `/app/account`

## 5. Stack
Next.js 15 (App Router), TypeScript, Tailwind v4, Wallet Standard, Sentry (EU), Jupiter + GeckoTerminal + Pyth for data.

## 6. Brand
Sovereign Shield motif. Violet → indigo → teal gradient. Space Grotesk + Inter.

Full original research, tables, and brand package details are in the source zip history. This is the clean operational specification.
