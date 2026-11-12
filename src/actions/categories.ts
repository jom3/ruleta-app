import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import { create, remove } from '../db/categories'
import { displayName, nameError } from '../lib/names'
import { requireUserId, throwIfDuplicate } from './guards'

export const createCategory = defineAction({
  input: z.object({ name: z.string() }),
  handler: async ({ name }, context) => {
    const userId = await requireUserId(context.request)

    const error = nameError(name)
    if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error })

    try {
      return await create(userId, displayName(name))
    } catch (cause) {
      return throwIfDuplicate(cause, 'Ya tienes una categoría con ese nombre.')
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
