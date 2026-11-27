# Decisiones — Frontend (web)

## Contract requests

_(none yet)_

## Decisions

1. **Mock codes for stops** — until the backend exposes QR codes, the mock accepts any non-empty `c` query param (≥ 8 chars). Real QR codes from `generate-qr.js` will work once M4 lands.
2. **Map lazy-load** — `StopMap` is a separate chunk via `React.lazy` to keep the initial bundle smaller on mobile data.
3. **Font** — Source Sans 3 via Google Fonts (single family) for legibility at 18 px without a heavy type stack.
4. **PWA** — `manifest.webmanifest` + SVG icons only; no service worker (per SPEC).
5. **Buffer** — `vite-plugin-node-polyfills` plus an explicit `Buffer` assign in `main.jsx` for Stellar SDK.

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
