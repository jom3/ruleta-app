import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { DuplicateNameError } from '../src/db/errors'

const hasDatabase = Boolean(process.env.DATABASE_URL)

describe.skipIf(!hasDatabase)('elements and variants repositories', () => {
  const userIds = [randomUUID(), randomUUID()]

  let db: typeof import('../src/db/client').db
  let schema: typeof import('../src/db/schema')
  let categories: typeof import('../src/db/categories')
  let elements: typeof import('../src/db/elements')
  let variants: typeof import('../src/db/variants')
  let ownership: typeof import('../src/lib/ownership')

  beforeAll(async () => {
    ;({ db } = await import('../src/db/client'))
    schema = await import('../src/db/schema')
    categories = await import('../src/db/categories')
    elements = await import('../src/db/elements')
    variants = await import('../src/db/variants')
    ownership = await import('../src/lib/ownership')

    await db.insert(schema.user).values(
      userIds.map((id, index) => ({
        id,
        name: `Spec 05 user ${index}`,
        email: `spec05-${index}-${id}@example.test`,
      })),
    )
  })

  beforeEach(async () => {
    await db.delete(schema.categories).where(inArray(schema.categories.userId, userIds))
  })

  afterAll(async () => {
    await db.delete(schema.user).where(inArray(schema.user.id, userIds))
  })

  it('rejects a duplicated element name in the same category', async () => {
    const category = await categories.create(userIds[0]!, 'Front')
    await elements.create(category.id, 'React')

    await expect(elements.create(category.id, 'react')).rejects.toBeInstanceOf(DuplicateNameError)
  })

  it('allows the same element name in two categories of the same user', async () => {
    const first = await categories.create(userIds[0]!, 'Front')
    const second = await categories.create(userIds[0]!, 'Back')

    await elements.create(first.id, 'React')
    const created = await elements.create(second.id, 'react')

    expect(created.name).toBe('react')
  })

  it('rejects a duplicated variant name in the same element', async () => {
    const category = await categories.create(userIds[0]!, 'Front')
    const element = await elements.create(category.id, 'React')
    await variants.create(element.id, '18')

    await expect(variants.create(element.id, '18')).rejects.toBeInstanceOf(DuplicateNameError)
  })

  it('removes the variants when the element is deleted', async () => {
    const category = await categories.create(userIds[0]!, 'Front')
    const element = await elements.create(category.id, 'React')
    await variants.create(element.id, '17')
    await variants.create(element.id, '18')

    expect(await elements.remove(category.id, element.id)).toBe(true)

    const left = await db
      .select({ id: schema.variants.id })
      .from(schema.variants)
      .where(eq(schema.variants.elementId, element.id))

    expect(left).toHaveLength(0)
  })

  it('lists elements with their variants', async () => {
    const category = await categories.create(userIds[0]!, 'Front')
    const element = await elements.create(category.id, 'React')
    await variants.create(element.id, '18')

    const [listed] = await elements.listWithVariants(category.id)

    expect(listed?.name).toBe('React')
    expect(listed?.variants.map((variant) => variant.name)).toEqual(['18'])
  })

  it('rejects an element id that belongs to another user', async () => {
    const category = await categories.create(userIds[1]!, 'Front')
    const element = await elements.create(category.id, 'React')

    expect(await ownership.requireOwnedElement(userIds[0]!, element.id)).toBeNull()
    expect(await ownership.requireOwnedElement(userIds[1]!, element.id)).not.toBeNull()
  })
})
