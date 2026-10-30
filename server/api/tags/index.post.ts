export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = (await readBody<Record<string, any>>(event)) ?? {}
  const name = String(body.name ?? '').trim().slice(0, 50)
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Name fehlt' })

  const [row] = await useDb().insert(schema.tags)
    .values({
      ...(isUuid(body.id) ? { id: body.id } : {}),
      userId: user.id,
      name,
      color: String(body.color ?? 'blue').slice(0, 20)
    })
    .onConflictDoNothing()
    .returning()
  return row ? tagToApi(row) : null
})
