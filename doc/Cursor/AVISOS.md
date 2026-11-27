# Cursor — when the human has to step in

Worktree: `C:\Users\Rufda\orca\workspaces\empremta\ruta-web` (branch `feat/ruta-memoria-web`)
Model: the strongest Claude in Cursor's picker (Opus > Sonnet), Agent mode, auto-run terminal commands ON.

1. **Kickoff** — open that folder in Cursor, Agent chat, paste:
   `Read doc/Cursor/PROMPT.md and execute it end to end without stopping to ask. Start now.`
2. **If it stops and asks "should I continue?"** — paste:
   `Continue with the next milestone in doc/Cursor/PROMPT.md. Don't ask, decide and log it.`
3. **When Devin lands M4** (`git log feat/ruta-memoria-api --oneline` shows `feat(m4)`) and Cursor hasn't noticed — paste:
   `Devin's feat(m4) is in. Do step 3 of "Work in parallel with a mock": merge feat/ruta-memoria-api, run the real server and switch VITE_API_MOCK=false.`
4. **If the context fills up / new chat** — paste:
   `Read doc/Cursor/PROMPT.md and web/DECISIONES-WEB.md, check git log, and continue from the last unfinished milestone.`
5. **End** — when Cursor commits `feat(m8)`, Devin does the final merge. Nothing else needed from Cursor.
