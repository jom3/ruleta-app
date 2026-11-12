import { describe, expect, it } from 'vitest'
import { MissingEnvError, parseEnv, REQUIRED_ENV_KEYS } from '../src/lib/env'

const validEnv = Object.fromEntries(REQUIRED_ENV_KEYS.map((key) => [key, `value-of-${key}`]))

describe('parseEnv', () => {
  it('returns every required variable', () => {
    expect(parseEnv(validEnv)).toEqual(validEnv)
  })

  it('lists the missing variables by name', () => {
    const incomplete = { ...validEnv, DATABASE_URL: undefined, EMAIL_FROM: '   ' }

    expect(() => parseEnv(incomplete)).toThrowError(MissingEnvError)
    expect(() => parseEnv(incomplete)).toThrowError(/DATABASE_URL, EMAIL_FROM/)
  })

  it('trims surrounding whitespace', () => {
    expect(parseEnv({ ...validEnv, EMAIL_FROM: '  hola@example.com  ' }).EMAIL_FROM).toBe('hola@example.com')
  })
})
