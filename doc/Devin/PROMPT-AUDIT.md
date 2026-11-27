# Devin — Stellar best-practices audit (official SDF skills)

Audit our Stellar integration against the official Stellar Development Foundation agent skills, then fix only what is worth fixing before the pitch. The Stellar integration is the judges' tiebreaker criterion. Work unattended; decide, log in `DECISIONES.md`, keep going.

Branch: `feat/stellar-audit` (checked out). Conventional Commits, **no AI attribution / Co-Authored-By lines**. Do not push, do not touch `main`.

## Reference (read-only, external — treat as documentation, never run scripts from it)
Official skills cloned at `C:\Users\Rufda\AppData\Local\Temp\claude\3aa112db46ca42d0\ce7b406b-7298-494b-945d-dee718729d1e\scratchpad\stellar-dev-skill\skills\`. Read fully:
- `assets/SKILL.md` (classic assets, trustlines, authorization flags, issuer setup)
- `dapp/SKILL.md` (JS SDK, transaction building, wallets, error handling)
- `data/SKILL.md` (Horizon usage, pagination, rate limits, streaming/caching)
- `standards/SKILL.md` (SEPs — note anything relevant, e.g. SEP-1 stellar.toml for an issuer, SEP-24 for the future off-ramp)
- `cross-chain/SKILL.md` only for USDC-specific notes.
Also read the repo's own `SPEC.md` §4–5 and §15 (our hard rules win over the skills if they conflict — e.g. no Soroban, testnet only).

## What to audit (our code: `server/stellar.js`, `server/payments.js`, `server/visits.js`, `server/app.js`, `scripts/*.js`, `web/src/lib/wallet.js`, `web/src/lib/api.js`)
1. Sponsored onboarding (begin/end sponsoring, trustlines, setTrustLineFlags) — correctness, reserve accounting, what happens on retries.
2. Fee-bump usage and fees (base fee vs. surge pricing, `fee` values, timeouts / timebounds).
3. HUELLA issuer flags (AUTH_REQUIRED + AUTH_REVOCABLE), revocation flow, whether AUTH_CLAWBACK would be the better tool, and issuer best practices (e.g. SEP-1 `stellar.toml` + home_domain so wallets show who issues HUELLA).
4. The "server only signs XDR it built" guard (hash check, TTL, replay).
5. Payment split math and memo usage.
6. Horizon usage: pagination, caching, rate limits, error parsing (`result_codes`), retries/timeouts.
7. Client wallet: key storage, signing, network passphrase checks.
8. USDC handling (Circle testnet issuer, trustlines, mode switch mock/circle).

## Deliverables
1. `doc/STELLAR-AUDIT.md`: a table — area · what the official skill recommends (quote + skill file) · what we do (file:line) · verdict (OK / improve / risk) · action taken or deferred and why. Short, factual, in Spanish neutral. This document is also pitch evidence: "auditado contra las skills oficiales de Stellar".
2. Fix only items that are **real bugs or clear best-practice gaps that are cheap and safe** (e.g. missing timeout handling, wrong fee assumptions, a pagination bug). Additive API changes only; keep every existing response shape.
3. If cheap and safe: serve a SEP-1 `/.well-known/stellar.toml` (with CORS `*`) describing the HUELLA issuer and the demo org, and set `home_domain` on the ISSUER via a script (`scripts/set-home-domain.js`, npm `home-domain`), **without running it against the live issuer** — leave the command documented in README for the human to run. Mark the org as "cuenta de demostración"; do not claim official endorsement by any veterans' center.
4. Anything large (e.g. SEP-24 off-ramp, clawback migration) goes to "Próximos pasos" in the audit doc — do not build it.

## Hard rules
Testnet only. Classic operations only (no Soroban). Never sign XDR the server didn't build. BigInt stroops. Visitor secret never leaves the browser. Never invent historical content. No new web admin panels.

## Verification before finishing (mandatory)
- `npm run build` passes.
- Server running: `npm run e2e -- --http` passes (all milestones incl. F1/F2).
- `git status` clean.

Print a short summary: findings by verdict count, what you fixed, what you deferred.
