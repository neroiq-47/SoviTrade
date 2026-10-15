# SoviTrade — 2026 Trading Upgrade Plan
**Date:** 15 Oct 2026 · **Status:** Sovereign DCA dry-run path is wired

## Live in this build
- `app/lib/swig-grant.ts` — Builds a real Swig create-or-add session transaction (`@swig-wallet/classic`). Root wallet is the only signer. USDC spend cap and program allow-list are on the session authority.
- `app/components/bot-wizard.tsx` — Review step shows duration, spend cap, and allowed programs, then either signs that transaction or saves a dry-run session. Stored record is the session public key plus an encrypted key-material reference. The root key is never stored.
- `app/lib/server/jupiter-swap.ts` — Jupiter Swap v1 quote + versioned transaction. Slippage is in bps. Jupiter's `priceImpactPct` is a fraction (0.01 = 1%) and is converted before the risk check.
- `app/lib/server/keeper.ts` and `execute-bot.ts` — Idempotent tick. Dry-run (default) logs the intended USDC → stock swap and does not send. Live send requires `KEEPER_DRY_RUN=false`, the cron secret, and session key material from a secret store.
- `wrangler.toml` + `workers/keeper/src/index.ts` — Cron every 5 minutes. Calls `keeperTick`. Refuses to sign if the session secret is missing.
- Dashboard, bots, and account show session status, next tick, and the last risk-check result. Empty states stay until a session exists.
- Fixes from the audit pass: restored `/api/rpc`, wallet picker actually opens, tokenised-stock decimals and issuer come from Jupiter instead of a hardcoded xStocks/6-decimal row, oracle deviation rejects a zero or missing reference, risk checks no longer divide by zero or use a fake 30 bps slippage, Trigger V2 sends the API key as `x-api-key` and the wallet JWT as `Authorization`, Pyth fetches a price when `PYTH_API_KEY` is set.

## Still not live
1. Underlying issuer print. The public xStocks route exposes the Solana multiplier, not the stock quote, so the risk engine fails closed and live sends stay blocked on that check.
2. On-chain confirmation polling and a signed Swig `remove authority` transaction for the kill switch. Revoke currently stops the keeper locally.
3. Durable Object storage for idempotency and bot configs. The worker reads `BOTS_JSON`. The browser keeps bots in localStorage.
4. Rebalance, grid, and trend execution.
5. Jupiter Trigger V2 vault orders. The client is labelled third-party and is not called from the wizard.
6. Production monitoring alerts beyond the existing Sentry wiring.

## Dual path
- **Sovereign (default):** Swig session + own keeper + Jupiter Swap. Non-custodial. Dry-run until you opt out.
- **Jupiter-native (opt-in):** Trigger V2 vault + DCA/limit. Labelled third-party. Not executed by this build.

Do not put session private keys in git, wrangler vars, or the bot record.
