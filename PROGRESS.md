# PROGRESS — Ruta de la Memoria de Malvinas

## Estado actual
- M0 completo: scaffold ESM Node 20+, `.env.example`, contenido placeholder y setup idempotente de testnet.
- `npm run setup` se ejecutó dos veces seguidas sin romper. La segunda corrida no re-fondeó ni duplicó trustlines.
- `ISSUER` quedó con `auth_required: true` y `auth_revocable: true`.

## Transacciones reales de testnet
- Flags de ISSUER: https://stellar.expert/explorer/testnet/tx/32d3d8c8d88523712e16da7216b04f4967e1091f12b57659dd1f64d740c72216
- Trustline USDC CENTRO: https://stellar.expert/explorer/testnet/tx/0565f7f76a895e2b525d2b432929602e4a11c2f38d35cf4e8ab2e9aff6771a68
- Trustline USDC TREASURY: https://stellar.expert/explorer/testnet/tx/9064db7966ede456e8a1c29e8be48fd1d42e2de087d21c0d54cf7ec8cc47339d
- Trustline USDC MERCHANT_1: https://stellar.expert/explorer/testnet/tx/52b820ccd40ac4c0325d4943b2649ec141e9b16bfc90f0377c8ebe8274b7b271
- Trustline USDC MERCHANT_2: https://stellar.expert/explorer/testnet/tx/d09dd982a22156ba37aeeb293d1dc3e9271975c2c340b355b5357a6e8c2ba6b1
- Emisión inicial USDC mock a TREASURY: https://stellar.expert/explorer/testnet/tx/6b9a07c28f93b3e4d2118f5ecaeac524cc20a7213870e0174d5fafd034fadaea

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
