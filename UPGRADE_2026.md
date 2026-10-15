# SoviTrade — 2026 Trading Upgrade Plan
**Date:** 15 Oct 2026 · **Status:** Live-trading skeleton implemented

## Implemented (this session)
- `app/lib/swig-grant.ts` — Session grant preparation (keypair + instructions outline)
- `app/lib/server/keeper.ts` — Per-bot Durable Object evaluation + tick skeleton
- `app/lib/server/jupiter-trigger-full.ts` — Full Trigger V2 auth, deposit/craft, DCA create
- `app/lib/server/risk-engine.ts` — Guardrail checks (position, daily loss, drawdown, slippage, deviation)
- Oracle deviation, config updates, Swig types (previous)

## Remaining for true live trading
1. Integrate `@swig-wallet/classic` (or kit) and actually build/sign create-session + sign transactions.
2. Deploy Cloudflare Worker + Durable Object that calls `keeperTick` and executes swaps via session key.
3. Wire bot wizard to call `prepareSessionGrant` and present the transaction for user signature.
4. Store encrypted session key material securely (Workers Secret + envelope).
5. Add Jupiter Swap API quote + build for Sovereign Mode execution (non-vault).
6. On-chain confirmation, idempotency, and kill-switch revocation path.
7. Monitoring (Sentry + alerts) and dry-run mode.

## Dual path
- **Sovereign (default):** Swig session + own keeper + Jupiter Swap. Non-custodial.
- **Jupiter-native (opt-in):** Trigger V2 vault + DCA/limit. Labelled third-party.

Live trading is not yet production-ready; the skeleton is in place for the next engineering sprint.
