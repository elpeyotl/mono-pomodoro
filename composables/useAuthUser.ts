import type { AuthUser } from '~/utils/authClient'

// Ersatz für useSupabaseUser(): null = Gast, sonst eingeloggter User.
// Wird im Client-Plugin plugins/auth.client.ts aus der Better-Auth-Session befüllt.
export function useAuthUser() {
  return useState<AuthUser | null>('auth-user', () => null)
}
