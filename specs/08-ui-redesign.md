# SPEC 08 — Rediseño de interfaz y sorteo de variantes

> **Status:** Implemented
> **Depends on:** SPEC 07
> **Date:** 2026-11-12
> **Objective:** Darle a la app una identidad visual de producto cuidado (sala de sorteo nocturna: fieltro, latón y ticket de papel) y sumar un efecto de sorteo entre las variantes del elemento ganador.

## Why

La app funciona de punta a punta, pero la interfaz es un formulario oscuro genérico. El giro es el momento central del producto y hoy termina en una línea de texto. El rediseño debe hacer que el resultado se sienta como un veredicto, sin perder claridad ni velocidad.

## Scope

**In:**

- Sistema de diseño nuevo: paleta, tipografía, radios, sombras y movimiento en `src/styles/global.css`.
- Fuentes locales con `@fontsource`: Fraunces (títulos), Instrument Sans (interfaz), IBM Plex Mono (datos y etiquetas).
- Header con marca, listado de categorías en grilla de tarjetas con contador.
- Página de categoría en dos columnas: sorteo a la izquierda, gestión de elementos a la derecha.
- Ticket de resultado en papel con elemento, variante y número de giro.
- Efecto de sorteo de variantes cuando el elemento ganador tiene 2 o más.
- Ajustes de accesibilidad: foco visible, contraste, `prefers-reduced-motion`.

**Out of scope (future specs):**

- Historial visible, "girar de nuevo", penalización de variantes.
- Rediseño estructural de las páginas de autenticación (heredan tokens).
- Sonido, confeti o modo claro.

## Design system

**Dirección:** sala de sorteo nocturna. Fieltro verde profundo, latón y un ticket de papel crema como pieza memorable. Se evita el negro con acento ácido que ya existía.

**Color**

| Token | Valor | Uso |
| ----- | ----- | --- |
| `--ink-900` | `#0a100e` | Fondo de página |
| `--ink-800` | `#101a16` | Superficie base |
| `--ink-700` | `#16241e` | Tarjetas elevadas |
| `--ink-600` | `#1d2e27` | Hover y campos |
| `--line` | `#2a3d34` | Bordes |
| `--line-strong` | `#3a5147` | Bordes activos |
| `--text` | `#ede7d7` | Texto principal |
| `--muted` | `#9fb0a5` | Texto secundario |
| `--brass` | `#d8a849` | Acción principal |
| `--brass-strong` | `#eec06a` | Hover de acción |
| `--cream` | `#f3ead7` | Ticket |
| `--cream-ink` | `#1a1710` | Texto del ticket |
| `--danger` | `#e2685c` | Borrar y errores |

Rueda: latón `#d8a849`, verde azulado `#2f5d54`, crema `#e8dcc2`, oxblood `#8c3f37`, salvia `#4a6b52`, pizarra `#3f5a6b`, con color de etiqueta legible en cada uno. El centro del primer sector mira hacia arriba, donde apunta el puntero.

**Tipografía**

- Display: **Fraunces Variable** (600) para `h1`, nombres de categoría y el elemento ganador.
- Interfaz: **Instrument Sans Variable** (400/500/600) para cuerpo, formularios y botones.
- Datos: **IBM Plex Mono** (400/500) para etiquetas tipo `CATEGORÍA`, contadores y el número de giro.

**Layout**

```
┌──────────────────────────────────────────────┐
│  Ruleta                          cuenta  ⏻  │
├──────────────────────────────────────────────┤
│  CATEGORÍA                                   │
│  Front                    3 elementos        │
│  ┌────────────────────┐  ┌─────────────────┐ │
│  │  [ rueda ]         │  │ ELEMENTOS   3   │ │
│  │  Girar             │  │ [nuevo elemento]│ │
│  │  ┌ ticket ┐        │  │ ▸ Camiseta      │ │
│  └────────────────────┘  └─────────────────┘ │
└──────────────────────────────────────────────┘
```

- Ancho de la app: `min(100% - 2rem, 72rem)`.
- Dos columnas desde 1024 px; apilado por debajo.
- Grilla de categorías: `auto-fill minmax(15rem, 1fr)`.

**Firma:** el ticket de resultado. Papel crema con muescas laterales, línea perforada, número de giro en mono y el nombre en Fraunces. Aparece con una inclinación leve que se endereza al revelarse.

## Variant draw

Cuando el ganador tiene 2 o más variantes:

1. La rueda gira y se detiene en el elemento (~4 s).
2. El ticket aparece con el elemento y un carrete de variantes que avanza cada vez más lento (~1,2 s) y se detiene en la variante elegida por el servidor.
3. El carrete se alimenta con los nombres de las variantes del elemento leídas del DOM; el ganador siempre es el `variantId` de la respuesta.

Con 1 variante no hay carrete: el ticket muestra directamente la variante. Con 0 variantes no se muestra la etiqueta.

## Implementation plan

1. Instalar y importar las fuentes; reescribir tokens y estilos base en `global.css`.
2. Rediseñar `AppLayout` con marca, cuenta y contenedor.
3. Rediseñar el listado de categorías: encabezado con totales, form en tarjeta y grilla de categorías.
4. Rediseñar la página de categoría en dos columnas conservando ids y clases que usa el script.
5. Extraer la geometría de la rueda a `src/lib/wheel.ts` y reestilizar `Wheel.astro` (anillo de latón, separadores, etiquetas legibles giradas, puntero).
6. Convertir el resultado en ticket y añadir el carrete de variantes en `SpinPanel.astro`.
7. Respetar `prefers-reduced-motion`: sin giro de rueda ni carrete.
8. Verificar en navegador a 360, 768 y 1440 px, con y sin variantes, y con movimiento reducido.

## Acceptance criteria

- [x] Las fuentes nuevas cargan y los títulos usan Fraunces, la interfaz Instrument Sans y los datos IBM Plex Mono.
- [x] El listado y la página de categoría no tienen scroll horizontal en 360, 768 y 1440 px.
- [x] La página de categoría usa dos columnas desde 1024 px y una sola por debajo.
- [x] El resultado aparece en el ticket con elemento, variante (si tiene) y número de giro.
- [x] Con 2 o más variantes se ve el carrete (~1,2 s) y se detiene en la variante guardada en `spins`.
- [x] Con 1 variante o sin variantes no hay carrete y el ticket muestra lo que corresponde.
- [x] El botón sigue deshabilitado durante rueda + carrete y no se registra más de un giro por clic.
- [x] Con `prefers-reduced-motion: reduce` no hay giro ni carrete y el ticket aparece al recibir la respuesta.
- [x] Crear y borrar categorías, elementos y variantes sigue funcionando sin recargar; el diálogo de borrado conserva su comportamiento.
- [x] El foco de teclado es visible en enlaces, botones e inputs.
- [x] `pnpm test` y `pnpm build` terminan en verde.

## Decisions

- **Yes:** Identidad de fieltro verde y latón en lugar de negro con acento ácido. El tema anterior era el default de cualquier app oscura; este acerca la interfaz al mundo del sorteo.
- **Yes:** Fuentes empaquetadas con `@fontsource` en vez de CDN. Sin peticiones externas ni parpadeo de fuentes.
- **Yes:** El carrete de variantes usa los nombres del DOM y el ganador del servidor. No se agrega información nueva al endpoint.
- **Yes:** El ticket es la única pieza con ambición visual; el resto queda disciplinado.
- **No:** Sonido o confeti. La animación de la rueda y el carrete alcanzan para el momento.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Muchos elementos hacen ilegibles las etiquetas | Truncado a 12 caracteres, tamaño de fuente según cantidad, `title` con el nombre completo y leyenda bajo la rueda. |
| El carrete muestra nombres que ya no existen | La lista sale del DOM vigente; el ganador y el registro salen del servidor, que es la fuente de verdad. |
| Más peso de fuentes en la primera carga | Solo se descarga el subconjunto latino que el navegador necesita (`unicode-range`). |
| El rediseño rompe los scripts existentes | Se conservan ids, clases y contratos (`data-*`) que ya usan los scripts. |
