<p align="center"><img src="web/public/brand/empremta-horizontal-color.svg" alt="Empremta" width="360"></p>

# Empremta · Ruta de la Memoria · Malvinas · Mendoza

App web para recorrer los lugares de memoria de Malvinas en Mendoza: el Memorial del Parque Central, la Plaza Héroes de Malvinas en El Plumerillo y el monumento de Coquimbito. En cada parada, un QR abre la historia del lugar y la voz de un veterano, y la visita queda registrada en Stellar testnet como `HUELLA`. Al completar las 3 paradas, la persona obtiene un descuento en un comercio adherido: **paga en pesos, como siempre**, y canjea sus Huellas en una sola transacción atómica que las quema y lleva el aporte del comercio al Centro de Veteranos (cuenta de demostración). Todo es públicamente verificable.

> Estado de red: **solo Stellar testnet**. El servidor se niega a arrancar si `HORIZON_URL` no contiene `testnet`.

**Documentos del proyecto:** [Modelo de negocio](#modelo-de-negocio) · [Plan de inversión](PLAN_DE_INVERSION.md) · [Validación](VALIDACION.md) · [Fuentes del contenido](STORYTELLING.md)

## Qué demuestra Stellar

Las Huellas solas podrían ser una tabla más, pero dos cosas no se reemplazan con una base de datos sin perder la propuesta:

1. **El aporte se mueve de forma atómica con el canje:** la quema de las Huellas y el aporte del comercio al Centro de Veteranos ocurren en una sola transacción, o no ocurre nada.
2. **El centro es el emisor de HUELLA,** con `AUTH_REQUIRED` y `AUTH_REVOCABLE`: controla quién puede tener el asset, y cualquiera puede auditar los movimientos en stellar.expert.

El visitante no necesita entender nada de cripto: la creación de su cuenta y los trustlines están patrocinados, y las operaciones usan fee-bump. Su clave secreta queda solo en su navegador.

## Flujo del canje

```
Visitante completa las 3 paradas (30 HUELLA)
        │
        ▼
Comercio ingresa el ticket en pesos en /comercio/:id
y genera un QR de /canjear
        │
        ▼
Visitante escanea el QR, ve el descuento y confirma
        │
        ▼
Una sola transacción en Stellar (fee-bump):
  ├─ quema de 30 HUELLA (vuelven al emisor)
  └─ aporte en USDC desde la cuenta del comercio
     al Centro de Veteranos
        │
        ▼
El visitante paga el café en pesos, con el descuento.
La caja del comercio y /transparencia se actualizan
con el hash verificable en stellar.expert
```

### Ejemplo con un café de $10.000

El descuento y el aporte son dos cosas distintas, y las dos las pone el comercio:

| | Monto | Quién / dónde |
|---|---|---|
| Ticket | $10.000 | |
| Descuento 10 % | −$1.000 | Lo ahorra el visitante: no va a nadie. Tope de $2.000 |
| El visitante paga | $9.000 | En pesos, como siempre (efectivo, tarjeta) |
| Aporte a los veteranos (5 % de $9.000) | $450 ≈ 0,32 USDC | Del comercio al Centro de Veteranos, por Stellar |
| Huellas | 30 | Se queman |

En Stellar pasa solo la última parte, en una sola transacción: se queman las 30 Huellas y el comercio manda los 0,32 USDC al Centro. Al comercio le cuesta $1.000 de descuento y $450 de aporte, y a cambio gana un cliente que vino por la ruta.

La conversión del aporte usa `ARS_PER_USDC` como tipo de cambio de referencia y se redondea hacia abajo a 7 decimales. Los detalles técnicos y las variables están en [Canje con aporte del comercio](#canje-con-aporte-del-comercio).

El flujo anterior, en el que el visitante paga en USDC desde la app y el pago se divide entre el comercio y el centro (`/pagar`), sigue disponible solo como opción avanzada de demostración.

## Validación

Lo probamos con personas ajenas al equipo:

- **En el Memorial del Parque Central**, con una persona que entrevistamos: recorrió la historia y dejó su huella sin trabarse. Le pareció muy intuitiva y nos dijo que no se imaginaba toda la historia que hay detrás del Memorial.
- **En Einstein Coffee Club**, con el empleado de la caja: probó el canje y preguntó cómo le llega la plata al comercio. Al explicárselo, le quedó clarísimo. Aprendimos que al comercio hay que explicarle el flujo del dinero desde el principio.

La próxima prueba, la más importante, es con veteranos de Malvinas. El detalle está en [VALIDACION.md](VALIDACION.md).

## Modelo de negocio

### Principio

Empremta **nunca cobra de la parte que va a los veteranos** ni al visitante. Cobra a quien recibe valor: las empresas que patrocinan, las instituciones que ganan una ruta de memoria y el comercio que gana clientes. Todo lo que se cobra en la cadena es visible en la misma transacción.

### Qué vendemos

No vendemos una audioguía: para contar historias con un QR existen plataformas gratuitas, como izi.TRAVEL. Vendemos el **circuito completo**:

- La **curaduría de testimonios**, con permiso de los veteranos y de las editoriales.
- La visita que **termina en un comercio de la zona**.
- El **aporte verificable** a los veteranos, a la vista de todos.

### Quién paga, en orden de importancia

| #     | Fuente                       | Quién paga                                                      | A cambio de qué                                                                        | Estado                                                                                                                                                    |
| ----- | ---------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Patrocinio de paradas**    | Empresas locales (bodegas, programas de responsabilidad social) | Su nombre en una parada, o duplicar el aporte de los visitantes, visible en la cadena. | Propuesto. Es la fuente más rápida: no depende de presupuestos públicos.                                                                                  |
| **2** | **Rutas para instituciones** | Municipios, turismo, escuelas                                   | Investigación, testimonios con permiso, carteles con QR y un año de mantenimiento.     | Propuesto. Tickets más grandes, pero el sector público compra lento.                                                                                      |
| **3** | **Comisión por canje**       | El comercio                                                     | 2 % de lo que paga el visitante de la ruta. Paga solo cuando le llevamos un cliente.   | Propuesto, no implementado: hoy el canje incluye solo el aporte a los veteranos. Es simbólica al principio, porque cada canje requiere completar la ruta. |

Sobre la venta a un visitante de la ruta, el comercio resigna un 10 % de descuento y, sobre lo que el visitante paga, un 5 % de aporte a los veteranos y un 2 % para Empremta: unos 16 % del ticket, una sola vez por visitante. Lo vamos a validar con comercios reales.

### Cuánto le llega a los veteranos

El **5 % de lo que paga cada visitante que canjea**: con un ticket de ARS 8.000 y el 10 % de descuento, paga ARS 7.200 y al centro le llegan **unos ARS 360**. Al principio es poco, y lo decimos así: el valor inicial es que sus historias se cuenten, y el aporte crece con las visitas.

### Cuánto cuesta operarlo

| Concepto                          | Costo estimado                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Hosting                           | Servidor propio en el piloto; después, USD 5 a 20 por mes en la nube                                  |
| Reservas en Stellar por visitante | 1,5 a 2 XLM (unos USD 0,30 a 0,40). Quedan bloqueadas en la cuenta del visitante                      |
| Comisiones de red                 | 0,00001 XLM por operación: fracciones de centavo                                                      |
| Por cada ruta nueva               | Unos USD 400: carteles mate con QR y traslados. La investigación y los testimonios los hace el equipo |

### Plan de inversión (resumen)

El dinero se pide **por etapas**, y cada etapa tiene una meta para pasar a la siguiente. El detalle, con los ingresos esperados, los escenarios y los supuestos, está en [PLAN_DE_INVERSION.md](PLAN_DE_INVERSION.md).

|                                | Plazo         | Mínimo (sin sueldos) | Con estipendio para el equipo | Meta para pasar al siguiente                                                                                                        |
| ------------------------------ | ------------- | -------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Hito 1 · Piloto real**       | Meses 1 a 3   | USD 980              | USD 3.680                     | Centro de veteranos operando su cuenta · 300 visitas · 5 comercios · 1 carta de intención de un patrocinador y 1 de una institución |
| **Hito 2 · Primeros ingresos** | Meses 4 a 9   | USD 2.460            | USD 7.860                     | 3 paradas patrocinadas · 2 rutas vendidas · 50 rutas completadas por mes                                                            |
| **Hito 3 · Escala**            | Meses 10 a 18 | USD 3.920            | USD 12.020                    | —                                                                                                                                   |

En el escenario mínimo se recupera hacia el mes 9; con estipendio, en unos 3 años. Por eso buscamos que el piloto se financie con fondos no reembolsables, y que lo siguiente se financie cada vez más con ingresos propios.

### Riesgos y cómo los vamos a validar

- **Que nadie pague por patrocinios ni por rutas:** es la hipótesis más importante. El Hito 1 no se da por cumplido sin una carta de intención de un patrocinador y otra de una institución.
- **Que pocas personas completen la ruta:** lo medimos en el piloto. Evaluamos permitir canjes en cada parada, sin exigir las tres.
- **Que el comercio considere alto lo que resigna (unos 16 % del ticket):** lo validamos con Einstein Coffee Club. Si es alto, bajamos el descuento.
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

El e2e imprime hashes reales de: onboarding patrocinado, 3 visitas, fondeo demo, pago atómico con fee-bump y revocación/restauración de HUELLA. Mirá `PROGRESS.md` para los links ya ejecutados.

> **No correr el e2e contra producción:** crea visitantes, hace pagos de prueba y gasta USDC de la tesorería, y todo eso queda en `/transparencia`.

## Control del asset HUELLA

El centro puede suspender una cuenta ante un fraude sin exponer un panel web administrativo:

```bash
npm run revocar -- <G...pubkey>            # suspende la trustline HUELLA
npm run revocar -- <G...pubkey> --restore  # la restaura
```

El script firma una operación clásica `setTrustLineFlags` con `ISSUER`, valida que sea testnet e imprime el link público de la transacción. Una cuenta suspendida no puede recibir ni usar Huellas; la API devuelve `ACCOUNT_REVOKED` con un mensaje humano en español, y `/transparencia` muestra la traza pública de las suspensiones vigentes.

## SEP-1: metadata pública de HUELLA

La API sirve `/.well-known/stellar.toml` con CORS `*`. Describe HUELLA como asset `test`, sin valor monetario, y a Empremta y al Centro de Veteranos como cuentas de demostración, sin afirmar aval institucional.

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

Express sirve la API y `web/dist` en el mismo puerto. En desarrollo, el servidor de Vite reenvía `/api` hacia `http://localhost:3000`.

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

Copiar `.env.example` o, más simple, correr `npm run setup` y completar o usar el `.env` generado.

| Variable                      | Uso                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `HORIZON_URL`                 | Debe ser `https://horizon-testnet.stellar.org` u otra URL testnet                      |
| `USDC_MODE`                   | `mock` para desarrollo; `circle` para la demo con USDC oficial de testnet              |
| `ISSUER_SECRET/PUB`           | Emisor de HUELLA, sponsor y fee source                                                 |
| `CENTRO_SECRET/PUB`           | Cuenta que recibe el aporte del centro                                                 |
| `TREASURY_SECRET/PUB`         | Fondeo demo de visitantes                                                              |
| `MERCHANT_1/2_SECRET/PUB`     | Comercios de prueba                                                                    |
| `USDC_ISSUER_MOCK_SECRET/PUB` | Emisor del USDC mock                                                                   |
| `QR_SECRET`                   | Secreto HMAC para firmar los QR de las paradas                                         |
| `DEMO_MODE`                   | `true` habilita `/api/demo/fund`                                                       |
| `DB_PATH`                     | SQLite; local `./data/app.sqlite`, Railway `/data/app.sqlite`                          |
| `PUBLIC_BASE_URL`             | URL base usada en los QR y en `stellar.toml`                                           |
| `HOME_DOMAIN`                 | Dominio corto opcional para vincular SEP-1 con `ISSUER` mediante `npm run home-domain` |
| `PORT`                        | Puerto HTTP, default `3000`                                                            |

Las variables del canje están en [Canje con aporte del comercio](#canje-con-aporte-del-comercio).

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
4. Configurar las variables de entorno:
   - copiar todos los secretos y pubkeys del `.env` local generado por `npm run setup`;
   - `DB_PATH=/data/app.sqlite`;
   - `PUBLIC_BASE_URL=https://<tu-dominio-de-railway>`;
   - `DEMO_MODE=true` durante la hackathon;
   - `USDC_MODE=circle`, una vez que `TREASURY` esté fondeada en https://faucet.circle.com (hasta entonces, `mock`).
5. Deploy. Verificar `https://<tu-dominio>/api/config` y `/transparencia`.
6. Regenerar los QR con la URL pública si hace falta imprimirlos.

La demo en producción usa `USDC_MODE=circle`, con el emisor oficial de USDC de Circle en testnet.

## Transacciones reales ya verificadas

Las transacciones de testnet más recientes están en `PROGRESS.md`.

Ejemplo del flujo anterior (`/pagar`: pago dividido entre comercio y centro, quema de Huellas y fee-bump, todo en una sola transacción):

https://stellar.expert/explorer/testnet/tx/d2c5b5f8ab4fff642c707d4f9c1775063b0f290c673955dc8bf98606a9e08de3

## Contenido y límites éticos

- **Reseñas de los monumentos:** basadas en fuentes públicas oficiales y periodísticas documentadas en [STORYTELLING.md](STORYTELLING.md) (Municipalidad de la Ciudad de Mendoza, Gobierno de Mendoza, Fuerza Aérea Argentina, Diario UNO, Los Andes, Sitio Andino, Mendoza Post y Cuyo Noticias).
- **Extractos de testimonios en `content/stops.json`:** citas textuales atribuidas del libro _Ecos de Malvinas: 41 años, 41 entrevistas_ (coord. Mariana Cóvolo y Jorge C. Dragonetti; Ediciones Universidad de Congreso — EdiUC, Mendoza, 2023, ISBN `978-987-82840-1-9`, [PDF oficial](https://ediuc.ucongreso.edu.ar/wp-content/uploads/sites/6/2024/05/Malvinas_digital.pags_.2024.ok_.pdf)):
  - Parque Central (`pc`): Miguel Rivero (24/5/2022), p. 75.
  - IV Brigada Aérea, El Plumerillo (`plu`): Fernando Klix Berrotaran (6/10/2020), pp. 157–158.
  - Coquimbito, Maipú (`coq`): Ramón Andrés Suárez (31/1/2023), pp. 150–151.
- Estamos gestionando la autorización de EdiUC; mientras tanto, la app muestra solo fragmentos breves con la cita completa.
- No se inventaron testimonios, citas, biografías ni anécdotas. La validación con veteranos y comerciantes queda documentada en `VALIDACION.md`.

## Canje con aporte del comercio

El flujo principal no pide saldo al visitante. El comercio ingresa el ticket en pesos en `/comercio/:id`, genera un QR de `/canjear` y el visitante canjea 30 Huellas. La transacción Stellar tiene dos operaciones clásicas: quema las Huellas y transfiere el aporte en USDC desde la cuenta custodial del comercio al Centro. La conversión usa `ARS_PER_USDC` como tipo de cambio de referencia y se redondea hacia abajo a 7 decimales.

Variables del canje: `ARS_PER_USDC=1400`, `APORTE_PCT` (vacío usa el porcentaje del comercio), `DESCUENTO_MAX_ARS=2000`, `MAX_TICKET_ARS=50000` (tope del ticket de un canje, que protege el USDC del comercio), `MAX_NEW_WALLETS_PER_IP_PER_DAY=5` y `CLIENT_IP_HEADER` (en producción, por defecto `x-real-ip`: el borde de Railway sobrescribe ese header en cada pedido, así que el cliente no puede falsear su IP; no se confía en `X-Forwarded-For`). El límite de cuentas nuevas se aplica por IP y por día UTC; localhost queda exento solo fuera de producción, para poder correr el e2e local.

El flujo técnico anterior (`/pagar` y "Cargar saldo de prueba") sigue disponible solo como opción avanzada de demostración.
