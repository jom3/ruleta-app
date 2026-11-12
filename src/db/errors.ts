export class DuplicateNameError extends Error {
  constructor() {
    super('Duplicate name')
    this.name = 'DuplicateNameError'
  }
}

export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  if ('code' in error && error.code === '23505') return true

  return 'cause' in error && isUniqueViolation(error.cause)
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}
