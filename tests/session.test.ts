import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('../src/lib/auth', () => ({
  auth: { api: { getSession } },
}))

const { readSessionUser } = await import('../src/lib/session')

const headers = new Headers({ cookie: 'session=abc' })

describe('readSessionUser', () => {
  beforeEach(() => {
    getSession.mockReset()
  })

  it('returns null when there is no session', async () => {
    getSession.mockResolvedValue(null)

    expect(await readSessionUser(headers)).toBeNull()
  })

  it('maps the session user to the fields the app needs', async () => {
    getSession.mockResolvedValue({
      user: { id: 'user-1', email: 'ana@example.com', name: 'ana', emailVerified: false },
    })

    expect(await readSessionUser(headers)).toEqual({
      id: 'user-1',
      email: 'ana@example.com',
      name: 'ana',
    })
  })

  it('forwards the request headers to the session lookup', async () => {
    getSession.mockResolvedValue(null)

    await readSessionUser(headers)

    expect(getSession).toHaveBeenCalledWith({ headers })
  })

  it('accepts an injected lookup', async () => {
    const lookup = vi.fn().mockResolvedValue({
      user: { id: 'user-2', email: 'luis@example.com', name: 'luis' },
    })

    expect(await readSessionUser(new Headers(), lookup)).toEqual({
      id: 'user-2',
      email: 'luis@example.com',
      name: 'luis',
    })
  })
})
