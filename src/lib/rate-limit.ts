export type RateLimiter = (key: string, now?: number) => boolean

export type RateLimitOptions = {
  limit: number
  windowMs: number
}

// Best effort: el contador vive en memoria del proceso, no se comparte entre instancias.
export function createRateLimiter({ limit, windowMs }: RateLimitOptions): RateLimiter {
  const hits = new Map<string, number[]>()

  return (key, now = Date.now()) => {
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)

    if (recent.length >= limit) {
      hits.set(key, recent)
      return false
    }

    recent.push(now)
    hits.set(key, recent)
    return true
  }
}
