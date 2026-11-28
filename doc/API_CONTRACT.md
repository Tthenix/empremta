# API Contract (frozen — shared by Devin and Cursor)

Source of truth for request/response shapes of SPEC.md §8. Devin implements it in `server/`; Cursor consumes it from `web/` (with a mock until Devin's `feat(m4)` commit lands).
Changing a shape requires updating this file in the same commit and noting it in `DECISIONES.md`.

All amounts are **strings** with up to 7 decimals (e.g. `"2.5000000"` or `"2.50"`). All errors are:

```json
{ "error": { "code": "INSUFFICIENT_BALANCE", "message": "No tenés saldo suficiente" } }
```

with HTTP 4xx/5xx. `message` is already human-readable Rioplatense Spanish; the UI shows it as-is.
Known codes: `INVALID_INPUT`, `INVALID_SIGNATURE`, `EXPIRED`, `INVALID_CODE`, `TOO_FAR`, `ALREADY_VISITED`, `HASH_MISMATCH`, `INSUFFICIENT_BALANCE`, `NOT_ONBOARDED`, `ALREADY_FUNDED`, `ALREADY_PAID`, `DEMO_DISABLED`, `ACCOUNT_REVOKED`, `ALREADY_ONBOARDED`, `HORIZON_ERROR`, `HORIZON_UNAVAILABLE`, `RATE_LIMITED`, `NOT_ENOUGH_VISITS`, `NOT_FOUND`.

## GET /api/config
```json
{ "network": "testnet", "usdcMode": "mock", "usdcLabel": "USDC (prueba)",
  "usdcAsset": { "code": "USDC", "issuer": "G..." },
  "huellaAsset": { "code": "HUELLA", "issuer": "G..." },
  "demoMode": true, "huellasPorVisita": 10, "costoCanje": 30,
  "descuentoPct": 10, "descuentoMaxUsdc": "1",
  "arsPerUsdc": "1400", "aportePct": null, "descuentoMaxArs": "2000", "maxTicketArs": "50000",
  "explorerTxUrl": "https://stellar.expert/explorer/testnet/tx/",
  "explorerAccountUrl": "https://stellar.expert/explorer/testnet/account/",
  "centroLabel": "Centro de Veteranos (cuenta de demostración)",
  "centroPub": "G..." }
```

## GET /api/stops
```json
[ { "id": "pc", "nombre": "...", "lugar": "...", "lat": -32.877, "lng": -68.846,
    "coordsVerificadas": false, "foto": "/fotos/pc.jpg", "fotoAlt": "...",
    "fotoCredito": "Foto: ...", "fotoFuente": "https://...", "audio": null } ]
```
(no `historia`, never `code`; `foto*` may be `null`. Wherever the photo is shown, the UI shows `fotoCredito` linked to `fotoFuente`.)

## GET /api/stops/:id
Same object plus `"historiaCorta"`, `"historiaLarga"`, `"fuentesLugar"` (`[{ "label", "url" }]`), `"historia"`, `"fuente"`, `"fuenteUrl"`. Placeholders start with `[` — the UI renders them in a grey "Contenido en preparación" box.

## POST /api/onboard/build
Req `{ "publicKey": "G..." }` → `{ "xdr": "AAAA..." }`.
If the account already exists and is onboarded → `200 { "alreadyOnboarded": true }`.
New sponsored accounts are limited per client IP per UTC day (`MAX_NEW_WALLETS_PER_IP_PER_DAY`, default 5); excess → 429 `RATE_LIMITED`. Loopback clients are exempt so the local e2e can create fresh wallets.

## POST /api/onboard/submit
Req `{ "signedXdr": "AAAA..." }` → `{ "txHash": "abc..." }`

## POST /api/visit
Req `{ "publicKey", "stopId", "code", "lat": number|null, "lng": number|null, "ts": number (ms epoch), "signature": "base64" }`
Signed message: `visita:${stopId}:${ts}` (UTF-8). Implementation note: stellar-sdk v17 returns `Uint8Array` from `keypair.sign`; encode with `Buffer.from(signatureBytes).toString("base64")` before sending.
→ `{ "txHash": "...", "huellas": "30.0000000" }` (`huellas` = new balance)
A suspended HUELLA trustline → 403 `ACCOUNT_REVOKED` with message `Esta cuenta fue suspendida por el Centro de Veteranos`.

## GET /api/account/:pub
```json
{ "exists": true, "onboarded": true, "huella": "20.0000000", "usdc": "5.0000000", "xlm": "0.0000000",
  "visits": [ { "stopId": "pc", "txHash": "...", "createdAt": 1764200000000 } ],
  "demoFunded": true }
```
Unknown account → `{ "exists": false, "onboarded": false, "huella": "0", "usdc": "0", "xlm": "0", "visits": [], "demoFunded": false }`

## POST /api/pay/build
Req `{ "publicKey", "merchantId": "m1", "amount": "2.50", "ref": "AB12CD34", "useHuellas": true }`
```json
{ "xdr": "AAAA...",
  "desglose": { "amount": "2.5000000", "discount": "0.2500000", "total": "2.2500000",
                "toMerchant": "2.1375000", "toCentro": "0.1125000",
                "huellasBurned": 30, "pctCentro": 5,
                "merchant": { "id": "m1", "nombre": "..." } } }
```
`useHuellas: true` requires the same wallet to have at least `costoCanje / huellasPorVisita` distinct visits recorded in the application DB; otherwise → 400 `NOT_ENOUGH_VISITS` (`Te faltan lugares por visitar para canjear`). With enough visits but insufficient Huellas → discount `"0"`, `huellasBurned: 0` (not an error).
`useHuellas: true` from a suspended HUELLA trustline → 403 `ACCOUNT_REVOKED` with the same human message as `/api/visit`.

## POST /api/pay/submit
Req `{ "signedXdr": "AAAA..." }` → `{ "txHash": "...", "desglose": { ...same as build } }`
Both `/api/pay/build` and `/api/pay/submit` return 409 `ALREADY_PAID` when that merchant already received a payment with the same `ref`.


## POST /api/redeem/build
Req `{ "publicKey", "merchantId": "m1", "amountArs": "10000", "ref": "AB12CD34" }` for the primary canje flow. The visitor pays the merchant outside the app; this transaction only burns Huellas and makes the merchant fund the Centro.
`amountArs` above `MAX_TICKET_ARS` (default 50000) → 400 `INVALID_INPUT` ("El monto supera el máximo permitido para un canje"). Revocation is checked again at submit.
```json
{ "xdr": "AAAA...",
  "desglose": { "amountArs": "10000.00", "discountArs": "1000.00", "totalArs": "9000.00",
                "aporteUsdc": "0.3214285", "arsPerUsdc": "1400", "aportePct": 5,
                "huellasBurned": 30, "merchant": { "id": "m1", "nombre": "..." } } }
```
The built classic transaction has source `publicKey`, memo `canje:<ref>`, a HUELLA payment of `costoCanje` to the issuer (burn), and a USDC payment to `centroPub` whose operation source is the merchant account. ARS→USDC conversion uses integer scaled arithmetic and floors to 7 decimals. Amounts producing a zero contribution → `INVALID_INPUT`. Missing own visits → 400 `NOT_ENOUGH_VISITS`; insufficient HUELLA → `INSUFFICIENT_BALANCE`; insufficient merchant USDC → `MERCHANT_NO_FUNDS`; duplicate merchant `ref` → 409 `ALREADY_PAID`.

## POST /api/redeem/submit
Req `{ "signedXdr": "AAAA..." }` → `{ "txHash": "...", "desglose": { ...same as build } }`. The server accepts only the exact hash it built, co-signs as custodial merchant, issuer fee-bumps, and persists the redemption atomically after submission.

## GET /api/merchants/:id/redemptions?since=<ms epoch, optional>
`[ { "txHash", "ref", "amountArs", "discountArs", "aporteUsdc", "huellasBurned", "createdAt" } ]`, newest first.

## GET /api/merchants
`[ { "id": "m1", "nombre": "...", "direccion": "...", "pctCentro": 5, "lat": null, "lng": null, "pub": "G..." } ]`

## GET /api/merchants/:id/payments?since=<ms epoch, optional>
`[ { "txHash", "ref", "amount", "discount", "toMerchant", "toCentro", "huellasBurned", "createdAt" } ]` newest first.
The cash register polls every 3 s and matches by `ref`.

## GET /api/transparencia
```json
{ "totalCentro": "12.3400000", "pagos": 7,
  "porComercio": [ { "merchantId": "m1", "nombre": "...", "totalCentro": "8.0000000", "pagos": 4 } ],
  "lista": [ { "txHash", "merchantId", "nombre", "toCentro", "createdAt" } ],
  "centroPub": "G...",
  "onChain": { "source": "horizon", "balanceUsdc": "12.3400000", "totalRecibido": "12.3400000",
    "pagos": 7,
    "lista": [ { "txHash", "amount", "from", "createdAt" } ],
    "fetchedAt": 1764200000000 },
  "revocaciones": [ { "pubkey": "G...", "txHash": "...", "createdAt": 1764200000000 } ] }
```

`onChain` is optional and additive. When Horizon cannot be read it is:

```json
{ "source": "db-fallback", "reason": "No se pudo leer la red Stellar en este momento" }
```

The existing top-level fields always come from the application database and now include both direct USDC payments (`tipo: "pago"`) and merchant-funded redemptions (`tipo: "canje"`, concept `Aporte del comercio por canje`). `onChain` is read from the public ledger: incoming `payment` operations to `centroPub` in the configured USDC asset, summed with integer stroops server-side and cached briefly to respect Horizon rate limits.

`revocaciones` is optional and additive. It contains currently suspended HUELLA trustlines whose latest issuer flag operation on Horizon clears `authorized`; restored accounts disappear after their restore operation becomes the latest one.

## POST /api/demo/fund
Req `{ "publicKey" }` → `{ "txHash": "...", "amount": "5" }` (403 `DEMO_DISABLED`, 409 `ALREADY_FUNDED`)

## GET /.well-known/stellar.toml
Additive non-JSON metadata endpoint. Responds `200 text/plain; charset=utf-8` with `Access-Control-Allow-Origin: *` and a SEP-1 TOML document for testnet: organization marked as demo, accounts controlled by the demo, and the HUELLA currency (`status = "test"`, issuer, display decimals, non-redemption conditions).

## QR / URLs
- Stop QR: `${PUBLIC_BASE_URL}/v/${stopId}?c=${HMAC_SHA256(QR_SECRET, stopId).hex.slice(0,16)}`
- Payment QR: `${PUBLIC_BASE_URL}/pagar?m=${merchantId}&monto=${amount}&ref=${ref}`

