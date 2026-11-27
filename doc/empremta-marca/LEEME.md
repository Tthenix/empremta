# Empremta — marca completa

**Isotipo:** huella dactilar hecha con el contorno real de las islas Malvinas (Natural Earth, dominio público). Las crestas de afuera son la costa repetida hacia afuera, y las islas llevan crestas en arco adentro.
**Tipografía:** Archivo (Omnibus-Type, Argentina · licencia SIL OFL). En todos los SVG y PDF está convertida a curvas, así que no hace falta instalarla.

## Carpetas
```
logo/svg, logo/png   → logo para pitch, slides, README y redes
web/                 → header, favicon e íconos de la app (PWA)
qr/                  → QR de prueba + generador para los QR reales de cada parada
cartel/              → cartel A4 de parada, listo para imprimir (PDF)
```

## Qué versión usar
| Dónde | Archivo |
|---|---|
| Header de la app (alto 44–56 px) | `web/empremta-header-color.svg` |
| Favicon | `web/favicon.svg` + `web/favicon-32.png` |
| Manifest PWA | `web/icon-192.png`, `web/icon-512.png` |
| iPhone (apple-touch-icon) | `web/apple-touch-icon.png` |
| Slides, README, portada del pitch | `logo/svg/empremta-horizontal-color.svg` o `empremta-vertical-color.svg` |
| Sobre fondo azul | variantes `-negativo` |
| Impresión en una tinta | variantes `-mono` |
| Isotipo solo, de 150 px para arriba | `empremta-isotipo-color` |
| Isotipo solo, por debajo de 150 px | `empremta-isotipo-medio-color` |

**Regla:** el logo con bajada ("huellas de Malvinas en Mendoza") se usa solo de 300 px de ancho para arriba. Por debajo, va el header sin bajada.

## Colores
| Uso | HEX |
|---|---|
| Azul tinta | #1F4E79 |
| Celeste islas | #6CACE4 |
| Celeste sobre fondo oscuro | #9CC9EE |
| Texto secundario | #4A5866 |
| Negro mono | #16202A |
El celeste nunca se usa para texto.

## QR
- `qr/qr-empremta-prueba.*` lleva a https://www.anthropic.com. **Es solo de prueba.**
- Para los QR reales: `python qr/generar_qr.py "<URL firmada de la parada>" parada-pc` (requiere `pip install segno cairosvg`).
- Impreso, mínimo 10 cm de lado (se lee a ~1 m). Siempre oscuro sobre fondo claro y mate.

## Cartel de parada (cartel/cartel-parada-a4.pdf)
Antes de imprimir:
1. Reemplazar el QR de prueba por el QR real de la parada.
2. Completar `[URL CORTA DE LA PARADA]`.
3. El aval del centro de veteranos va **solo si está confirmado**. Si no, borrarlo.
Impresión: A4 (o A3 si va lejos), papel o vinilo **mate**, sin laminado brillante. No pegarlo en el monumento: atril al costado o en mano.
