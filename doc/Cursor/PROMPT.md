# Cursor — Frontend PWA (Ruta de la Memoria de Malvinas)

You are the **frontend owner** of a hackathon project that must be a *real, working product*, not a demo. Work end to end without stopping to ask: when something is not decided, pick the simplest option that works, note it in `web/DECISIONES-WEB.md`, and keep going. Do not ask for confirmation between steps.

## Read first, in this order
1. `SPEC.md` — source of truth. Sections 0, 3, 6, **9 (screens, wallet, tone)**, 10, 14, 15 are yours.
2. `doc/API_CONTRACT.md` — **frozen** request/response shapes. Another agent (Devin) is building the backend against it **right now, in parallel**, on branch `feat/ruta-memoria-api`.

## Your scope (allowed edit surfaces)
- `web/**` only (including `web/package.json`, `web/vite.config.js`, `web/DECISIONES-WEB.md`).
- **Never touch** `server/**`, `scripts/**`, `content/**`, or root files — Devin owns them. If you need a contract change, write it in `web/DECISIONES-WEB.md` under "Contract requests" and adapt on your side meanwhile.

## Git
- You work in this worktree on branch `feat/ruta-memoria-web`.
- Commit per milestone with Conventional Commits: `feat(m5): home, stop, journey and pay screens`, `feat(m6): merchant cash register and transparency`, `feat(m8): polish, errors, a11y, about`. No AI attribution lines. Do not push.

## Stack (SPEC §6)
React + Vite (JavaScript, no TypeScript), `react-router-dom`, `leaflet` + `react-leaflet` (OSM tiles), `qrcode`, `@stellar/stellar-sdk`. Basic PWA: `manifest.webmanifest` + icons, no complex service worker.
- Buffer gotcha: `import { Buffer } from "buffer"; globalThis.Buffer = Buffer;` in `main.jsx`, or `vite-plugin-node-polyfills`.
- `vite.config.js`: dev proxy `/api` → `http://localhost:3000`. Build output `web/dist` (Express serves it in production — Devin's side).

## Work in parallel with a mock, then switch to the real API
1. Build `web/src/lib/api.js` as the **only** module that talks to the backend, exactly per `doc/API_CONTRACT.md`.
2. Add `web/src/lib/mockApi.js` returning realistic fake data with the exact shapes (including errors), enabled with `VITE_API_MOCK=true`. Make the mock stateful in memory so the full flow (onboard → 3 visits → 30 Huellas → pay with discount → appears in transparency) works in the browser.
3. **Watch for the real backend**: periodically run `git log feat/ruta-memoria-api --oneline | grep "feat(m4)"`. As soon as it exists: `git merge feat/ruta-memoria-api` into your branch, run the server (`npm install && npm run setup && npm run dev:server` at the repo root — read Devin's README/PROGRESS for the exact commands), set `VITE_API_MOCK=false`, and run the whole flow against real testnet. Fix any shape mismatch on your side; log real mismatches as "Contract requests".

## Milestones
| | Deliverable | Done when |
|---|---|---|
| M5 | `/` Home (map + progress + Huellas balance), `/v/:stopId?c=CODE` Stop (transparent onboarding, sign visit, register), `/recorrido` Journey (visits with links, balances, "Cómo canjear", backup key), `/pagar?m&monto&ref` Pay (breakdown **before** signing, toggle discount, confirm) | Full flow works in a mobile browser (first with mock, then real) |
| M6 | `/comercio/:id` Cash register (amount → "Generar cobro" → big QR of the `/pagar` URL with a random 8-char `ref` → poll `/api/merchants/:id/payments` every 3 s → "✓ Pago recibido" + tx link), `/transparencia` | Register detects payment in < 5 s; transparency totals are right. **Transparency is the pitch screen: it must look impeccable.** |
| M8 | Polish: human error messages, loading states, empty states, `/acerca`, accessibility checklist | SPEC §9.3 checklist passes |

## Wallet (`web/src/lib/wallet.js`, SPEC §9.2)
- `Keypair.random()` on first use; secret in `localStorage` key `rmm_secret`, every access in try/catch (private mode must not crash — fall back to in-memory and warn).
- Onboarding: `POST /api/onboard/build` → `TransactionBuilder.fromXDR(xdr, Networks.TESTNET)` → sign with the visitor keypair → `POST /api/onboard/submit`. Handle `alreadyOnboarded`.
- Visit signature: `keypair.sign(Buffer.from(\`visita:${stopId}:${ts}\`)).toString("base64")`. Send geolocation if granted; if denied send `null` (server skips in DEMO_MODE).
- In `DEMO_MODE`, on `/recorrido` and `/pagar` show a discreet "Cargar saldo de prueba" button → `POST /api/demo/fund` when USDC balance is 0.
- **The secret key never leaves the browser.** Never auto-sign a payment: the user always sees the breakdown and taps "Confirmar pago".

## Tone and design — NON-NEGOTIABLE (SPEC §9.3)
- **This is a memorial, not a game.** Forbidden: "¡Ganaste!", levels, achievements, rankings, confetti, victory sounds, war emojis, weapons/combat imagery, AI-generated soldiers.
- All visible text in **Rioplatense Spanish**, sober and respectful. Vocabulary: "registrar visita", "Huellas", "recorrido", "veteranos", "caídos". Huellas = "el registro de tu paso por cada lugar de memoria".
- Visual: light background, highly legible typography, soft celeste as a subtle accent, no military aesthetic.
- Accessibility: many veterans are 60+. Base text **18 px**, AA contrast, buttons ≥ **48 px** tall, simple language, visible focus states, real `<button>`/`<label>`.
- Mobile-first; must run well on a mid-range Android on mobile data (keep the bundle small, lazy-load the map).
- Placeholder content (strings starting with `[`) renders visibly in a grey "Contenido en preparación" box — never hidden, never filled with invented text.
- Never claim official participation of the veterans' center: use the `centroLabel` from `/api/config` ("Centro de Veteranos (cuenta de demostración)").
- Every tx shows a "Ver en Stellar" link built from `explorerTxUrl`.

## Out of scope (SPEC §14)
NFTs, rankings, profiles, email/social login, Soroban, mainnet, admin panel, i18n, notifications, peso conversion, native app, in-app QR reader, analytics.

## Verification (lean — hackathon)
- `npm --prefix web run build` must pass with no errors at every commit.
- Walk the full flow in the browser at mobile width (375 px) at each milestone; with the real backend once M4 lands.
- No test framework required.

When everything is done, stop and print a summary: screens done, whether it ran against the real backend, open "Contract requests", and anything blocked.
