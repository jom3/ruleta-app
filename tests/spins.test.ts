import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { computeProbabilities } from '../src/lib/spin'

const hasDatabase = Boolean(process.env.DATABASE_URL)

const pause = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 10))

describe.skipIf(!hasDatabase)('spins repository', () => {
  const userId = randomUUID()

  let db: typeof import('../src/db/client').db
  let schema: typeof import('../src/db/schema')
  let categories: typeof import('../src/db/categories')
  let elements: typeof import('../src/db/elements')
  let variants: typeof import('../src/db/variants')
  let spins: typeof import('../src/db/spins')

  async function makeCategory(name = 'Front') {
    return categories.create(userId, name)
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
    variants = await import('../src/db/variants')
    spins = await import('../src/db/spins')

    await db.insert(schema.user).values({
      id: userId,
      name: 'Spec 06 user',
      email: `spec06-${userId}@example.test`,
    })
  })

  beforeEach(async () => {
    await db.delete(schema.categories).where(inArray(schema.categories.userId, [userId]))
  })

  afterAll(async () => {
    await db.delete(schema.user).where(inArray(schema.user.id, [userId]))
  })

  it('does not spin with zero or one element and writes nothing', async () => {
    const category = await makeCategory()

    expect(await spins.resolveSpin(category.id)).toBe('not-enough-elements')

    await elements.create(category.id, 'Alpha')

    expect(await spins.resolveSpin(category.id)).toBe('not-enough-elements')
    expect(await countSpins(category.id)).toBe(0)
  })

  it('records a spin whose element id matches the draw', async () => {
    const category = await makeCategory()
    const alpha = await elements.create(category.id, 'Alpha')
    await elements.create(category.id, 'Beta')

    const result = await spins.resolveSpin(category.id, () => 0)

    expect(result).toEqual({ elementId: alpha.id, variantId: null })

    const rows = await db
      .select({ elementId: schema.spins.elementId, variantId: schema.spins.variantId })
      .from(schema.spins)
      .where(eq(schema.spins.categoryId, category.id))

    expect(rows).toEqual([{ elementId: alpha.id, variantId: null }])
  })

  it('returns a variant id when the drawn element has variants', async () => {
    const category = await makeCategory()
    await elements.create(category.id, 'Alpha')
    const beta = await elements.create(category.id, 'Beta')
    const variant = await variants.create(beta.id, '18')

    const result = await spins.resolveSpin(category.id, () => 0.9)

    expect(result).toEqual({ elementId: beta.id, variantId: variant.id })
  })

  it('returns the last two spins of the category, newest first', async () => {
    const category = await makeCategory()
    const alpha = await elements.create(category.id, 'Alpha')
    const beta = await elements.create(category.id, 'Beta')
    const gamma = await elements.create(category.id, 'Gamma')

    await spins.recordSpin({ categoryId: category.id, elementId: alpha.id, variantId: null })
    await pause()
    await spins.recordSpin({ categoryId: category.id, elementId: beta.id, variantId: null })
    await pause()
    await spins.recordSpin({ categoryId: category.id, elementId: gamma.id, variantId: null })

    expect(await spins.getRecentElementIds(category.id)).toEqual([gamma.id, beta.id])
  })

  it('does not mix spins from another category', async () => {
    const front = await makeCategory('Front')
    const back = await makeCategory('Back')
    const frontElement = await elements.create(front.id, 'Alpha')
    await elements.create(back.id, 'Beta')

    await spins.recordSpin({ categoryId: front.id, elementId: frontElement.id, variantId: null })

    expect(await spins.getRecentElementIds(back.id)).toEqual([])
  })

  it('removes the spins of a deleted element and keeps the rest', async () => {
    const category = await makeCategory()
    const alpha = await elements.create(category.id, 'Alpha')
    const beta = await elements.create(category.id, 'Beta')
    await elements.create(category.id, 'Gamma')

    await spins.recordSpin({ categoryId: category.id, elementId: alpha.id, variantId: null })
    await pause()
    await spins.recordSpin({ categoryId: category.id, elementId: beta.id, variantId: null })

    await elements.remove(category.id, alpha.id)

    expect(await spins.getRecentElementIds(category.id)).toEqual([beta.id])
    expect(await countSpins(category.id)).toBe(1)
  })

  it('penalizes the previous winner with ten elements in the category', async () => {
    const category = await makeCategory()
    const names = Array.from({ length: 10 }, (_, index) => `Element ${index}`)

    for (const name of names) await elements.create(category.id, name)

    const first = await spins.resolveSpin(category.id, () => 0)
    expect(first).not.toBe('not-enough-elements')

    const second = await spins.resolveSpin(category.id, () => 0.99)
    expect(second).not.toBe('not-enough-elements')

    if (first === 'not-enough-elements' || second === 'not-enough-elements') return
    expect(second.elementId).not.toBe(first.elementId)

    const ids = (await db
      .select({ id: schema.elements.id })
      .from(schema.elements)
      .where(eq(schema.elements.categoryId, category.id))).map((row) => row.id)

    const recent = await spins.getRecentElementIds(category.id)
    const entries = computeProbabilities(ids, recent)
    const last = entries.find((entry) => entry.id === recent[0])!
    const previous = entries.find((entry) => entry.id === recent[1])!
    const fresh = entries.find((entry) => !recent.includes(entry.id))!

    expect(last.probability).toBeCloseTo(1 / 86, 10)
    expect(previous.probability).toBeCloseTo(5 / 86, 10)
    expect(fresh.probability).toBeCloseTo(10 / 86, 10)
  })
})
