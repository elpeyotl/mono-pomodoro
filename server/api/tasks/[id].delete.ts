import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = requireUuidParam(event)
  await useDb().delete(schema.tasks)
    .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)))
  return { ok: true }
})
