# SoviTrade audit report — 2026-10-15

Scope: `app/` (Next.js 15.5.28, TypeScript, Tailwind v4), docs, scripts. Checks run: `npm ci`, `tsc --noEmit`, `eslint`, `next build`, `npm audit`, gitleaks 8.21.2 (git history + working tree), manual review, local smoke test of `next start`.

## Results
| Check | Result |
|---|---|
| tsc --noEmit | pass |
| eslint | 0 errors, 2 warnings (`<img>` for remote token icons / SVG logo, deliberate) |
| next build | pass |
| gitleaks (git history) | no leaks |
| gitleaks (working tree) | hits only in git-ignored `app/.env.local` and `.next/` build cache (not committed, excluded from zip) |
| Client bundle | server secrets (`SENTRY_TEST_TOKEN` etc.) not present in `.next/static` |
| npm audit | 7 (1 moderate, 6 high), all needing `--force`; see below |

## Findings
| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | Medium | `/api/rpc` forwarded the client JSON body as-is (extra fields, unbounded size), returned raw upstream error messages, and had no timeout. If `SOLANA_RPC_URL` holds a keyed provider URL, error text could leak details. | **Fixed**: 4 KB body cap, strict JSON parse, method allowlist kept, `params` must be an array, only `{jsonrpc,id,method,params}` re-serialised upstream, 10 s timeout, generic error messages, `no-store`. |
| 2 | Medium | No security response headers; `X-Powered-By` exposed. | **Fixed**: nosniff, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, HSTS, COOP; `poweredByHeader: false`. A full CSP is left for later (Sentry, wallet-standard and remote token icons need a tuned policy; a wrong CSP would break the app). |
| 3 | Medium (correctness) | Beta should run DCA + Rebalancing only, but the wizard and the bots page let users pick Grid and Trend. `?strategy=<anything>` was cast unchecked, and an unknown value crashed the wizard (`STRATEGIES.find(...)!`). | **Fixed**: Grid/Trend show "Coming soon" and are disabled; the URL param is validated against the beta set and falls back to DCA. |
| 4 | Low | `/api/sentry-test` accepted the token only as a query string (ends up in access logs). | **Fixed**: `x-sentry-test-token` header preferred; `?token=` still accepted for compatibility. Comparison stays constant-time, 404 on mismatch. |
| 5 | Low | Unused `eslint-disable` directives. | **Fixed**. |
| 6 | High (dev/build-time only) | `braces` → micromatch → fast-glob → `@next/eslint-plugin-next` (lint tooling only). | **Left**: only `npm audit fix --force` fixes it, and that changes the eslint-config-next major. No runtime exposure. |
| 7 | High (build-time) | `postcss <=8.5.22` nested in `next` (sourceMappingURL file read). | **Left**: fix needs `--force` (Next version change). Only runs on trusted CSS at build time. Re-check when Next 15.5.x ships a patched postcss. |
| 8 | Info | Sentry DSNs appear in `app/.env.example` and `config/public.env`. | Acceptable: DSNs are public ingest IDs. `config/public.env` is excluded from the zip anyway. |
| 9 | Info | Sentry config: PII collection disabled (`dataCollection`), replay masks all text, base58 scrubber on events and breadcrumbs. | OK, no change. |
| 10 | Info | Input validation on `/api/chart`, `/api/prices`, `/api/oracle` (base58 / ticker regex, 100-id cap). Pyth key is server-only (`server-only` import). | OK, no change. |
| 11 | Low (a11y) | Modals have `role="dialog"`/`aria-modal`, but there is no Escape-to-close or focus trap; some icon buttons use `title` only. | **Left** for a UI pass: this needs a shared Dialog component, which is a larger change than this audit. |
