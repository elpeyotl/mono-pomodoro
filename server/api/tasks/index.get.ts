import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const rows = await useDb().select().from(schema.tasks)
    .where(eq(schema.tasks.userId, user.id))
    .orderBy(desc(schema.tasks.createdAt))
  return rows.map(taskToApi)
})
