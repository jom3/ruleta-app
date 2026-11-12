import { resolveSpin } from '../db/spins'
import { requireOwnedCategory } from './ownership'
import { getCurrentUser, type SessionUser } from './session'

export type SpinUserLookup = (request: Request) => Promise<SessionUser | null>

const json = (body: unknown, status: number): Response =>
  Response.json(body, { status })

export async function handleSpin(
  request: Request,
  categoryId: string,
  lookupUser: SpinUserLookup = (request) => getCurrentUser({ request }),
): Promise<Response> {
  const user = await lookupUser(request)
  if (!user) return json({ error: 'unauthorized' }, 401)

  const category = await requireOwnedCategory(user.id, categoryId)
  if (!category) return json({ error: 'not-found' }, 404)

  const result = await resolveSpin(category.id)
  if (result === 'not-enough-elements') return json({ error: 'not-enough-elements' }, 409)

  return json(result, 200)
}
