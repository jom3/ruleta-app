import { defineMiddleware } from 'astro:middleware'
import { readSessionUser } from './lib/session'

const PRIVATE_PREFIX = '/app'

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  // Las rutas de API resuelven su propia sesión.
  if (pathname.startsWith('/api/')) {
    context.locals.user = null
    return next()
  }

  const user = await readSessionUser(context.request.headers)
  context.locals.user = user

  const isPrivate = pathname === PRIVATE_PREFIX || pathname.startsWith(`${PRIVATE_PREFIX}/`)
  if (isPrivate && !user) {
    return context.redirect('/login')
  }

  return next()
})
