import type { APIRoute } from 'astro'
import { createRateLimiter } from '../../../lib/rate-limit'
import { requestReset } from '../../../lib/reset'

export const prerender = false

const allowRequest = createRateLimiter({ limit: 3, windowMs: 60_000 })

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!allowRequest(clientAddress)) {
    return Response.json({ ok: true })
  }

  let email = ''

  try {
    const body = await request.json()
    email = String(body?.email ?? '')
  } catch {
    email = ''
  }

  if (email.trim() !== '') {
    try {
      await requestReset(email)
    } catch (error) {
      console.error('[password-recovery] reset request failed', error)
    }
  }

  // Respuesta genérica siempre: no revela si el correo tiene cuenta.
  return Response.json({ ok: true })
}
