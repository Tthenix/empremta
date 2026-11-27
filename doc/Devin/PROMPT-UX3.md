# Devin — UX round 3: brand integration + visual quality

The app is live (https://empremta-production.up.railway.app) and the full flow was validated end to end by a human on a phone. The project now has an official brand: **Empremta** ("huellas de Malvinas en Mendoza"). Work unattended; decide, log in `DECISIONES.md`, keep going.

Branch: `feat/ux-round3` (checked out). Conventional Commits, **no AI attribution / Co-Authored-By lines**, do not push, do not touch `main`.

## Read first
1. `SPEC.md` §9 (screens, tone, accessibility) and §15 (hard rules). `web/UX-AUDIT.md` (previous round — don't redo what's done).
2. `doc/brand/LEEME.md` — brand rules and palette: Azul tinta `#1F4E79`, Celeste islas `#6CACE4`, Celeste on dark `#9CC9EE`, secondary text `#4A5866`, mono `#16202A`. Typeface **Archivo** (SIL OFL, Google Fonts). Never deform/rotate the logo, never change the islands' celeste, never put the isotype over busy photos.
3. Skills (read fully, apply): `C:\Users\Rufda\.claude\skills\impeccable\SKILL.md`, `C:\Users\Rufda\.claude\skills\ux-motion\SKILL.md`, `C:\Users\Rufda\.claude\skills\frontend-a11y\SKILL.md`, `C:\Users\Rufda\.claude\skills\frontend-design-direction\SKILL.md`.

## Allowed edit surfaces
- `web/**` **except `web/src/pages/Merchant.jsx`** (another agent is fixing the cash register right now — do not touch it).
- `DECISIONES.md`, `PROGRESS.md`, `web/UX-AUDIT.md`.
- Never touch `server/**`, `scripts/**`, `content/**`, `doc/API_CONTRACT.md`.

## Goals, by impact
1. **Brand system in CSS**: move the palette into CSS custom properties (tokens) and apply it consistently (buttons, links, focus ring, progress bar, cards). Headings in **Archivo** (self-host or Google Fonts with `display=swap`; keep body text highly legible). Keep AA contrast — verify every text/background pair numerically and list them in `web/UX-AUDIT.md`.
2. **Home hero**: introduce the brand with dignity — the vertical or isotype logo (`web/public/brand/`, more variants in `doc/brand/svg/`), one sentence of purpose, clear primary action. Memorial tone: calm, no marketing hype.
3. **Transparency** (pitch screen): make it look impeccable with the brand palette; the big number must read instantly from 3 m away on a projector.
4. **Consistency pass** on Stop, Journey, Pay, About: spacing scale, button hierarchy (one primary per screen), empty/loading/error states with the same visual language.
5. **Motion**: subtle only, `prefers-reduced-motion` respected, nothing celebratory.

## Hard rules
Memorial, not a game: no "¡Ganaste!", levels, badges, confetti, rankings, war emojis, military aesthetic, AI images of soldiers. Never invent historical content; keep placeholders visible. Keep "Centro de Veteranos (cuenta de demostración)". Base text 18 px, buttons ≥ 48 px, visible focus, mobile-first (375 px, mid-range Android).

## Verification before finishing (mandatory)
- `npm run build` passes.
- Run the server (`npm start` after build) and walk every screen at 375 px and desktop; no horizontal overflow.
- `npm run e2e -- --http` still passes (server running). Summarize in `PROGRESS.md`.
- `git status` clean.

Print a short summary when done: what changed per screen, contrast table location, e2e result.
