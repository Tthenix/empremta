# API Contract (frozen — shared by Devin and Cursor)

Source of truth for request/response shapes of SPEC.md §8. Devin implements it in `server/`; Cursor consumes it from `web/` (with a mock until Devin's `feat(m4)` commit lands).
Changing a shape requires updating this file in the same commit and noting it in `DECISIONES.md`.

All amounts are **strings** with up to 7 decimals (e.g. `"2.5000000"` or `"2.50"`). All errors are:

```json
{ "error": { "code": "INSUFFICIENT_BALANCE", "message": "No tenés saldo suficiente" } }
```

with HTTP 4xx/5xx. `message` is already human-readable Rioplatense Spanish; the UI shows it as-is.
Known codes: `INVALID_INPUT`, `INVALID_SIGNATURE`, `EXPIRED`, `INVALID_CODE`, `TOO_FAR`, `ALREADY_VISITED`, `HASH_MISMATCH`, `INSUFFICIENT_BALANCE`, `NOT_ONBOARDED`, `ALREADY_FUNDED`, `DEMO_DISABLED`, `HORIZON_ERROR`, `RATE_LIMITED`, `NOT_FOUND`.

## GET /api/config
```json
{ "network": "testnet", "usdcMode": "mock", "usdcLabel": "USDC (prueba)",
  "usdcAsset": { "code": "USDC", "issuer": "G..." },
  "huellaAsset": { "code": "HUELLA", "issuer": "G..." },
  "demoMode": true, "huellasPorVisita": 10, "costoCanje": 30,
  "descuentoPct": 10, "descuentoMaxUsdc": "1",
  "explorerTxUrl": "https://stellar.expert/explorer/testnet/tx/",
  "explorerAccountUrl": "https://stellar.expert/explorer/testnet/account/",
  "centroLabel": "Centro de Veteranos (cuenta de demostración)",
  "centroPub": "G..." }
```

## GET /api/stops
```json
[ { "id": "pc", "nombre": "...", "lugar": "...", "lat": -32.877, "lng": -68.846,
    "coordsVerificadas": false, "foto": null, "audio": null } ]
```
(no `historia`, never `code`)

## GET /api/stops/:id
Same object plus `"historia": "...", "fuente": "..."`. Placeholders start with `[` — the UI renders them in a grey "Contenido en preparación" box.

## POST /api/onboard/build
Req `{ "publicKey": "G..." }` → `{ "xdr": "AAAA..." }`.
If the account already exists and is onboarded → `200 { "alreadyOnboarded": true }`.

## POST /api/onboard/submit
Req `{ "signedXdr": "AAAA..." }` → `{ "txHash": "abc..." }`

## POST /api/visit
Req `{ "publicKey", "stopId", "code", "lat": number|null, "lng": number|null, "ts": number (ms epoch), "signature": "base64" }`
Signed message: `visita:${stopId}:${ts}` (UTF-8).
→ `{ "txHash": "...", "huellas": "30.0000000" }` (`huellas` = new balance)

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
`useHuellas: true` with insufficient Huellas → discount `"0"`, `huellasBurned: 0` (not an error).

## POST /api/pay/submit
Req `{ "signedXdr": "AAAA..." }` → `{ "txHash": "...", "desglose": { ...same as build } }`

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
  "centroPub": "G..." }
```

## POST /api/demo/fund
Req `{ "publicKey" }` → `{ "txHash": "...", "amount": "5" }` (403 `DEMO_DISABLED`, 409 `ALREADY_FUNDED`)

## QR / URLs
- Stop QR: `${PUBLIC_BASE_URL}/v/${stopId}?c=${HMAC_SHA256(QR_SECRET, stopId).hex.slice(0,16)}`
- Payment QR: `${PUBLIC_BASE_URL}/pagar?m=${merchantId}&monto=${amount}&ref=${ref}`
