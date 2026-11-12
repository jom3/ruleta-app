import { and, eq } from 'drizzle-orm'
import { db } from './client'
import { DuplicateNameError, isUniqueViolation, isUuid } from './errors'
import { variants } from './schema/variants'
import { displayName, normalizeName } from '../lib/names'

export { DuplicateNameError }

export type Variant = {
  id: string
  name: string
}

const columns = {
  id: variants.id,
  name: variants.name,
}

export async function create(elementId: string, name: string): Promise<Variant> {
  try {
    const [variant] = await db
      .insert(variants)
      .values({ elementId, name: displayName(name), nameKey: normalizeName(name) })
      .returning(columns)

    return variant
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateNameError()
    throw error
  }
}

export async function remove(elementId: string, variantId: string): Promise<boolean> {
  if (!isUuid(variantId)) return false

  const removed = await db
    .delete(variants)
    .where(and(eq(variants.elementId, elementId), eq(variants.id, variantId)))
    .returning({ id: variants.id })

  return removed.length > 0
}
