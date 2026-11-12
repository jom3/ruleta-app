import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const hasDatabase = Boolean(process.env.DATABASE_URL)

describe.skipIf(!hasDatabase)('categories repository', () => {
  const userIds = [randomUUID(), randomUUID()]

  let db: typeof import('../src/db/client').db
  let schema: typeof import('../src/db/schema')
  let repository: typeof import('../src/db/categories')

  beforeAll(async () => {
    ;({ db } = await import('../src/db/client'))
    schema = await import('../src/db/schema')
    repository = await import('../src/db/categories')

    await db.insert(schema.user).values(
      userIds.map((id, index) => ({
        id,
        name: `Spec 04 user ${index}`,
        email: `spec04-${index}-${id}@example.test`,
      })),
    )
  })

  beforeEach(async () => {
    await db.delete(schema.categories).where(inArray(schema.categories.userId, userIds))
  })

  afterAll(async () => {
    await db.delete(schema.user).where(inArray(schema.user.id, userIds))
  })

  it('rejects a duplicated name that only changes case', async () => {
    await repository.create(userIds[0]!, 'Front')

    await expect(repository.create(userIds[0]!, 'front')).rejects.toBeInstanceOf(
      repository.DuplicateNameError,
    )
  })

  it('allows the same name for two different users', async () => {
    await repository.create(userIds[0]!, 'Front')
    const created = await repository.create(userIds[1]!, 'front')

    expect(created.name).toBe('front')
  })

  it('stores the name without extra spaces', async () => {
    const created = await repository.create(userIds[0]!, '  Front   End  ')

    expect(created.name).toBe('Front End')
  })

  it('does not remove a category owned by another user', async () => {
    const created = await repository.create(userIds[1]!, 'Front')

    expect(await repository.remove(userIds[0]!, created.id)).toBe(false)
    expect(await repository.findById(userIds[1]!, created.id)).not.toBeNull()
  })

  it('returns null for an id that is not a uuid', async () => {
    expect(await repository.findById(userIds[0]!, 'not-a-uuid')).toBeNull()
  })
})
