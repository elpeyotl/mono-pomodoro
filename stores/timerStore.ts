import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

export interface TimerSettings {
  focus: number           // in minutes
  shortBreak: number      // in minutes
  longBreak: number       // in minutes
  longBreakInterval: number // number of focus sessions before long break
  autoStart: boolean      // auto-start next timer
  soundEnabled: boolean   // play sound on completion
}

// Default settings
// Note: autoStart is OFF by default to enable Overtime mode for flexible work
export const DEFAULT_SETTINGS: TimerSettings = {
  focus: 25,           // 25 min
  shortBreak: 5,       // 5 min
  longBreak: 15,       // 15 min
  longBreakInterval: 4, // 4 sessions
  autoStart: false,    // OFF = Overtime mode enabled (timer counts into negative)
  soundEnabled: true
}

export const useTimerStore = defineStore('timer', () => {
  // Eingeloggter User (Settings liegen in Neon, /api/settings)
  const user = useAuthUser()

  // Timer state
  const currentMode = ref<TimerMode>('focus')
  const isRunning = ref(false)
  const timeRemaining = ref(25 * 60) // in seconds, synced from PomodoroTimer

  // Global debounce for timer completion (prevents double execution from SSR hydration)
  const lastCompletionTime = ref(0)
  const COMPLETION_DEBOUNCE_MS = 2000

  // Focus time tracking (shared across components)
  const sessionStartTime = ref<number | null>(null)
  const accumulatedFocusTime = ref(0) // Accumulated time in current session (for pause/resume)

  // Local settings (for guest mode)
  const localSettings = useStorage<TimerSettings>('focus-app-timer-settings', { ...DEFAULT_SETTINGS })
  
  // Server settings (for logged-in users)
  const serverSettings = ref<TimerSettings | null>(null)
  const isLoading = ref(false)
  const isSyncing = ref(false)

  // Computed: Active settings based on auth status
  const settings = computed<TimerSettings>(() => {
    if (user.value && serverSettings.value) {
      return serverSettings.value
    }
    return localSettings.value
  })

  // Check if local settings differ from defaults (for sync prompt)
  const hasLocalSettings = computed(() => {
    const local = localSettings.value
    return (
      local.focus !== DEFAULT_SETTINGS.focus ||
      local.shortBreak !== DEFAULT_SETTINGS.shortBreak ||
      local.longBreak !== DEFAULT_SETTINGS.longBreak ||
      local.longBreakInterval !== DEFAULT_SETTINGS.longBreakInterval ||
      local.autoStart !== DEFAULT_SETTINGS.autoStart ||
      local.soundEnabled !== DEFAULT_SETTINGS.soundEnabled
    )
  })

  // ==================== Actions ====================

  function setMode(mode: TimerMode) {
    console.log('[timerStore] setMode called:', mode, 'previous:', currentMode.value)
    currentMode.value = mode
    console.log('[timerStore] currentMode is now:', currentMode.value)
  }

  function setRunning(running: boolean) {
    isRunning.value = running
  }

  function setTimeRemaining(seconds: number) {
    timeRemaining.value = seconds
  }

  // Session tracking functions
  function startSession() {
    sessionStartTime.value = Date.now()
  }

  function pauseSession() {
    if (sessionStartTime.value) {
      accumulatedFocusTime.value += Math.floor((Date.now() - sessionStartTime.value) / 1000)
      sessionStartTime.value = null
    }
  }

  function resetSession() {
    sessionStartTime.value = null
    accumulatedFocusTime.value = 0
  }

  // Get current elapsed focus time (for saving when task is completed)
  function getElapsedFocusTime(): number {
    let totalSeconds = accumulatedFocusTime.value
    if (sessionStartTime.value) {
      totalSeconds += Math.floor((Date.now() - sessionStartTime.value) / 1000)
    }
    return totalSeconds
  }

  // Check if timer completion should be debounced (prevents double execution from SSR hydration)
  function shouldDebounceCompletion(): boolean {
    const now = Date.now()
    if (now - lastCompletionTime.value < COMPLETION_DEBOUNCE_MS) {
      console.log('[timerStore] Completion debounced - too soon after last completion')
      return true
    }
    lastCompletionTime.value = now
    return false
  }

  // Fetch settings from Server
  async function fetchSettings(): Promise<void> {
    if (!user.value) return

    isLoading.value = true
    try {
      const data = await $fetch<Record<string, any> | null>('/api/settings')

      if (data) {
        serverSettings.value = {
          focus: data.focus_duration,
          shortBreak: data.short_break_duration,
          longBreak: data.long_break_duration,
          longBreakInterval: data.long_break_interval,
          autoStart: data.auto_start,
          soundEnabled: data.sound_enabled
        }
      } else {
        // No settings in DB yet - use local settings or defaults
        serverSettings.value = null
      }
    } catch (e) {
      console.error('Error fetching settings:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Save settings to Server (upsert)
  // Note: Decimal values like 0.167 (10 seconds) are allowed for testing
  async function saveSettings(newSettings: TimerSettings): Promise<boolean> {
    // Validate values - allow decimal values for testing (e.g., 0.167 = 10 seconds)
    const validated: TimerSettings = {
      focus: Math.max(0.01, Math.min(120, newSettings.focus || 25)),
      shortBreak: Math.max(0.01, Math.min(30, newSettings.shortBreak || 5)),
      longBreak: Math.max(0.01, Math.min(60, newSettings.longBreak || 15)),
      longBreakInterval: Math.max(1, Math.min(10, newSettings.longBreakInterval || 4)),
      autoStart: newSettings.autoStart ?? true,
      soundEnabled: newSettings.soundEnabled ?? true
    }

    if (user.value) {
      // Save to Server
      isSyncing.value = true
      try {
        await $fetch('/api/settings', {
          method: 'PUT',
          body: {
            focus_duration: validated.focus,
            short_break_duration: validated.shortBreak,
            long_break_duration: validated.longBreak,
            long_break_interval: validated.longBreakInterval,
            auto_start: validated.autoStart,
            sound_enabled: validated.soundEnabled
          }
        })

        serverSettings.value = validated
        return true
      } catch (e) {
        console.error('Error saving settings:', e)
        return false
      } finally {
        isSyncing.value = false
      }
    } else {
      // Save to localStorage
      localSettings.value = validated
      return true
    }
  }

  // Sync local settings to Server (after login)
  async function syncLocalSettingsToServer(): Promise<boolean> {
    if (!user.value || !hasLocalSettings.value) {
      return false
    }

    const success = await saveSettings(localSettings.value)
    if (success) {
      // Reset local settings to defaults after sync
      localSettings.value = { ...DEFAULT_SETTINGS }
    }
    return success
  }

  // Reset to defaults
  async function resetToDefaults(): Promise<boolean> {
    return await saveSettings({ ...DEFAULT_SETTINGS })
  }

  // ==================== Watchers ====================

  // Fetch settings when user logs in
  watch(user, async (newUser) => {
    if (newUser) {
      await fetchSettings()
    } else {
      serverSettings.value = null
    }
  }, { immediate: true })

  return {
    // State
    currentMode,
    isRunning,
    timeRemaining,
    settings,
    isLoading,
    isSyncing,
    hasLocalSettings,
    sessionStartTime,
    accumulatedFocusTime,
    
    // Actions
    setMode,
    setRunning,
    setTimeRemaining,
    startSession,
    pauseSession,
    resetSession,
    getElapsedFocusTime,
    shouldDebounceCompletion,
    fetchSettings,
    saveSettings,
    syncLocalSettingsToServer,
    resetToDefaults
  }
})
