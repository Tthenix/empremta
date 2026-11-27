# SPEC — Ruta de la Memoria de Malvinas · Mendoza

### Hackathon FLAT 2026 (BAF × Stellar) · Entrega: sábado 28/11/2026 23:59 ART

> **Para la IA que construye:** este documento es tu fuente de verdad. Leelo completo antes de escribir código. Guardalo en la raíz del repo como `SPEC.md` (y copiá la sección 0 a `CLAUDE.md` / `AGENTS.md` si tu herramienta lo usa). Trabajás sin supervisión toda la noche: **no esperes respuestas humanas**. Cuando tengas que decidir algo que no está acá, elegí la opción más simple que funcione, anotala en `DECISIONES.md` y seguí.

---

## 0\. Reglas de trabajo para la IA (leer primero)

1. **Orden estricto de hitos** (sección 12). No empieces el frontend lindo antes de que las transacciones de Stellar funcionen de punta a punta desde un script.  
2. **Commit al cerrar cada hito**, con mensaje `M{n}: descripción`. Actualizá `PROGRESS.md` en cada commit: qué anda, qué falta, links de transacciones de prueba en stellar.expert.  
3. **Probá contra testnet de verdad**. Cada hito de Stellar tiene un script de verificación que tiene que imprimir hashes de transacciones exitosas.  
4. **Nunca** uses mainnet. **Nunca** subas secretos al repo (`.env` va en `.gitignore`). **Nunca** mandes la clave secreta del visitante al servidor.  
5. **Nunca inventes contenido histórico**: ni testimonios, ni citas de veteranos, ni biografías de caídos, ni anécdotas. Usá los placeholders de la sección 10\. Esto es una regla ética dura, no de estilo.  
6. Si algo de Stellar te bloquea más de 45 minutos, aplicá el fallback de la sección 13 y anotalo.  
7. JavaScript (ESM), sin TypeScript, para ir rápido. Mantené las dependencias al mínimo.  
8. Todo el texto visible de la app va en **español rioplatense**, con tono sobrio y respetuoso (sección 9.3).

---

## 1\. Contexto de la hackathon (lo que se evalúa)

- **Organizan:** BAF × Stellar, con ToraBlock y FLAT (Festival Latinoamericano de Arte y Tecnología). La sede presencial es el MMAMM (Mendoza).  
- **Ejes:** Arte, Memoria o Territorio. El proyecto tiene que servir a una persona, comunidad o lugar concreto. Este proyecto toca **Memoria \+ Territorio**.  
- **Requisitos obligatorios:**  
  - Una app **funcionando** que haga algo real en Stellar.  
  - Haberla **probado con alguien ajeno al equipo** y documentar lo aprendido (`VALIDACION.md`).  
  - Entrega en Apex antes del sábado 28/11 a las 23:59 ART.  
- **Criterios, 25% cada uno:**  
  1. Problema real: que exista el problema y se entienda para quién se construye.  
  2. Conexión con los ejes, para una comunidad o lugar concreto.  
  3. Producto y validación: que funcione, que se entienda cómo usarlo y que esté probado con un usuario externo.  
  4. Ejecución técnica: que funcione de verdad y que **la integración con Stellar tenga sentido**. **También es el criterio de desempate.**  
- **Premios:** 500 USDC el primer puesto y 300 USDC el segundo.

**Consecuencia de diseño:** Stellar tiene que hacer algo que **no se pueda reemplazar por una base de datos** sin perder la propuesta. En este proyecto eso es el **flujo de plata transparente y atómico hacia los veteranos** y el **asset emitido y controlado por el centro de veteranos**.

---

## 2\. Problema y comunidad

- **Comunidad:** los veteranos de Malvinas de Mendoza. Según declaraciones públicas de la agrupación Veteranos Unidos por Malvinas de Mendoza, en la provincia hubo 456 veteranos y hoy quedan unos 340\. La memoria viva se está perdiendo.  
- **Territorio:** Mendoza ya tiene lugares de memoria de Malvinas, pero están desconectados entre sí. No hay un circuito, ni relatos accesibles en el lugar, ni un mecanismo que haga volver valor económico a los veteranos.  
  - Memorial Malvinas Argentinas, Parque Central (Ciudad de Mendoza). Tiene los nombres de los 15 caídos mendocinos.  
  - Plaza Héroes de Malvinas, IV Brigada Aérea, El Plumerillo. Tiene aviones expuestos (A-4C, Mirage III, MS-760).  
  - Monumento a los caídos en la rotonda de carril Gómez y Urquiza, Coquimbito, Maipú. Es zona turística de bodegas.  
- **Problema en una frase:** *Los lugares de memoria de Malvinas en Mendoza no cuentan las historias de quienes estuvieron ahí y no generan ningún apoyo concreto para los veteranos que quedan.*

---

## 3\. La solución

**En una frase:** una ruta por los lugares de memoria de Malvinas en Mendoza. En cada lugar, un QR abre la historia contada por los veteranos y registra la visita en Stellar. Las visitas se canjean por descuentos en comercios adheridos, y **cada compra le transfiere automáticamente un porcentaje al centro de veteranos**, de forma pública y verificable.

### 3.1 Flujo del visitante

1. Escanea el QR de una parada con la cámara del celular, que abre una URL de la app.  
2. La primera vez, la app crea una wallet en el navegador. El visitante **no ve nada de cripto**: el centro le patrocina la cuenta y las comisiones.  
3. Lee o escucha la historia del lugar y toca "Registrar mi visita". Recibe **10 Huellas** (asset `HUELLA` en Stellar).  
4. Con **30 Huellas** (las 3 paradas) obtiene un **10% de descuento** en un comercio adherido, con un tope configurable.  
5. En el comercio escanea el QR de cobro, ve el desglose (total, descuento, cuánto va al comercio, cuánto va al Centro de Veteranos) y confirma.  
6. Una sola transacción atómica hace todo: paga al comercio, paga al Centro de Veteranos y quema las Huellas usadas.

### 3.2 Flujo del comercio

1. Abre su "Caja" en la web, carga un monto en USDC y muestra un QR.  
2. Ve en vivo "Pago recibido" con el link a la transacción.  
3. Su incentivo: clientes que hacen la ruta y quedar asociado públicamente al apoyo a los veteranos. Él financia el descuento y el porcentaje que va al centro.

### 3.3 Flujo del centro de veteranos y del público

- Página pública de **Transparencia**: total recibido por el centro, desglose por comercio y cada pago con su link a stellar.expert.  
- El centro es el **emisor** del asset Huella: autoriza quién lo tiene y puede revocar en caso de fraude.

---

## 4\. Actores y cuentas de Stellar (testnet)

| Variable | Rol | ¿El server tiene la secreta? |
| :---- | :---- | :---- |
| `ISSUER` | Cuenta del Centro de Veteranos como **emisor** de `HUELLA`. También es **sponsor** de reservas y **fee source** de los fee-bump. | Sí |
| `CENTRO` | Cuenta del Centro de Veteranos que **recibe USDC**. Va separada del emisor por buena práctica. | No hace falta. Guardala igual para el setup. |
| `TREASURY` | Solo para la demo: fondea a los visitantes con USDC de testnet. | Sí |
| `MERCHANT_1` (… `_N`) | Comercios. Solo reciben. | No hace falta. Guardala igual para el setup. |
| `USDC_ISSUER_MOCK` | Solo si `USDC_MODE=mock`: emisor de un USDC de prueba propio. | Sí |
| Visitante | Keypair generado **en el navegador**. | **Nunca** |

### 4.1 Assets

- **`HUELLA`**: emisor `ISSUER`. Flags del emisor: **`AUTH_REQUIRED` \+ `AUTH_REVOCABLE`**, seteados **antes** de que exista cualquier trustline. Así solo tienen Huellas las cuentas que el centro autoriza, y el centro puede revocar una autorización si detecta fraude. *Opcional, solo si sobra tiempo:* `AUTH_CLAWBACK_ENABLED`.  
- **`USDC`**: configurable con `USDC_MODE`:  
  - `mock` (**default para desarrollo nocturno**): asset `USDC` emitido por `USDC_ISSUER_MOCK`, sin flags. La IA puede probar sola sin pasar por el faucet. En la UI se muestra como "USDC (prueba)".  
  - `circle` (**para la demo**): USDC oficial de Circle en testnet, emisor `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`. Se fondea desde [https\://faucet.circle.com](https://faucet.circle.com): 10 USDC por pedido, un pedido cada 24 h por dirección. **Lo hace un humano.** Por eso en la demo los montos son chicos, entre 1 y 3 USDC.

### 4.2 Red

- Horizon: `https://horizon-testnet.stellar.org`  
- Passphrase: `Networks.TESTNET`  
- Friendbot: `https://friendbot.stellar.org?addr=<PUBKEY>`  
- Explorador: `https://stellar.expert/explorer/testnet/tx/<hash>`  
- SDK: `@stellar/stellar-sdk` (última versión), usando `Horizon.Server`.

---

## 5\. Diseño de las transacciones de Stellar (lo crítico)

> Usá solo **operaciones clásicas**. **No uses Soroban**: no hace falta, suma riesgo y el jurado premia el sentido, no la complejidad.

### 5.1 Setup (`scripts/setup-testnet.js`, idempotente)

1. Genera keypairs para `ISSUER`, `CENTRO`, `TREASURY`, `MERCHANT_1`, `MERCHANT_2` y `USDC_ISSUER_MOCK`, si no existen en `.env`.  
2. Fondea todo con Friendbot.  
3. En `ISSUER`: `setOptions({ setFlags: AuthRequiredFlag | AuthRevocableFlag })`.  
4. Abre trustlines de `USDC` en `CENTRO`, `TREASURY` y los `MERCHANT_*`.  
5. Si `USDC_MODE=mock`: `USDC_ISSUER_MOCK` emite 10.000 USDC a `TREASURY`.  
6. Escribe o actualiza `.env` e imprime las direcciones con sus links al explorador.  
7. Si `USDC_MODE=circle`: imprime la dirección de `TREASURY` y avisa: "Un humano tiene que fondearla en faucet.circle.com".

### 5.2 Onboarding del visitante: cuenta patrocinada (una transacción)

El visitante genera su `Keypair.random()` en el navegador y manda **solo su clave pública**.

```js
// server: construir
const issuerAcc = await server.loadAccount(ISSUER_PUB);
const tx = new TransactionBuilder(issuerAcc, { fee: "1000", networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.beginSponsoringFutureReserves({ sponsoredId: visitorPub }))
  .addOperation(Operation.createAccount({ destination: visitorPub, startingBalance: "0" }))
  .addOperation(Operation.changeTrust({ asset: HUELLA, source: visitorPub }))
  .addOperation(Operation.changeTrust({ asset: USDC, source: visitorPub }))
  .addOperation(Operation.setTrustLineFlags({ trustor: visitorPub, asset: HUELLA, flags: { authorized: true } }))
  .addOperation(Operation.endSponsoringFutureReserves({ source: visitorPub }))
  .setTimeout(300)
  .build();
// guardar tx.hash().toString("hex") en un Map en memoria con TTL de 5 min, asociado a visitorPub
// devolver tx.toXDR()
```

- **El cliente firma** con su keypair y devuelve el XDR firmado.  
- **El server verifica** que `TransactionBuilder.fromXDR(xdr, Networks.TESTNET).hash()` sea **igual** al hash que construyó (el hash no incluye firmas). **Nunca firmes un XDR que no construiste vos.**  
- El server firma con `ISSUER` y hace submit.  
- El emisor paga la comisión porque es el source de la transacción. El visitante queda con **0 XLM** y todas sus reservas patrocinadas.

### 5.3 Registro de visita (mint de Huellas)

- El cliente manda `{ publicKey, stopId, code, lat, lng, ts, signature }`, donde `signature` es la firma con su keypair de `visita:${stopId}:${ts}` (`keypair.sign(Buffer.from(msg)).toString("base64")`).  
- El server valida, en este orden:  
  1. La firma: `Keypair.fromPublicKey(pub).verify(Buffer.from(msg), Buffer.from(sig, "base64"))`.  
  2. Que `ts` tenga menos de 5 minutos.  
  3. Que `code === HMAC_SHA256(QR_SECRET, stopId)` (primeros 16 caracteres hex).  
  4. La geolocalización: distancia de Haversine menor a `GEO_RADIUS_M` (default 200). **Se saltea si `DEMO_MODE=true`.**  
  5. Que no exista otra visita para (publicKey, stopId), con una restricción UNIQUE en la base.  
- Transacción: source `ISSUER`, `payment` de `HUELLAS_POR_VISITA` (10) `HUELLA` al visitante, `memo text` igual a `visita:<stopId>` (máximo 28 bytes, así que usá ids cortos).  
- Se guarda la visita con el `tx_hash`.

### 5.4 Pago en comercio: split atómico, quema y fee-bump

Datos de entrada: `{ publicKey, merchantId, amount, ref, useHuellas }`. `amount` es un string en USDC, por ejemplo `"2.50"`.

**Cuentas en enteros (stroops, BigInt). Nada de floats.**

```js
const S = 10_000_000n; // 7 decimales
toStroops("2.50") -> 25_000_000n
descuento = useHuellas && saldoHuellas >= COSTO_CANJE
  ? min(amount * DESCUENTO_PCT / 100, DESCUENTO_MAX)  // en stroops
  : 0n
total = amount - descuento
alCentro = total * merchant.pctCentro / 100n   // floor
alComercio = total - alCentro                  // garantiza alCentro + alComercio === total
```

**Transacción interna** (source \= **visitante**):

```js
const visitorAcc = await server.loadAccount(visitorPub);
const inner = new TransactionBuilder(visitorAcc, { fee: "100", networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.payment({ destination: MERCHANT_PUB, asset: USDC, amount: fmt(alComercio) }))
  .addOperation(Operation.payment({ destination: CENTRO_PUB,  asset: USDC, amount: fmt(alCentro) }))
  // solo si hubo canje: pagarle HUELLA al emisor la QUEMA
  .addOperation(Operation.payment({ destination: ISSUER_PUB, asset: HUELLA, amount: String(COSTO_CANJE) }))
  .addMemo(Memo.text(`pago:${ref}`))   // ref de 8 caracteres
  .setTimeout(300)
  .build();
```

- Igual que en 5.2: el server guarda el hash, el cliente firma y el server verifica que el hash coincida.  
- **Fee-bump**: como el visitante tiene 0 XLM, la comisión la paga el emisor.

```js
const fb = TransactionBuilder.buildFeeBumpTransaction(issuerKeypair, "1000", innerSigned, Networks.TESTNET);
fb.sign(issuerKeypair);
await server.submitTransaction(fb);
```

- Si cualquier operación falla, **falla todo**: eso es lo atómico y es el argumento técnico del pitch.  
- Guardar en la tabla `payments` (sección 7\) con el desglose y el hash.  
- **Mostrale al visitante el desglose antes de firmar.** Nunca firmes por él.

### 5.5 Fondeo de demo

`POST /api/demo/fund` (solo si `DEMO_MODE=true`): `TREASURY` le paga `DEMO_FUND_USDC` (default `"5"`) al visitante, una sola vez por publicKey.

### 5.6 Errores de Horizon

Parseá `err.response.data.extras.result_codes` y mostrá mensajes humanos: "No tenés saldo suficiente", "La transacción venció, probá de nuevo", etc. Logueá el detalle en el server.

---

## 6\. Arquitectura y stack

- **Backend:** Node 20+, Express, `@stellar/stellar-sdk`, `better-sqlite3`, `dotenv`, `cors`, `express-rate-limit`.  
- **Frontend:** React \+ Vite, PWA básica (manifest e íconos, sin service worker complejo), `react-router-dom`, `leaflet` \+ `react-leaflet` con tiles de OpenStreetMap, `qrcode` para generar los QR de la caja.  
  - **Gotcha:** el SDK de Stellar en el navegador puede necesitar `Buffer`. Si falla, `import { Buffer } from "buffer"; globalThis.Buffer = Buffer;` o `vite-plugin-node-polyfills`.  
- **No hace falta un lector de QR dentro de la app:** los QR son URLs y se escanean con la cámara del celular.  
- En producción, Express sirve el build del frontend: un solo servicio y un solo dominio.  
- **Hace falta HTTPS** para la geolocalización. Dejá un `Dockerfile` y documentá dos opciones de deploy: Render/Railway, o un server propio con Cloudflare Tunnel. Lo decide el equipo.

### 6.1 Estructura

```
/
├─ SPEC.md  PROGRESS.md  DECISIONES.md  README.md  VALIDACION.md  DEMO.md
├─ .env.example  Dockerfile
├─ content/
│  ├─ stops.json        # paradas + historias (placeholders)
│  ├─ merchants.json    # comercios
│  └─ media/            # fotos/audios reales (los suben humanos)
├─ scripts/
│  ├─ setup-testnet.js
│  ├─ e2e-testnet.js    # flujo completo por CLI, imprime hashes
│  └─ generate-qr.js    # PNG + un PDF imprimible con los QR firmados de cada parada
├─ server/
│  ├─ index.js  stellar.js  db.js  routes/*.js
└─ web/
   └─ src/ (pages, components, lib/wallet.js, lib/api.js)
```

---

## 7\. Modelo de datos (SQLite)

```sql
CREATE TABLE visitors (pubkey TEXT PRIMARY KEY, onboard_tx TEXT, created_at INTEGER);
CREATE TABLE visits (
  pubkey TEXT, stop_id TEXT, tx_hash TEXT, created_at INTEGER,
  UNIQUE(pubkey, stop_id)
);
CREATE TABLE payments (
  tx_hash TEXT PRIMARY KEY, ref TEXT, pubkey TEXT, merchant_id TEXT,
  amount TEXT, discount TEXT, to_merchant TEXT, to_centro TEXT,
  huellas_burned INTEGER, created_at INTEGER
);
CREATE TABLE demo_funds (pubkey TEXT PRIMARY KEY, tx_hash TEXT, created_at INTEGER);
```

Las paradas y los comercios viven en `content/*.json`, no en la base de datos.

`merchants.json`:

```json
[{ "id": "m1", "nombre": "[COMERCIO PENDIENTE]", "direccion": "[PENDIENTE]",
   "pubkeyEnv": "MERCHANT_1_PUB", "pctCentro": 5, "lat": null, "lng": null }]
```

---

## 8\. API

| Método | Ruta | Descripción |
| :---- | :---- | :---- |
| GET | `/api/config` | Modo USDC, `DEMO_MODE`, reglas de canje y explorador |
| GET | `/api/stops` | Lista de paradas (sin `code`) |
| GET | `/api/stops/:id` | Contenido de la parada |
| POST | `/api/onboard/build` | `{publicKey}` → `{xdr}` |
| POST | `/api/onboard/submit` | `{signedXdr}` → `{txHash}` |
| POST | `/api/visit` | Sección 5.3 → `{txHash, huellas}` |
| GET | `/api/account/:pub` | Saldos de HUELLA y USDC (desde Horizon) más las visitas (desde la base) |
| POST | `/api/pay/build` | `{publicKey, merchantId, amount, ref, useHuellas}` → `{xdr, desglose}` |
| POST | `/api/pay/submit` | `{signedXdr}` → `{txHash}` (aplica el fee-bump) |
| GET | `/api/merchants` | Lista |
| GET | `/api/merchants/:id/payments` | Pagos recibidos (para la caja, con polling cada 3 s) |
| GET | `/api/transparencia` | Total al centro, desglose por comercio y lista con links |
| POST | `/api/demo/fund` | Sección 5.5 |

Rate limit: 30 requests por minuto por IP en los POST. Validá todas las entradas: clave pública con `StrKey.isValidEd25519PublicKey`, montos con regex `^\d+(\.\d{1,7})?$` y menores a 1000\.

---

## 9\. Frontend

### 9.1 Pantallas

1. **`/` Inicio:** título "Ruta de la Memoria · Malvinas · Mendoza", una explicación de dos líneas, mapa con las 3 paradas, progreso del tipo "Visitaste 1 de 3 lugares" y saldo de Huellas.  
2. **`/v/:stopId?c=CODE` Parada:** foto, nombre del lugar, la historia (texto y audio si existe) y un botón "Registrar mi visita". Si no hay wallet, el onboarding corre de forma transparente antes. Al terminar muestra "Tu visita quedó registrada" y el link a la transacción.  
3. **`/recorrido` Mi recorrido:** visitas con fecha y links, saldo de Huellas y USDC, y "Cómo canjear".  
4. **`/pagar?m=ID&monto=X&ref=R` Pagar:** desglose claro, en este orden:  
   - Total del comercio  
   - Descuento por tu recorrido (−X), si aplica, con un toggle  
   - **Va al comercio: X**  
   - **Va al Centro de Veteranos de Malvinas: X**  
   - Botón "Confirmar pago". Al terminar: "Pago hecho" y el link.  
5. **`/comercio/:id` Caja:** input del monto, botón "Generar cobro", QR grande con la URL de `/pagar` y un estado en vivo: "Esperando pago…" → "✓ Pago recibido" con el link.  
6. **`/transparencia`:** número grande con lo recibido por el centro, desglose por comercio y tabla de pagos con links a stellar.expert. **Es la pantalla del pitch: tiene que verse impecable.**  
7. **`/acerca`:** qué es el proyecto, quién lo hace, que corre en la testnet de Stellar y que el contenido lo aportan los veteranos.

### 9.2 Wallet en el navegador (`lib/wallet.js`)

- Clave secreta en `localStorage` (`rmm_secret`), con try/catch.  
- Botón en `/recorrido` para "Respaldar mi clave" (mostrarla con una advertencia). Es aceptable para el MVP.  
- **La clave secreta nunca sale del navegador.**

### 9.3 Tono y diseño (no negociable)

- **Esto es un memorial, no un juego.** Prohibido: "¡Ganaste\!", niveles, logros, rankings, confetti, sonidos de victoria, emojis bélicos, imágenes de armas o de combate, e imágenes generadas por IA de soldados.  
- Vocabulario: "registrar visita", "Huellas", "recorrido", "veteranos", "caídos". Las Huellas se explican como "el registro de tu paso por cada lugar de memoria".  
- Visual sobrio: fondo claro, tipografía legible y celeste como acento sutil. Sin estética militar.  
- **Accesibilidad:** muchos veteranos tienen más de 60 años. Texto base de 18 px, contraste AA, botones de al menos 48 px de alto y lenguaje simple.  
- Mobile-first. Tiene que funcionar bien en un Android de gama media con datos móviles.

---

## 10\. Contenido (`content/stops.json`)

> **Las coordenadas son APROXIMADAS: los humanos las verifican el viernes.** Los textos son PLACEHOLDERS. **No los completes con contenido inventado.**

```json
[
  {
    "id": "pc", "nombre": "Memorial Malvinas Argentinas",
    "lugar": "Parque Central, Ciudad de Mendoza",
    "lat": -32.877, "lng": -68.846, "coordsVerificadas": false,
    "foto": null, "audio": null,
    "historia": "[HISTORIA PENDIENTE — la aporta un veterano. No completar con texto inventado.]",
    "fuente": "[Nombre del veterano o agrupación que aporta el relato]"
  },
  {
    "id": "plu", "nombre": "Plaza Héroes de Malvinas",
    "lugar": "IV Brigada Aérea, El Plumerillo",
    "lat": -32.832, "lng": -68.793, "coordsVerificadas": false,
    "foto": null, "audio": null,
    "historia": "[HISTORIA PENDIENTE — la aporta un veterano. No completar con texto inventado.]",
    "fuente": "[PENDIENTE]"
  },
  {
    "id": "coq", "nombre": "Monumento a los Caídos en Malvinas",
    "lugar": "Rotonda carril Gómez y Urquiza, Coquimbito, Maipú",
    "lat": -32.97, "lng": -68.75, "coordsVerificadas": false,
    "foto": null, "audio": null,
    "historia": "[HISTORIA PENDIENTE — la aporta un veterano. No completar con texto inventado.]",
    "fuente": "[PENDIENTE]"
  }
]
```

- La UI muestra los placeholders de forma visible, como un recuadro gris de "Contenido en preparación". No los escondas.  
- Si `coordsVerificadas` es `false` y `DEMO_MODE` es `false`, se saltea igual la validación de distancia para esa parada y se loguea una advertencia.

---

## 11\. Configuración (`.env.example`)

```
HORIZON_URL=https://horizon-testnet.stellar.org
USDC_MODE=mock                # mock | circle
USDC_CIRCLE_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
ISSUER_SECRET=  ISSUER_PUB=
CENTRO_SECRET=  CENTRO_PUB=
TREASURY_SECRET=  TREASURY_PUB=
MERCHANT_1_SECRET=  MERCHANT_1_PUB=
MERCHANT_2_SECRET=  MERCHANT_2_PUB=
USDC_ISSUER_MOCK_SECRET=  USDC_ISSUER_MOCK_PUB=
QR_SECRET=                    # random 32 bytes hex
HUELLAS_POR_VISITA=10
COSTO_CANJE=30
DESCUENTO_PCT=10
DESCUENTO_MAX_USDC=1
GEO_RADIUS_M=200
DEMO_MODE=true
DEMO_FUND_USDC=5
PUBLIC_BASE_URL=http://localhost:3000
PORT=3000
```

---

## 12\. Orden de construcción: hitos con criterio de aceptación

| Hito | Qué | Listo cuando… |
| :---- | :---- | :---- |
| **M0** | Scaffold del repo, `.env.example`, `setup-testnet.js` | El setup corre dos veces sin romper e imprime cuentas con flags correctos (`auth_required: true` y `auth_revocable: true` en `ISSUER`) |
| **M1** | Onboarding patrocinado (5.2) | `e2e-testnet.js` crea un visitante y el explorador muestra la cuenta con **0 XLM**, sponsor `ISSUER` y trustlines de HUELLA (autorizada) y USDC |
| **M2** | Visita y mint (5.3) | El e2e registra las 3 visitas, el saldo da 30 HUELLA y una visita repetida se rechaza |
| **M3** | Pago con split, quema y fee-bump (5.4) y fondeo de demo | El e2e paga 2.50 con canje: llega lo correcto al comercio y al centro, las HUELLA bajan a 0 y el visitante sigue con 0 XLM. **Imprimir los hashes.** |
| **M4** | API completa y base de datos | Todos los endpoints responden y el e2e pasa también vía HTTP |
| **M5** | Frontend: Inicio, Parada, Recorrido y Pagar | El flujo completo funciona desde el navegador del celular |
| **M6** | Caja del comercio y Transparencia | La caja detecta el pago en menos de 5 s y la transparencia muestra los totales correctos |
| **M7** | `generate-qr.js`, Dockerfile y README | Sale el PDF con 3 QR imprimibles (nombre del lugar más QR) y la app levanta con `docker run` |
| **M8** | Pulido: errores humanos, estados de carga, accesibilidad, `/acerca` | Checklist de la sección 9.3 cumplido |

**Si se termina el tiempo, se corta de abajo hacia arriba.** M0 a M5 son el mínimo para competir y M6 (transparencia) es el más importante de los que siguen.

---

## 13\. Fallbacks (aplicar, anotar en `DECISIONES.md` y seguir)

- **El patrocinio de reservas falla más de 45 min:** onboarding con `createAccount` de `startingBalance: "3"` desde `ISSUER`, sin sponsorship. Se mantiene el fee-bump si anda.  
- **El fee-bump falla más de 45 min:** el onboarding le da 3 XLM al visitante y él paga su propia comisión.  
- **`USDC_MODE=circle` sin fondos:** se queda en `mock`. Los humanos cambian el modo el viernes.  
- **El mapa de Leaflet da problemas:** lista de paradas con un link a Google Maps. El mapa no suma puntos.  
- **SQLite da problemas en el deploy:** archivo JSON en disco con escritura atómica.

---

## 14\. Fuera de alcance (no construir)

NFTs, rankings, perfiles, login con email o redes, Soroban o smart contracts, mainnet, panel de administración (el contenido se edita en JSON), multi-idioma, notificaciones, conversión a pesos u on/off-ramps (se menciona en el pitch, no se construye), app nativa, lector de QR propio, analítica o tracking.

---

## 15\. Límites y reglas duras

1. **Solo testnet.** Si `HORIZON_URL` no contiene `testnet`, el server **no arranca**.  
2. **Secretos:** solo en `.env`, nunca en el repo ni en logs. La secreta del visitante nunca llega al server.  
3. **El server solo firma XDR construido por él mismo** (verificación de hash).  
4. **No inventar contenido histórico** ni atribuir frases a personas reales.  
5. **No usar imágenes de terceros** (fotos de medios, etc.). Solo fotos tomadas por el equipo o cedidas con permiso.  
6. **Tono respetuoso** (9.3). Esto es memoria de una guerra con muertos mendocinos.  
7. Montos siempre en BigInt/stroops. Validar que `alCentro + alComercio === total` antes de construir la transacción.  
8. Nada en la app afirma que el centro de veteranos participa oficialmente **hasta que el equipo lo confirme**. Mientras tanto se dice "Centro de Veteranos (cuenta de demostración)".

---

## 16\. Entregables finales en el repo

- **`README.md`:** qué es, el problema, cómo funciona (con un diagrama ASCII del flujo de pago), por qué Stellar (sección 18), cómo correrlo, URL pública y links a transacciones reales de testnet.  
- **`VALIDACION.md`** (template; lo completan los humanos):

```
## Prueba con usuario externo
- Quién (rol, sin datos sensibles): 
- Fecha / lugar: 
- Qué hizo: 
- Qué entendió solo / qué no entendió: 
- Qué le molestó o le pareció inapropiado: 
- Cita textual (con permiso): 
- Qué cambiamos por esto: 
```

- **`DEMO.md`:** guion de demo de 3 minutos, paso por paso, con las URLs a abrir.  
- **`PROGRESS.md`** y **`DECISIONES.md`** actualizados.

---

## 17\. Tareas HUMANAS (la IA no las hace; dejalas listadas en `PROGRESS.md`)

**Viernes a la mañana (lo más importante de toda la hackathon):**

- [ ] Contactar a Veteranos Unidos por Malvinas de Mendoza o a otro centro de veteranos. Pedir: 2 o 3 historias reales (texto o audio), permiso para publicarlas y que **un veterano pruebe la app el sábado**.  
- [ ] **Preguntarle de frente al veterano** si "juntar Huellas" en un memorial le parece respetuoso. Si dice que no, se ajusta el lenguaje y eso va al pitch.  
- [ ] Conseguir **1 comercio real** cerca del Parque Central o en Maipú que acepte la idea (descuento \+ 5% al centro). Si no acepta, documentar por qué: también es validación.  
- [ ] Verificar las coordenadas reales de las 3 paradas.  
- [ ] Sacar fotos propias de los lugares.  
- [ ] Fondear `TREASURY` en faucet.circle.com y pasar `USDC_MODE=circle`.

**Sábado:**

- [ ] Ir al Memorial del Parque Central con el QR **impreso en la mano**. No pegar nada en el monumento.  
- [ ] Prueba con una persona externa en el lugar. **Filmarla, con permiso.**  
- [ ] Prueba de cobro con el comercio.  
- [ ] Completar `VALIDACION.md`, grabar el video y **entregar en Apex antes de las 22:00**.

---

## 18\. Para el pitch: respuestas al jurado

- **¿Por qué Stellar y no una base de datos?** Los puntos solos podrían vivir en una base de datos, y lo decimos. Lo que no se puede reemplazar es (1) que la plata que va a los veteranos se mueva de forma **atómica** con la compra, sin intermediario que la retenga, y sea **verificable por cualquiera**; y (2) que el **centro de veteranos sea el emisor** y controle su propio asset (`AUTH_REQUIRED` / `AUTH_REVOCABLE`). Además, el visitante no necesita saber nada de cripto: reservas patrocinadas y fee-bump.  
- **¿Quién pone la plata?** El comercio, a cambio de clientes y reputación. Validado (o no) con el comercio X.  
- **¿No banaliza la memoria?** Se lo preguntamos al veterano X y esto fue lo que dijo (VALIDACION.md).  
- **¿Y en el mundo real, nadie paga un café con USDC?** En Argentina el dólar digital ya es parte de la economía cotidiana. Los anchors de Stellar permiten cobrar en pesos. Es el siguiente paso y no lo construimos en 48 h.  
- **¿Qué sigue?** Sumar más paradas (Malargüe, San Rafael), escuelas el 2 de abril y que el centro de veteranos opere su propia cuenta en mainnet.