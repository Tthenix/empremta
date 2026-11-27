<p align="center"><img src="web/public/brand/empremta-horizontal-color.svg" alt="Empremta" width="360"></p>

# Empremta · Ruta de la Memoria · Malvinas · Mendoza

App web para recorrer lugares de memoria de Malvinas en Mendoza. Cada visita queda registrada en Stellar testnet como `HUELLA`; al completar las 3 paradas, la persona puede canjear un descuento en un comercio adherido. El pago se divide en una sola transacción atómica: una parte va al comercio y otra al Centro de Veteranos (cuenta de demostración), públicamente verificable.

> Estado de red: **solo Stellar testnet**. El servidor se niega a arrancar si `HORIZON_URL` no contiene `testnet`.

## Qué demuestra Stellar

Los puntos podrían ser una tabla más, pero dos cosas no se reemplazan con una base de datos sin perder la propuesta:

1. **La plata se mueve de forma atómica con la compra**: comercio, centro de veteranos y quema de Huellas ocurren en una sola transacción o no ocurre nada.
2. **El centro es emisor de HUELLA** con `AUTH_REQUIRED` y `AUTH_REVOCABLE`: controla quién puede tener el asset y cualquiera puede auditar los movimientos en stellar.expert.

El visitante no necesita entender cripto: creación de cuenta y trustlines son patrocinadas, y los pagos usan fee-bump. Su clave secreta queda solo en el navegador.

## Flujo de pago

```
Visitante escanea QR de cobro
        │
        ▼
Backend construye XDR con desglose:
  total del comercio
  - descuento por 30 Huellas
  = total a pagar
      ├─ pago al comercio
      └─ porcentaje al Centro de Veteranos
  + devolución de 30 HUELLA al emisor (quema)
        │
        ▼
El visitante ve el desglose y firma en su navegador
        │
        ▼
Backend verifica hash del XDR construido por él,
lo envuelve en fee-bump y lo envía a testnet
        │
        ▼
Caja del comercio y /transparencia se actualizan
con hash verificable en stellar.expert
```

## Correr en local

Requisito: Node.js 22.12 o superior (es un runtime Node 20+; se usa 22 porque la versión vigente del SDK de Stellar y `better-sqlite3` lo exigen).

```bash
npm ci
npm run setup        # genera/actualiza .env y configura cuentas de testnet
npm run dev:server   # API en http://localhost:3000
```

Verificación completa contra testnet real:

```bash
npm run e2e          # flujo directo CLI
npm run e2e -- --http  # mismo flujo completo a través de la API HTTP
```

El e2e imprime hashes reales de: onboarding patrocinado, 3 visitas, fondeo demo y pago atómico con fee-bump. Mira `PROGRESS.md` para links ya ejecutados.

## Frontend integrado

Cuando el directorio `web/` está integrado:

```bash
npm run build
npm start
```

Express sirve la API y `web/dist` en el mismo puerto. En desarrollo, el servidor Vite de Cursor proxifica `/api` hacia `http://localhost:3000`.

## QR imprimibles

```bash
npm run qr
```

Genera en `dist/qr/`:

- `parada-pc.png`, `parada-plu.png`, `parada-coq.png`
- `qr-paradas-ruta-memoria.pdf` (una hoja imprimible con los 3 QR)

Antes de imprimir, `PUBLIC_BASE_URL` tiene que ser la URL pública HTTPS: `npm run qr` se niega a generar QR que apunten a `localhost` (para forzarlo: `npm run qr -- --allow-local`).

## Variables de entorno

Copiar `.env.example` o, más simple, correr `npm run setup` y completar/usar el `.env` generado.

| Variable | Uso |
|---|---|
| `HORIZON_URL` | Debe ser `https://horizon-testnet.stellar.org` u otra URL testnet |
| `USDC_MODE` | `mock` para desarrollo nocturno, `circle` para demo con USDC oficial de testnet |
| `ISSUER_SECRET/PUB` | Emisor de HUELLA, sponsor y fee source |
| `CENTRO_SECRET/PUB` | Cuenta que recibe el porcentaje del centro |
| `TREASURY_SECRET/PUB` | Fondeo demo de visitantes |
| `MERCHANT_1/2_SECRET/PUB` | Comercios de prueba |
| `USDC_ISSUER_MOCK_SECRET/PUB` | Emisor del USDC mock |
| `QR_SECRET` | Secreto HMAC para firmar QRs de paradas |
| `DEMO_MODE` | `true` habilita `/api/demo/fund` |
| `DB_PATH` | SQLite; local `./data/app.sqlite`, Railway `/data/app.sqlite` |
| `PUBLIC_BASE_URL` | URL base usada en QR |
| `PORT` | Puerto HTTP, default `3000` |

**Nunca commitear `.env`.** Los secretos solo van en variables del entorno.

## Docker local

```bash
docker build -t ruta-memoria .
docker run --rm -p 3000:3000 --env-file .env ruta-memoria
```

Smoke test:

```bash
curl http://localhost:3000/api/config
```

El Dockerfile construye `web/` si existe; si todavía no está integrado, genera una página mínima para que el contenedor pueda arrancar la API.

## Deploy en Railway en 5 minutos

1. Crear un proyecto en Railway y elegir **Deploy from Repo**.
2. Railway detecta `railway.json` y usa el `Dockerfile` del root.
3. Crear un **Volume** y montarlo en `/data`.
4. Configurar variables de entorno:
   - copiar todos los secretos/pubkeys del `.env` local generado por `npm run setup`;
   - `DB_PATH=/data/app.sqlite`;
   - `PUBLIC_BASE_URL=https://<tu-dominio-de-railway>`;
   - `DEMO_MODE=true` durante la hackathon;
   - `USDC_MODE=mock` hasta que un humano fondee Circle.
5. Deploy. Verificar `https://<tu-dominio>/api/config` y `/transparencia`.
6. Regenerar los QR con la URL pública si hace falta imprimirlos.

Para `USDC_MODE=circle`, un humano debe fondear `TREASURY` en https://faucet.circle.com y luego cambiar la variable.

## Transacciones reales ya verificadas

Las transacciones de testnet más recientes del flujo HTTP completo están en `PROGRESS.md`. Ejemplo clave del split atómico + quema + fee-bump:

https://stellar.expert/explorer/testnet/tx/d2c5b5f8ab4fff642c707d4f9c1775063b0f290c673955dc8bf98606a9e08de3

## Contenido y límites éticos

Los textos históricos en `content/stops.json` son placeholders visibles. No se inventaron testimonios, citas, biografías ni anécdotas. La validación con veteranos y comerciantes queda como tarea humana en `VALIDACION.md` y SPEC §17.
