import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { FocusSession, LocalFocusSession, DailyStats, WeeklyStats } from '~/types'

export const useStatisticsStore = defineStore('statistics', () => {
  // Local sessions for guest mode
  const localSessions = useStorage<LocalFocusSession[]>('focus-app-sessions', [])

  // Supabase state
  const user = useSupabaseUser()
  const supabase = useSupabaseClient() as any
  const supabaseSessions = ref<FocusSession[]>([])
  const isLoading = ref(false)

  // Computed: Active sessions source (merge both for logged-in users with fallback sessions)
  const sessions = computed(() => {
    if (user.value) {
      if (localSessions.value.length > 0) {
        return [...supabaseSessions.value, ...(localSessions.value as FocusSession[])]
      }
      return supabaseSessions.value
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
        const { error } = await supabase
          .from('focus_sessions')
          .insert({
            ...session,
            user_id: user.value.id
          })
        if (error) throw error
        supabaseSessions.value = [...supabaseSessions.value, { ...session, user_id: user.value.id }]
      } catch (e) {
        console.error('Error logging focus session:', e)
        // Fallback to localStorage if Supabase fails
        localSessions.value.push(session)
      }
    } else {
      localSessions.value.push(session)
    }
  }

  // ==================== Statistics Aggregation ====================

  // Get daily stats for a date range
  function getDailyStats(startDate: string, endDate: string): DailyStats[] {
    const stats: Map<string, DailyStats> = new Map()

    // Initialize all dates in range
    let current = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      stats.set(dateStr, {
        date: dateStr,
        total_focus_time: 0,
        completed_pomodoros: 0,
        sessions_count: 0
      })
      current.setDate(current.getDate() + 1)
    }

    // Aggregate sessions
    sessions.value.forEach(session => {
      const sessionDate = session.started_at.split('T')[0]
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

      const startStr = weekStart.toISOString().split('T')[0]
      const endStr = weekEnd.toISOString().split('T')[0]
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

  // Today's stats (quick access)
  const todayStats = computed((): DailyStats => {
    const today = new Date().toISOString().split('T')[0]
    const stats = getDailyStats(today, today)
    return stats[0] || { date: today, total_focus_time: 0, completed_pomodoros: 0, sessions_count: 0 }
  })

  // This week's stats
  const thisWeekStats = computed((): WeeklyStats | null => {
    const weeks = getWeeklyStats(1)
    return weeks[0] || null
  })

  // ==================== Supabase Sync ====================

  async function fetchSessions(daysBack: number = 30): Promise<void> {
    if (!user.value) return

    isLoading.value = true
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: false })

      if (error) throw error
      supabaseSessions.value = (data || []) as FocusSession[]
    } catch (e) {
      console.error('Error fetching sessions:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function syncLocalToSupabase(): Promise<{ synced: number; errors: number }> {
    if (!user.value || localSessions.value.length === 0) {
      return { synced: 0, errors: 0 }
    }

    let synced = 0
    let errors = 0

    for (const session of localSessions.value) {
      try {
        const { error } = await supabase
          .from('focus_sessions')
          .insert({
            ...session,
            user_id: user.value.id
          })
        if (error) throw error
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
      supabaseSessions.value = []
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
    syncLocalToSupabase
  }
})
