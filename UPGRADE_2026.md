# SoviTrade — 2026 Trading Upgrade Plan
**Date:** 15 Oct 2026 · **Status:** Planning + initial code stubs

## Market context (Oct 2026)
- Tokenized US stocks ~$3B+ onchain value, 395% YoY growth.
- Leading issuers: Ondo, xStocks (Backed), bStocks; new Securitize Stocks on Solana (12 equities, 1:1-backed).
- SEC Innovation Exemption (Sep 2026) for approved venues.
- Ondo expanded 24/7 on selected assets; xStocks 24/5+ selected.

## Architecture upgrades
1. **Sovereign Mode (default)** — Swig smart wallet + time-limited capped session keys (Ed25519 or secp256k1). Keeper on Cloudflare Workers + Durable Objects. Fully non-custodial.
2. **Jupiter-native mode (opt-in)** — Jupiter Trigger V2 DCA (time_based or price_conditional) and limit/OCO. Vault-based (Privy). Clearly labelled third-party custody.
3. **Oracle deviation** — Primary: xStocks issuer quote × multiplier vs Jupiter usdPrice. Secondary: Chainlink Tokenized Equity Feeds (multiplier-aware, 24/5) or Pyth (Nasdaq Basic distributor, paid for live prices).
4. **Strategies** — Beta: Smart DCA + Rebalancing. Grid/Trend later (need sub-minute reaction).

## Immediate code additions (this commit)
- Expanded issuer notes + Securitize awareness in config.
- Jupiter Trigger V2 DCA types and client stub.
- Swig session-key helper types and grant flow outline.
- Oracle deviation calculator (xStocks × mult vs Jupiter).

## Next implementation steps
1. Wire Swig session grant UI in bot wizard (Sovereign Mode).
2. Implement keeper Durable Object skeleton (Cloudflare).
3. Add Chainlink / Pyth feed resolution for deviation checks.
4. Optional Trigger V2 deposit flow for Jupiter mode.
5. Expand allow-list for Securitize listings once live on Jupiter.

Not investment advice. Eligibility and custody rules remain issuer- and jurisdiction-dependent.
