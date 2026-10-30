import type { H3Event } from 'h3'

// Ersetzt Supabase-RLS: jede API-Route holt den eingeloggten User und filtert selbst auf user_id.
export async function requireUser(event: H3Event) {
  const session = await useAuth().api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Nicht eingeloggt' })
  }
  return session.user
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

export function requireUuidParam(event: H3Event, name = 'id'): string {
  const value = getRouterParam(event, name)
  if (!isUuid(value)) throw createError({ statusCode: 400, statusMessage: 'Ungültige ID' })
  return value
}
