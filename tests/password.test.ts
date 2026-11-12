import { describe, expect, it } from 'vitest'
import { isValidPassword, MIN_PASSWORD_LENGTH } from '../src/lib/password'

describe('isValidPassword', () => {
  it('rejects a password shorter than the minimum', () => {
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(false)
  })

  it('accepts a password with exactly the minimum length', () => {
    expect(isValidPassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBe(true)
  })

  it('accepts any characters as long as the length is enough', () => {
    expect(isValidPassword('12345678')).toBe(true)
    expect(isValidPassword('        ')).toBe(true)
  })
})
