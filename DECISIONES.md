# DECISIONES

- Persistencia: SQLite con `better-sqlite3`; ruta configurable por `DB_PATH` (default `./data/app.sqlite`) según decisión del equipo.
- Durante la noche: `USDC_MODE=mock` y `DEMO_MODE=true`.
- Deploy objetivo: Railway con volumen montado en `/data` y `DB_PATH=/data/app.sqlite`.
- Firma de visitas: `@stellar/stellar-sdk` v17 devuelve `Uint8Array` en `keypair.sign`; la codificación base64 canónica es `Buffer.from(signatureBytes).toString("base64")`. No cambia el contrato, solo evita el valor incorrecto de `Uint8Array.toString()`.
- Runtime: Node 22.12+ dentro de la familia “Node 20+” moderna. La versión vigente de `@stellar/stellar-sdk` (17.x) y `better-sqlite3` (13.x) exige Node 22; usar versiones viejas compatibles con Node 20 arrastraba vulnerabilidades de `axios`/`toml`.
- Compatibilidad de firma: el backend acepta también la serialización errónea `Uint8Array.toString()` (lista de bytes separada por comas) porque la primera integración web usaba ese formato; la verificación criptográfica sigue siendo la misma y el contrato sigue pidiendo base64.
