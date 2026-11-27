## Guión de 3 minutos: canje

1. Mostrar la ruta y registrar una visita: la Huella queda en Stellar sin instalar nada.
2. En “Mis huellas”, explicar que al completar las tres paradas se habilita el descuento. La clave local sigue disponible como respaldo manual.
3. Abrir `/comercio/m1`, ingresar un ticket de $10.000 y generar el canje. La caja queda “Esperando canje…”.
4. Escanear el QR con el celular o abrir `/canjear?...`: mostrar ticket, descuento de $1.000, total a pagar en el comercio de $9.000 y aporte del comercio de 0.3214285 USDC al Centro (tipo de referencia $1.400).
5. Tocar “Canjear mis Huellas”. En la misma transacción se queman 30 Huellas y el comercio aporta USDC. La caja cambia a “Huellas canjeadas” y muestra el enlace de Stellar.
6. Cerrar en Transparencia: el aporte aparece como “Aporte del comercio por canje”. El visitante nunca necesitó XLM ni USDC.

### Respaldo técnico (solo si preguntan)

`/pagar` y “Cargar saldo de prueba” siguen funcionando como demo avanzada del flujo USDC original.

# DEMO — guion de 3 minutos

Objetivo: mostrar que una visita a lugares de memoria se convierte en apoyo económico verificable para veteranos, sin que la persona visitante tenga que entender cripto.

## Preparación (antes de filmar)

1. Levantar la app integrada:
   ```bash
   npm ci
   npm run setup
   npm run build
   npm start
   ```
2. Abrir dos contextos de navegador distintos:
   - **Visitante:** navegador normal o celular.
   - **Comercio:** ventana de incógnito u otro navegador.
3. Confirmar que el servidor responde:
   - `http://localhost:3000/api/config`
   - `http://localhost:3000/transparencia`
4. Si se filma con URL pública, reemplazar `http://localhost:3000` por esa URL y regenerar los QR con `npm run qr`.

## URLs de paradas para la demo local

Estas URLs equivalen a escanear los QR impresos **con el `.env` actual de esta worktree**. Si se regenera `QR_SECRET` o se despliega en otra URL, usar los enlaces que imprime `npm run qr` en el PDF/PNG y reemplazar el dominio:

- Parque Central / pc: `http://localhost:3000/v/pc?c=607fa0c7fbacfcbe`
- Plaza Uncal / plu: `http://localhost:3000/v/plu?c=8674be7638a7b6cb`
- Coquimbito / coq: `http://localhost:3000/v/coq?c=fa1850502e99d539`

## Guión

### 0:00–0:20 — La idea

Abrir `http://localhost:3000/` en el navegador del visitante.

Decir:

> “Esta es una ruta de memoria de Malvinas en Mendoza. En cada parada la persona lee una historia y deja registrado su paso. Ese registro no es solo simbólico: después se transforma en apoyo económico verificable para veteranos.”

Mostrar el mapa y aclarar que los textos históricos actuales son placeholders hasta validar testimonios reales.

### 0:20–1:05 — Visita y prueba on-chain

1. Abrir la URL de `pc`.
2. Tocar **“Dejar mi huella”**.
3. Mostrar la pantalla **“Dejaste tu huella”**: las 3 huellas de progreso, el botón al próximo lugar y el link **“Ver el registro público”** (Stellar).
4. Repetir rápido con `plu` y `coq`.

Decir:

> “La cuenta y las trustlines fueron patrocinadas. La persona no pagó gas ni copió una frase secreta. La clave queda en su navegador; el servidor nunca la recibe.”

### 1:05–1:30 — Recorrido y saldo demo

1. Abrir `http://localhost:3000/recorrido`.
2. Mostrar `30` Huellas.
3. Tocar **“Cargar saldo de prueba”**.
4. Mostrar que el saldo de prueba aparece y que el recorrido explica el canje.

Decir:

> “En la hackathon usamos USDC de testnet. El fondeo demo existe solo para que cualquiera pueda probar el flujo.”

### 1:30–2:15 — Cobro en comercio

1. En el navegador del comercio abrir `http://localhost:3000/comercio/m1`.
2. Dejar monto `2.50` y tocar **“Generar cobro”**.
3. Copiar la URL `/pagar?...` generada o escanear el QR con el navegador/celular del visitante.
4. En el visitante, mostrar el desglose antes de confirmar:
   - total original;
   - descuento por 30 Huellas;
   - parte para el comercio;
   - parte para el Centro de Veteranos.
5. Confirmar el pago.
6. Volver a la ventana del comercio y esperar el estado **“Pago recibido”**.

Decir:

> “Acá está la parte que una base de datos no reemplaza: el pago al comercio, el aporte al centro y la quema de Huellas ocurren en una sola transacción atómica. Además el servidor envuelve la transacción en fee-bump, así que el visitante sigue con 0 XLM.”

### 2:15–2:45 — Transparencia pública

Abrir `http://localhost:3000/transparencia`.

Mostrar:

- total recibido por el centro;
- desglose por comercio;
- lista de aportes;
- link a stellar.expert de la transacción recién hecha.

Decir:

> “Cualquiera puede auditar que el aporte llegó. No depende de confiar en nuestra base de datos.”

### 2:45–3:00 — Cierre y honestidad del prototipo

Decir:

> “Los contenidos históricos todavía son placeholders porque no vamos a inventar testimonios. El próximo paso humano es validar el tono con veteranos, reemplazar los textos por historias cedidas con permiso y probar con un comercio real. La infraestructura ya funciona de punta a punta en Stellar testnet.”

## Paso opcional de 30 segundos — control del centro sobre HUELLA

Preparación: tener a mano la clave pública de una cuenta visitante descartable (el e2e imprime una en cada corrida) y una URL de parada válida.

1. **0–10 s:** en una terminal, suspenderla:
   ```bash
   npm run revocar -- <G...pubkey>
   ```
   Mostrar el link de Stellar que imprime y, en `/transparencia`, la sección discreta “Cuentas suspendidas por el centro”.
2. **10–20 s:** intentar registrar la visita con esa cuenta. La app muestra: “Esta cuenta fue suspendida por el Centro de Veteranos”.
3. **20–30 s:** restaurarla y repetir la visita:
   ```bash
   npm run revocar -- <G...pubkey> --restore
   ```

Decir:

> “HUELLA no es un punto editable en una base: el emisor puede autorizar o suspender cuentas con una operación pública de Stellar. No hicimos un panel administrativo web porque sería una superficie de ataque innecesaria para esta demo.”

## Links de evidencia técnica

Si falla la red durante la filmación, usar los hashes reales ya verificados en `PROGRESS.md`, especialmente el pago atómico:

https://stellar.expert/explorer/testnet/tx/d2c5b5f8ab4fff642c707d4f9c1775063b0f290c673955dc8bf98606a9e08de3
