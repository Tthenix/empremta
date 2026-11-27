# Devin — Four features that prove "this is not a demo"

The app is live (https://empremta-production.up.railway.app). Judges score technical execution with "the Stellar integration must make sense" (also the tiebreaker) and "it must really work, not be a demo". These four features strengthen exactly that. Work unattended; decide, log in `DECISIONES.md`, keep going.

Branch: `feat/verifiable-features` (checked out). One Conventional Commit per feature (`feat(transparency): ...`, `feat(issuer): ...`, `feat(stop): ...`, `feat(qr): ...`). **No AI attribution / Co-Authored-By lines.** Do not push, do not touch `main`.

## Read first
`SPEC.md` (§4–5 Stellar design, §9 tone/accessibility, §15 hard rules), `doc/API_CONTRACT.md`, `doc/brand/LEEME.md`, `web/UX-AUDIT.md`. Reuse the existing helpers in `server/stellar.js` (Horizon server instance, keypairs, asset objects, `horizonToAppError`), `server/money.js` (stroops/BigInt formatting) and `server/errors.js`. Never re-implement them with a different shape.

## Allowed edit surfaces
`server/**`, `scripts/**`, `web/src/**`, `web/public/**`, `package.json` (scripts only, no new deps unless unavoidable — justify in DECISIONES.md), `doc/API_CONTRACT.md`, `README.md`, `DEMO.md`, `PROGRESS.md`, `DECISIONES.md`. Not `content/**`.

## F1 — Transparency read straight from Stellar
Goal: the total received by the centro must come from the **public ledger**, not from our database, so anyone can see we don't control the number.
- Server: read the CENTRO account from Horizon — its USDC balance and its incoming USDC payments (paginate `payments().forAccount(CENTRO_PUB)`, keep only `payment` ops with `to === CENTRO_PUB` and the configured USDC asset). Cache 15–30 s in memory to respect Horizon rate limits; on Horizon failure fall back to the DB numbers and say so.
- `GET /api/transparencia`: **add** (do not remove or rename existing fields) an optional `onChain` object: `{ source: "horizon", balanceUsdc, totalRecibido, pagos, lista: [{ txHash, amount, from, createdAt }], fetchedAt }` or `{ source: "db-fallback", reason }`. Document it in `doc/API_CONTRACT.md`.
- UI `/transparencia`: the big number shows the on-chain total, with a calm line "Leído directamente de la red Stellar · actualizado hace X s" and the link to the centro account on stellar.expert. Keep the per-merchant breakdown from the DB, matched by txHash. If a ledger payment has no DB match, list it as "Otro aporte" (it is still real money to the centro).
- Test: e2e `--http` asserts `onChain.source === "horizon"` and that the latest e2e payment appears in `onChain.lista`.

## F2 — The centro controls its own asset (revoke for fraud)
`HUELLA` already has `AUTH_REQUIRED + AUTH_REVOCABLE`. Make that control real and demonstrable, **without adding a web admin panel** (out of scope and a security risk).
- `scripts/revocar-huellas.js` (npm script `revocar`): `npm run revocar -- <G...pubkey> [--restore]`. Builds and submits `setTrustLineFlags` on HUELLA for that trustor (`authorized: false`, or `true` with `--restore`), signed by ISSUER, testnet only, validates the pubkey, prints the tx link. Idempotent and clear error messages.
- Server effect: a revoked account cannot receive Huellas nor spend them; make sure visit-mint and pay-with-Huellas return a human Spanish error (`ACCOUNT_REVOKED`, "Esta cuenta fue suspendida por el Centro de Veteranos") instead of a raw Horizon failure. Add the code to the contract.
- Public trace: `/api/transparencia` gains optional `revocaciones: [{ pubkey, txHash, createdAt }]` read from Horizon (trustline flag ops by ISSUER on HUELLA) or from a small DB table if Horizon makes that impractical (log the choice). Show it discreetly at the bottom of `/transparencia` ("Cuentas suspendidas por el centro") with tx links.
- Test: the e2e creates a throwaway visitor, revokes it, asserts a visit is rejected with `ACCOUNT_REVOKED`, restores it, asserts a visit works.
- Add a step to `DEMO.md` showing this in 30 seconds.

## F3 — Listen to the story (accessibility)
- On `/v/:stopId`, a clear "Escuchar el relato" button (≥ 48 px) that reads the story aloud with the Web Speech API (`speechSynthesis`), `lang="es-AR"` (fallback to any `es-*` voice), rate ~0.95. Toggle to "Detener". If the API is unavailable, hide the button. If an `audio` file exists for the stop, prefer the real recording (`<audio controls>`), it is more respectful than a synthetic voice.
- Never read placeholders: if the story is a placeholder (starts with `[`), do not show the button.
- Stop speech when leaving the page. `aria-pressed`/`aria-live` correct. No auto-play.

## F4 — Printable QR poster with the brand
- Extend `scripts/generate-qr.js` to also produce `dist/qr/carteles-ruta-memoria.pdf`: one A5/A4 page per stop with the **isotipo-simple** (`doc/brand/svg/empremta-isotipo-simple-color.svg` or its PNG — per LEEME the simple isotype is the one for QR signs), the stop name and place, a large QR, the line "Escaneá para conocer la historia de este lugar y registrar tu visita", and small "Empremta · Huellas de Malvinas en Mendoza". Sober layout, plenty of white space, AA contrast, readable from 1 m.
- Keep the existing localhost guard (`--allow-local`) and the existing outputs unchanged.
- **Generate the posters with** `PUBLIC_BASE_URL=https://empremta-production.up.railway.app npm run qr` so the files on disk are the production ones.

## Hard rules
Testnet only. Server only signs XDR it built. Visitor secret never leaves the browser. BigInt stroops only. Classic operations only (no Soroban). Never invent historical content. Memorial tone (no gamification). Additive API changes only.

## Verification before finishing (mandatory)
- `npm run build` passes.
- Server running: `npm run e2e -- --http` passes including the new F1 and F2 assertions. Paste the summary and tx links in `PROGRESS.md`.
- Walk `/transparencia` and `/v/pc` at 375 px and desktop.
- Open both PDFs and confirm the QRs encode `https://empremta-production.up.railway.app/...`.
- `git status` clean.

Print a short summary per feature when done.
