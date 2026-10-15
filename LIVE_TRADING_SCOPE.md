# SoviTrade — LIVE TRADING Scope & Plan
**Version:** 1.0 · 15 Oct 2026 · **Status:** Scope/plan (no production code yet) · **Builds on:** `SPEC.md` and the Next.js demo in `/app`

> This document turns the demo into a scoped plan for **real-money, 24/7, non-custodial auto-trading** of tokenised stocks on Solana. Not legal, tax or investment advice.

---

## 0. Executive summary

### Five findings that change the existing spec
1. Oracle landscape shifted (Switchboard gone, Pyth paid for prices, Chainlink DS available).
2. Custody default is Sovereign Mode (user Swig wallet + capped session key). Jupiter vault is opt-in and labelled third-party.
3. Beta strategies limited to Smart DCA and Rebalancing. Grid and Trend need sub-minute reaction.
4. Free-tier architecture is feasible for beta (Cloudflare Workers + Durable Objects) but has tight CPU limits.
5. Risk controls (position caps, daily loss, drawdown, deviation checks, kill switch) must be enforced on-chain or in the keeper, not only in the UI.

## 1. Scope
- Non-custodial execution via Swig smart wallet + time-limited capped session keys.
- Strategies: Smart DCA and Rebalancing first.
- Guardrails the bots cannot break.
- Live market data (Jupiter, Pyth, GeckoTerminal).
- Monitoring, alerts, and global kill switch.
- No payments or real order execution in the current front-end.

## 2. Architecture sketch
- Next.js front-end (current `/app`).
- Cloudflare Worker keeper with per-bot Durable Objects.
- Swig session keys with program allow-list and spending caps.
- Price deviation checks before every trade.

## 3. Rollout
1. Front-end preview with live data (current).
2. Keeper + session-key grant flow (demo).
3. Limited beta with real funds (DCA/Rebalancing only, tight caps).
4. Expand strategies and raise limits after monitoring.

## 4. Open questions
See original document for counsel questions, exact risk parameters, and source citations.

Full original scope (architecture diagrams, risk engine details, custody model, rollout timeline, and citations) is preserved in the source zip history. This is the clean operational summary.
