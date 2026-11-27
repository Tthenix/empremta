# Decisiones — Frontend (web)

## Contract requests

_(none yet)_

## Decisions

1. **Mock codes for stops** — until the backend exposes QR codes, the mock accepts any non-empty `c` query param (≥ 8 chars). Real QR codes from `generate-qr.js` will work once M4 lands.
2. **Map lazy-load** — `StopMap` is a separate chunk via `React.lazy` to keep the initial bundle smaller on mobile data.
3. **Font** — Source Sans 3 via Google Fonts (single family) for legibility at 18 px without a heavy type stack.
4. **PWA** — `manifest.webmanifest` + SVG icons only; no service worker (per SPEC).
5. **Buffer** — `vite-plugin-node-polyfills` plus an explicit `Buffer` assign in `main.jsx` for Stellar SDK.
