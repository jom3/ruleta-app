import { auth } from './auth'

export type SessionUser = {
  id: string
  email: string
  name: string
}

export type SessionPayload = {
  user: { id: string; email: string; name: string }
} | null

export type SessionLookup = (headers: Headers) => Promise<SessionPayload>

const lookupWithBetterAuth: SessionLookup = (headers) => auth.api.getSession({ headers })

export async function readSessionUser(
  headers: Headers,
  lookup: SessionLookup = lookupWithBetterAuth,
): Promise<SessionUser | null> {
  const payload = await lookup(headers)
  if (!payload?.user) return null

  return {
    id: payload.user.id,
    email: payload.user.email,
    name: payload.user.name,
  }
}

export function getCurrentUser(astro: { request: Request }): Promise<SessionUser | null> {
  return readSessionUser(astro.request.headers)
}
