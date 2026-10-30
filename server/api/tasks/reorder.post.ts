import { and, eq } from 'drizzle-orm'

// { ids: string[] } in neuer Reihenfolge -> sort_order = Index, in einer Transaktion
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { ids } = (await readBody<{ ids?: unknown[] }>(event)) ?? {}
  const valid = (ids ?? []).filter(isUuid)
  const now = new Date()
  await useDb().transaction(async (tx) => {
    for (const [index, id] of valid.entries()) {
      await tx.update(schema.tasks)
        .set({ sortOrder: index, updatedAt: now })
        .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)))
    }
  })
  return { ok: true, updated_at: now.toISOString() }
})
