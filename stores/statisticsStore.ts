import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { FocusSession, LocalFocusSession, DailyStats, WeeklyStats } from '~/types'

export const useStatisticsStore = defineStore('statistics', () => {
  // Local sessions for guest mode
  const localSessions = useStorage<LocalFocusSession[]>('focus-app-sessions', [])

  // Server state (Neon über /api/sessions)
  const user = useAuthUser()
  const serverSessions = ref<FocusSession[]>([])
  const isLoading = ref(false)

  // Computed: Active sessions source (merge both for logged-in users with fallback sessions)
  const sessions = computed(() => {
    if (user.value) {
      if (localSessions.value.length > 0) {
        return [...serverSessions.value, ...(localSessions.value as FocusSession[])]
      }
      return serverSessions.value
    }
    return localSessions.value as FocusSession[]
  })

  // Helper: Generate UUID
  function generateId(): string {
    return crypto.randomUUID()
  }

  // ==================== Session Logging ====================

  async function logFocusSession(
    taskId: string | null,
    durationSeconds: number,
    startedAt: Date,
    endedAt: Date,
    completedPomodoro: boolean
  ): Promise<void> {
    // Don't log very short sessions (less than 10 seconds)
    if (durationSeconds < 10) return

    const session: LocalFocusSession = {
      id: generateId(),
      task_id: taskId,
      duration_seconds: durationSeconds,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      completed_pomodoro: completedPomodoro,
      created_at: new Date().toISOString()
    }

    if (user.value) {
      try {
        await $fetch('/api/sessions', { method: 'POST', body: session })
        serverSessions.value = [...serverSessions.value, { ...session, user_id: user.value.id }]
      } catch (e) {
        console.error('Error logging focus session:', e)
        // Fallback to localStorage if the server fails
        localSessions.value.push(session)
      }
    } else {
      localSessions.value.push(session)
    }
  }

  // ==================== Statistics Aggregation ====================

  // Helper: Format a Date to local YYYY-MM-DD string
  function toLocalDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // Get daily stats for a date range (uses local dates consistently)
  function getDailyStats(startDate: string, endDate: string): DailyStats[] {
    const stats: Map<string, DailyStats> = new Map()

    // Initialize all dates in range using local time
    const [startY, startM, startD] = startDate.split('-').map(Number)
    const [endY, endM, endD] = endDate.split('-').map(Number)
    let current = new Date(startY, startM - 1, startD)
    const end = new Date(endY, endM - 1, endD)
    while (current <= end) {
      const dateStr = toLocalDateStr(current)
      stats.set(dateStr, {
        date: dateStr,
        total_focus_time: 0,
        completed_pomodoros: 0,
        sessions_count: 0
      })
      current.setDate(current.getDate() + 1)
    }

    // Aggregate sessions using local date of each session
    sessions.value.forEach(session => {
      const sessionDate = toLocalDateStr(new Date(session.started_at))
      if (sessionDate >= startDate && sessionDate <= endDate) {
        const dayStat = stats.get(sessionDate)
        if (dayStat) {
          dayStat.total_focus_time += session.duration_seconds
          dayStat.sessions_count++
          if (session.completed_pomodoro) {
            dayStat.completed_pomodoros++
          }
        }
      }
    })

    return Array.from(stats.values()).sort((a, b) => a.date.localeCompare(b.date))
  }

  // Get weekly stats
  function getWeeklyStats(weeksBack: number = 4): WeeklyStats[] {
    const weeks: WeeklyStats[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < weeksBack; i++) {
      // Calculate week end (Saturday of this week going back)
      const weekEnd = new Date(today)
      weekEnd.setDate(today.getDate() - (i * 7) - today.getDay())

      // Calculate week start (Sunday)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekEnd.getDate() - 6)

      const startStr = toLocalDateStr(weekStart)
      const endStr = toLocalDateStr(weekEnd)
      const dailyBreakdown = getDailyStats(startStr, endStr)

      weeks.push({
        week_start: startStr,
        week_end: endStr,
        total_focus_time: dailyBreakdown.reduce((sum, d) => sum + d.total_focus_time, 0),
        completed_pomodoros: dailyBreakdown.reduce((sum, d) => sum + d.completed_pomodoros, 0),
        sessions_count: dailyBreakdown.reduce((sum, d) => sum + d.sessions_count, 0),
        daily_breakdown: dailyBreakdown
      })
    }

    return weeks
  }

  // Today's stats (quick access, using local date)
  const todayStats = computed((): DailyStats => {
    const today = toLocalDateStr(new Date())
    const stats = getDailyStats(today, today)
    return stats[0] || { date: today, total_focus_time: 0, completed_pomodoros: 0, sessions_count: 0 }
  })

  // This week's stats
  const thisWeekStats = computed((): WeeklyStats | null => {
    const weeks = getWeeklyStats(1)
    return weeks[0] || null
  })

  // ==================== Server Sync ====================

  async function fetchSessions(daysBack: number = 30): Promise<void> {
    if (!user.value) return

    isLoading.value = true
    try {
      const data = await $fetch<FocusSession[]>('/api/sessions', { query: { days: daysBack } })
      serverSessions.value = data || []
    } catch (e) {
      console.error('Error fetching sessions:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function syncLocalToServer(): Promise<{ synced: number; errors: number }> {
    if (!user.value || localSessions.value.length === 0) {
      return { synced: 0, errors: 0 }
    }

    let synced = 0
    let errors = 0

    for (const session of localSessions.value) {
      try {
        await $fetch('/api/sessions', { method: 'POST', body: session })
        synced++
      } catch (e) {
        console.error('Error syncing session:', e)
        errors++
      }
    }

    if (synced > 0) {
      localSessions.value = []
      await fetchSessions()
    }

    return { synced, errors }
  }

  // Check if local sessions exist (for sync prompt)
  const hasLocalSessions = computed(() => localSessions.value.length > 0)

  // Watch for user login
  watch(user, async (newUser) => {
    if (newUser) {
      await fetchSessions()
    } else {
      serverSessions.value = []
    }
  }, { immediate: true })

  return {
    // State
    sessions,
    isLoading,
    hasLocalSessions,

    // Computed stats
    todayStats,
    thisWeekStats,

    // Actions
    logFocusSession,
    getDailyStats,
    getWeeklyStats,
    fetchSessions,
    syncLocalToServer
  }
})
