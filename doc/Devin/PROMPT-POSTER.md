# Devin — Match the approved stop poster design + brand symbol on Home

The team approved a poster design: `doc/brand/cartel-referencia.pdf` (A4, print) — a screenshot of its top part is `doc/brand/cartel-referencia.png`. Replicate it in our generator and bring its symbol to the Home screen. Work unattended; decide, log in `DECISIONES.md`, keep going.

Branch: `feat/poster-design` (checked out). Conventional Commits, **no AI attribution / Co-Authored-By lines**. Do not push, do not touch `main`.

## Allowed edit surfaces
`scripts/generate-qr.js`, `web/src/pages/Home.jsx`, `web/src/index.css`, `web/public/**`, `doc/brand/**`, `README.md`, `DEMO.md`, `PROGRESS.md`, `DECISIONES.md`, `package.json`/`package-lock.json` (only if a dependency is truly needed — justify it).

## 1. Poster (`dist/qr/carteles-ruta-memoria.pdf`), one A4 page per stop, matching the reference
Top to bottom, centered, generous white space:
1. **Horizontal logo** (`doc/brand/png/empremta-horizontal-color.png`, or the SVG rasterized) — "empremta · huellas de Malvinas en Mendoza".
2. **Stop name**, large, bold, dark ink `#16202A` (e.g. "Memorial Malvinas Argentinas").
3. **Place** in secondary text `#4A5866`, with " · " separators (e.g. "Parque Central · Ciudad de Mendoza" — derive from `stop.lugar` by replacing ", " with " · ").
4. **"Escaneá con la cámara de tu celular"** in Azul tinta `#1F4E79`, semi-large and bold.
5. **"Escuchá la historia de este lugar y registrá tu visita."** in secondary text.
6. **The QR inside a rounded-corner frame** (thin `#1F4E79` border, ~16 px radius, white fill, padding):
   - QR modules in **`#1F4E79`** on white (not black), quiet zone kept.
   - **Error correction level H** (required, because of the logo in the middle).
   - **App icon centered** on the QR (`doc/brand/png/empremta-icono-app.png`: white fingerprint on a blue rounded square), size ≤ ~22 % of the QR width, with a small white margin around it.
7. **"o entrá a <url>"** below the frame, where `<url>` is the stop URL without the `https://` scheme. If the full URL (with `?c=` code) is too long to print legibly, print the readable form `empremta-production.up.railway.app/v/<stopId>` and note in DECISIONES.md that typing it shows the story but registering needs the QR (the `c` code).
8. Footer separated by a thin rule, small text: "Empremta · Huellas de Malvinas en Mendoza" · "Centro de Veteranos (cuenta de demostración)" · "Registro verificable en la red Stellar".

Fonts: Archivo if you can embed it (SIL OFL — download the TTF into `doc/brand/fonts/` and register it in pdfkit); otherwise Helvetica-Bold/Helvetica. Keep AA contrast.

**Must keep:** the localhost guard (`--allow-local`), the existing `qr-paradas-ruta-memoria.pdf` and PNG outputs (you may also apply the blue + center-icon style to the PNGs if every QR still decodes).

**Mandatory check:** every generated QR must still decode to the exact stop URL. Decode them programmatically (e.g. `jsqr` + `pngjs` as devDependencies, or another reliable decoder) in a small `scripts/verify-qr.js`, run it, and paste the result in PROGRESS.md. If a QR with the center icon does not decode, shrink the icon until it does.

Generate the final files with `PUBLIC_BASE_URL=https://empremta-production.up.railway.app npm run qr`.

## 2. Home: use the app symbol
In `web/src/pages/Home.jsx`, the hero card currently shows the isotype. Replace it with the **app icon** (`/icons/app-icon.svg`, already in `web/public/icons/`) — the white fingerprint on the blue rounded square, the same symbol as in the center of the poster QR — at a dignified size (~96–120 px), keeping the explanatory sentence about the islands' outline. Subtle, no animation beyond what `prefers-reduced-motion` allows. Do not change other screens.

## Verification before finishing (mandatory)
- `npm run build` passes.
- `node scripts/verify-qr.js` decodes all QRs to the production URLs.
- Start the server, check `/` at 375 px and desktop (no overflow), and run `npm run e2e -- --http` (must pass).
- `git status` clean.

Print a short summary when done.
