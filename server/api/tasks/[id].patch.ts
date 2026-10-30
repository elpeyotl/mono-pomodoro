import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = requireUuidParam(event)
  const data = taskFromApi((await readBody(event)) ?? {})
  delete data.createdAt

  const [row] = await useDb().update(schema.tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)))
    .returning()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Task nicht gefunden' })
  return taskToApi(row)
})
