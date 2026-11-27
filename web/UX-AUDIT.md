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
