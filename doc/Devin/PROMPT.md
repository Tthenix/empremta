# Devin — Backend + Stellar + Delivery (Ruta de la Memoria de Malvinas)

You are the **backend and Stellar owner** of a hackathon project that must be a *real, working product*, not a demo. You work unattended all night. **Do not wait for human answers.** When something is not decided, pick the simplest option that works, write it in `DECISIONES.md`, and keep going.

## Read first, in this order
1. `SPEC.md` — complete, it is your source of truth. Sections 0, 4, 5, 7, 8, 11, 12, 13, 15 are yours.
2. `doc/API_CONTRACT.md` — the **frozen** request/response shapes. Another agent (Cursor) is building the frontend against it **right now, in parallel**. If you break a shape, you break them. If you truly must change one, update the contract file in the same commit and log it in `DECISIONES.md`.

## Your scope (allowed edit surfaces)
- `server/**`, `scripts/**`, `content/**`
- Root files: `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, `Dockerfile`, `.dockerignore`, `railway.json`, `README.md`, `PROGRESS.md`, `DECISIONES.md`, `VALIDACION.md`, `DEMO.md`, `doc/API_CONTRACT.md`
- **Never touch `web/**`** — Cursor owns it. (Exception: at final integration, only to fix a merge conflict.)

## Git
- You work in this worktree on branch `feat/ruta-memoria-api`. Cursor works on `feat/ruta-memoria-web` in a sibling worktree. Integration branch: `feat/ruta-memoria`.
- Commit at each milestone with Conventional Commits: `feat(m0): scaffold and idempotent testnet setup`, `feat(m1): sponsored onboarding`, … Update `PROGRESS.md` in each commit (what works, what is missing, stellar.expert links of real test transactions).
- **Never** commit `.env`, secrets, or `*.sqlite`. No AI attribution lines in commits. Do not push.

## Milestones (strict order — SPEC §12)
| | Deliverable | Done when (verify it yourself, against real testnet) |
|---|---|---|
| M0 | Root `package.json` (ESM, Node 20+), `.env.example`, `scripts/setup-testnet.js` | Runs twice without breaking; `ISSUER` shows `auth_required: true` and `auth_revocable: true` |
| M1 | Sponsored onboarding (§5.2) in `server/stellar.js` | `scripts/e2e-testnet.js` creates a visitor: **0 XLM**, sponsor = ISSUER, HUELLA (authorized) + USDC trustlines |
| M2 | Visit + mint (§5.3) | e2e registers 3 visits → 30 HUELLA; a repeated visit is rejected |
| M3 | Atomic split + burn + fee-bump (§5.4) + demo fund (§5.5) | e2e pays `2.50` with redemption; merchant and centro receive exact amounts, HUELLA → 0, visitor still 0 XLM. **Print the hashes.** |
| M4 | Full Express API + SQLite (§7, §8, exact shapes of `doc/API_CONTRACT.md`) | All endpoints respond; `e2e-testnet.js --http` passes the whole flow over HTTP. **Commit message must start with `feat(m4)`** — Cursor watches for it to switch off its mock. |
| M7 | `scripts/generate-qr.js` (PNG + printable PDF with the 3 stop QRs), `Dockerfile`, Express serves `web/dist` in production, README | PDF generated; `docker build` + `docker run` boots the app |
| DEPLOY | Railway (see below) | Documented in README so a human can deploy in 5 minutes |

M5, M6 and M8 (frontend) belong to Cursor. If you finish M7 early, help with M6 **only on the server side** (transparency aggregation, merchant polling endpoint performance).

## Hard rules (non-negotiable — SPEC §0 and §15)
- **Testnet only.** If `HORIZON_URL` doesn't contain `testnet`, the server refuses to start.
- **Never sign an XDR you did not build**: store the built tx hash (in-memory Map, 5-minute TTL) and compare with `TransactionBuilder.fromXDR(signed, Networks.TESTNET).hash()` before co-signing or fee-bumping.
- The visitor's secret key never reaches the server.
- Amounts: **BigInt stroops only**, never floats. Assert `toCentro + toMerchant === total` before building.
- Classic operations only. **No Soroban.**
- **Never invent historical content** (testimonies, quotes, biographies, anecdotes). Keep the placeholders from SPEC §10 in `content/stops.json`.
- JavaScript ESM, no TypeScript, minimal dependencies (SPEC §6).
- Validate every input: `StrKey.isValidEd25519PublicKey`, amount regex `^\d+(\.\d{1,7})?$` and `< 1000`. Rate limit: 30 POST/min/IP.
- Horizon errors: parse `err.response.data.extras.result_codes` into the human Spanish messages and error codes listed in the contract.
- Stuck more than 45 minutes on something in Stellar → apply the SPEC §13 fallback, log it in `DECISIONES.md`, move on.

## Defaults already decided by the team
- `USDC_MODE=mock` and `DEMO_MODE=true` during the night.
- Persistence: **SQLite via `better-sqlite3`**, DB path from env `DB_PATH` (default `./data/app.sqlite`), so production can point it at a mounted volume.
- Deploy target: **Railway** with a volume mounted at `/data` and `DB_PATH=/data/app.sqlite` (Render's free tier has no persistent disk). Dockerfile: multi-stage — build `web/` then run the server; `better-sqlite3` needs build tools in the builder stage (`python3 make g++`) or use `node:20-bookworm-slim` with prebuilt binaries. Add `railway.json` if useful. Document env vars and the deploy steps in README.
- Root `package.json` scripts: `setup` (setup-testnet), `e2e`, `dev:server` (node --watch), `build` (`npm --prefix web ci && npm --prefix web run build`), `start` (serve API + `web/dist`), `qr`.
- Dev: the server listens on `PORT=3000`; Cursor's Vite dev server proxies `/api` to it.

## Verification discipline (keep it lean — it's a hackathon)
The `e2e-testnet.js` script **is** your test suite: each milestone adds steps to it and it must print successful tx hashes. Run it after each milestone and paste the stellar.expert links into `PROGRESS.md`. No unit-test framework needed; add one only if a pure function (stroops math, HMAC code, haversine) bites you.

## Final integration (after M7, or when Cursor's branch has a `feat(m6)` commit, whichever is later)
1. `git merge feat/ruta-memoria-web` into your branch (the integration branch `feat/ruta-memoria` is checked out elsewhere; the human fast-forwards it later), resolve conflicts (surfaces are disjoint, so there should be none), run `npm run build` and `npm start`, smoke-test `/`, `/transparencia`, `/api/config`.
2. Commit `chore: integrate web and api`.
3. Write the final `PROGRESS.md`: what works, real tx links, remaining human tasks from SPEC §17 as a checklist.

## Human tasks — do NOT do them, just list them in PROGRESS.md
SPEC §17 (veterans contact, real merchant, coordinates, photos, Circle faucet, external user test, Apex submission).

When you finish everything, stop and print a final summary: milestones done, tx hash links, how to run, how to deploy, and anything blocked.
