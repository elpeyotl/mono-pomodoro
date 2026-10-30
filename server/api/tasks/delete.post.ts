import { and, eq, inArray } from 'drizzle-orm'

// Batch-Delete: { ids: string[] }
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { ids } = (await readBody<{ ids?: unknown[] }>(event)) ?? {}
  const valid = (ids ?? []).filter(isUuid)
  if (valid.length === 0) return { deleted: 0 }
  const rows = await useDb().delete(schema.tasks)
    .where(and(eq(schema.tasks.userId, user.id), inArray(schema.tasks.id, valid)))
    .returning({ id: schema.tasks.id })
  return { deleted: rows.length }
})
