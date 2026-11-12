import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from './client'
import { DuplicateNameError, isUniqueViolation, isUuid } from './errors'
import { elements } from './schema/elements'
import { variants } from './schema/variants'
import { displayName, normalizeName } from '../lib/names'

export { DuplicateNameError }

export type VariantSummary = {
  id: string
  name: string
}

export type ElementSummary = {
  id: string
  name: string
  createdAt: Date
  variants: VariantSummary[]
}

const columns = {
  id: elements.id,
  name: elements.name,
  createdAt: elements.createdAt,
}

export async function listWithVariants(categoryId: string): Promise<ElementSummary[]> {
  const elementRows = await db
    .select(columns)
    .from(elements)
    .where(eq(elements.categoryId, categoryId))
    .orderBy(asc(elements.nameKey))

  if (elementRows.length === 0) return []

  const variantRows = await db
    .select({ id: variants.id, elementId: variants.elementId, name: variants.name })
    .from(variants)
    .where(
      inArray(
        variants.elementId,
        elementRows.map((element) => element.id),
      ),
    )
    .orderBy(asc(variants.nameKey))

  return elementRows.map((element) => ({
    ...element,
    variants: variantRows
      .filter((variant) => variant.elementId === element.id)
      .map((variant) => ({ id: variant.id, name: variant.name })),
  }))
}

export async function create(categoryId: string, name: string): Promise<ElementSummary> {
  try {
    const [element] = await db
      .insert(elements)
      .values({ categoryId, name: displayName(name), nameKey: normalizeName(name) })
      .returning(columns)

    return { ...element, variants: [] }
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateNameError()
    throw error
  }
}

export async function remove(categoryId: string, elementId: string): Promise<boolean> {
  if (!isUuid(elementId)) return false

  const removed = await db
    .delete(elements)
    .where(and(eq(elements.categoryId, categoryId), eq(elements.id, elementId)))
    .returning({ id: elements.id })

  return removed.length > 0
}
