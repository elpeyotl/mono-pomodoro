import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = requireUuidParam(event)
  const body = (await readBody<Record<string, any>>(event)) ?? {}
  const data: { name?: string; color?: string } = {}
  if (typeof body.name === 'string') data.name = body.name.trim().slice(0, 50)
  if (typeof body.color === 'string') data.color = body.color.slice(0, 20)

  const [row] = await useDb().update(schema.tags)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(schema.tags.id, id), eq(schema.tags.userId, user.id)))
    .returning()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Tag nicht gefunden' })
  return tagToApi(row)
})
