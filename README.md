# SoviTrade

**Your keys. Your limits. Always on.** SoviTrade is a non-custodial auto-trading dashboard for tokenised US stocks and ETFs on Solana (xStocks, Ondo, Backpack via Jupiter). You choose a strategy (Smart DCA, Grid, Trend, Rebalancing), set guardrails the bots can't break, and keep custody in your own Swig smart wallet. Status: **v1 front-end with live market data; no real trading or payments yet.**

## Repository layout
| Path | What |
|---|---|
| `SPEC.md` | Product spec & brand package (research, strategies, safeguards, pricing, UI, sitemap, stack) |
| `LIVE_TRADING_SCOPE.md` | Scope & plan for real-money, 24/7 non-custodial trading |
| `FREE_STACK.md` | Free-tier-only infrastructure plan |
| `live-architecture.png`, `diagram/` | Live-trading architecture diagram (mermaid source) |
| `app/` | Next.js 15 (App Router) + TypeScript + Tailwind v4 web app |
| `branding/`, `scripts/` | Logos (Sovereign Shield), palette, generator scripts |
| `screenshots/` | Full-page screenshots of each page |
| `shots-tool/` | Playwright screenshot script |
| `pyth_onchain_check.py` | Pyth on-chain price check helper |

## App: pages & data
- Pages: `/`, `/app` (dashboard), `/app/bots` (+ `/new` wizard, `/[id]`), `/app/markets` (+ `/[ticker]`), `/pricing`, `/app/account`.
- Live data: Jupiter Token API v2 + Price API v3 (listings, mints, prices, SOL), GeckoTerminal OHLCV (charts), Pyth Hermes (feed metadata; prices need `PYTH_API_KEY`), Solana RPC via `/api/rpc` read-only proxy (wallet balances), NYSE session calc (`lib/nyse.ts`).
- No mock data: bots, P&L, orders, activity, pass and payments show empty states until the execution engine exists.
- Custody: default Sovereign Mode (your Swig smart wallet, time-limited capped session key); Jupiter vault orders are opt-in and labelled third-party custody.
- Monitoring: Sentry (`@sentry/nextjs`, EU region), errors + 10% traces, replays on error only, no PII, wallet addresses truncated.

## Run
```bash
cd app
cp .env.example .env.local   # fill in as needed (all optional)
npm install
npm run build && npm run start -- -p 3000   # or: npm run dev
```
Restart: `pkill -f next-server`. Screenshots: `cd shots-tool && npm i && npx playwright install chromium && node shoot.mjs` (server must be running).

## Environment
See `app/.env.example`: `NEXT_PUBLIC_SOLANA_RPC`, `SOLANA_RPC_URL`, `PYTH_API_KEY`, `PYTH_HERMES_URL`, `JUPITER_API_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (source-map upload only), `SENTRY_TEST_TOKEN`, `KEEPER_SENTRY_DSN`.

## Compliance & risk
Not available to US persons or residents of the UK, Canada, Australia, Switzerland or sanctioned regions. Tokenised stocks are not shares. Nothing here is investment, legal or tax advice.
