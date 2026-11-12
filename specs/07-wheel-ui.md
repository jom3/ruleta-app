# SPEC 07 — Spin endpoint and wheel animation

> **Status:** Implemented
> **Depends on:** SPEC 06
> **Date:** 2026-11-11
> **Objective:** Girar una categoría desde la interfaz mediante un endpoint que registra el giro y mostrar una ruleta animada de ~4 s que termina en el resultado.

## Scope

**In:**

- `POST /api/categories/[id]/spin` que valida sesión, pertenencia y mínimo de elementos.
- Respuesta con el ganador decidido en servidor antes de la animación.
- Componente `src/components/Wheel.astro` con rueda SVG de segmentos iguales y rotación calculada.
- Bloqueo del botón "Girar" mientras dura la animación.
- Panel de resultado con el elemento y la variante si tiene.
- Ajuste responsive de la rueda y del resultado.

**Out of scope (future specs):**

- Historial visible, "girar de nuevo" y penalización de variantes.
- Sonidos o confeti.

## Data model

Sin estructuras nuevas. Contrato del endpoint:

```ts
// POST /api/categories/:id/spin
// 200
type SpinResponse = {
  spinId: string
  element: { id: string; name: string }
  variant: { id: string; name: string } | null
}
// 401 { error: 'unauthorized' }
// 404 { error: 'not-found' }
// 409 { error: 'not-enough-elements' }
```

## Implementation plan

1. Crear `src/pages/api/categories/[id]/spin.ts` (export `prerender = false`) con `POST`: usuario de sesión, `requireOwnedCategory`, y respuesta 401/404.
2. Conectar `resolveSpin`; devolver 409 en `'not-enough-elements'` y 200 con nombres de elemento y variante resueltos.
3. Añadir pruebas del handler para 401 sin sesión, 404 con categoría de otro usuario y 409 con 1 elemento.
4. Crear `src/components/Wheel.astro`: SVG con un segmento por elemento, etiquetas truncadas a 12 caracteres y colores desde `src/styles/tokens.css`.
5. Añadir el script de la rueda: `transform: rotate()` con transición de 4000 ms y `cubic-bezier(0.12, 0.72, 0.06, 1)`; el ángulo final centra el segmento ganador en el puntero superior con 4 vueltas completas.
6. Crear `src/components/SpinPanel.astro` con el botón, el estado "Girando…", el panel de resultado y un `aria-live="polite"` para anunciarlo.
7. Cablear el clic: deshabilitar el botón, `POST` al endpoint, esperar la promesa y **después** iniciar la animación; al terminar, mostrar el resultado y rehabilitar el botón.
8. Manejar errores: 409 muestra "Añade al menos 2 elementos"; error de red muestra "No se pudo girar, inténtalo de nuevo" y rehabilitar el botón.
9. Ajustar tamaños: rueda `clamp(240px, 78vw, 420px)`, resultado legible sin scroll horizontal en 360 px y en 1440 px.

## Acceptance criteria

- [x] Pulsar "Girar" en una categoría con 2 o más elementos anima la rueda durante ~4 s y termina mostrando el elemento ganador.
- [x] Si el ganador tiene variantes, el resultado muestra la variante; si no tiene, solo el elemento.
- [x] El resultado mostrado coincide con la fila insertada en `spins` para ese giro.
- [x] Durante la animación el botón no responde a clics adicionales y no se inserta ningún giro extra.
- [x] Recargar la página durante la animación deja el giro registrado y, al volver, la penalización incluye ese giro.
- [x] Una categoría con 1 elemento muestra el aviso y no llama al endpoint.
- [x] Llamar al endpoint sin sesión responde 401; con la categoría de otro usuario responde 404.
- [x] La animación y el resultado se ven completos, sin scroll horizontal, en 360 px, 768 px y 1440 px.
- [x] Con `prefers-reduced-motion: reduce` la rueda salta al resultado en menos de 300 ms sin animación de giro.

## Decisions

- **Yes:** El servidor decide y registra el ganador antes de animar. La animación nunca puede contradecir el historial.
- **Yes:** Segmentos iguales en la rueda. Mostrar el tamaño proporcional al peso revelaría las probabilidades, y la animación solo debe comunicar el resultado.
- **Yes:** La animación arranca después de la respuesta HTTP, no en paralelo. Así el resultado mostrado siempre existe en la base de datos.
- **Yes:** Rotación con transición CSS sobre `transform`. Menos código y mejor rendimiento en móvil que animar con JS por frame.
- **Yes:** `prefers-reduced-motion` respetado. Evita mareo y es una regla de accesibilidad barata.
- **No:** Canvas o WebGL para la rueda. El SVG con N segmentos es suficiente para el MVP.
- **No:** Precargar las probabilidades en el cliente. El cliente no necesita saberlas y así no se filtran.
- **Yes:** Los colores de la rueda viven en `src/styles/global.css` (`--wheel-1`…`--wheel-6`), junto al resto de los tokens: no existe un `src/styles/tokens.css` separado.
- **Yes:** El handler se extrae a `src/lib/spin-endpoint.ts` con `lookupUser` inyectable para probar 401/404/409 sin fabricar cookies de sesión; la ruta solo delega.
- **Yes:** La rueda se redibuja en el cliente cuando la lista de elementos cambia sin recargar. Así los segmentos siempre coinciden con los elementos reales y el ganador puede centrarse en el puntero.
- **Yes:** Con `prefers-reduced-motion` la transición CSS es `none` y la rueda salta al ángulo final al recibir la respuesta; no hay giro de 4 s.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| El usuario pulsa Girar en dos pestañas y hay dos giros registrados | Se acepta en el MVP; el botón bloqueado cubre el caso normal y queda documentado como límite conocido. |
| Muchos elementos hacen ilegibles las etiquetas de la rueda | Truncado a 12 caracteres con `title` completo y una leyenda bajo la rueda con los nombres de los elementos. |
| Diferencia de ~300 ms entre el registro y el fin de la animación en redes lentas | La animación arranca solo al recibir la respuesta; el texto "Girando…" cubre la espera. |

## What is not in this spec

- Historial de giros visible al usuario.
- Botón "girar de nuevo".
- Penalización de variantes.
