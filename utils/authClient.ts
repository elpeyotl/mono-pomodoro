import { createAuthClient } from 'better-auth/vue'

// Same-Origin: die Auth-API liegt unter /api/auth
export const authClient = createAuthClient()

export interface AuthUser {
  id: string
  email: string
  name?: string | null
}
