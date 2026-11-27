# PROGRESS — Ruta de la Memoria de Malvinas

## Estado actual
- M0 completo: scaffold ESM Node 22+, `.env.example`, contenido placeholder y setup idempotente de testnet.
- `npm run setup` se ejecutó dos veces seguidas sin romper. La segunda corrida no re-fondeó ni duplicó trustlines.
- `ISSUER` quedó con `auth_required: true` y `auth_revocable: true`.
- M1 completo: onboarding patrocinado verificado contra testnet real. El visitante quedó con 0 XLM, trustlines HUELLA autorizada + USDC y sponsor `ISSUER`.
- M2 completo: registro de visita con firma, código HMAC, anti-duplicado SQLite y mint de 10 HUELLA por parada. E2E llegó a 30 HUELLA y rechazó una repetida.
- M3 completo: fondeo demo una sola vez, pago `2.50` con canje de 30 HUELLA, split atómico exacto, quema a 0 y fee-bump dejando al visitante con 0 XLM.
- M4 completo: API Express + SQLite con las formas de `doc/API_CONTRACT.md`. `npm run e2e -- --http` pasó el flujo completo por HTTP y verificó config, stops, account, merchants, payments y transparencia.
- M7 completo: `npm run qr` generó 3 PNG y un PDF imprimible en `dist/qr/`; `docker build` y `docker run` + smoke `/api/config` pasaron. README documenta local, Docker y Railway.
- Integración completa: `feat/ruta-memoria-web` mergeado sin conflictos, `npm run build` OK, `npm start` sirvió `/`, `/transparencia` y `/api/config`, y Docker final construye el frontend real y pasa smoke en contenedor.
- Compatibilidad de integración verificada: una corrida HTTP completa usó la serialización `Uint8Array` del navegador en la primera firma de visita y el backend la verificó criptográficamente sin cambiar el contrato base64.


## Transacciones reales de testnet
- Flags de ISSUER: https://stellar.expert/explorer/testnet/tx/32d3d8c8d88523712e16da7216b04f4967e1091f12b57659dd1f64d740c72216
- Trustline USDC CENTRO: https://stellar.expert/explorer/testnet/tx/0565f7f76a895e2b525d2b432929602e4a11c2f38d35cf4e8ab2e9aff6771a68
- Trustline USDC TREASURY: https://stellar.expert/explorer/testnet/tx/9064db7966ede456e8a1c29e8be48fd1d42e2de087d21c0d54cf7ec8cc47339d
- Trustline USDC MERCHANT_1: https://stellar.expert/explorer/testnet/tx/52b820ccd40ac4c0325d4943b2649ec141e9b16bfc90f0377c8ebe8274b7b271
- Trustline USDC MERCHANT_2: https://stellar.expert/explorer/testnet/tx/d09dd982a22156ba37aeeb293d1dc3e9271975c2c340b355b5357a6e8c2ba6b1
- Emisión inicial USDC mock a TREASURY: https://stellar.expert/explorer/testnet/tx/6b9a07c28f93b3e4d2118f5ecaeac524cc20a7213870e0174d5fafd034fadaea
- Onboarding patrocinado de visitante M1: https://stellar.expert/explorer/testnet/tx/4f2509426bc058cf0eb7df6e2f56b047f4fe2a6db93a95bf44cb0124801bd3cf
- Cuenta visitante M1: https://stellar.expert/explorer/testnet/account/GB6WOWE57JQZBVTXRZMM3OYAYXNNHXWUZXVTOS2MFVDQVNLEY4Q7V5TO
- Onboarding visitante M2: https://stellar.expert/explorer/testnet/tx/1d259816a8d54cf100484459a93bfca7410a61955a18a0a6b9e7f66d230d0f63
- Visita `pc`: https://stellar.expert/explorer/testnet/tx/b19ea501bf7adfe666cdff56962880eefcaba2de7a1d1500ddc9c7646a3547eb
- Visita `plu`: https://stellar.expert/explorer/testnet/tx/ff3e637c26b1fa1637d9e726a69592310b1931aec77bd56d9fbbc3fa2661c8d9
- Visita `coq`: https://stellar.expert/explorer/testnet/tx/f1e4e6e05d43b37f89078261ea03aed85f99653f0bf391ef5dc9ff532a31702d
- Cuenta visitante M2: https://stellar.expert/explorer/testnet/account/GBQKDHPRBOT3KUJD66V6755P4WWKILXD6T4UQDW6WKCGX6WW3UFCA7J2
- Onboarding visitante M3: https://stellar.expert/explorer/testnet/tx/b82537f8c5a43abe270b9ee21a92dc80f61ecd2a08d62c1e7bcd462cba37e059
- Visitas M3: https://stellar.expert/explorer/testnet/tx/6f6dbd81702165b2ed97ce013ef75ab8a284ef734d25d9624768f7a6a97702bd · https://stellar.expert/explorer/testnet/tx/a4b742eb2acdf93241c2484352563a9aac8050a91f68ab41215182b68a0c38cb · https://stellar.expert/explorer/testnet/tx/60713553805bb7b9df6d35a32a18887558031b72506ca9cfbf09dbcbf5d6a393
- Demo fund M3: https://stellar.expert/explorer/testnet/tx/62b01b7dd90bc84dbd4c3757e8a7503d8ee34dfb160cf188957c1eabc00fdb18
- Pago atómico con quema y fee-bump M3: https://stellar.expert/explorer/testnet/tx/714f2c45a76446b1a0076f2cc660723c6a11c28bbe907fd7ef2b56b95f52e362
- Cuenta visitante M3: https://stellar.expert/explorer/testnet/account/GCJITEDA6KTQOWYCLFX4VYGSUHSPQZ7DUFT7V4XQ5PKBX54J7T3MACRK
- Onboarding HTTP M4: https://stellar.expert/explorer/testnet/tx/2026a4b0ffee6a2548486597102d02f8f2389ac83a8fcaa0a368eb2c0f3f54d5
- Visitas HTTP M4: https://stellar.expert/explorer/testnet/tx/5fb024041ea0819dd180a18a6c62e3c549536a26fbbe2f533f68351b744cfabd · https://stellar.expert/explorer/testnet/tx/0f9ddceedf2555a5f5f70cedc6f0344cdc7546819cc6b72b73cf1b5b4337df29 · https://stellar.expert/explorer/testnet/tx/9a0b9bc8e35a77b8b1d480c14aeafd88e59993a98b84b3edf87ddd941cf44bd9
- Demo fund HTTP M4: https://stellar.expert/explorer/testnet/tx/70888427261858c949a987f15e2c13fc2ca49354cd6d72a520accfa65668ca4a
- Pago HTTP M4 con fee-bump: https://stellar.expert/explorer/testnet/tx/21dc16c97e23d080948391ca0054afead053a13b034310bfbc09f3437bb5e122
- Cuenta visitante M4: https://stellar.expert/explorer/testnet/account/GCGONNVGJOAQX7A5QJYQMVICYHERA5EQLH2EIUJJGY4ZU2H2LWCE3ZYF
- Re-verificación HTTP tras actualizar dependencias/Express: pago https://stellar.expert/explorer/testnet/tx/07d930d972f34be13c232182a72a3156cb2c91e255931f4e2ad2a67f23eec35a
- Cuenta de esa re-verificación: https://stellar.expert/explorer/testnet/account/GCY7KOYPQASE5MXEQZYAOBGPJFB6TJDQXK2TVOSJHBFC6L7R2GLWT73T

## Última verificación integral HTTP (testnet real)
- Cuenta visitante: https://stellar.expert/explorer/testnet/account/GDCEBSHW2WUQPGCNJUDE3HLIPDG65S6WPPWHSMPWNTGIOP2U3SDPGXHJ
- Onboarding patrocinado: https://stellar.expert/explorer/testnet/tx/90e2c8b3e56783f2f1523923f42769e9cc838215b265679ad24729d828dbcd32
- Visitas: https://stellar.expert/explorer/testnet/tx/dfd76fbab09c991e910087a6299551dd30ed0e7d53539755094794c02673face · https://stellar.expert/explorer/testnet/tx/ea6b795555ef04ff4c6362e821286af7501facbe3d99d692b04145cd45544acf · https://stellar.expert/explorer/testnet/tx/f791d49342c7e158e2b0d25020d2a5a812cc961488bb8c9463f2acdd2253f62d
- Fondeo demo: https://stellar.expert/explorer/testnet/tx/229db8f76e8215c3d16c489065103e8bc5bf6adaf09f8d82a63244eb7d838e68
- Pago atómico con split, quema y fee-bump: https://stellar.expert/explorer/testnet/tx/d2c5b5f8ab4fff642c707d4f9c1775063b0f290c673955dc8bf98606a9e08de3
- Resultado verificado por el e2e: comercio `+2.1375000`, centro `+0.1125000`, HUELLA del visitante `0.0000000`, XLM del visitante `0.0000000`.

## Tareas humanas pendientes (SPEC §17)
- [ ] Contactar a Veteranos Unidos por Malvinas de Mendoza u otro centro de veteranos; pedir 2 o 3 historias reales, permiso de publicación y que un veterano pruebe la app.
- [ ] Preguntar directamente a un veterano si “juntar Huellas” en un memorial le parece respetuoso; ajustar el lenguaje si hace falta.
- [ ] Conseguir 1 comercio real cerca del Parque Central o en Maipú.
- [ ] Verificar las coordenadas reales de las 3 paradas.
- [ ] Sacar fotos propias de los lugares.
- [ ] Fondear `TREASURY` en faucet.circle.com y pasar `USDC_MODE=circle`.
- [ ] Ir al Memorial con el QR impreso en la mano; no pegar nada en el monumento.
- [ ] Probar con una persona externa en el lugar y filmarla con permiso.
- [ ] Probar cobro con el comercio.
- [ ] Completar `VALIDACION.md`, grabar el video y entregar en Apex antes de las 22:00.

## Verificación noche 2 — UX polish + investigación (2026-11-27)
- `npm --prefix web run build`: OK. Bundle inicial `index` 296.97 kB minificado / 94.32 kB gzip; `wallet` diferido 292.92 kB / 71.26 kB gzip; `StopMap` diferido 153.77 kB / 45.16 kB gzip.
- `npm run e2e -- --http`: OK contra testnet real. Resultado final del script: `M1+M2+M3+M4 HTTP OK`.
- Flujo e2e: onboarding, 3 visitas, rechazo de visita repetida, fondeo demo, desglose previo, pago fee-bump, verificación de contratos HTTP.
- Desglose e2e verificado antes de firmar: total cobro `2.5000000`; descuento `0.2500000`; total pagado `2.2500000`; comercio `+2.1375000`; centro `+0.1125000`; HUELLA final `0.0000000`; XLM visitante `0.0000000`.
- Pago e2e noche 2: https://stellar.expert/explorer/testnet/tx/598c415c11975970ce1fbf27ff1293dfaaf5bac11f6e528da95e23e0ec861cd0
- Cuenta visitante e2e noche 2: https://stellar.expert/explorer/testnet/account/GBIHW4P4X2QAJ5JESVSE4KKEQ3S2H2WH7HXWRVPDQBQMRHWX4L7PUUZ5
- Repaso manual posterior a cambios a 375 px (`/`, `/v/pc`, `/recorrido`, `/pagar`, `/comercio/m1`, `/transparencia`, `/acerca`): sin overflow horizontal; acciones principales miden 55 px de alto.
- Comprobación equivalente a zoom 200 % sobre viewport desktop de 1280 px (layout a 640 CSS px): las mismas 7 pantallas no presentan overflow horizontal.
- Detector manual Impeccable sobre archivos web modificados: `[]` (sin hallazgos mecánicos).

## Verificación ronda 3 — integración de marca y calidad visual (2026-11-27)
- `npm --prefix web run build`: OK. Bundle inicial `index` 297.95 kB minificado / 94.64 kB gzip; CSS principal 20.71 kB / 4.43 kB gzip; `wallet` diferido 292.92 kB / 71.26 kB gzip; `StopMap` diferido 153.77 kB / 45.16 kB gzip.
- `npm run e2e -- --http`: OK contra testnet real. Resultado final del script: `M1+M2+M3+M4 HTTP OK`.
- Flujo e2e: onboarding patrocinado, 3 visitas, rechazo de visita repetida, fondeo demo, desglose previo, pago fee-bump y verificación de contratos HTTP.
- Desglose e2e verificado antes de firmar: total cobro `2.5000000`; descuento `0.2500000`; total pagado `2.2500000`; comercio `+2.1375000`; centro `+0.1125000`; HUELLA final `0.0000000`; XLM visitante `0.0000000`.
- Cuenta visitante e2e ronda 3: https://stellar.expert/explorer/testnet/account/GDUWGRNQLNVD5GBFPTCVE4KDIGE7YAEL3DIUCEQMBLKXJ6NW6ZMZIDVV
- Onboarding e2e ronda 3: https://stellar.expert/explorer/testnet/tx/1787539a31b7b7b59f5685617b5d21ad0670fdf3cc67b0470143211ae0f0adc5
- Pago e2e ronda 3: https://stellar.expert/explorer/testnet/tx/14672353cbcaa38a7d31d4844159e8583e2a566778006880849e91c29f059700
- Recorrido renderizado posterior al build final a 375×812 y desktop 1280×900 en `/`, `/v/pc`, `/recorrido`, `/pagar`, `/comercio/m1`, `/transparencia` y `/acerca`: las 7 pantallas sin overflow horizontal.
- Verificación visual adicional: la acción “Registrar mi visita” queda dentro del primer viewport desktop en `/v/pc`; foco visible definido con outline de 3 px; `prefers-reduced-motion` reduce transiciones/animaciones globalmente.
- Detector mecánico Impeccable final sobre los archivos web modificados: `[]` (sin hallazgos).
- Tabla numérica de contraste AA de la paleta de marca: `web/UX-AUDIT.md`, sección “Ronda 3 — integración de marca y verificación de contraste”.

## Verificación ronda 4 — features verificables F1–F4 (2026-11-27)
- Commits: `947d7ce feat(transparency)`, `b0b8d4a feat(issuer)`, `0b87f73 feat(stop)`, `3c6ca53 feat(qr)`.
- `npm run build`: OK. Bundle inicial `index` 297.95 kB minificado / 94.64 kB gzip; CSS principal 21.42 kB / 4.55 kB gzip; `wallet` diferido 292.92 kB / 71.26 kB gzip; `StopMap` diferido 153.77 kB / 45.16 kB gzip.
- `npm run e2e -- --http`: OK contra testnet real. Resultado final del script: `M1+M2+M3+M4+F1+F2 HTTP OK`.
- Cuenta visitante principal: https://stellar.expert/explorer/testnet/account/GBP6QL5F6BK3XEUHZJBRAEVH75OG64AJZBJ2VSIGTGQZRB4BYJ3G6RCJ
- Onboarding patrocinado: https://stellar.expert/explorer/testnet/tx/fe30ee6e603f6b93c68217b9c7725745223ae2aeda9e0acb8e51a109da13ff94
- Visitas: https://stellar.expert/explorer/testnet/tx/672a44e02b39d4d69c64d70d807661d1bdfa6b1fbbb5417914040c8a2f5639b1 · https://stellar.expert/explorer/testnet/tx/cca5ffe38d99e1c17b7ec30bb5e6e6d6cc2430f3054df7e8d4c9d0a9a5fca9dd · https://stellar.expert/explorer/testnet/tx/62ea03938ce28eae679c6a23e9fbebe10d7586ae9421c7c88e9ad8f109ae25ad
- Fondeo demo: https://stellar.expert/explorer/testnet/tx/47aa783c8a8e3b16aa6aaa6b45867b2bd053444f822eab105421d4c4d3411afc
- Pago atómico con split, quema y fee-bump: https://stellar.expert/explorer/testnet/tx/2e1523d33c550867131bc528e59e7eb6a8a8f2bc49b8f07bd871346d3509193d
- F1 verificado por e2e: `/api/transparencia` respondió `onChain.source === "horizon"`; el último pago e2e apareció en `onChain.lista` y el total on-chain cubrió el total del centro.
- Cuenta de revocación: https://stellar.expert/explorer/testnet/account/GDGIGY2OHHPPZUDCQVC4SGJ2IVHIT5BKYI3WBUGSKFHOGCBSXD5GWR5U
- Revocación HUELLA: https://stellar.expert/explorer/testnet/tx/7e5ef6e4812e089d9b2bd66d420774c9038d10f793aee86f8dc7c84eec7ad193
- Restauración HUELLA: https://stellar.expert/explorer/testnet/tx/c752d5de015fc37196426d077de5219d8c00703aedb523910591027f4a8b78a4
- Visita posterior a restauración: https://stellar.expert/explorer/testnet/tx/05479a4b36e06264dd1a02e31c2dc050ebff9486e3ae103b9cdc0692fa30d951
- F2 verificado por e2e: la cuenta suspendida apareció en la traza pública; visita y pago con Huellas fueron rechazados con `ACCOUNT_REVOKED`; tras `--restore`, una visita real volvió a minter 10 HUELLA.
- Carteles generados con `PUBLIC_BASE_URL=https://empremta-production.up.railway.app npm run qr`. `qr-paradas-ruta-memoria.pdf` tiene 1 página y `carteles-ruta-memoria.pdf` tiene 3 páginas.
- Ambos PDF fueron renderizados e inspeccionados. Decodificación QR desde el PDF original: `/v/pc?c=607fa0c7fbacfcbe`, `/v/plu?c=8674be7638a7b6cb`, `/v/coq?c=fa1850502e99d539`, todos bajo `https://empremta-production.up.railway.app`. Decodificación equivalente desde los 3 carteles individuales.
- Recorrido visual exacto por CDP en `/transparencia` y `/v/pc`: 375×812 (`innerWidth=375`, `scrollWidth=375`, sin overflow horizontal) y 1280×900 (sin overflow horizontal). En `/v/pc` el botón de escucha no aparece porque el relato sigue placeholder, como exige la regla de no leer placeholders.
