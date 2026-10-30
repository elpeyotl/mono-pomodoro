import { and, desc, eq, gte } from 'drizzle-orm'

// ?days=30 (Default)
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const days = Math.min(Math.max(Number(getQuery(event).days) || 30, 1), 3650)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const rows = await useDb().select().from(schema.focusSessions)
    .where(and(eq(schema.focusSessions.userId, user.id), gte(schema.focusSessions.startedAt, since)))
    .orderBy(desc(schema.focusSessions.startedAt))
  return rows.map(sessionToApi)
})
