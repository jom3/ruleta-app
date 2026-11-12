# SPEC 04 — Categories and empty state

> **Status:** Draft
> **Depends on:** SPEC 02
> **Date:** 2026-11-11
> **Objective:** Que cada usuario autenticado cree, liste y borre sus propias categorías con nombre único y vea un estado vacío cuando no tenga ninguna.

## Scope

**In:**

- Tabla `categories` con migración.
- Página `/app` que lista las categorías del usuario con su número de elementos.
- Crear categoría desde `/app` (nombre obligatorio, único sin distinguir mayúsculas).
- Borrar categoría con confirmación; borra en cascada elementos, variantes y giros.
- Estado vacío con el texto "Crea tu primera categoría para empezar".
- Bloque de navegación del encabezado con correo del usuario y "Cerrar sesión".

**Out of scope (future specs):**

- Edición de categorías.
- Elementos y variantes (SPEC 05).
- Reordenar o agrupar categorías.

## Data model

```ts
// src/db/schema/categories.ts
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameKey: text('name_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('categories_user_name_key_idx').on(table.userId, table.nameKey),
])
```

```ts
// src/lib/names.ts
export function normalizeName(raw: string): string  // trim, colapsa espacios, toLowerCase
export function displayName(raw: string): string   // trim, colapsa espacios
```

Reglas: `displayName` no vacío; máximo 40 caracteres; `normalizeName` como clave de unicidad.

## Implementation plan

1. Crear `src/db/schema/categories.ts`, exportarlo en el barril y generar/aplicar la migración.
2. Crear `src/lib/names.ts` con `normalizeName`/`displayName` y sus pruebas (vacío, espacios, mayúsculas, límite de longitud).
3. Crear `src/db/categories.ts` con `listByUser(userId)`, `create(userId, name)` y `remove(userId, categoryId)`; todas filtran por `userId`.
4. Crear `src/actions/categories.ts` con Astro Actions `createCategory` y `deleteCategory` que validan nombre y devuelven errores de campo.
5. Construir `/app` con lista, formulario de creación y diálogo de confirmación para borrar (`<dialog>` nativo).
6. Implementar el estado vacío y su reaparición cuando se borra la última categoría.
7. Añadir el encabezado reutilizable `src/layouts/AppLayout.astro` con correo y cierre de sesión.
8. Añadir pruebas de `normalizeName` y de `create` rechazando "Front" cuando ya existe "front" para el mismo usuario y permitiéndolo para otro usuario.

## Acceptance criteria

- [ ] Un usuario nuevo ve el mensaje de estado vacío y un formulario para crear su primera categoría.
- [ ] Crear una categoría con nombre válido la añade a la lista sin recargar la página entera.
- [ ] Crear una categoría con nombre vacío o solo espacios muestra un error y no guarda nada.
- [ ] Crear "Front" teniendo "front" muestra un error de nombre repetido.
- [ ] Dos usuarios distintos pueden tener una categoría llamada "Front".
- [ ] Borrar pide confirmación; cancelar no borra nada.
- [ ] Confirmar el borrado elimina la categoría y sus elementos, variantes y giros de la base de datos.
- [ ] Tras borrar la última categoría vuelve a verse el estado vacío.
- [ ] Abrir `/app/categories/<id de otro usuario>` responde 404.
- [ ] La lista y el formulario se usan sin scroll horizontal en 360 px de ancho.

## Decisions

- **Yes:** `name_key` como columna en lugar de índice sobre `lower(name)`. Es portable y hace evidente la regla en el código.
- **Yes:** Astro Actions para las mutaciones de categorías. Validación en servidor con errores por campo y funciona sin JS.
- **Yes:** Borrado en cascada por llave foránea. La base de datos garantiza que no queden huérfanos.
- **Yes:** Límite de 40 caracteres. Evita romper la lista en móvil; no está en la idea, es una decisión de producto del MVP.
- **No:** Edición de nombre. La idea lo excluye: se borra y se crea de nuevo.
- **No:** Confirmación con ventana del navegador (`confirm`). `<dialog>` respeta el estilo y es accesible.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Cascada mal definida deja hijos huérfanos al borrar una categoría | `onDelete: 'cascade'` en las llaves foráneas de `elements` (SPEC 05) y `spins` (SPEC 06), más una prueba que borre una categoría con datos. |

## What is not in this spec

- Elementos y variantes (SPEC 05).
- Giro y ruleta (SPEC 06 y 07).
- Historial visible al usuario.
