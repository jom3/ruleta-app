import type { EmailMessage } from './email'

export type ResetRequestResult = 'sent' | 'ignored'

export type ResetDeps = {
  findProviders: (email: string) => Promise<string[] | null>
  sendMail: (message: EmailMessage) => Promise<void>
  sendResetLink: (email: string) => Promise<void>
}

const googleOnlyMessage = (email: string): EmailMessage => ({
  to: email,
  subject: 'Tu cuenta entra con Google',
  text: [
    'Tu cuenta se creó con Google, así que no tiene contraseña que restablecer.',
    '',
    'Entra desde el inicio de sesión con el botón "Continuar con Google".',
    '',
    'Si no solicitaste este correo, ignóralo.',
  ].join('\n'),
})

export async function requestReset(
  rawEmail: string,
  deps: Partial<ResetDeps> = {},
): Promise<ResetRequestResult> {
  const email = rawEmail.trim().toLowerCase()
  const providers = await (deps.findProviders ?? findProvidersInDatabase)(email)

  if (!providers) return 'ignored'

  if (!providers.includes('credential')) {
    await (deps.sendMail ?? sendEmail)(googleOnlyMessage(email))
    return 'ignored'
  }

  await (deps.sendResetLink ?? sendResetLinkWithBetterAuth)(email)
  return 'sent'
}

async function findProvidersInDatabase(email: string): Promise<string[] | null> {
  const { eq } = await import('drizzle-orm')
  const { db } = await import('../db/client')
  const { account, user } = await import('../db/schema/auth')

  const [foundUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  if (!foundUser) return null

  const rows = await db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, foundUser.id))

  return rows.map((row) => row.providerId)
}

async function sendResetLinkWithBetterAuth(email: string): Promise<void> {
  const { auth } = await import('./auth')
  const { getEnv } = await import('./env')

  await auth.api.requestPasswordReset({
    body: {
      email,
      redirectTo: `${getEnv().BETTER_AUTH_URL}/reset-password`,
    },
  })
}

async function sendEmail(message: EmailMessage): Promise<void> {
  const { sendEmail: send } = await import('./email')
  await send(message)
}
