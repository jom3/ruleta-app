export const REQUIRED_ENV_KEYS = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
] as const

export type EnvKey = (typeof REQUIRED_ENV_KEYS)[number]
export type Env = Record<EnvKey, string>

export class MissingEnvError extends Error {
  readonly keys: EnvKey[]

  constructor(keys: EnvKey[]) {
    super(`Missing environment variables: ${keys.join(', ')}`)
    this.name = 'MissingEnvError'
    this.keys = keys
  }
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !source[key]?.trim())
  if (missing.length > 0) {
    throw new MissingEnvError(missing)
  }

  return Object.fromEntries(
    REQUIRED_ENV_KEYS.map((key) => [key, source[key]!.trim()]),
  ) as Env
}

// En dev y en el build de Astro las variables llegan por import.meta.env;
// en Vercel, por process.env.
function readSources(): Record<string, string | undefined> {
  const source: Record<string, string | undefined> = { ...process.env }
  const viteEnv = (import.meta.env ?? {}) as Record<string, unknown>

  for (const key of REQUIRED_ENV_KEYS) {
    const value = viteEnv[key]
    if (typeof value === 'string' && value.trim() !== '') {
      source[key] = value
    }
  }

  return source
}

let cachedEnv: Env | undefined

export function getEnv(): Env {
  cachedEnv ??= parseEnv(readSources())
  return cachedEnv
}
