# PROGRESS — Ruta de la Memoria de Malvinas

## Estado actual
- M0 completo: scaffold ESM Node 20+, `.env.example`, contenido placeholder y setup idempotente de testnet.
- `npm run setup` se ejecutó dos veces seguidas sin romper. La segunda corrida no re-fondeó ni duplicó trustlines.
- `ISSUER` quedó con `auth_required: true` y `auth_revocable: true`.
- M1 completo: onboarding patrocinado verificado contra testnet real. El visitante quedó con 0 XLM, trustlines HUELLA autorizada + USDC y sponsor `ISSUER`.
- M2 completo: registro de visita con firma, código HMAC, anti-duplicado SQLite y mint de 10 HUELLA por parada. E2E llegó a 30 HUELLA y rechazó una repetida.
- M3 completo: fondeo demo una sola vez, pago `2.50` con canje de 30 HUELLA, split atómico exacto, quema a 0 y fee-bump dejando al visitante con 0 XLM.
- M4 completo: API Express + SQLite con las formas de `doc/API_CONTRACT.md`. `npm run e2e -- --http` pasó el flujo completo por HTTP y verificó config, stops, account, merchants, payments y transparencia.
- M7 completo: `npm run qr` generó 3 PNG y un PDF imprimible en `dist/qr/`; `docker build` y `docker run` + smoke `/api/config` pasaron. README documenta local, Docker y Railway.

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
