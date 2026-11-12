import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from './client'
import { DuplicateNameError, isUniqueViolation, isUuid } from './errors'
import { categories } from './schema/categories'
import { elements } from './schema/elements'
import { displayName, normalizeName } from '../lib/names'

export { DuplicateNameError }

export type Category = {
  id: string
  name: string
  createdAt: Date
}

export type CategoryListItem = Category & {
  elementCount: number
}

const columns = {
  id: categories.id,
  name: categories.name,
  createdAt: categories.createdAt,
}

export async function listByUser(userId: string): Promise<CategoryListItem[]> {
  return db
    .select({
      ...columns,
      elementCount: sql<number>`count(${elements.id})::int`,
    })
    .from(categories)
    .leftJoin(elements, eq(elements.categoryId, categories.id))
    .where(eq(categories.userId, userId))
    .groupBy(categories.id)
    .orderBy(asc(categories.nameKey))
}

export async function findById(userId: string, categoryId: string): Promise<Category | null> {
  if (!isUuid(categoryId)) return null

  const [category] = await db
    .select(columns)
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
    .limit(1)

  return category ?? null
}

export async function create(userId: string, name: string): Promise<Category> {
  try {
    const [category] = await db
      .insert(categories)
      .values({ userId, name: displayName(name), nameKey: normalizeName(name) })
      .returning(columns)

    return category
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateNameError()
    throw error
  }
}

export async function remove(userId: string, categoryId: string): Promise<boolean> {
  if (!isUuid(categoryId)) return false

  const removed = await db
    .delete(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
    .returning({ id: categories.id })

  return removed.length > 0
}
