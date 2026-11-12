import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import { create, remove } from '../db/elements'
import { displayName, nameError } from '../lib/names'
import { requireOwnedCategory } from '../lib/ownership'
import { requireUserId, throwIfDuplicate } from './guards'

export const createElement = defineAction({
  input: z.object({ categoryId: z.string(), name: z.string() }),
  handler: async ({ categoryId, name }, context) => {
    const userId = await requireUserId(context.request)

    const category = await requireOwnedCategory(userId, categoryId)
    if (!category) throw new ActionError({ code: 'NOT_FOUND', message: 'La categoría no existe.' })

    const error = nameError(name)
    if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error })

    try {
      return await create(category.id, displayName(name))
    } catch (cause) {
      return throwIfDuplicate(cause, 'Ese elemento ya existe en la categoría.')
    }
  },
})

export const deleteElement = defineAction({
  input: z.object({ categoryId: z.string(), elementId: z.string() }),
  handler: async ({ categoryId, elementId }, context) => {
    const userId = await requireUserId(context.request)

    const category = await requireOwnedCategory(userId, categoryId)
    if (!category) throw new ActionError({ code: 'NOT_FOUND', message: 'La categoría no existe.' })

    const removed = await remove(category.id, elementId)
    if (!removed) throw new ActionError({ code: 'NOT_FOUND', message: 'El elemento no existe.' })

    return { id: elementId }
  },
})
