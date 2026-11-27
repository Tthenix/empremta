# Ruta de la Memoria — Frontend (PWA)

React + Vite app for the Malvinas memory route (hackathon FLAT 2026).

## Run

```bash
cd web
cp .env.example .env   # VITE_API_MOCK=true by default
npm install
npm run dev
```

Open `http://localhost:5173`. With mock mode, the full visitor → 3 visits → pay → transparency flow works without the API.

When the API (`feat(m4)`) is ready:

1. Merge `feat/ruta-memoria-api` into this branch
2. Set `VITE_API_MOCK=false`
3. Run the server on port 3000 (Vite proxies `/api`)

## Screens

| Path | Role |
|------|------|
| `/` | Home + map + progress |
| `/v/:stopId?c=CODE` | Stop + register visit |
| `/recorrido` | Journey, balances, backup key |
| `/pagar?m&monto&ref` | Pay with breakdown |
| `/comercio/:id` | Merchant cash register + QR |
| `/transparencia` | Public totals |
| `/acerca` | About |

Decisions and contract requests: `DECISIONES-WEB.md`.
