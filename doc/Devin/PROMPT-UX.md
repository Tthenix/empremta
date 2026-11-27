# Devin — Night shift 2: UX polish + validation research

The app is **live in production** (https://empremta-production.up.railway.app, Railway auto-deploys from `main`). You now own two tasks. Work unattended; do not wait for answers. Decide, log in `DECISIONES.md`, keep going.

Branch: `feat/ux-polish` (already checked out in this worktree). Commit each unit with Conventional Commits (`feat(ux): ...`, `fix(a11y): ...`, `docs(research): ...`). **No AI attribution / Co-Authored-By lines.** Do not push, do not touch `main`.

## Read first
1. `SPEC.md` — especially **§9 (screens, tone, accessibility)**, §10 (content placeholders), §14 (out of scope), §15 (hard rules).
2. Skills (read these files fully before touching UI — they are your design guidelines):
   - `C:\Users\Rufda\.claude\skills\impeccable\SKILL.md` (critique → polish workflow; use its "audit" and "polish" passes)
   - `C:\Users\Rufda\.claude\skills\ux-motion\SKILL.md`
   - `C:\Users\Rufda\.claude\skills\frontend-a11y\SKILL.md`
   - `C:\Users\Rufda\.claude\skills\frontend-design-direction\SKILL.md`
   - `C:\Users\Rufda\.claude\skills\react-patterns\SKILL.md`

## Task A — UX/UI polish (`web/**` only)
Goal: a sober, dignified, highly legible memorial app that a 65-year-old veteran and a tourist both understand without help. Judges score "se entiende cómo usarlo".

1. **Audit first**: run the app (`npm run build && npm start`, or `npm run dev:server` + `npm --prefix web run dev`), walk every screen at **375 px** and at desktop width: `/`, `/v/pc?c=<code from npm run qr output>`, `/recorrido`, `/pagar?m=m1&monto=2.50&ref=TEST1234`, `/comercio/m1`, `/transparencia`, `/acerca`. Write the findings in `web/UX-AUDIT.md` (problem → fix), ordered by impact.
2. **Fix by impact**, in this priority:
   1. `/transparencia` — the pitch screen. Big, calm total for the centro; clear per-merchant breakdown; every payment with "Ver en Stellar"; a one-line explanation of why it's verifiable. Good empty state ("Todavía no hay pagos registrados").
   2. `/pagar` — breakdown must be unmistakable before signing (what goes to the merchant, what goes to the centro), clear loading and success states with tx link.
   3. `/v/:stopId` — the first thing a visitor sees from a QR: the place, the story (or the grey "Contenido en preparación" box), one obvious "Registrar mi visita" button, transparent onboarding with a calm progress message (no crypto jargon).
   4. `/` and `/recorrido` — progress "Visitaste X de 3 lugares", what Huellas are, how to redeem.
   5. `/comercio/:id` — big QR, obvious live state.
3. **Accessibility (non-negotiable)**: base text 18 px, AA contrast (verify numbers), buttons ≥ 48 px, visible focus, semantic HTML, `alt` text, `aria-live` for async status (visit registered, payment received), works with zoom 200 %.
4. **Motion (ux-motion)**: only subtle, purposeful transitions (state changes, loading, confirmation fade). Always respect `prefers-reduced-motion`. **No celebratory animation.**
5. **Tone (SPEC §9.3 — hard rule)**: memorial, not a game. No "¡Ganaste!", levels, badges, confetti, rankings, war emojis, military aesthetic, AI images of soldiers. Never invent historical content; keep placeholders visible. Keep "Centro de Veteranos (cuenta de demostración)".
6. Do **not** change `doc/API_CONTRACT.md` shapes or anything under `server/` for Task A. Keep the bundle small (mid-range Android on mobile data).

## Task B — Validation research (`doc/research/**` only)
Create `doc/research/VALIDACION-PREP.md` (in Spanish, neutral and respectful) with:
1. **Public contacts** of Malvinas veterans organizations in Mendoza (e.g. "Veteranos Unidos por Malvinas de Mendoza", centro/asociación de ex combatientes, provincial/municipal offices of veterans affairs): name, public phone/email/social, address, **and the source URL for each item**. Only information that is publicly published — no private individuals' personal data. If you cannot verify something, write "no verificado" instead of guessing. If you have no web access, say so in the file and leave the section as a checklist of where to look.
2. **Verified facts** about the three memorial sites in SPEC §2 (exact location, what is there), each with its source URL. Do not invent; mark unverified items.
3. **Script for Friday's calls/visits** (short): who we are, what we ask (2–3 stories, permission to publish, one veteran to try the app on Saturday), and the direct question "¿Te parece respetuoso que el registro de visitas se llame 'Huellas'?" with alternatives to offer.
4. **Pitch for one merchant** near Parque Central or Maipú (discount + 5 % to the centro) and a list of what to ask.
5. **External user test protocol** (15 min) aligned with the `VALIDACION.md` template: tasks to give, what to observe, questions to ask after.

## Verification before you finish (mandatory)
- `npm --prefix web run build` passes.
- `npm run e2e -- --http` still passes against testnet with the server running (proves nothing in the flow broke). Paste the result summary in `PROGRESS.md`.
- Manually re-walk every screen at 375 px after your changes.
- `git status` clean, everything committed on `feat/ux-polish`.

When done, print a summary: what changed per screen, audit items left open, e2e result, and the research file path.
