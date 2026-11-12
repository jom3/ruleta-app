import { describe, expect, it } from 'vitest'
import { createRateLimiter } from '../src/lib/rate-limit'

describe('createRateLimiter', () => {
  it('allows three requests per window and blocks the fourth', () => {
    const allow = createRateLimiter({ limit: 3, windowMs: 60_000 })

    expect(allow('ip-1', 0)).toBe(true)
    expect(allow('ip-1', 10)).toBe(true)
    expect(allow('ip-1', 20)).toBe(true)
    expect(allow('ip-1', 30)).toBe(false)
  })

  it('tracks each key separately', () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 60_000 })

    expect(allow('ip-1', 0)).toBe(true)
    expect(allow('ip-2', 0)).toBe(true)
    expect(allow('ip-1', 1)).toBe(false)
  })

  it('allows requests again once the window passes', () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 1_000 })

    expect(allow('ip-1', 0)).toBe(true)
    expect(allow('ip-1', 500)).toBe(false)
    expect(allow('ip-1', 1_001)).toBe(true)
  })
})
