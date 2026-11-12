import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import { create, DuplicateNameError, remove } from '../db/categories'
import { displayName, nameError } from '../lib/names'
import { getCurrentUser } from '../lib/session'

async function requireUserId(request: Request): Promise<string> {
  const user = await getCurrentUser({ request })
  if (!user) throw new ActionError({ code: 'UNAUTHORIZED', message: 'Inicia sesión para continuar.' })
  return user.id
}

export const createCategory = defineAction({
  input: z.object({ name: z.string() }),
  handler: async ({ name }, context) => {
    const userId = await requireUserId(context.request)

    const error = nameError(name)
    if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error })

    try {
      return await create(userId, displayName(name))
    } catch (cause) {
      if (cause instanceof DuplicateNameError) {
        throw new ActionError({ code: 'CONFLICT', message: 'Ya tienes una categoría con ese nombre.' })
      }
      throw cause
    }
  },
})

export const deleteCategory = defineAction({
  input: z.object({ id: z.string() }),
  handler: async ({ id }, context) => {
    const userId = await requireUserId(context.request)

    const removed = await remove(userId, id)
    if (!removed) throw new ActionError({ code: 'NOT_FOUND', message: 'La categoría no existe.' })

    return { id }
  },
})
