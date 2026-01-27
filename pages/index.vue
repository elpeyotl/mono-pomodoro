<template>
  <div class="h-full lg:h-auto flex flex-col lg:block space-y-4 lg:space-y-8">
    <!-- Onboarding Flow for new users -->
    <OnboardingFlow />

    <!-- Desktop Layout: Two Columns + Stats Slideover (>= 1024px) -->
    <div class="hidden lg:grid lg:grid-cols-2 gap-6 items-start">
      <!-- Timer - Left Side -->
      <div class="lg:sticky lg:top-8">
        <PomodoroTimer @navigate-to-task="scrollToTaskList" />
      </div>

      <!-- Task List - Right Side -->
      <div>
        <TaskList />
      </div>
    </div>

    <!-- Desktop Stats Toggle Button -->
    <button
      class="hidden lg:flex fixed bottom-6 right-6 z-40 items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full shadow-lg transition-colors"
      @click="showStats = true"
    >
      <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-primary-400" />
      <span class="text-sm text-gray-300">Stats</span>
    </button>

    <!-- Desktop Stats Slideover -->
    <USlideover v-model="showStats" side="right" :ui="{ width: 'max-w-md' }">
      <div class="p-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Statistics</h2>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            @click="showStats = false"
          />
        </div>
        <StatisticsView />
      </div>
    </USlideover>

    <!-- Mobile/Tablet Layout: Swipeable Tabs (< 1024px) -->
    <div class="lg:hidden flex-1 flex flex-col min-h-0">
      <!-- Tab Indicator Dots (above content) -->
      <div class="flex flex-col items-center gap-1 py-2 flex-shrink-0">
        <div class="flex justify-center gap-2">
          <button
            v-for="(tab, index) in tabs"
            :key="tab.id"
            class="w-2 h-2 rounded-full transition-all duration-300"
            :class="activeTab === index ? 'bg-primary-500 w-6' : 'bg-gray-600'"
            @click="scrollToTab(index)"
          />
        </div>
        <!-- Swipe hint - disappears after first swipe -->
        <Transition name="fade">
          <span
            v-if="showSwipeHint"
            class="text-xs text-gray-500 flex items-center gap-1"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-3 h-3" />
            <span>Swipe</span>
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </span>
        </Transition>
      </div>

      <!-- Swipeable Container -->
      <div
        ref="swipeContainer"
        class="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-16"
        style="scroll-behavior: smooth;"
        @scroll="onScroll"
      >
        <!-- Timer Card -->
        <div
          class="flex-shrink-0 w-full snap-center px-2 overflow-y-auto scrollbar-hide"
        >
          <div class="py-2 flex justify-center">
            <div class="w-full max-w-md">
              <PomodoroTimer @navigate-to-task="scrollToTaskList" />
            </div>
          </div>
        </div>

        <!-- Tasks Card -->
        <div
          ref="tasksContainer"
          class="flex-shrink-0 w-full snap-center px-2 overflow-y-auto scrollbar-hide"
        >
          <div class="pt-2 pb-20">
            <TaskList />
          </div>
        </div>

        <!-- Statistics Card -->
        <div
          class="flex-shrink-0 w-full snap-center px-2 overflow-y-auto scrollbar-hide"
        >
          <div class="pt-2 pb-20">
            <StatisticsView />
          </div>
        </div>
      </div>

      <!-- Bottom Tab Bar -->
      <div class="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-50 safe-area-bottom">
        <div class="flex">
          <button
            v-for="(tab, index) in tabs"
            :key="tab.id"
            class="flex-1 flex flex-col items-center gap-1 py-3 px-4 transition-colors relative"
            :class="activeTab === index ? 'text-primary-400' : 'text-gray-500'"
            @click="scrollToTab(index)"
          >
            <UIcon :name="tab.icon" class="w-6 h-6" />
            <!-- Timer: show countdown when running, otherwise show label -->
            <span
              v-if="tab.id === 'timer' && timerStore.isRunning"
              class="text-xs font-mono font-medium"
              :class="timerColorClass"
            >
              {{ formattedTime }}
            </span>
            <span v-else class="text-xs font-medium">{{ tab.label }}</span>
            <!-- Task count badge -->
            <span
              v-if="tab.id === 'tasks' && pendingTaskCount > 0"
              class="absolute top-1 right-1/3 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold bg-primary-500 text-white"
            >
              {{ pendingTaskCount > 99 ? '99+' : pendingTaskCount }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const timerStore = useTimerStore()
const taskStore = useTaskStore()

// Desktop stats slideover
const showStats = ref(false)

// Tabs configuration (mobile)
const tabs = [
  { id: 'timer', label: 'Timer', icon: 'i-heroicons-clock' },
  { id: 'tasks', label: 'Tasks', icon: 'i-heroicons-clipboard-document-list' },
  { id: 'stats', label: 'Stats', icon: 'i-heroicons-chart-bar' }
]

// Active tab state
const activeTab = ref(0)
const swipeContainer = ref<HTMLElement | null>(null)
const tasksContainer = ref<HTMLElement | null>(null)

// Swipe hint - show until first swipe, stored in localStorage
const swipeHintDismissed = useLocalStorage('mono-swipe-hint-dismissed', false)
const showSwipeHint = ref(!swipeHintDismissed.value)

// Pending task count for badge
const pendingTaskCount = computed(() => taskStore.pendingTasks.length)

// Formatted time for tab display
const formattedTime = computed(() => {
  const seconds = timerStore.timeRemaining
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

// Timer color based on mode (matching wave background colors)
const timerColorClass = computed(() => {
  switch (timerStore.currentMode) {
    case 'focus': return 'text-primary-400'      // Turquoise/teal
    case 'shortBreak': return 'text-blue-400'    // Bright blue
    case 'longBreak': return 'text-purple-400'   // Purple
    default: return 'text-primary-400'
  }
})

// Scroll to specific tab
function scrollToTab(index: number) {
  if (!swipeContainer.value) return
  const containerWidth = swipeContainer.value.offsetWidth
  swipeContainer.value.scrollTo({
    left: index * containerWidth,
    behavior: 'smooth'
  })
}

// Check if we're on mobile (< 1024px)
function isMobileView(): boolean {
  return window.innerWidth < 1024
}

// Navigate to task list (from timer "Working on" click)
function scrollToTaskList() {
  const activeTask = taskStore.activeTask
  if (!activeTask) return

  // Check if the active task is visible with the current tag filter
  const currentFilter = taskStore.activeTagFilter
  const taskTags = activeTask.tags || []

  // If a filter is active and the task doesn't have that tag, switch filter
  if (currentFilter !== null) {
    const taskHasCurrentFilter = taskTags.includes(currentFilter)

    if (!taskHasCurrentFilter) {
      // Switch to the first tag of the task, or "All" if no tags
      if (taskTags.length > 0) {
        taskStore.setTagFilter(taskTags[0])
      } else {
        taskStore.setTagFilter(null) // Show all
      }

      // Wait a tick for the filter to update before scrolling
      nextTick(() => {
        performScrollToTask(activeTask.id)
      })
      return
    }
  }

  // Task is visible with current filter, just scroll
  performScrollToTask(activeTask.id)
}

// Helper function to perform the actual scroll
function performScrollToTask(taskId: string) {
  // On mobile, switch to Tasks tab first, then scroll to task
  if (isMobileView() && swipeContainer.value) {
    // First, scroll horizontally to the Tasks tab
    scrollToTab(1)

    // After horizontal scroll completes, find and highlight the task
    setTimeout(() => {
      const taskElement = document.getElementById(`task-${taskId}`)
      if (taskElement) {
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Add highlight animation after scroll completes
        setTimeout(() => {
          taskElement.classList.add('highlight-pulse')
          setTimeout(() => {
            taskElement.classList.remove('highlight-pulse')
          }, 1500)
        }, 400)
      }
    }, 400)
    return
  }

  // On desktop, scroll to the active task directly
  scrollToActiveTask(taskId)
}

// Scroll to a specific task and highlight it (desktop version)
function scrollToActiveTask(taskId: string) {
  const taskElement = document.getElementById(`task-${taskId}`)
  if (!taskElement) return

  taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // Add highlight animation after scroll completes
  setTimeout(() => {
    taskElement.classList.add('highlight-pulse')
    setTimeout(() => {
      taskElement.classList.remove('highlight-pulse')
    }, 1500)
  }, 400)
}

// Handle scroll to update active tab
function onScroll() {
  if (!swipeContainer.value) return
  const containerWidth = swipeContainer.value.offsetWidth
  const scrollLeft = swipeContainer.value.scrollLeft
  const newActiveTab = Math.round(scrollLeft / containerWidth)
  if (newActiveTab !== activeTab.value && newActiveTab >= 0 && newActiveTab < tabs.length) {
    activeTab.value = newActiveTab

    // Dismiss swipe hint after first swipe
    if (showSwipeHint.value) {
      showSwipeHint.value = false
      swipeHintDismissed.value = true
    }
  }
}
</script>

<style scoped>
/* Hide scrollbar for swipe container */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Safe area for bottom tab bar on iOS */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* Fade transition for swipe hint */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
