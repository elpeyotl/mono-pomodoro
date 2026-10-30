import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const [row] = await useDb().select().from(schema.userSettings)
    .where(eq(schema.userSettings.userId, user.id))
  if (!row) return null
  return {
    focus_duration: row.focusDuration,
    short_break_duration: row.shortBreakDuration,
    long_break_duration: row.longBreakDuration,
    long_break_interval: row.longBreakInterval,
    auto_start: row.autoStart,
    sound_enabled: row.soundEnabled
  }
})
