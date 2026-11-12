import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const hasDatabase = Boolean(process.env.DATABASE_URL)

describe.skipIf(!hasDatabase)('POST /api/categories/:id/spin', () => {
  const ownerId = randomUUID()
  const strangerId = randomUUID()

  let db: typeof import('../src/db/client').db
  let schema: typeof import('../src/db/schema')
  let categories: typeof import('../src/db/categories')
  let elements: typeof import('../src/db/elements')
  let handleSpin: typeof import('../src/lib/spin-endpoint').handleSpin

  const request = (categoryId: string): Request =>
    new Request(`http://localhost/api/categories/${categoryId}/spin`, { method: 'POST' })

  const asUser = (id: string | null) => async () => {
    if (!id) return null
    return { id, email: `${id}@example.test`, name: 'Spec 07 user' }
  }

  async function countSpins(categoryId: string): Promise<number> {
    const rows = await db
      .select({ id: schema.spins.id })
      .from(schema.spins)
      .where(eq(schema.spins.categoryId, categoryId))

    return rows.length
  }

  beforeAll(async () => {
    ;({ db } = await import('../src/db/client'))
    schema = await import('../src/db/schema')
    categories = await import('../src/db/categories')
    elements = await import('../src/db/elements')
    ;({ handleSpin } = await import('../src/lib/spin-endpoint'))

    for (const id of [ownerId, strangerId]) {
      await db.insert(schema.user).values({
        id,
        name: 'Spec 07 user',
        email: `spec07-${id}@example.test`,
      })
    }
  })

  beforeEach(async () => {
    await db
      .delete(schema.categories)
      .where(inArray(schema.categories.userId, [ownerId, strangerId]))
  })

  afterAll(async () => {
    await db.delete(schema.user).where(inArray(schema.user.id, [ownerId, strangerId]))
  })

  it('responds 401 without a session', async () => {
    const category = await categories.create(ownerId, 'Front')

    const response = await handleSpin(request(category.id), category.id, asUser(null))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'unauthorized' })
    expect(await countSpins(category.id)).toBe(0)
  })

  it('responds 404 when the category belongs to another user', async () => {
    const category = await categories.create(strangerId, 'Front')

    const response = await handleSpin(request(category.id), category.id, asUser(ownerId))

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'not-found' })
    expect(await countSpins(category.id)).toBe(0)
  })

  it('responds 409 when the category has one element', async () => {
    const category = await categories.create(ownerId, 'Front')
    await elements.create(category.id, 'Alpha')

    const response = await handleSpin(request(category.id), category.id, asUser(ownerId))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'not-enough-elements' })
    expect(await countSpins(category.id)).toBe(0)
  })

  it('responds 200 with the winner already recorded', async () => {
    const category = await categories.create(ownerId, 'Front')
    const alpha = await elements.create(category.id, 'Alpha')
    const beta = await elements.create(category.id, 'Beta')

    const response = await handleSpin(request(category.id), category.id, asUser(ownerId))

    expect(response.status).toBe(200)

    const body = await response.json()
    expect([alpha.name, beta.name]).toContain(body.element.name)
    expect(body.variant).toBeNull()
    expect(body.spinId).toEqual(expect.any(String))

    const rows = await db
      .select({ id: schema.spins.id, elementId: schema.spins.elementId })
      .from(schema.spins)
      .where(eq(schema.spins.categoryId, category.id))

    expect(rows).toEqual([{ id: body.spinId, elementId: body.element.id }])
  })
})
