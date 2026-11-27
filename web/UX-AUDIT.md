# Auditoría UX/UI — Ruta de la Memoria

Fecha: 2026-11-27  
Alcance: recorrido manual de `/`, `/v/pc?c=…`, `/recorrido`, `/pagar?m=m1&monto=2.50&ref=TEST1234`, `/comercio/m1`, `/transparencia` y `/acerca` en viewport móvil 375×812 y desktop ~1280×900, contra `npm start` local y API real de testnet. También se revisó el árbol de accesibilidad y se midieron contrastes de los tokens CSS.

## Lectura general

La base es sobria y correcta: lenguaje respetuoso, fondo claro, tipografía legible, placeholders visibles y botones reales. El problema principal no es estético sino de prioridad de información: en las pantallas críticas la acción o la prueba de transparencia queda demasiado abajo, y algunos estados asíncronos no explican con calma qué está pasando.

## Hallazgos ordenados por impacto

### P1 — `/transparencia`: la pantalla del pitch no muestra suficiente evidencia en el primer viewport

1. **Problema:** en 375 px aparece una barra de desplazamiento horizontal y la tabla de pagos queda fuera del primer viewport. En desktop, la tabla recién empieza al final de la primera pantalla. Una persona del jurado no ve de inmediato “cada pago con Ver en Stellar”.  
   **Fix:** convertir los pagos a tarjetas/lista en móvil, evitar overflow, compactar el hero y dejar visible al menos el primer aporte sin scroll en desktop.
2. **Problema:** la explicación dice que es verificable, pero no explica por qué en una línea entendible sin cripto.  
   **Fix:** agregar una frase directa: “Stellar es un registro público: cualquiera puede abrir el enlace de una operación y comprobar que la plata llegó a esta cuenta.”
3. **Problema:** el total es grande y claro, pero la cuenta y los pagos compiten con mucho espacio vacío.  
   **Fix:** mantener el total grande, agrupar cuenta/pagos/verificación en una tarjeta más compacta y jerarquizada.
4. **Problema:** el estado vacío está dividido en dos mensajes (“aportes” y “cuando haya pagos…”) y no usa la frase simple pedida.  
   **Fix:** estado único y visible: “Todavía no hay pagos registrados”, con una segunda línea explicativa.
5. **Problema:** los montos se muestran con dos decimales; en operaciones con centavos parciales puede parecer que las partes no suman.  
   **Fix:** formatear montos USDC con hasta 7 decimales y recortar ceros finales, para que `al comercio + al centro` coincida visualmente con el total.

### P1 — `/pagar`: el desglose existe, pero falta el dato que la persona realmente paga

6. **Problema:** la lista muestra total del comercio, descuento y destinos, pero no muestra explícitamente “Total que pagás”.  
   **Fix:** agregar una fila destacada “Total que pagás” entre el descuento y la distribución.
7. **Problema:** con `2.50`, el redondeo a dos decimales muestra `2,38 + 0,13`, que parece sumar `2,51`.  
   **Fix:** usar formato exacto de hasta 7 decimales con ceros finales recortados (`2,375` y `0,125`).
8. **Problema:** el comercio y la referencia aparecen como texto suelto debajo del desglose; `[COMERCIO PENDIENTE]` no parece identificación del cobro.  
   **Fix:** mover “Cobro de … · Ref. …” arriba como contexto del pago y marcar el placeholder como dato pendiente.
9. **Problema:** el descuento deshabilitado no explica por qué no se puede usar.  
   **Fix:** agregar texto auxiliar: “Necesitás 30 Huellas para usar este descuento” o “Se usarán 30 Huellas”.
10. **Problema:** el botón no ocupa el ancho disponible en móvil y el estado “Confirmando…” no describe la espera de red.  
    **Fix:** botón primario full-width en móvil, con estado “Confirmando en la red…” y `aria-live`.
11. **Problema:** la confirmación final cambia de pantalla sin un anuncio de estado claramente asociado.  
    **Fix:** envolver el resultado en `role="status" aria-live="polite"` y conservar link a Stellar como acción principal secundaria.

### P1 — `/v/:stopId`: el QR abre con un gran rectángulo vacío y la acción queda abajo

12. **Problema:** si no hay foto, un bloque celeste vacío de 160 px ocupa el primer viewport sin comunicar nada; en 375 px el botón queda cortado al final de la pantalla.  
    **Fix:** reemplazarlo por una tarjeta compacta “Fotografía pendiente” (o eliminar el espacio visual muerto) y subir la historia/acción.
13. **Problema:** “Registrar mi visita” no es suficientemente dominante ni ocupa todo el ancho del pulgar en móvil.  
    **Fix:** botón primario full-width, en una tarjeta de acción visible antes o inmediatamente después del contenido.
14. **Problema:** el texto “Se crea una billetera en tu celular” introduce una palabra técnica sin necesidad y no explica la espera.  
    **Fix:** copy transparente sin jerga: “La primera vez se prepara tu registro en este celular. Puede tardar unos segundos; no tenés que instalar nada.”
15. **Problema:** durante onboarding/registro el único feedback es “Registrando…”, sin distinguir preparación inicial, geolocalización y confirmación de red.  
    **Fix:** estado de progreso calmado y anunciado con `aria-live`: “Preparando tu registro…”, “Ubicando tu visita…”, “Confirmando en la red…”.
16. **Problema:** no hay tratamiento de movimiento reducido porque casi no hay transiciones; al agregar feedback hay que hacerlo sin animación celebratoria.  
    **Fix:** solo fade/transition corta de estado y regla global `prefers-reduced-motion`.

### P2 — `/` y `/recorrido`: el progreso y el canje no son escaneables

17. **Problema:** “Visitaste 0 de 3 lugares” y “Huellas: 0” son texto plano; no hay sensación visual de progreso ni siguiente paso.  
    **Fix:** barra de progreso sobria o pasos 1/3, y texto del próximo paso (“Escaneá el QR de la primera parada”).
18. **Problema:** la explicación de Huellas está en una sola línea, pero no explica el canje en Inicio.  
    **Fix:** una línea adicional: “Con 30 Huellas se habilita un descuento en comercios adheridos.”
19. **Problema:** el mapa ocupa gran parte del viewport antes de la lista de paradas.  
    **Fix:** reducir altura en móvil y dar más jerarquía a la lista accionable; el mapa queda como apoyo.
20. **Problema:** `/recorrido` muestra saldos pero no repite “Visitaste X de 3 lugares”.  
    **Fix:** agregar tarjeta de progreso arriba de saldos.
21. **Problema:** el estado vacío dice “escaneá el QR” pero no ofrece una acción segura dentro de la app.  
    **Fix:** incluir enlace “Ver las paradas” hacia `/` o lista de paradas.

### P2 — `/comercio/:id`: el QR es grande, pero el estado en vivo queda escondido

22. **Problema:** después de generar el cobro, “Esperando pago…” queda debajo del QR y fuera del viewport en 375 px.  
    **Fix:** mover el estado en vivo arriba del QR, con texto grande y `aria-live`; el QR sigue grande pero sin URL visible salvo detrás de un detalle.
23. **Problema:** la URL completa del cobro ensucia la pantalla y no ayuda al comercio.  
    **Fix:** ocultarla en un `<details>` o texto secundario colapsable.
24. **Problema:** `[COMERCIO PENDIENTE]` no está marcado visualmente como placeholder.  
    **Fix:** usar el mismo tratamiento de placeholder visible que en paradas/transparencia.

### P1 — Accesibilidad transversal

25. **Problema:** `--celeste-deep: #3d7a9c` sobre `--bg` mide 4.46:1, apenas por debajo de AA para texto normal.  
    **Fix:** oscurecer el token a un valor medido ≥4.5:1 (por ejemplo `#356e8e`, 5.27:1) manteniendo el acento sobrio.
26. **Problema:** varios textos secundarios usan `0.95rem` (17.1 px) y la tabla usa `0.95rem`; el requisito es base 18 px y audiencia mayor de 60 años.  
    **Fix:** llevar textos funcionales a 1rem; solo metadatos no críticos pueden quedar en 16 px como mínimo.
27. **Problema:** los links de navegación tienen altura efectiva menor a 48 px.  
    **Fix:** padding vertical suficiente para objetivos ≥48 px.
28. **Problema:** los enlaces “Ver en Stellar” usan 44 px de altura, no 48 px.  
    **Fix:** subir a 48 px o envolver en botones/enlaces con min-height 48.
29. **Problema:** no se verificó aún zoom 200% tras cambios.  
    **Fix:** revisión manual final a 200%; evitar overflow y mantener botones visibles.

### P2 — Performance móvil

30. **Problema:** el bundle principal actual pesa ~615 kB sin comprimir porque Stellar SDK, QR y páginas entran de una.  
    **Fix:** code-splitting por ruta y carga dinámica de Stellar/QR donde sea posible, sin alterar contratos ni flujo.

## Puntuación técnica inicial (Impeccable audit)

| Dimensión | Puntaje | Hallazgo clave |
|---|---:|---|
| Accesibilidad | 2/4 | Contraste del acento apenas bajo AA; textos funcionales <18 px; nav <48 px |
| Performance | 2/4 | Bundle principal pesado para Android de gama media |
| Theming | 3/4 | Tokens coherentes, aunque el acento necesita ajuste de contraste |
| Responsive | 2/4 | Overflow/horizontal scroll en transparencia y acción clave baja en parada |
| Integridad de implementación | 3/4 | Detector Impeccable sin hallazgos mecánicos; drift principalmente de jerarquía/estado |
| **Total** | **12/20** | **Aceptable; requiere trabajo significativo antes del pitch** |

## Notas positivas

- Tono memorial correcto: no hay gamificación ni lenguaje celebratorio.
- Placeholders históricos visibles y sin contenido inventado.
- Controles semánticos reales (`button`, `label`, links) y skip link presente.
- El QR de cobro es grande y escaneable.
- La pantalla de pago ya muestra la separación comercio/centro antes de firmar.

## Estado posterior al polish (2026-11-27)

Resueltos:

- `/transparencia`: sin overflow a 375 px; explicación de verificabilidad en una línea; total sobrio; pagos como lista con “Ver en Stellar”; estados vacíos explícitos; montos exactos.
- `/pagar`: comercio/referencia arriba; fila “Total que pagás”; ayuda del descuento; montos exactos; botón full-width y estado con `aria-live`.
- `/v/:stopId`: placeholder de fotografía compacto; botón visible en el primer viewport a 375 px; progreso de preparación/ubicación/registro anunciado con `aria-live`.
- `/` y `/recorrido`: progreso visual sobrio, explicación de Huellas/canje y acción para ver paradas.
- `/comercio/:id`: estado “Esperando pago…” arriba del QR; URL secundaria colapsable; placeholder de comercio visible.
- Accesibilidad: acento `#356e8e` medido a 5.27:1 sobre fondo y 5.57:1 sobre blanco; base 18 px; navegación y links de transacción con objetivo ≥48 px; regla `prefers-reduced-motion` global.
- Performance: rutas secundarias divididas; QR solo en ruta de comercio; mapa diferido; SDK Stellar diferido dentro del límite `api.js`.
- Verificación final: sin overflow horizontal a 375 px en las 7 pantallas; comprobación equivalente a zoom 200 % (viewport desktop 1280 → layout 640 CSS px) sin overflow.

Queda abierto / depende de validación humana:

- Contenido histórico real, fotografías propias y atribución: pendiente por diseño hasta hablar con veteranos/organizaciones.
- Selección de comercio real y validación del pitch.
- El bundle inicial sigue siendo 296.97 kB minificado / 94.32 kB gzip por React/router/base; ya no incluye el SDK Stellar ni el mapa, pero se podría evaluar un vendor split más fino solo si la medición en Android real lo justifica.

## Ronda 3 — integración de marca y verificación de contraste (2026-11-27)

### Tabla de contrastes medidos

Cálculo de luminancia relativa WCAG sobre los tokens finales de `web/src/index.css`. AA exige 4.5:1 para texto normal, 3:1 para texto grande y 3:1 para indicadores/controles. Todos los pares de texto/fondo usados superan AA.

| Texto / fondo | Uso principal | Contraste | Resultado |
|---|---|---:|---|
| `#16202A` / `#FFFFFF` | texto principal sobre tarjetas | 16.48:1 | AA |
| `#16202A` / `#F4F7FA` | texto principal sobre fondo | 15.33:1 | AA |
| `#16202A` / `#EAF3FA` | texto sobre superficie celeste suave | 14.68:1 | AA |
| `#16202A` / `#D8E8F4` | texto sobre fila destacada | 13.16:1 | AA |
| `#16202A` / `#EEF2F5` | texto sobre placeholders/empty states | 14.64:1 | AA |
| `#4A5866` / `#FFFFFF` | texto secundario sobre tarjetas | 7.29:1 | AA |
| `#4A5866` / `#F4F7FA` | texto secundario sobre fondo | 6.78:1 | AA |
| `#4A5866` / `#EAF3FA` | texto secundario sobre superficie celeste | 6.50:1 | AA |
| `#4A5866` / `#D8E8F4` | texto secundario sobre fila destacada | 5.82:1 | AA |
| `#4A5866` / `#EEF2F5` | texto secundario en placeholders | 6.48:1 | AA |
| `#4A5866` / `#F8FAFC` | texto secundario en panel neutro | 6.97:1 | AA |
| `#1F4E79` / `#FFFFFF` | links y botones secundarios sobre tarjetas | 8.66:1 | AA |
| `#1F4E79` / `#F4F7FA` | links, nav y foco sobre fondo | 8.06:1 | AA |
| `#1F4E79` / `#EAF3FA` | links/botones sobre celeste suave | 7.71:1 | AA |
| `#1F4E79` / `#D8E8F4` | texto de marca sobre fila destacada | 6.92:1 | AA |
| `#FFFFFF` / `#1F4E79` | texto en botón primario | 8.66:1 | AA |
| `#FFFFFF` / `#183E61` | texto en hover de botón primario | 11.05:1 | AA |
| `#FFFFFF` / `#122E49` | texto en estado activo de botón primario | 13.88:1 | AA |
| `#FFFFFF` / `#16202A` | texto principal en panel oscuro de transparencia | 16.48:1 | AA |
| `#C9D9E7` / `#16202A` | texto secundario en panel oscuro | 11.43:1 | AA |
| `#9CC9EE` / `#16202A` | celeste de marca sobre oscuro | 9.42:1 | AA |
| `#7A2A24` / `#FDF0EE` | error sobre fondo de error | 8.64:1 | AA |
| `#174C2A` / `#EAF5EE` | éxito sobre fondo de éxito | 8.93:1 | AA |
| `#16202A` / `#6CACE4` | selección de texto | 6.80:1 | AA |

Notas:

- `#6CACE4` (celeste islas) se reserva para acentos gráficos, subrayados, selección y bordes; no se usa como color de texto sobre fondo claro porque mediría 2.43:1 sobre blanco.
- El foco visible usa `#1F4E79` sobre superficies claras (8.06:1 o más contra el fondo) y `#9CC9EE` dentro del panel oscuro (9.42:1).
- La barra de progreso usa `#1F4E79` sobre una pista `#D8E8F4`; además el progreso está expresado en texto (“Visitaste X de 3”), por lo que no depende solo del color.

### Resultado visual y detector

- Detector mecánico Impeccable sobre los archivos modificados de la ronda: `[]` (sin hallazgos).
- Verificación manual renderizada a 375 px y desktop documentada en `PROGRESS.md` al cierre de la ronda.
