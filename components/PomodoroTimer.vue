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
        
        <!-- Active Task Display -->
        <div v-if="activeTask" class="mt-2">
          <div class="flex items-center justify-center gap-2 text-sm">
            <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-primary-400" />
            <span class="text-gray-300">Working on:</span>
            <span class="text-primary-400 font-medium truncate max-w-[200px]">{{ activeTask.title }}</span>
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
          <span class="text-4xl font-mono font-bold">{{ formattedTime }}</span>
          <span class="text-xs text-gray-400 mt-1">{{ modeLabel }}</span>
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
      
      <!-- Keyboard Shortcuts Hint -->
      <div class="text-xs text-gray-500 mt-4 flex items-center gap-2">
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
              min="2"
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
const timerDurations = computed<Record<TimerMode, number>>(() => ({
  focus: savedSettings.value.focus * 60,
  shortBreak: savedSettings.value.shortBreak * 60,
  longBreak: savedSettings.value.longBreak * 60
}))

const currentMode = ref<TimerMode>('focus')
const timeRemaining = ref(timerDurations.value.focus)
const isRunning = ref(false)

// Update timeRemaining when settings change (only if timer is not running)
watch(timerDurations, (newDurations) => {
  if (!isRunning.value) {
    timeRemaining.value = newDurations[currentMode.value]
  }
}, { deep: true })

// Focus time tracking
const sessionStartTime = ref<number | null>(null)
const accumulatedFocusTime = ref(0) // Accumulated time in current session (for pause/resume)

// Mode label for display
const modeLabel = computed(() => {
  switch (currentMode.value) {
    case 'focus': return 'Focus Time'
    case 'shortBreak': return 'Short Break'
    case 'longBreak': return 'Long Break'
  }
})

// Progress color based on mode
const progressColorClass = computed(() => {
  switch (currentMode.value) {
    case 'focus': return 'text-primary-500'
    case 'shortBreak': return 'text-green-500'
    case 'longBreak': return 'text-blue-500'
  }
})

// Circular progress calculations
const circumference = 2 * Math.PI * 45 // radius = 45

const progress = computed(() => {
  const total = timerDurations.value[currentMode.value]
  return timeRemaining.value / total
})

const strokeDashoffset = computed(() => {
  return circumference * (1 - progress.value)
})

const formattedTime = computed(() => {
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
      sessionStartTime.value = Date.now()
    }
  } else {
    // Pausing timer - save focus time immediately
    if (currentMode.value === 'focus' && sessionStartTime.value && activeTask.value) {
      const elapsed = Math.floor((Date.now() - sessionStartTime.value) / 1000)
      if (elapsed > 0) {
        // Save immediately to task
        taskStore.addFocusTime(activeTask.value.id, elapsed)
      }
      sessionStartTime.value = null
      accumulatedFocusTime.value = 0 // Reset since we saved
    }
  }
  isRunning.value = !isRunning.value
}

function resetTimer() {
  // Save accumulated focus time before reset (if any)
  if (currentMode.value === 'focus' && activeTask.value) {
    let totalSeconds = accumulatedFocusTime.value
    if (sessionStartTime.value) {
      totalSeconds += Math.floor((Date.now() - sessionStartTime.value) / 1000)
    }
    if (totalSeconds > 0) {
      taskStore.addFocusTime(activeTask.value.id, totalSeconds)
    }
  }
  
  isRunning.value = false
  timeRemaining.value = timerDurations.value[currentMode.value]
  sessionStartTime.value = null
  accumulatedFocusTime.value = 0
}

function setMode(mode: TimerMode, autoStart = false) {
  // Save focus time when switching away from focus mode
  if (currentMode.value === 'focus' && mode !== 'focus' && activeTask.value) {
    let totalSeconds = accumulatedFocusTime.value
    if (sessionStartTime.value) {
      totalSeconds += Math.floor((Date.now() - sessionStartTime.value) / 1000)
    }
    if (totalSeconds > 0) {
      taskStore.addFocusTime(activeTask.value.id, totalSeconds)
    }
  }
  
  currentMode.value = mode
  isRunning.value = false
  timeRemaining.value = timerDurations.value[mode]
  sessionStartTime.value = null
  accumulatedFocusTime.value = 0
  
  if (autoStart && savedSettings.value.autoStart) {
    // Small delay before auto-starting
    setTimeout(() => {
      isRunning.value = true
      if (mode === 'focus') {
        sessionStartTime.value = Date.now()
      }
    }, 1000)
  }
}

function skipTimer() {
  // Skip to next mode without completing current timer
  switchToNextMode(false)
}

function switchToNextMode(completed: boolean) {
  if (currentMode.value === 'focus') {
    if (completed) {
      // Increment pomodoro count only if completed (not skipped)
      pomodoroCount.value++
    }
    
    // Check if it's time for a long break
    if (pomodoroCount.value >= savedSettings.value.longBreakInterval) {
      pomodoroCount.value = 0 // Reset counter
      setMode('longBreak', true)
    } else {
      setMode('shortBreak', true)
    }
  } else {
    // After any break, go back to focus
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

// Timer completion handler
async function onTimerComplete() {
  isRunning.value = false
  
  // Play notification sound
  playNotificationSound()
  
  // Wenn Focus-Modus abgeschlossen und ein aktiver Task existiert
  if (currentMode.value === 'focus' && activeTask.value) {
    // Pomodoro-Zähler erhöhen
    await taskStore.incrementPomodoro(activeTask.value.id)
    
    // Focus-Zeit hinzufügen (gesamte Session-Dauer)
    let totalSeconds = accumulatedFocusTime.value
    if (sessionStartTime.value) {
      totalSeconds += Math.floor((Date.now() - sessionStartTime.value) / 1000)
    }
    // Falls keine Zeit getrackt wurde, verwende die Timer-Dauer
    if (totalSeconds === 0) {
      totalSeconds = timerDurations.value.focus
    }
    await taskStore.addFocusTime(activeTask.value.id, totalSeconds)
    
    // Reset tracking variables
    sessionStartTime.value = null
    accumulatedFocusTime.value = 0
  }
  
  // Browser-Benachrichtigung (falls erlaubt)
  if ('Notification' in window && Notification.permission === 'granted') {
    const message = currentMode.value === 'focus'
      ? 'Focus session complete! Time for a break.'
      : 'Break is over! Ready to focus?'
    new Notification('Pomodoro Timer', { body: message })
  }
  
  // Automatically switch to next mode
  switchToNextMode(true)
}

// Timer interval
let intervalId: ReturnType<typeof setInterval> | null = null

watch(isRunning, (running) => {
  if (running) {
    intervalId = setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value--
      } else {
        onTimerComplete()
      }
    }, 1000)
  } else {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
})

// Sync timer state to timerStore for background animation
watch(currentMode, (mode) => {
  timerStore.setMode(mode)
}, { immediate: true })

watch(isRunning, (running) => {
  timerStore.setRunning(running)
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
    sessionStartTime.value = Date.now()
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
  if (intervalId) {
    clearInterval(intervalId)
  }
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
</script>
