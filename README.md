# SoviTrade

**Your keys. Your limits. Always on.** SoviTrade is a non-custodial auto-trading dashboard for tokenised US stocks and ETFs on Solana (xStocks, Ondo, Backpack, Securitize via Jupiter). You choose a strategy (Smart DCA, Grid, Trend, Rebalancing), set guardrails the bots can't break, and keep custody in your own Swig smart wallet. Status: **v1 front-end with live market data; no real trading or payments yet.**

## 2026 Trading Upgrade
See `UPGRADE_2026.md` for the aligned plan (Swig sessions, Jupiter Trigger V2 optional mode, oracle deviation, new issuers).
Initial stubs live in:
- `app/lib/server/jupiter-trigger.ts`
- `app/lib/server/oracle-deviation.ts`
- `app/lib/swig-session.ts`

## Repository layout
| Path | What |
|---|---|
| `SPEC.md` | Product spec & brand package |
| `LIVE_TRADING_SCOPE.md` | Scope & plan for real-money trading |
| `FREE_STACK.md` | Free-tier-only infrastructure plan |
| `UPGRADE_2026.md` | 2026 market & architecture upgrade |
| `app/` | Next.js 15 (App Router) + TypeScript + Tailwind v4 web app |
| `branding/`, `scripts/` | Logos, palette, generator scripts |
| `pyth_onchain_check.py` | Pyth on-chain price check helper |

## App: pages & data
- Pages: `/`, `/app` (dashboard), `/app/bots` (+ `/new` wizard, `/[id]`), `/app/markets` (+ `/[ticker]`), `/pricing`, `/app/account`.
- Live data: Jupiter Token API v2 + Price API v3, GeckoTerminal OHLCV, Pyth Hermes (metadata), Solana RPC via `/api/rpc`.
- No mock data: bots, P&L, orders show empty states until the execution engine exists.
- Custody: default Sovereign Mode (Swig + session key); Jupiter Trigger V2 vault is opt-in and labelled third-party.

## Run
```bash
cd app
cp .env.example .env.local
npm install
npm run dev
```

## Compliance & risk
Not available to US persons or residents of the UK, Canada, Australia, Switzerland or sanctioned regions. Tokenised stocks are not shares. Nothing here is investment, legal or tax advice.
