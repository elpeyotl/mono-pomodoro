import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { hashPassword, verifyPassword } from 'better-auth/crypto'
import bcrypt from 'bcryptjs'
import { useDb, schema } from './db'
import { sendMail } from './mail'

let _auth: ReturnType<typeof createAuth> | null = null

function createAuth() {
  const googleId = process.env.GOOGLE_CLIENT_ID
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET

  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    // Vercel-Vorschauen laufen auf wechselnden URLs
    trustedOrigins: [
      ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
      ...(process.env.VERCEL_BRANCH_URL ? [`https://${process.env.VERCEL_BRANCH_URL}`] : [])
    ],
    database: drizzleAdapter(useDb(), {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification
      }
    }),
    advanced: {
      database: { generateId: 'uuid' }
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      requireEmailVerification: true,
      password: {
        hash: hashPassword,
        // Aus Supabase übernommene Konten haben bcrypt-Hashes ($2a$/$2b$).
        // Diese werden weiter akzeptiert; neue Passwörter nutzen Better Auths scrypt.
        verify: async ({ hash, password }) => {
          if (hash.startsWith('$2')) return bcrypt.compare(password, hash)
          return verifyPassword({ hash, password })
        }
      },
      sendResetPassword: async ({ user, url }) => {
        await sendMail({
          to: user.email,
          subject: 'Mono – Reset your password',
          text: `Hi,\n\nUse this link to set a new password:\n${url}\n\nIf you didn't request this, you can ignore this email.`
        })
      }
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendMail({
          to: user.email,
          subject: 'Mono – Confirm your email',
          text: `Welcome to Mono!\n\nPlease confirm your email address:\n${url}`
        })
      }
    },
    socialProviders: googleId && googleSecret
      ? { google: { clientId: googleId, clientSecret: googleSecret } }
      : {},
    account: {
      // Google-Login mit derselben E-Mail wird mit dem bestehenden Konto verknüpft
      accountLinking: { enabled: true, trustedProviders: ['google'] }
    }
  })
}

export function useAuth() {
  if (!_auth) _auth = createAuth()
  return _auth
}
