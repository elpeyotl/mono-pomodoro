import { and, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = requireUuidParam(event)
  await useDb().transaction(async (tx) => {
    await tx.delete(schema.tags)
      .where(and(eq(schema.tags.id, id), eq(schema.tags.userId, user.id)))
    // Tag auch aus den Tasks entfernen (vorher nur im Browser-State)
    await tx.update(schema.tasks)
      .set({ tags: sql`array_remove(${schema.tasks.tags}, ${id})` })
      .where(and(eq(schema.tasks.userId, user.id), sql`${id} = any(${schema.tasks.tags})`))
  })
  return { ok: true }
})
