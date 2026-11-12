import type { APIRoute } from 'astro'
import { sql } from 'drizzle-orm'
import { db } from '../../db/client'

export const prerender = false

export const GET: APIRoute = async () => {
  try {
    await db.execute(sql`select 1`)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[health] database check failed', error)
    return Response.json({ ok: false }, { status: 503 })
  }
}
