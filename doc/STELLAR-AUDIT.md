# Auditoría Stellar contra las skills oficiales del SDF

Auditoría de la integración clásica de Stellar en testnet, comparada con las skills oficiales `assets`, `dapp`, `data`, `standards` y la parte USDC de `cross-chain`. Cuando una recomendación general choca con `SPEC.md`, gana el SPEC: solo testnet, solo operaciones clásicas, sin Soroban y sin exposición de la secreta del visitante.

**Resultado:** 8 áreas OK, 7 mejoras identificadas (5 corregidas, 2 diferidas), 1 riesgo aceptado/diferido. Esta auditoría sirve como evidencia de pitch: la integración fue revisada contra las skills oficiales de Stellar.

| Área | Recomendación oficial (cita + skill) | Qué hace este repo | Veredicto | Acción |
|---|---|---|---|---|
| Onboarding patrocinado | “Handle trustline creation in onboarding flow” y “Monitor for frozen/deauthorized status” (`assets/SKILL.md`, Best Practices) | `beginSponsoringFutureReserves` → `createAccount` → trustlines HUELLA/USDC → `setTrustLineFlags` → `endSponsoringFutureReserves` en una sola transacción (`server/stellar.js:133-154`); la cuenta queda con 0 XLM y reservas patrocinadas. | OK | Sin cambio. La atomicidad evita estados parciales. |
| Reintentos de onboarding/pago | “Prevent double-submission while processing” y manejar timeout/expiración (`dapp/SKILL.md`, Transaction UX Checklist) | El hash se guarda 5 min y se borra tras éxito (`server/stellar.js:25-69`), pero un `tx_bad_seq`, timeout o 5xx podía ser ambiguo si Horizon ya había aceptado la transacción. | improve | **Corregido:** tras error ambiguo se consulta el hash en Horizon antes de reportar fracaso (`server/stellar.js:160-182`); no se reenvía ciegamente. |
| Fees y fee-bump | Los ejemplos usan `fee: StellarSdk.BASE_FEE` y fee por operación (`dapp/SKILL.md`, Transaction Building) | Inner payment usa 100 stroops/op y el fee-bump 1000 stroops/op (`server/stellar.js:313`, `server/stellar.js:346-353`); onboarding/mint/demo usan 1000 como techo (`server/stellar.js:145`, `209`, `232`). | OK | Sin cambio. El fee es techo por operación y 1000 = 10× el inner, suficiente para el patrón de fee-bump en testnet. |
| Surge pricing | “Use exponential backoff for retries” y considerar congestión/rate limits (`data/SKILL.md`, Rate Limiting) | No se consulta `feeStats`; la fee es fija. En testnet el base fee observado era 100 y la capacidad baja, pero en congestión podría aparecer `tx_insufficient_fee`. | improve | **Diferido:** fees dinámicas agregan otra dependencia de Horizon antes de firmar y pueden encarecer la demo. Se mitigó con mensaje específico para `tx_insufficient_fee` (`server/errors.js:32-34`). |
| Timebounds / expiración | Los ejemplos construyen con `.setTimeout(180)` (`dapp/SKILL.md`, Transaction Building) | Todas las transacciones usan `.setTimeout(300)` (`server/stellar.js:154`, `218`, `241`, `337`), coherente con el TTL de 5 min del guard. | OK | Sin cambio. `tx_too_late`/`tx_timeout` ya se traducen a error humano. |
| Flags del emisor | `AUTH_REQUIRED`, `AUTH_REVOCABLE` y autorización con `setTrustLineFlags` (`assets/SKILL.md`, Asset Flags / Authorize Trustline) | Setup configura ambos flags antes de operar trustlines (`scripts/setup-testnet.js:169-180`) y el onboarding autoriza HUELLA (`server/stellar.js:152`). | OK | Sin cambio. |
| Revocación | `AUTH_REVOCABLE` permite “freeze user balances” (`assets/SKILL.md`, Flag Descriptions) | CLI clásico `setTrustLineFlags({ authorized: restore })` (`scripts/revocar-huellas.js:60-64`); la API consulta la última operación de flags en Horizon (`server/transparency.js:121-135`). | OK | Sin cambio. No hay panel web nuevo. |
| Clawback | `AUTH_CLAWBACK_ENABLED` permite recuperar tokens (`assets/SKILL.md`, Flag Descriptions / Clawback Tokens) | No está habilitado; SPEC lo marca opcional. Revocar congela uso/recepción, pero no retira Huellas ya emitidas. | improve | **Diferido:** activarlo ahora no corrige trustlines existentes sin migración operativa y agrega poder del emisor que la demo no necesita. Queda en Próximos pasos. |
| SEP-1 y `home_domain` | “Publish stellar.toml with asset metadata” (`assets/SKILL.md`, Best Practices); SEP-0001 es el estándar de `stellar.toml` (`standards/SKILL.md`) | Antes no existía metadata SEP-1 ni vínculo de dominio. | improve | **Corregido:** se sirve `/.well-known/stellar.toml` con CORS `*` (`server/app.js:47-54`, `server/stellarToml.js:25-56`) y se agrega script manual `npm run home-domain` (`scripts/set-home-domain.js`). **No se ejecutó contra el issuer.** |
| Guard “server solo firma XDR construido por él” | “Prevent double-submission” y mostrar destino/monto antes de firmar (`dapp/SKILL.md`, Transaction UX Checklist) | Hash del XDR parseado con passphrase testnet debe existir en el Map interno, con kind y TTL correctos (`server/stellar.js:52-65`); se elimina tras éxito. | OK | Sin cambio estructural. La recuperación por hash reduce falsos fracasos sin aceptar XDR ajeno. |
| Split de pago y memos | Los ejemplos usan amounts string y memo/UX explícita (`dapp/SKILL.md`, Transaction Building) | BigInt/stroops, floor al centro y complemento al comercio; invariante `toCentro + toMerchant === total` (`server/stellar.js:248-277`); memo `pago:<ref8>` dentro de 28 bytes (`server/stellar.js:336`). | OK | Sin cambio. |
| Validación de saldo antes de firmar | La UX debe manejar fondos insuficientes con mensajes claros (`dapp/SKILL.md`, Transaction UX Checklist) | Antes la falta de USDC se descubría después de firmar, al fallar la operación. | improve | **Corregido:** `buildPayment` rechaza antes si el saldo USDC es menor que el total (`server/stellar.js:301-309`). La carrera on-chain sigue cubierta por `op_underfunded`. |
| Horizon: paginación y cache | La paginación oficial usa `page.next()` (`data/horizon.md`, Pagination); “Cache responses where appropriate” (`data/SKILL.md`, Rate Limiting) | Transparencia usa `limit(200)`, `page.next()`, tope defensivo de 50 páginas y cache de 20 s (`server/transparency.js:6-39`, `55-83`). | OK | Sin cambio. El tope evita loops y degrada explícitamente a `db-fallback`. |
| Horizon: timeouts, retries y errores | “Use exponential backoff for retries” (`data/SKILL.md`, Rate Limiting) y parsear `extras.result_codes` (`data/SKILL.md`, Error Handling) | Antes las lecturas no tenían timeout global ni backoff; los errores de red se informaban como rechazo de Stellar. | improve | **Corregido:** timeout de lectura 10 s, retry solo para 429/5xx/red con backoff (`server/horizon-utils.js:6-39`); paginación/cuentas lo usan; errores de red quedan `HORIZON_UNAVAILABLE` y se agregan códigos de fee/exists (`server/errors.js:15-40`). |
| Wallet del navegador | La UX debe contemplar red incorrecta, firma y rechazo (`dapp/SKILL.md`, Transaction UX Checklist) | La secreta se genera y firma solo en el navegador, con passphrase testnet (`web/src/lib/wallet.js:61-65`); no sale al server. Pero se almacena cruda en `localStorage` (`web/src/lib/wallet.js:4-38`). | risk | **Diferido:** endurecer storage con claves no exportables o wallet externa cambia la UX de onboarding sin wallet. Riesgo XSS documentado; para la demo se compensa con CSP/alcance reducido, pero no se construyó aquí. |
| USDC mock/circle | “Classic Stellar recipients need a trustline first” (`cross-chain/SKILL.md`, Pitfalls) y validar issuer, no solo code (`assets/SKILL.md`, Security) | Circle testnet usa el issuer oficial del SPEC y todas las cuentas relevantes abren trustline (`scripts/setup-testnet.js:181-199`); los montos se convierten a stroops BigInt. Antes un typo en `USDC_MODE` caía silenciosamente a mock y podía etiquetarse mal. | improve | **Corregido:** server y setup rechazan cualquier `USDC_MODE` distinto de `mock`/`circle` (`server/config.js:9-12`, `scripts/setup-testnet.js:139-141`). |

## SEP-1 publicado

`GET /.well-known/stellar.toml` publica:

- `NETWORK_PASSPHRASE` de testnet.
- cuentas controladas por la demo.
- `[DOCUMENTATION]` de Empremta como **cuenta de demostración**, sin afirmar aval oficial de ningún centro de veteranos.
- `[[CURRENCIES]]` para HUELLA con `status = "test"`, `display_decimals = 0`, `is_unlimited = true` y condiciones de no redimibilidad.

Para vincular el issuer, un humano debe elegir un dominio corto (máx. 32 bytes) que sirva ese mismo `stellar.toml` por HTTPS y ejecutar manualmente:

```bash
npm run home-domain -- --domain <dominio-corto>
```

El script valida testnet, formato y que `ISSUER_SECRET` corresponda a `ISSUER_PUB`; no se ejecutó durante esta auditoría.

## Próximos pasos (no construidos)

1. **Off-ramp SEP-24:** evaluar un anchor real y el flujo hosted interactivo (`standards/SKILL.md` mapea SEP-0024 para fiat rails). Es integración grande, con KYC y operación externa.
2. **Migración a clawback:** decidir política de emisión, habilitar flag solo con plan para trustlines existentes y documentar poderes del emisor.
3. **Wallet hardening:** evaluar WebCrypto/claves no exportables o integración de wallet sin romper el onboarding sin fricción.
4. **Fees dinámicas:** usar `feeStats` con techo operativo y cache corto si la demo se expone a congestión real.
5. **Separación issuer/distribuidor y multisig:** recomendable para producción (`assets/SKILL.md` lo lista como best practice), pero incompatible con la simplicidad de cuentas exigida por esta demo.
6. **Verificación cliente del XDR:** mostrar/verificar operaciones parseadas del XDR además del desglose del server, para reducir confianza en el backend.

## Verificación

- `npm run build`: PASS (Vite producción; solo avisos de auditoría npm de severidad baja ya existentes).
- `npm run e2e -- --http`: PASS (`M1+M2+M3+M4+F1+F2 HTTP OK`), incluidas onboarding patrocinado, 3 visitas, fondeo demo, pago atómico con fee-bump, revocación/restauración, transparencia on-chain y contrato SEP-1.
- Hash del pago e2e de la corrida final: `190b379b174ef9c88fecc28b69295f544f348478f14e227ca6e43df851a5fa50`.
