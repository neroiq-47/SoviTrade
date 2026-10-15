# SoviTrade — FREE-ONLY stack (revised 15 Oct 2026)

**Policy:** free options only. No paid plans, no trials that convert, ideally no card. Anything that needs money is listed as deferred.

## 1. Price sources for tokenised US stocks (oracle-deviation checks)

| Source | Free? | Verdict |
|---|---|---|
| xStocks issuer API | Yes | Primary reference (issuer quote) |
| Jupiter Price API v3 | Yes | DEX/market leg |
| Twelve Data / Finnhub free | Yes (non-commercial) | Optional secondary |
| Pyth Hermes | Key required for prices | Metadata free; prices need key |
| On-chain Pyth equity feeds | Free to read | Currently stale for equities |

**Recommended beta:** `ref = xStocks × multiplier` vs `dex = Jupiter usdPrice`, with sanity check. Deviation band ~1.5%.

## 2. Architecture (free-only, no VM, no card)

**Beta scope:** DCA and Rebalancing only. Grid and Trend shown as "Coming soon".

1. One Cloudflare Worker with Cron Trigger (`* * * * *`) that fans out to Durable Objects.
2. One Durable Object per bot (SQLite-backed) for serialisation, idempotency, and alarms.

## 3. CPU & limits
- Workers free: 10 ms CPU, 50 subrequests per invocation.
- Mitigations: tree-shaken Solana libs, native crypto.subtle, one trade per invocation, pre-resolve ALTs.

## 4. Signing-key storage
Envelope encryption: master key as Workers Secret, per-session keys encrypted. Swig role caps are the real safety net.

## 5. Free-only infrastructure

| Need | Pick | Free limits |
|---|---|---|
| Keeper / web | Cloudflare Workers + DO + Pages | 10 ms CPU, 1-min cron |
| Postgres | Supabase Free via Hyperdrive | 500 MB |
| Redis | Upstash Free | 256 MB |
| Errors | Sentry Developer | 5k errors/mo |
| Paging | Telegram + Discord + Better Stack | Free |

## 6. Deferred (paid)
Licensed oracle, HSM/KMS, Workers Paid (higher CPU), phone paging, PITR, KYT, full audit.

Full original notes and benchmarks are in the source history; this is the operational summary.
