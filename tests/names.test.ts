import { describe, expect, it } from 'vitest'
import { displayName, MAX_NAME_LENGTH, nameError, normalizeName } from '../src/lib/names'

describe('displayName', () => {
  it('trims borders and collapses inner spaces', () => {
    expect(displayName('  Front   End  ')).toBe('Front End')
  })

  it('keeps the original case', () => {
    expect(displayName('JavaScript')).toBe('JavaScript')
  })
})

describe('normalizeName', () => {
  it('ignores case and spacing', () => {
    expect(normalizeName('  FRONT  end ')).toBe('front end')
  })
})

describe('nameError', () => {
  it('rejects an empty name', () => {
    expect(nameError('')).not.toBeNull()
  })

  it('rejects a name with only spaces', () => {
    expect(nameError('   ')).not.toBeNull()
  })

  it('accepts a name up to the limit', () => {
    expect(nameError('a'.repeat(MAX_NAME_LENGTH))).toBeNull()
  })

  it('rejects a name over the limit', () => {
    expect(nameError('a'.repeat(MAX_NAME_LENGTH + 1))).not.toBeNull()
  })
})
