<template>
  <UCard :ui="{ background: 'bg-gray-800', ring: 'ring-2 ring-gray-600', divide: 'divide-y divide-gray-600', shadow: 'shadow-2xl shadow-black/50', rounded: 'rounded-xl' }">
    <template #header>
      <div class="text-center relative">
        <!-- Settings Button -->
        <UButton
          icon="i-heroicons-cog-6-tooth"
          size="sm"
          color="primary"
          variant="outline"
          class="absolute right-0 top-0"
          @click="isSettingsOpen = true"
        />
        <h2 class="text-xl font-semibold">Pomodoro Timer</h2>
        
        <!-- Pomodoro Counter (X/4 until Long Break) -->
        <div class="mt-1 text-sm text-gray-400">
          <span v-if="currentMode === 'focus'">
            Focus Session {{ pomodoroCount + 1 }}/{{ savedSettings.longBreakInterval }}
          </span>
          <span v-else-if="currentMode === 'shortBreak'">
            Short Break - {{ savedSettings.longBreakInterval - pomodoroCount }} sessions until long break
          </span>
          <span v-else>
            Long Break - Great job! 🎉
          </span>
        </div>
        
        <!-- Active Task Display - Clickable to navigate to task -->
        <div
          v-if="activeTask"
          class="mt-2 cursor-pointer hover:bg-gray-700/30 rounded-lg py-1 px-2 -mx-2 transition-colors"
          @click="navigateToTask"
        >
          <div class="flex items-center justify-center gap-2 text-sm">
            <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-primary-400" />
            <span class="text-gray-300">Working on:</span>
            <span class="text-primary-400 font-medium truncate max-w-[200px]">{{ activeTask.title }}</span>
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 text-gray-500" />
          </div>
          <div class="flex items-center justify-center gap-1 mt-1 text-xs text-gray-500">
            <UIcon name="i-heroicons-clock" class="w-3 h-3" />
            <span>{{ activeTask.pomodoro_count }} pomodoros completed</span>
          </div>
        </div>
        <div v-else class="mt-2 text-sm text-gray-500">
          <span>No task selected. Select a task from the list to track your focus.</span>
        </div>
      </div>
    </template>
    
    <div class="flex flex-col items-center gap-6 py-8">
      <!-- Circular Progress Placeholder -->
      <div class="relative w-48 h-48">
        <!-- Background Circle -->
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            stroke-width="8"
            class="text-gray-700"
          />
          <!-- Progress Circle -->
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            stroke-width="8"
            stroke-linecap="round"
            :class="progressColorClass"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
          />
        </svg>
        <!-- Timer Display -->
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span
            class="text-4xl font-mono font-bold"
            :class="{ 'text-green-400': isOverflow }"
          >{{ formattedTime }}</span>
          <span
            class="text-xs mt-1"
            :class="isOverflow ? 'text-green-400' : 'text-gray-400'"
          >{{ modeLabel }}</span>
        </div>
      </div>
      
      <!-- Controls -->
      <div class="flex gap-4">
        <UButton
          :icon="isRunning ? 'i-heroicons-pause' : 'i-heroicons-play'"
          size="lg"
          color="primary"
          :label="isRunning ? 'Pause' : 'Start'"
          @click="toggleTimer"
        />
        <UButton
          icon="i-heroicons-forward"
          size="lg"
          color="gray"
          variant="outline"
          label="Skip"
          @click="skipTimer"
        />
        <UButton
          icon="i-heroicons-arrow-path"
          size="lg"
          color="gray"
          variant="outline"
          label="Reset"
          @click="resetTimer"
        />
      </div>
      
      <!-- Timer Type Selector -->
      <UButtonGroup>
        <UButton
          :color="currentMode === 'focus' ? 'primary' : 'white'"
          :variant="currentMode === 'focus' ? 'soft' : 'outline'"
          label="Focus"
          @click="setMode('focus')"
        />
        <UButton
          :color="currentMode === 'shortBreak' ? 'primary' : 'white'"
          :variant="currentMode === 'shortBreak' ? 'soft' : 'outline'"
          label="Short Break"
          @click="setMode('shortBreak')"
        />
        <UButton
          :color="currentMode === 'longBreak' ? 'primary' : 'white'"
          :variant="currentMode === 'longBreak' ? 'soft' : 'outline'"
          label="Long Break"
          @click="setMode('longBreak')"
        />
      </UButtonGroup>
      
      <!-- Keyboard Shortcuts Hint - Hidden on mobile -->
      <div class="hidden md:flex text-xs text-gray-500 mt-4 items-center gap-2">
        <UIcon name="i-heroicons-command-line" class="w-3 h-3" />
        <span>
          <kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono text-[10px]">Space</kbd> Play/Pause
          <span class="mx-1">·</span>
          <kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono text-[10px]">R</kbd> Reset
          <span class="mx-1">·</span>
          <kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono text-[10px]">S</kbd> Skip
          <span class="mx-1">·</span>
          <kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono text-[10px]">1</kbd><kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono text-[10px]">2</kbd><kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono text-[10px]">3</kbd> Mode
        </span>
      </div>
    </div>
    
    <!-- Settings Modal -->
    <UModal v-model="isSettingsOpen">
      <UCard
        :ui="{
          background: 'bg-gray-900',
          ring: 'ring-1 ring-gray-800',
          header: { background: 'bg-gray-900', base: 'text-gray-100' },
          body: { background: 'bg-gray-900' },
          footer: { background: 'bg-gray-900' }
        }"
      >
        <template #header>
          <h3 class="text-lg font-semibold text-gray-100">Timer Settings</h3>
        </template>

        <div class="space-y-4">
          <!-- Focus Duration -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Focus Duration (minutes)
            </label>
            <UInput
              v-model.number="settingsForm.focus"
              type="number"
              min="1"
              max="120"
              color="gray"
              variant="outline"
              :ui="{
                base: 'bg-gray-800 text-gray-100',
                color: {
                  gray: {
                    outline: 'bg-gray-800 text-gray-100 ring-gray-700 focus:ring-primary-500'
                  }
                }
              }"
            />
          </div>
          
          <!-- Short Break Duration -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Short Break (minutes)
            </label>
            <UInput
              v-model.number="settingsForm.shortBreak"
              type="number"
              min="1"
              max="30"
              color="gray"
              variant="outline"
              :ui="{
                base: 'bg-gray-800 text-gray-100',
                color: {
                  gray: {
                    outline: 'bg-gray-800 text-gray-100 ring-gray-700 focus:ring-primary-500'
                  }
                }
              }"
            />
          </div>
          
          <!-- Long Break Duration -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Long Break (minutes)
            </label>
            <UInput
              v-model.number="settingsForm.longBreak"
              type="number"
              min="1"
              max="60"
              color="gray"
              variant="outline"
              :ui="{
                base: 'bg-gray-800 text-gray-100',
                color: {
                  gray: {
                    outline: 'bg-gray-800 text-gray-100 ring-gray-700 focus:ring-primary-500'
                  }
                }
              }"
            />
          </div>
          
          <!-- Long Break Interval -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Long Break after X Focus Sessions
            </label>
            <UInput
              v-model.number="settingsForm.longBreakInterval"
              type="number"
              min="1"
              max="10"
              color="gray"
              variant="outline"
              :ui="{
                base: 'bg-gray-800 text-gray-100',
                color: {
                  gray: {
                    outline: 'bg-gray-800 text-gray-100 ring-gray-700 focus:ring-primary-500'
                  }
                }
              }"
            />
          </div>
          
          <!-- Auto-Start Toggle -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-300">
              Auto-start next timer
            </label>
            <UToggle
              v-model="settingsForm.autoStart"
              on-icon="i-heroicons-check"
              off-icon="i-heroicons-x-mark"
            />
          </div>
          
          <!-- Sound Toggle -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-300">
              Play sound on completion
            </label>
            <UToggle
              v-model="settingsForm.soundEnabled"
              on-icon="i-heroicons-speaker-wave"
              off-icon="i-heroicons-speaker-x-mark"
            />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-between">
            <UButton
              color="white"
              variant="solid"
              label="Reset to Defaults"
              @click="resetToDefaults"
            />
            <div class="flex gap-3">
              <UButton
                color="white"
                variant="solid"
                label="Cancel"
                @click="cancelSettings"
              />
              <UButton
                color="primary"
                label="Save"
                @click="saveSettings"
              />
            </div>
          </div>
        </template>
      </UCard>
    </UModal>
  </UCard>
</template>

<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { useTimerStore, type TimerMode, type TimerSettings, DEFAULT_SETTINGS } from '~/stores/timerStore'

// Emit for navigation to task
const emit = defineEmits<{
  (e: 'navigate-to-task'): void
}>()

// Timer Store for background synchronization and settings
const timerStore = useTimerStore()

// Task Store für aktiven Task
const taskStore = useTaskStore()
const activeTask = computed(() => taskStore.activeTask)

// Settings from timerStore (synced with Supabase for logged-in users)
const savedSettings = computed(() => timerStore.settings)

// Pomodoro count (completed focus sessions in current cycle)
const pomodoroCount = ref(0)

// Settings Modal State
const isSettingsOpen = ref(false)
const settingsForm = ref<TimerSettings>({ ...DEFAULT_SETTINGS })

// Update settingsForm when savedSettings changes (e.g., after loading from Supabase)
watch(savedSettings, (newSettings) => {
  if (!isSettingsOpen.value) {
    settingsForm.value = { ...newSettings }
  }
}, { immediate: true, deep: true })

// Computed timer durations based on saved settings (in seconds)
// Use Math.round to avoid floating-point precision issues (e.g., 0.167 * 60 = 10.02)
const timerDurations = computed<Record<TimerMode, number>>(() => ({
  focus: Math.round(savedSettings.value.focus * 60),
  shortBreak: Math.round(savedSettings.value.shortBreak * 60),
  longBreak: Math.round(savedSettings.value.longBreak * 60)
}))

const currentMode = ref<TimerMode>('focus')
const timeRemaining = ref(timerDurations.value.focus)
const isRunning = ref(false)

// Overflow mode: Timer counts into negative when autoStart is OFF
const isOverflow = ref(false)
const overflowSeconds = ref(0) // How many seconds past 0

// Update timeRemaining when settings change (only if timer is not running)
watch(timerDurations, (newDurations) => {
  if (!isRunning.value) {
    timeRemaining.value = newDurations[currentMode.value]
  }
}, { deep: true })

// Focus time tracking - use timerStore for shared state
const sessionStartTime = computed(() => timerStore.sessionStartTime)
const accumulatedFocusTime = computed(() => timerStore.accumulatedFocusTime)

// Mode label for display
const modeLabel = computed(() => {
  // Show overflow indicator when in overflow mode
  if (isOverflow.value) {
    return 'Overtime - Click Skip when ready'
  }
  switch (currentMode.value) {
    case 'focus': return 'Focus Time'
    case 'shortBreak': return 'Short Break'
    case 'longBreak': return 'Long Break'
  }
})

// Progress color based on mode - matching the wave background colors
const progressColorClass = computed(() => {
  // Green color when in overflow mode (positive - you're still working!)
  if (isOverflow.value) return 'text-green-400'
  
  switch (currentMode.value) {
    case 'focus': return 'text-primary-500'    // Turquoise/teal (original)
    case 'shortBreak': return 'text-blue-400'  // Bright blue
    case 'longBreak': return 'text-purple-400' // Purple
  }
})

// Circular progress calculations
const circumference = 2 * Math.PI * 45 // radius = 45

const progress = computed(() => {
  // In overflow mode, progress stays at 0 (empty ring)
  if (isOverflow.value) return 0
  const total = timerDurations.value[currentMode.value]
  return timeRemaining.value / total
})

const strokeDashoffset = computed(() => {
  return circumference * (1 - progress.value)
})

const formattedTime = computed(() => {
  // In overflow mode, show negative time
  if (isOverflow.value) {
    const minutes = Math.floor(overflowSeconds.value / 60)
    const seconds = overflowSeconds.value % 60
    return `-${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Audio context for notification sound
let audioContext: AudioContext | null = null

function playNotificationSound() {
  if (!savedSettings.value.soundEnabled) return
  
  try {
    // Create audio context on first use (must be after user interaction)
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Pleasant notification sound - two-tone chime
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
    oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.15) // C#6
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
    
    // Play second chime
    setTimeout(() => {
      if (!audioContext) return
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      
      osc2.frequency.setValueAtTime(1318.51, audioContext.currentTime) // E6
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)
      
      osc2.start(audioContext.currentTime)
      osc2.stop(audioContext.currentTime + 0.6)
    }, 200)
  } catch (e) {
    console.warn('Could not play notification sound:', e)
  }
}

function toggleTimer() {
  if (!isRunning.value) {
    // Starting timer
    if (currentMode.value === 'focus') {
      timerStore.startSession()
    }
  } else {
    // Pausing timer - save focus time immediately
    if (currentMode.value === 'focus' && sessionStartTime.value && activeTask.value) {
      const elapsed = timerStore.getElapsedFocusTime()
      if (elapsed > 0) {
        // Save immediately to task
        taskStore.addFocusTime(activeTask.value.id, elapsed)
      }
      timerStore.resetSession()
    }
  }
  isRunning.value = !isRunning.value
}

function resetTimer() {
  // Save accumulated focus time before reset (if any)
  if (currentMode.value === 'focus' && activeTask.value) {
    // Include overflow time if in overflow mode
    let totalSeconds = timerStore.getElapsedFocusTime()
    if (isOverflow.value) {
      totalSeconds += overflowSeconds.value
    }
    if (totalSeconds > 0) {
      taskStore.addFocusTime(activeTask.value.id, totalSeconds)
    }
  }
  
  isRunning.value = false
  timeRemaining.value = timerDurations.value[currentMode.value]
  timerStore.resetSession()
  
  // Reset overflow state
  isOverflow.value = false
  overflowSeconds.value = 0
}

function setMode(mode: TimerMode, autoStart = false) {
  console.log('[Timer] setMode called:', mode, 'autoStart:', autoStart)
  
  // Save focus time when switching away from focus mode
  if (currentMode.value === 'focus' && mode !== 'focus' && activeTask.value) {
    // Include overflow time if in overflow mode
    let totalSeconds = timerStore.getElapsedFocusTime()
    if (isOverflow.value) {
      totalSeconds += overflowSeconds.value
    }
    if (totalSeconds > 0) {
      taskStore.addFocusTime(activeTask.value.id, totalSeconds)
    }
  }
  
  console.log('[Timer] Setting currentMode.value to:', mode)
  currentMode.value = mode
  isRunning.value = false
  timeRemaining.value = timerDurations.value[mode]
  timerStore.resetSession()
  
  // Reset overflow state
  isOverflow.value = false
  overflowSeconds.value = 0
  
  console.log('[Timer] currentMode.value is now:', currentMode.value)
  
  if (autoStart && savedSettings.value.autoStart) {
    console.log('[Timer] Auto-starting in 1 second...')
    // Small delay before auto-starting
    setTimeout(() => {
      isRunning.value = true
      if (mode === 'focus') {
        timerStore.startSession()
      }
    }, 1000)
  }
}

function skipTimer() {
  // If in overflow mode during focus, save the overflow time and increment pomodoro
  if (isOverflow.value && currentMode.value === 'focus' && activeTask.value) {
    // Increment pomodoro count
    taskStore.incrementPomodoro(activeTask.value.id)
    
    // Save focus time including overflow
    const totalSeconds = timerDurations.value.focus + overflowSeconds.value
    taskStore.addFocusTime(activeTask.value.id, totalSeconds)
    timerStore.resetSession()
  }
  
  // Skip to next mode without completing current timer
  switchToNextMode(false)
}

function switchToNextMode(completed: boolean) {
  console.log('[Timer] switchToNextMode called, completed:', completed, 'currentMode:', currentMode.value, 'isOverflow:', isOverflow.value)
  
  if (currentMode.value === 'focus') {
    // Always increment pomodoro count when leaving focus mode (skip or complete)
    pomodoroCount.value++
    console.log('[Timer] pomodoroCount:', pomodoroCount.value, 'longBreakInterval:', savedSettings.value.longBreakInterval)
    
    // Check if it's time for a long break
    if (pomodoroCount.value >= savedSettings.value.longBreakInterval) {
      pomodoroCount.value = 0 // Reset counter
      console.log('[Timer] Switching to longBreak')
      setMode('longBreak', true)
    } else {
      console.log('[Timer] Switching to shortBreak')
      setMode('shortBreak', true)
    }
  } else {
    // After any break, go back to focus
    console.log('[Timer] Switching to focus')
    setMode('focus', true)
  }
}

// Settings Functions
function openSettings() {
  settingsForm.value = { ...savedSettings.value }
  isSettingsOpen.value = true
}

async function saveSettings() {
  // Save via timerStore (handles validation and Supabase sync)
  const success = await timerStore.saveSettings(settingsForm.value)
  
  if (success) {
    // Reset current timer with new duration
    timeRemaining.value = timerDurations.value[currentMode.value]
    isRunning.value = false
    
    isSettingsOpen.value = false
  }
}

function cancelSettings() {
  settingsForm.value = { ...savedSettings.value }
  isSettingsOpen.value = false
}

async function resetToDefaults() {
  settingsForm.value = { ...DEFAULT_SETTINGS }
}

// Timer completion handler - with global debounce from timerStore
async function onTimerComplete() {
  // Use global debounce from timerStore to prevent double execution from SSR hydration
  if (timerStore.shouldDebounceCompletion()) {
    console.log('[Timer] onTimerComplete debounced by timerStore')
    return
  }
  
  console.log('[Timer] onTimerComplete executing, currentMode:', currentMode.value)
  
  isRunning.value = false
  
  // Play notification sound
  playNotificationSound()
  
  // Capture current mode before any async operations
  const completedMode = currentMode.value
  
  // Wenn Focus-Modus abgeschlossen und ein aktiver Task existiert
  if (completedMode === 'focus' && activeTask.value) {
    // Pomodoro-Zähler erhöhen
    await taskStore.incrementPomodoro(activeTask.value.id)
    
    // Focus-Zeit hinzufügen (gesamte Session-Dauer)
    let totalSeconds = timerStore.getElapsedFocusTime()
    // Falls keine Zeit getrackt wurde, verwende die Timer-Dauer
    if (totalSeconds === 0) {
      totalSeconds = timerDurations.value.focus
    }
    await taskStore.addFocusTime(activeTask.value.id, totalSeconds)
    
    // Reset tracking variables
    timerStore.resetSession()
  }
  
  // Browser-Benachrichtigung (falls erlaubt)
  if ('Notification' in window && Notification.permission === 'granted') {
    const message = completedMode === 'focus'
      ? 'Focus session complete! Time for a break.'
      : 'Break is over! Ready to focus?'
    new Notification('Pomodoro Timer', { body: message })
  }
  
  // Automatically switch to next mode
  switchToNextMode(true)
}

// Timer interval with absolute end time for accuracy in background tabs
let intervalId: ReturnType<typeof setInterval> | null = null
let timerEndTime: number | null = null // Absolute timestamp when timer should end
let isCompletionInProgress = false // Guard to prevent multiple onTimerComplete calls
let hasPlayedCompletionSound = false // Track if we've played the sound for this session
let isHydrated = false // Guard to prevent SSR timer execution

function startTimerInterval() {
  // CRITICAL: Don't start timer during SSR - wait for client hydration
  if (import.meta.server) {
    console.log('[Timer] Skipping startTimerInterval on server')
    return
  }
  
  // Also check if we're hydrated (onMounted has been called)
  if (!isHydrated) {
    console.log('[Timer] Skipping startTimerInterval - not yet hydrated')
    return
  }
  
  // Reset completion guard when starting
  isCompletionInProgress = false
  hasPlayedCompletionSound = false
  
  // If we're in overflow mode, continue counting up
  if (isOverflow.value) {
    intervalId = setInterval(() => {
      overflowSeconds.value++
    }, 1000)
    return
  }
  
  // Calculate absolute end time
  timerEndTime = Date.now() + (timeRemaining.value * 1000)
  console.log('[Timer] Started with timerEndTime:', timerEndTime, 'timeRemaining:', timeRemaining.value)
  
  intervalId = setInterval(() => {
    if (timerEndTime) {
      const remaining = Math.ceil((timerEndTime - Date.now()) / 1000)
      
      if (remaining <= 0) {
        // Check if autoStart is OFF - enter overflow mode instead of completing
        if (!savedSettings.value.autoStart) {
          // Play sound once when entering overflow
          if (!hasPlayedCompletionSound) {
            hasPlayedCompletionSound = true
            console.log('[Timer] Playing completion sound (overflow mode)')
            playNotificationSound()
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              const message = currentMode.value === 'focus'
                ? 'Timer complete! Take a break when ready.'
                : 'Break timer complete! Start focusing when ready.'
              new Notification('Pomodoro Timer', { body: message })
            }
          }
          
          // Enter overflow mode
          timeRemaining.value = 0
          isOverflow.value = true
          overflowSeconds.value = Math.abs(remaining)
          
          // Switch to overflow counting interval
          stopTimerInterval()
          intervalId = setInterval(() => {
            overflowSeconds.value++
          }, 1000)
        } else {
          // AutoStart is ON - complete normally
          stopTimerInterval()
          timeRemaining.value = 0
          
          // Guard against multiple calls
          if (!isCompletionInProgress) {
            isCompletionInProgress = true
            onTimerComplete()
          }
        }
      } else {
        timeRemaining.value = remaining
      }
    }
  }, 1000)
}

function stopTimerInterval() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  timerEndTime = null
}

watch(isRunning, (running) => {
  // Don't start timer during SSR or before hydration
  if (import.meta.server) {
    console.log('[Timer] Skipping isRunning watch on server')
    return
  }
  
  if (running) {
    // Only start if hydrated
    if (isHydrated) {
      startTimerInterval()
    } else {
      console.log('[Timer] isRunning=true but not hydrated yet, will start after hydration')
    }
  } else {
    stopTimerInterval()
  }
})

// Handle tab visibility changes - recalculate time when tab becomes visible
function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && isRunning.value) {
    // If in overflow mode, just continue - no recalculation needed
    if (isOverflow.value) {
      return
    }
    
    if (timerEndTime) {
      const remaining = Math.ceil((timerEndTime - Date.now()) / 1000)
      
      if (remaining <= 0) {
        // Check if autoStart is OFF - enter overflow mode
        if (!savedSettings.value.autoStart) {
          // Play sound once when entering overflow
          if (!hasPlayedCompletionSound) {
            hasPlayedCompletionSound = true
            playNotificationSound()
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              const message = currentMode.value === 'focus'
                ? 'Timer complete! Take a break when ready.'
                : 'Break timer complete! Start focusing when ready.'
              new Notification('Pomodoro Timer', { body: message })
            }
          }
          
          // Enter overflow mode
          timeRemaining.value = 0
          isOverflow.value = true
          overflowSeconds.value = Math.abs(remaining)
          
          // Switch to overflow counting interval
          stopTimerInterval()
          intervalId = setInterval(() => {
            overflowSeconds.value++
          }, 1000)
        } else {
          // AutoStart is ON - complete normally
          stopTimerInterval()
          timeRemaining.value = 0
          
          if (!isCompletionInProgress) {
            isCompletionInProgress = true
            onTimerComplete()
          }
        }
      } else {
        timeRemaining.value = remaining
      }
    }
  }
}

onMounted(() => {
  // Mark as hydrated - this prevents SSR timer execution
  isHydrated = true
  console.log('[Timer] Component hydrated, timer can now start')
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// Sync timer state to timerStore for background animation and mobile tab display
watch(currentMode, (mode, oldMode) => {
  console.log('[Timer] currentMode watcher triggered:', oldMode, '->', mode)
  console.log('[Timer] Calling timerStore.setMode(', mode, ')')
  timerStore.setMode(mode)
}, { immediate: true })

watch(isRunning, (running) => {
  timerStore.setRunning(running)
}, { immediate: true })

// Sync timeRemaining to store for mobile tab display
watch(timeRemaining, (time) => {
  timerStore.setTimeRemaining(time)
}, { immediate: true })

// Watch for external timer start requests (e.g., from TaskList when activating a task)
watch(() => timerStore.isRunning, (storeRunning) => {
  // Only start if store says running but local timer is not
  if (storeRunning && !isRunning.value) {
    // Ensure we're in focus mode
    if (currentMode.value !== 'focus') {
      currentMode.value = 'focus'
      timeRemaining.value = timerDurations.value.focus
    }
    // Start the timer
    isRunning.value = true
    timerStore.startSession()
  }
})

// Request notification permission on mount
onMounted(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  stopTimerInterval()
})

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

// Helper to check if user is typing in an input field
function isTyping(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement
  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable
}

// Space: Toggle Timer (Start/Pause)
onKeyStroke(' ', (e) => {
  if (isTyping(e)) return
  e.preventDefault() // Prevent page scroll
  toggleTimer()
})

// R: Reset Timer
onKeyStroke('r', (e) => {
  if (isTyping(e)) return
  resetTimer()
})

// S: Skip Timer
onKeyStroke('s', (e) => {
  if (isTyping(e)) return
  skipTimer()
})

// 1: Focus Mode
onKeyStroke('1', (e) => {
  if (isTyping(e)) return
  setMode('focus')
})

// 2: Short Break Mode
onKeyStroke('2', (e) => {
  if (isTyping(e)) return
  setMode('shortBreak')
})

// 3: Long Break Mode
onKeyStroke('3', (e) => {
  if (isTyping(e)) return
  setMode('longBreak')
})

// Navigate to active task (emits event for parent to handle)
function navigateToTask() {
  emit('navigate-to-task')
}
</script>
