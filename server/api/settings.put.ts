export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const b = (await readBody<Record<string, any>>(event)) ?? {}
  const values = {
    focusDuration: Number(b.focus_duration) || 25,
    shortBreakDuration: Number(b.short_break_duration) || 5,
    longBreakDuration: Number(b.long_break_duration) || 15,
    longBreakInterval: Number(b.long_break_interval) || 4,
    autoStart: Boolean(b.auto_start),
    soundEnabled: Boolean(b.sound_enabled),
    updatedAt: new Date()
  }
  await useDb().insert(schema.userSettings)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: schema.userSettings.userId, set: values })
  return { ok: true }
})
