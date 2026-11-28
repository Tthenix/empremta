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

## Modelo de negocio

### Principio
Empremta **nunca cobra de la parte que va a los veteranos** ni al visitante. Cobra a quien recibe valor: el comercio, que gana clientes, y la institución, que gana una ruta de memoria. Todo lo que se cobra en la cadena es visible en la misma transacción.

### Quién paga y por qué

| Fuente | Quién paga | A cambio de qué | Estado |
|---|---|---|---|
| **Comisión por canje** | El comercio | 2 % de cada venta que le llega a través de la ruta. Paga solo cuando le llevamos un cliente. | Propuesto. Hoy el canje incluye solo el aporte a los veteranos; el 2 % se sumaría como una operación más dentro de la misma transacción atómica. |
| **Armado de rutas** | Municipios, turismo y educación | Investigación del lugar, testimonios con permiso, carteles con QR y un año de mantenimiento. | Propuesto. Principal fuente de ingresos en la primera etapa. |
| **Patrocinio de paradas** | Empresas locales | Financian una parada o duplican el aporte de los visitantes, visible en la cadena. | Propuesto. |

Sobre cada venta de la ruta, el comercio resigna un 10 % de descuento, un 5 % de aporte a los veteranos y un 2 % para Empremta. Ese 17 % lo vamos a validar con comercios reales; si resulta alto, se baja el descuento.

### Cuánto cuesta operarlo

| Concepto | Costo estimado |
|---|---|
| Hosting | USD 5 a 20 por mes, según el uso |
| Dominio | Alrededor de USD 15 por año |
| Reservas en Stellar por visitante | 1,5 a 2 XLM. No se gastan: quedan bloqueadas y se recuperan si la cuenta se cierra |
| Comisiones de red | 0,00001 XLM por operación: fracciones de centavo |
| Por cada ruta nueva | Carteles mate con QR (uno por parada), investigación y redacción de cada lugar, y testimonios grabados con consentimiento |

### Cómo se recupera la plata
- **Primer año:** el ingreso viene del armado de rutas para instituciones. El precio de cada ruta cubre su armado y un año de mantenimiento, y se define según la cantidad de paradas.
- **Después:** con más comercios y visitantes, la comisión por canje cubre los costos fijos. El punto de equilibrio es `canjes por mes = costos fijos ÷ (2 % × ticket promedio)`. Por ejemplo, con USD 20 por mes de costos y un ticket de USD 5, hacen falta 200 canjes por mes.
- **Patrocinios:** ingreso adicional, sin costo variable.

### Riesgos y cómo los vamos a validar
- **Que el comercio considere alto el 17 %:** lo validamos con Einstein Coffee Club y con más comercios. Si es alto, bajamos el descuento.
- **Que las ventas a instituciones sean lentas:** arrancamos con una ruta piloto y patrocinio privado mientras tanto.
- **Que los veteranos no quieran participar:** es lo primero del roadmap. Sin ellos, el proyecto no sigue.

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

El e2e imprime hashes reales de: onboarding patrocinado, 3 visitas, fondeo demo, pago atómico con fee-bump y revocación/restauración de HUELLA. Mira `PROGRESS.md` para links ya ejecutados.

## Control del asset HUELLA

El centro puede suspender una cuenta ante fraude sin exponer un panel web administrativo:

```bash
npm run revocar -- <G...pubkey>            # suspende la trustline HUELLA
npm run revocar -- <G...pubkey> --restore  # la restaura
```

El script firma una operación clásica `setTrustLineFlags` con `ISSUER`, valida que sea testnet e imprime el link público de la transacción. Una cuenta suspendida no puede recibir ni usar Huellas; la API devuelve `ACCOUNT_REVOKED` con un mensaje humano en español y `/transparencia` muestra la traza pública de suspensiones vigentes.

## SEP-1: metadata pública de HUELLA

La API sirve `/.well-known/stellar.toml` con CORS `*`. Describe HUELLA como asset `test`, sin valor monetario, y a Empremta/Centro de Veteranos como cuentas de demostración, sin afirmar aval institucional.

Para que las wallets puedan vincular esa metadata con el emisor, un humano debe configurar `home_domain` en la cuenta `ISSUER`. Es una operación explícita contra la cuenta de testnet y por eso no forma parte del setup automático:

```bash
HOME_DOMAIN=<dominio-corto> npm run home-domain
# o: npm run home-domain -- --domain <dominio-corto>
```

El dominio tiene que servir `https://<dominio-corto>/.well-known/stellar.toml` y entrar en el límite de 32 bytes de `home_domain`. Si el hostname generado por Railway supera ese límite, hay que usar un dominio corto propio antes de ejecutar el comando.

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
- `carteles-ruta-memoria.pdf` (un cartel A4 con marca para cada parada)

Antes de imprimir, `PUBLIC_BASE_URL` tiene que ser la URL pública HTTPS: `npm run qr` se niega a generar QR que apunten a `localhost` (para forzarlo: `npm run qr -- --allow-local`). Los QR locales se guardan aparte, en `dist/qr-prueba/`, con una franja roja "PRUEBA LOCAL · NO IMPRIMIR": `dist/qr/` queda solo para lo que se imprime.

Para comprobar que los PNG generados decodifican a las URLs exactas de producción:

```bash
node scripts/verify-qr.js
```

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
| `PUBLIC_BASE_URL` | URL base usada en QR y en `stellar.toml` |
| `HOME_DOMAIN` | Dominio corto opcional para vincular SEP-1 con `ISSUER` mediante `npm run home-domain` |
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

- **Reseñas de los monumentos:** basadas en fuentes públicas oficiales y periodísticas documentadas en [STORYTELLING.md](STORYTELLING.md) (Municipalidad de la Ciudad de Mendoza, Gobierno de Mendoza, Fuerza Aérea Argentina, Diario UNO, Los Andes, Sitio Andino, Mendoza Post y Cuyo Noticias).
- **Extractos de testimonios en `content/stops.json`:** citas textuales atribuidas del libro *Ecos de Malvinas: 41 años, 41 entrevistas* (coord. Mariana Cóvolo y Jorge C. Dragonetti; Ediciones Universidad de Congreso — EdiUC, Mendoza, 2023, ISBN `978-987-82840-1-9`, [PDF oficial](https://ediuc.ucongreso.edu.ar/wp-content/uploads/sites/6/2024/05/Malvinas_digital.pags_.2024.ok_.pdf)):
  - Parque Central (`pc`): Miguel Rivero (24/5/2022), p. 75.
  - IV Brigada Aérea, El Plumerillo (`plu`): Fernando Klix Berrotaran (6/10/2020), pp. 157–158.
  - Coquimbito, Maipú (`coq`): Ramón Andrés Suárez (31/1/2023), pp. 150–151.
- No se inventaron testimonios, citas, biografías ni anécdotas. La confirmación de derechos con EdiUC y la validación con veteranos y comerciantes quedan documentadas en `VALIDACION.md` y SPEC §17.


## Canje con aporte del comercio

El flujo principal no pide saldo al visitante. El comercio ingresa el ticket en pesos en `/comercio/:id`, genera un QR de `/canjear` y el visitante canjea 30 Huellas. La transacción Stellar tiene dos operaciones clásicas: quema las Huellas y transfiere el aporte USDC desde la cuenta custodial del comercio al Centro. La conversión usa `ARS_PER_USDC` como tipo de cambio de referencia y se redondea hacia abajo a 7 decimales.

Variables aditivas: `ARS_PER_USDC=1400`, `APORTE_PCT` (vacío usa el porcentaje del comercio), `DESCUENTO_MAX_ARS=2000`, `MAX_TICKET_ARS=50000` (tope del ticket de un canje, protege el USDC del comercio), `MAX_NEW_WALLETS_PER_IP_PER_DAY=5` y `CLIENT_IP_HEADER` (en producción por defecto `x-real-ip`: el borde de Railway sobrescribe ese header en cada pedido, así que el cliente no puede falsear su IP; no se confía en `X-Forwarded-For`). El límite de cuentas nuevas se aplica por IP y día UTC; localhost queda exento solo fuera de producción, para poder correr el e2e local.

El flujo técnico anterior `/pagar` y “Cargar saldo de prueba” sigue disponible solo como opción avanzada/demo.
