import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const rows = await useDb().select().from(schema.tags)
    .where(eq(schema.tags.userId, user.id))
    .orderBy(asc(schema.tags.createdAt))
  return rows.map(tagToApi)
})
