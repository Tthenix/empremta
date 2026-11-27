# DECISIONES

- Persistencia: SQLite con `better-sqlite3`; ruta configurable por `DB_PATH` (default `./data/app.sqlite`) según decisión del equipo.
- Durante la noche: `USDC_MODE=mock` y `DEMO_MODE=true`.
- Deploy objetivo: Railway con volumen montado en `/data` y `DB_PATH=/data/app.sqlite`.
- Firma de visitas: `@stellar/stellar-sdk` v17 devuelve `Uint8Array` en `keypair.sign`; la codificación base64 canónica es `Buffer.from(signatureBytes).toString("base64")`. No cambia el contrato, solo evita el valor incorrecto de `Uint8Array.toString()`.
- Runtime: Node 22.12+ dentro de la familia “Node 20+” moderna. La versión vigente de `@stellar/stellar-sdk` (17.x) y `better-sqlite3` (13.x) exige Node 22; usar versiones viejas compatibles con Node 20 arrastraba vulnerabilidades de `axios`/`toml`.
- Compatibilidad de firma: el backend acepta también la serialización errónea `Uint8Array.toString()` (lista de bytes separada por comas) porque la primera integración web usaba ese formato; la verificación criptográfica sigue siendo la misma y el contrato sigue pidiendo base64.
- UX noche 2: se priorizó legibilidad y evidencia sobre decoración. `/transparencia` usa una tarjeta de total sobria, lista de pagos en lugar de tabla y montos exactos con decimales significativos para que las partes sumen visualmente.
- UX noche 2: se mantuvo “Centro de Veteranos (cuenta de demostración)” y los placeholders históricos visibles. No se agregaron relatos ni nombres porque las fuentes todavía requieren validación humana.
- UX noche 2: el acento celeste se oscureció a `#356e8e` (contraste medido 5.27:1 sobre fondo y 5.57:1 sobre blanco) y los controles/links principales quedaron con altura mínima de 48 px.
- UX noche 2: el SDK de Stellar se carga dinámicamente dentro del límite `web/src/lib/api.js` y las rutas secundarias se dividieron con `React.lazy`, sin cambiar formas del contrato ni código de `server/`.
- Validación: `doc/research/VALIDACION-PREP.md` registra solo datos públicos con URL; los datos no confirmados quedan marcados como “no verificado” y la discrepancia 15/16 de caídos mendocinos queda pendiente de validación humana.
