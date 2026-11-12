# SPEC 06 — Spin engine: penalty weights, draw and history

> **Status:** Implemented
> **Depends on:** SPEC 05
> **Date:** 2026-11-11
> **Objective:** Implementar en lógica pura y testeable el sorteo con penalización de los 2 últimos giros y persistir cada giro en el historial de su categoría.

## Why

La regla de penalización es la pieza con más riesgo del producto y no debe depender de la interfaz. Vive en `src/lib/spin.ts`, sin acceso a base de datos, y la persistencia en `src/db/spins.ts`.

## Scope

**In:**

- Tabla `spins` con migración y borrado en cascada.
- `src/lib/spin.ts`: `computeProbabilities`, `drawWeighted`, `pickVariant`, `MIN_ELEMENTS_TO_SPIN`.
- `src/db/spins.ts`: `getRecentElementIds`, `recordSpin`.
- `resolveSpin(categoryId)` que lee, calcula, sortea y guarda en una sola operación.
- Pruebas unitarias de la penalización, del sorteo y de la persistencia.

**Out of scope (future specs):**

- Endpoint HTTP y animación (SPEC 07).
- Penalización de variantes y botón "girar de nuevo".
- Mostrar el historial al usuario.

## Data model

```ts
// src/db/schema/spins.ts
export const spins = pgTable('spins', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  elementId: uuid('element_id').notNull().references(() => elements.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => variants.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

Index: `spins_category_created_idx` sobre `(categoryId, createdAt desc)`.

```ts
// src/lib/spin.ts
export const MIN_ELEMENTS_TO_SPIN = 2
export const LAST_SPIN_FACTOR = 0.1
export const PREVIOUS_SPIN_FACTOR = 0.5

export type Weighted = { id: string; weight: number; probability: number }
export type SpinResult = {
  spinId: string
  element: { id: string; name: string }
  variant: { id: string; name: string } | null
}

export function computeProbabilities(
  elementIds: string[],
  recentElementIds: string[], // más reciente primero, longitud 0..2
): Weighted[]

export function drawWeighted(entries: Weighted[], rng: () => number): string
export function pickVariant(variantIds: string[], rng: () => number): string | null
```

```ts
// src/db/spins.ts
export async function getRecentElementIds(categoryId: string): Promise<string[]>
export async function recordSpin(input: {
  categoryId: string
  elementId: string
  variantId: string | null
}): Promise<{ id: string; createdAt: Date }>
export async function resolveSpin(categoryId: string): Promise<SpinResult | 'not-enough-elements'>
```

## Implementation plan

1. Crear el esquema de `spins`, exportarlo y generar/aplicar la migración con sus índices.
2. Implementar `computeProbabilities` en `src/lib/spin.ts` con los factores 1/10 y 1/2 y normalización a suma 1.
3. Añadir pruebas de `computeProbabilities`: sin historial, 1 giro, 2 giros distintos, mismo elemento en ambos, elemento repetido en el historial y 2 elementos en total.
4. Implementar `drawWeighted` y `pickVariant` con `rng` inyectado; probar los límites (`rng = 0`, `rng ≈ 1`) y que ningún elemento tenga probabilidad 0.
5. Implementar `src/db/spins.ts`: `getRecentElementIds` (2 más recientes de la categoría) y `recordSpin`.
6. Implementar `resolveSpin` con una transacción: leer elementos, leer historial, calcular, sortear, insertar; si hay menos de 2 elementos devolver `'not-enough-elements'` sin escribir.
7. Añadir pruebas de integración de `resolveSpin` contra la base de datos de pruebas: con 0 y 1 elemento no escribe; con 2 elementos escribe un giro; dos giros seguidos penalizan al ganador anterior.
8. Añadir una prueba de que borrar un elemento elimina sus giros y no rompe `getRecentElementIds`.
9. Añadir una prueba con 10 elementos y 2 giros distintos que verifique ≈1 %, ≈6 % y ≈12 % por elemento con tolerancia de 1 punto porcentual.

## Acceptance criteria

- [x] `computeProbabilities` con 10 elementos y 2 giros de elementos distintos produce 1/86, 5/86 y 10/86 (≈1,16 %, ≈5,81 %, ≈11,63 %).
- [x] Con el mismo elemento en los 2 últimos giros, su factor es 1/10 y no se multiplica por 1/2.
- [x] Con 1 solo giro en el historial se aplica únicamente 1/10 al último elemento.
- [x] Todas las probabilidades devueltas son mayores que 0 y suman 1 (tolerancia 1e-9).
- [x] `getRecentElementIds` devuelve como máximo 2 ids y nunca uno de otra categoría.
- [x] `resolveSpin` con 0 o 1 elementos devuelve `'not-enough-elements'` y no inserta filas.
- [x] `resolveSpin` inserta un giro cuyo `elementId` coincide con el sorteo devuelto.
- [x] Un elemento con variantes devuelve un `variantId`; sin variantes devuelve `null`.
- [x] Los giros de una categoría no cambian las probabilidades de otra categoría.
- [x] Borrar un elemento elimina sus giros y el resto del historial sigue disponible.
- [x] `pnpm test` cubre todos los casos anteriores y termina en verde.

## Decisions

- **Yes:** Sorteo y persistencia en dos capas separadas. La regla se prueba sin base de datos y sin interfaz.
- **Yes:** `rng` como parámetro con valor por defecto `Math.random`. Pruebas deterministas sin mocks globales.
- **Yes:** `onDelete: 'cascade'` de `spins.element_id`. Borrar un elemento lo saca del historial automáticamente: "deja de contar" queda expresado en el esquema.
- **Yes:** La ventana de penalización es "los 2 giros más recientes cuyo elemento existe". Si un elemento se borró, su giro desaparece con él y se toma el siguiente giro más reciente.
- **Yes:** `MIN_ELEMENTS_TO_SPIN = 2` como constante exportada, usada por la lógica y por la interfaz. Un solo número.
- **Yes:** Transacción única en `resolveSpin` (leer + sortear + insertar). Evita giros a medias.
- **No:** Penalización de variantes. Versión 2.
- **No:** Guardar los pesos calculados en la fila del giro. Se puede recalcular y no forma parte del MVP.
- **Yes:** `resolveSpin` acepta un `rng` opcional después del `categoryId` para que las pruebas de integración sean deterministas; el valor por defecto sigue siendo `Math.random`.
- **Yes:** Sin transacción interactiva: `neon-http` no las soporta (`No transactions support in neon-http driver`). `resolveSpin` lee, calcula y escribe en una sola sentencia de inserción; las llaves foráneas impiden filas inválidas. La carrera de dos giros simultáneos queda como límite aceptado en la tabla de riesgos.
- **Yes:** `SpinResult` devuelve `spinId` y los nombres de elemento y variante además de los ids. La respuesta de SPEC 07 los necesita y la lectura ya trae esos datos, así que se evita una consulta extra por giro.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Dos giros simultáneos de la misma categoría leen el mismo historial | La interfaz bloquea el botón (SPEC 07) y el MVP acepta el caso residual; `neon-http` no ofrece transacciones interactivas, así que se documenta como límite conocido. |
| Redondeo de punto flotante deja la suma de probabilidades en 0,999… | Normalizar dividiendo por la suma calculada y comparar con tolerancia 1e-9 en las pruebas. |
| Historia con muchos giros hace lenta la consulta | Índice `(categoryId, createdAt desc)` y límite 2 en la consulta. |

## What is not in this spec

- Endpoint de giro y animación (SPEC 07).
- Lista de giros pasados visible al usuario.
- Botón "girar de nuevo".
