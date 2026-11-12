import { ActionError } from 'astro:actions'
import { DuplicateNameError } from '../db/errors'
import { getCurrentUser } from '../lib/session'

export async function requireUserId(request: Request): Promise<string> {
  const user = await getCurrentUser({ request })
  if (!user) throw new ActionError({ code: 'UNAUTHORIZED', message: 'Inicia sesión para continuar.' })
  return user.id
}

export function throwIfDuplicate(cause: unknown, message: string): never {
  if (cause instanceof DuplicateNameError) {
    throw new ActionError({ code: 'CONFLICT', message })
  }
  throw cause
}
