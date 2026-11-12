import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import { create, remove } from '../db/variants'
import { displayName, nameError } from '../lib/names'
import { requireOwnedElement } from '../lib/ownership'
import { requireUserId, throwIfDuplicate } from './guards'

export const createVariant = defineAction({
  input: z.object({ elementId: z.string(), name: z.string() }),
  handler: async ({ elementId, name }, context) => {
    const userId = await requireUserId(context.request)

    const element = await requireOwnedElement(userId, elementId)
    if (!element) throw new ActionError({ code: 'NOT_FOUND', message: 'El elemento no existe.' })

    const error = nameError(name)
    if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error })

    try {
      return await create(element.id, displayName(name))
    } catch (cause) {
      return throwIfDuplicate(cause, 'Esa variante ya existe en el elemento.')
    }
  },
})

export const deleteVariant = defineAction({
  input: z.object({ elementId: z.string(), variantId: z.string() }),
  handler: async ({ elementId, variantId }, context) => {
    const userId = await requireUserId(context.request)

    const element = await requireOwnedElement(userId, elementId)
    if (!element) throw new ActionError({ code: 'NOT_FOUND', message: 'El elemento no existe.' })

    const removed = await remove(element.id, variantId)
    if (!removed) throw new ActionError({ code: 'NOT_FOUND', message: 'La variante no existe.' })

    return { id: variantId }
  },
})
