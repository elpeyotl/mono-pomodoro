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
export const DEFAULT_SETTINGS: TimerSettings = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  autoStart: true,
  soundEnabled: true
}

export const useTimerStore = defineStore('timer', () => {
  // Supabase
  const user = useSupabaseUser()
  const supabase = useSupabaseClient() as any

  // Timer state
  const currentMode = ref<TimerMode>('focus')
  const isRunning = ref(false)

  // Local settings (for guest mode)
  const localSettings = useStorage<TimerSettings>('focus-app-timer-settings', { ...DEFAULT_SETTINGS })
  
  // Supabase settings (for logged-in users)
  const supabaseSettings = ref<TimerSettings | null>(null)
  const isLoading = ref(false)
  const isSyncing = ref(false)

  // Computed: Active settings based on auth status
  const settings = computed<TimerSettings>(() => {
    if (user.value && supabaseSettings.value) {
      return supabaseSettings.value
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
    currentMode.value = mode
  }

  function setRunning(running: boolean) {
    isRunning.value = running
  }

  // Fetch settings from Supabase
  async function fetchSettings(): Promise<void> {
    if (!user.value) return

    isLoading.value = true
    try {
      // Use maybeSingle() instead of single() to avoid PGRST116 error
      // maybeSingle() returns null if no row found instead of throwing
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.value.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching settings:', error)
        return
      }

      if (data) {
        supabaseSettings.value = {
          focus: data.focus_duration,
          shortBreak: data.short_break_duration,
          longBreak: data.long_break_duration,
          longBreakInterval: data.long_break_interval,
          autoStart: data.auto_start,
          soundEnabled: data.sound_enabled
        }
      } else {
        // No settings in DB yet - use local settings or defaults
        supabaseSettings.value = null
      }
    } catch (e) {
      console.error('Error fetching settings:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Save settings to Supabase (upsert)
  async function saveSettings(newSettings: TimerSettings): Promise<boolean> {
    // Validate values
    const validated: TimerSettings = {
      focus: Math.max(1, Math.min(120, newSettings.focus || 25)),
      shortBreak: Math.max(1, Math.min(30, newSettings.shortBreak || 5)),
      longBreak: Math.max(1, Math.min(60, newSettings.longBreak || 15)),
      longBreakInterval: Math.max(2, Math.min(10, newSettings.longBreakInterval || 4)),
      autoStart: newSettings.autoStart ?? true,
      soundEnabled: newSettings.soundEnabled ?? true
    }

    if (user.value) {
      // Save to Supabase
      isSyncing.value = true
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.value.id,
            focus_duration: validated.focus,
            short_break_duration: validated.shortBreak,
            long_break_duration: validated.longBreak,
            long_break_interval: validated.longBreakInterval,
            auto_start: validated.autoStart,
            sound_enabled: validated.soundEnabled,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (error) throw error

        supabaseSettings.value = validated
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

  // Sync local settings to Supabase (after login)
  async function syncLocalSettingsToSupabase(): Promise<boolean> {
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
      supabaseSettings.value = null
    }
  }, { immediate: true })

  return {
    // State
    currentMode,
    isRunning,
    settings,
    isLoading,
    isSyncing,
    hasLocalSettings,
    
    // Actions
    setMode,
    setRunning,
    fetchSettings,
    saveSettings,
    syncLocalSettingsToSupabase,
    resetToDefaults
  }
})
