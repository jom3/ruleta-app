import { and, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { isUuid } from '../db/errors'
import { categories } from '../db/schema/categories'
import { elements } from '../db/schema/elements'

// Único punto de control de pertenencia: toda consulta a una categoría o
// elemento pasa por acá y nunca filtra solo por el id.

export type OwnedCategory = {
  id: string
  name: string
}

export type OwnedElement = {
  id: string
  name: string
  categoryId: string
}

export async function requireOwnedCategory(
  userId: string,
  categoryId: string,
): Promise<OwnedCategory | null> {
  if (!isUuid(categoryId)) return null

  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1)

  return category ?? null
}

export async function requireOwnedElement(
  userId: string,
  elementId: string,
): Promise<OwnedElement | null> {
  if (!isUuid(elementId)) return null

  const [element] = await db
    .select({ id: elements.id, name: elements.name, categoryId: elements.categoryId })
    .from(elements)
    .innerJoin(categories, eq(elements.categoryId, categories.id))
    .where(and(eq(elements.id, elementId), eq(categories.userId, userId)))
    .limit(1)

  return element ?? null
}
