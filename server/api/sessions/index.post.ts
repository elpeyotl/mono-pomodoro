export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const b = (await readBody<Record<string, any>>(event)) ?? {}
  const startedAt = new Date(b.started_at)
  const endedAt = new Date(b.ended_at)
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Zeiten' })
  }

  const [row] = await useDb().insert(schema.focusSessions)
    .values({
      ...(isUuid(b.id) ? { id: b.id } : {}),
      userId: user.id,
      taskId: isUuid(b.task_id) ? b.task_id : null,
      durationSeconds: Math.round(Number(b.duration_seconds) || 0),
      startedAt,
      endedAt,
      completedPomodoro: Boolean(b.completed_pomodoro)
    })
    .onConflictDoNothing()
    .returning()
  return row ? sessionToApi(row) : null
})
