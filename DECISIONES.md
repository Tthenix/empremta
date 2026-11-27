# DECISIONES

- Persistencia: SQLite con `better-sqlite3`; ruta configurable por `DB_PATH` (default `./data/app.sqlite`) según decisión del equipo.
- Durante la noche: `USDC_MODE=mock` y `DEMO_MODE=true`.
- Deploy objetivo: Railway con volumen montado en `/data` y `DB_PATH=/data/app.sqlite`.
