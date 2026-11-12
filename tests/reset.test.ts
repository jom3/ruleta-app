import { describe, expect, it, vi } from 'vitest'
import { requestReset } from '../src/lib/reset'

function buildDeps(providers: string[] | null) {
  return {
    findProviders: vi.fn().mockResolvedValue(providers),
    sendMail: vi.fn().mockResolvedValue(undefined),
    sendResetLink: vi.fn().mockResolvedValue(undefined),
  }
}

describe('requestReset', () => {
  it('ignores an email without account', async () => {
    const deps = buildDeps(null)

    expect(await requestReset('nadie@example.com', deps)).toBe('ignored')
    expect(deps.sendMail).not.toHaveBeenCalled()
    expect(deps.sendResetLink).not.toHaveBeenCalled()
  })

  it('sends the reset link when the account has a password', async () => {
    const deps = buildDeps(['credential'])

    expect(await requestReset('  Ana@Example.com ', deps)).toBe('sent')
    expect(deps.sendResetLink).toHaveBeenCalledWith('ana@example.com')
    expect(deps.sendMail).not.toHaveBeenCalled()
  })

  it('sends the Google notice to a Google-only account', async () => {
    const deps = buildDeps(['google'])

    expect(await requestReset('ana@example.com', deps)).toBe('ignored')
    expect(deps.sendResetLink).not.toHaveBeenCalled()
    expect(deps.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        subject: 'Tu cuenta entra con Google',
      }),
    )
  })

  it('sends the reset link when the account has a password and Google', async () => {
    const deps = buildDeps(['credential', 'google'])

    expect(await requestReset('ana@example.com', deps)).toBe('sent')
    expect(deps.sendResetLink).toHaveBeenCalledWith('ana@example.com')
  })
})
