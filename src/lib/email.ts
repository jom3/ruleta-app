import { Resend } from 'resend'
import { getEnv } from './env'

export type EmailMessage = {
  to: string
  subject: string
  text: string
}

let resendClient: Resend | undefined

export async function sendEmail(message: EmailMessage): Promise<void> {
  const env = getEnv()
  resendClient ??= new Resend(env.RESEND_API_KEY)

  const { error } = await resendClient.emails.send({
    from: env.EMAIL_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
