import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db/client'
import { account, session, user, verification } from '../db/schema/auth'
import { sendEmail } from './email'
import { getEnv } from './env'
import { MIN_PASSWORD_LENGTH } from './password'

const env = getEnv()

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    requireEmailVerification: false,
    sendResetPassword: async ({ user: targetUser, url }) => {
      await sendEmail({
        to: targetUser.email,
        subject: 'Restablece tu contraseña',
        text: [
          'Recibimos una solicitud para restablecer tu contraseña.',
          '',
          `Abre este enlace para crear una nueva (caduca en 1 hora):`,
          url,
          '',
          'Si no lo solicitaste, ignora este correo: tu contraseña sigue igual.',
        ].join('\n'),
      })
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      // Google es de confianza: si el correo coincide, se vincula a la cuenta existente.
      trustedProviders: ['google'],
      // El MVP no verifica correos, así que la cuenta local no está marcada como verificada.
      requireLocalEmailVerified: false,
    },
  },
})
