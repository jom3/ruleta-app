# SPEC 05 — Elements and variants

> **Status:** Draft
> **Depends on:** SPEC 04
> **Date:** 2026-11-11
> **Objective:** Que el usuario cree y borre elementos dentro de una categoría y variantes opcionales dentro de un elemento, con nombres únicos y sin edición.

## Scope

**In:**

- Tablas `elements` y `variants` con migración y borrado en cascada.
- Página `/app/categories/[id]` con la lista de elementos y sus variantes.
- Crear elemento (nombre obligatorio, único por categoría sin distinguir mayúsculas).
- Crear variante (nombre obligatorio, único por elemento sin distinguir mayúsculas).
- Borrar elemento con confirmación; borra sus variantes.
- Borrar variante directamente, con confirmación.
- Aviso cuando la categoría tiene menos de 2 elementos: "Añade al menos 2 elementos para poder girar".

**Out of scope (future specs):**

- Edición de nombres.
- Peso manual por elemento.
- Penalización de variantes.
- El giro y su animación (SPEC 06 y 07).

## Data model

```ts
// src/db/schema/elements.ts
export const elements = pgTable('elements', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameKey: text('name_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('elements_category_name_key_idx').on(table.categoryId, table.nameKey),
])

// src/db/schema/variants.ts
export const variants = pgTable('variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  elementId: uuid('element_id').notNull().references(() => elements.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameKey: text('name_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('variants_element_name_key_idx').on(table.elementId, table.nameKey),
])
```

Reutiliza `normalizeName`/`displayName` de `src/lib/names.ts`, con el mismo límite de 40 caracteres.

## Implementation plan

1. Crear ambos esquemas, exportarlos y generar/aplicar la migración.
2. Crear `src/lib/ownership.ts` con `requireOwnedCategory(userId, categoryId)` y `requireOwnedElement(userId, elementId)`, que lanzan `AstroError(404)` si no pertenecen al usuario.
3. Crear `src/db/elements.ts` con `listByCategory(categoryId)`, `create(categoryId, name)`, `remove(categoryId, elementId)`.
4. Crear `src/db/variants.ts` con `listByElement(elementId)`, `create(elementId, name)`, `remove(elementId, variantId)`.
5. Crear `src/actions/elements.ts` y `src/actions/variants.ts` con validación de nombre y errores de campo.
6. Construir `/app/categories/[id]` con encabezado de la categoría, formulario de elemento, lista con variantes expandidas y formulario de variante por elemento.
7. Añadir el aviso de menos de 2 elementos en la categoría y el botón de girar deshabilitado (sin lógica de giro todavía).
8. Añadir pruebas de unicidad: "React"/"react" rechazado en una categoría y permitido en otra; variante repetida rechazada; borrar elemento borra sus variantes.
9. Añadir pruebas de aislamiento: `requireOwnedElement` devuelve 404 con el `elementId` de otro usuario.

## Acceptance criteria

- [ ] Se crea un elemento con nombre válido y aparece en su categoría.
- [ ] Crear "React" teniendo "react" en la misma categoría muestra un error.
- [ ] "React" puede existir en dos categorías distintas del mismo usuario.
- [ ] Un elemento puede tener 0, 1 o varias variantes.
- [ ] Crear una variante repetida (sin distinguir mayúsculas) en el mismo elemento muestra un error.
- [ ] Borrar un elemento con variantes pide confirmación y, al confirmar, desaparecen el elemento y sus variantes.
- [ ] Borrar una variante deja intacto el elemento y sus demás variantes.
- [ ] Con menos de 2 elementos en la categoría se ve el aviso y el botón de girar está deshabilitado.
- [ ] Abrir `/app/categories/<id de otro usuario>` responde 404.
- [ ] La lista de elementos con variantes se usa sin scroll horizontal en 360 px de ancho.

## Decisions

- **Yes:** Unicidad por `(parent_id, name_key)`. Misma regla que categorías, sin distinguir mayúsculas.
- **Yes:** Cascada en `variants.element_id`. Borrar un elemento nunca deja variantes sueltas.
- **Yes:** `requireOwnedCategory`/`requireOwnedElement` como único punto de control de pertenencia. Una consulta nueva no puede olvidar el filtro por usuario.
- **Yes:** Aviso de mínimo 2 elementos desde este spec, aunque el giro llegue en SPEC 06. El usuario entiende el requisito al construir la categoría.
- **No:** Editar nombre. La idea lo excluye explícitamente.
- **No:** Limitar el número de elementos o variantes. El MVP no lo necesita y añade reglas sin uso.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Página con muchos elementos y variantes se vuelve lenta | Consulta única con `leftJoin` y render en servidor; sin paginación en el MVP y con índice en `elements.category_id`. |

## What is not in this spec

- Giro, penalización e historial (SPEC 06).
- Animación de la ruleta (SPEC 07).
