export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<Record<string, any>>(event)
  const data = taskFromApi(body ?? {})
  if (!data.title) throw createError({ statusCode: 400, statusMessage: 'Titel fehlt' })

  // Client vergibt die ID (auch für den Gast-Sync); doppelte Inserts werden ignoriert
  const [row] = await useDb().insert(schema.tasks)
    .values({ ...data, ...(isUuid(body.id) ? { id: body.id } : {}), userId: user.id } as any)
    .onConflictDoNothing()
    .returning()
  return row ? taskToApi(row) : null
})
