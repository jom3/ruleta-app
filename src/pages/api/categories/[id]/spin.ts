import type { APIRoute } from 'astro'
import { handleSpin } from '../../../../lib/spin-endpoint'

export const prerender = false

export const POST: APIRoute = ({ request, params }) => handleSpin(request, params.id ?? '')
