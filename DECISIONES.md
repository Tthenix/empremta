# DECISIONES

- Persistencia: SQLite con `better-sqlite3`; ruta configurable por `DB_PATH` (default `./data/app.sqlite`) según decisión del equipo.
- Durante la noche: `USDC_MODE=mock` y `DEMO_MODE=true`.
- Deploy objetivo: Railway con volumen montado en `/data` y `DB_PATH=/data/app.sqlite`.
- Firma de visitas: `@stellar/stellar-sdk` v17 devuelve `Uint8Array` en `keypair.sign`; la codificación base64 canónica es `Buffer.from(signatureBytes).toString("base64")`. No cambia el contrato, solo evita el valor incorrecto de `Uint8Array.toString()`.
