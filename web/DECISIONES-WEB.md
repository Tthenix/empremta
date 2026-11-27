# Decisiones — Frontend (web)

## Contract requests

1. **Document the `ref` format** — the server requires `ref` to be exactly 8 alphanumeric characters (`INVALID_INPUT` otherwise), but `doc/API_CONTRACT.md` only shows the example `AB12CD34`. The cash register already generates compliant refs; please state the rule in the contract.
2. **Optional: drop the comma-separated signature fallback** — `server/visits.js` accepts `"12,34,…"` signatures (commit `c9d6c38`). That format came from a web bug (`Uint8Array.toString('base64')` ignores the encoding in the browser), now fixed in `wallet.js`. The web sends strict base64 per the contract.

## Decisions

1. **Stop codes** — internal links (home, map, journey) open `/v/:stopId` without `c`, to read the story only. The "Registrar mi visita" button appears only when the URL carries the `c` code of the physical QR. The server validates it via HMAC, so a hardcoded code would fail. With the mock, any `c` of 8+ characters works (e.g. `/v/pc?c=12345678`).
2. **Map lazy-load** — `StopMap` is a separate chunk via `React.lazy` to keep the initial bundle smaller on mobile data.
3. **Font** — Source Sans 3 via Google Fonts (single family) for legibility at 18 px without a heavy type stack.
4. **PWA** — `manifest.webmanifest` + SVG icons only; no service worker (per SPEC).
5. **Buffer** — `vite-plugin-node-polyfills` plus an explicit `Buffer` assign in `main.jsx` for Stellar SDK.
6. **Real API by default** — `VITE_API_MOCK` defaults to off (`.env.example` sets `false`), so the production build served by Express always talks to the real API. Set `VITE_API_MOCK=true` only for offline UI work.
7. **Bundle size** — with the real API the main chunk is ~178 kB gzip (was ~133 kB in mock builds, where the minifier dropped the SDK signing paths). Acceptable for now; next lever would be lazy-loading the Stellar SDK on first sign.
8. **Windows install** — `better-sqlite3` ships a `win32-x64` prebuild, but npm still runs `node-gyp rebuild` (needs Visual Studio). Use `npm ci --ignore-scripts` at the root on Windows without build tools.

## Accessibility checklist (SPEC §9.3)

- [x] Base text 18 px
- [x] Soft celeste accent, light background, no military aesthetic
- [x] Buttons ≥ 48 px tall (`.btn` min-height)
- [x] Visible `:focus-visible` outlines
- [x] Real `<button>` / `<label>` controls
- [x] Skip link to main content
- [x] Rioplatense Spanish, sober memorial tone (no game language)
- [x] Placeholder strings shown in grey `Contenido en preparación` boxes
- [x] `centroLabel` from config; never claim official center participation
- [x] Every tx has `Ver en Stellar` link via `explorerTxUrl`
- [x] Loading / empty / human error states on main screens
