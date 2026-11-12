import { and, asc, eq } from 'drizzle-orm'
import { db } from './client'
import { categories } from './schema/categories'
import { displayName, normalizeName } from '../lib/names'

export type Category = {
  id: string
  name: string
  createdAt: Date
}

export class DuplicateNameError extends Error {
  constructor() {
    super('Duplicate category name')
    this.name = 'DuplicateNameError'
  }
}

const columns = {
  id: categories.id,
  name: categories.name,
  createdAt: categories.createdAt,
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function listByUser(userId: string): Promise<Category[]> {
  return db
    .select(columns)
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.nameKey))
}

export async function findById(userId: string, categoryId: string): Promise<Category | null> {
  if (!UUID_PATTERN.test(categoryId)) return null

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
  if (!UUID_PATTERN.test(categoryId)) return false

  const removed = await db
    .delete(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
    .returning({ id: categories.id })

  return removed.length > 0
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  if ('code' in error && error.code === '23505') return true

  return 'cause' in error && isUniqueViolation(error.cause)
}
