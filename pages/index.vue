<template>
  <div class="h-full lg:h-auto flex flex-col lg:block space-y-4 lg:space-y-8">
    <!-- Onboarding Flow for new users -->
    <OnboardingFlow />
    
    <!-- Welcome Message - Hidden on mobile to maximize timer space -->
    <div class="hidden lg:block text-center">
      <h1 class="text-3xl font-bold mb-2">
        {{ user ? `Welcome back, ${user.email?.split('@')[0]}` : 'One task at a time.' }}
      </h1>
      <p class="text-gray-400 text-base">
        {{ user ? 'Your focus sessions are synced to the cloud.' : 'You are in guest mode. Login to sync your data.' }}
      </p>
    </div>

    <!-- Desktop Layout: Side by Side (only on large screens >= 1024px) -->
    <div class="hidden lg:grid lg:grid-cols-2 gap-8 items-start">
      <!-- Timer - Left Side -->
      <div class="lg:sticky lg:top-8">
        <PomodoroTimer @navigate-to-task="scrollToTaskList" />
      </div>

      <!-- Task List - Right Side -->
      <div>
        <TaskList />
      </div>
    </div>

    <!-- Mobile/Tablet Layout: Swipeable Tabs (< 1024px) -->
    <div class="lg:hidden flex-1 flex flex-col overflow-hidden">
      <!-- Tab Indicator Dots (above content) -->
      <div class="flex justify-center gap-2 py-2 flex-shrink-0">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.id"
          class="w-2 h-2 rounded-full transition-all duration-300"
          :class="activeTab === index ? 'bg-primary-500 w-6' : 'bg-gray-600'"
          @click="scrollToTab(index)"
        />
      </div>

      <!-- Swipeable Container - takes remaining space minus bottom bar -->
      <div
        ref="swipeContainer"
        class="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-16"
        style="scroll-behavior: smooth;"
        @scroll="onScroll"
      >
        <!-- Timer Card - scrollable, starts at top like tasks -->
        <div
          class="flex-shrink-0 w-full h-full snap-center px-2 overflow-y-auto scrollbar-hide"
        >
          <div class="py-2 flex justify-center">
            <div class="w-full max-w-md">
              <PomodoroTimer @navigate-to-task="scrollToTaskList" />
            </div>
          </div>
        </div>

        <!-- Tasks Card - scrollable content with padding for bottom bar -->
        <div
          ref="tasksContainer"
          class="flex-shrink-0 w-full h-full snap-center px-2 overflow-y-auto scrollbar-hide"
        >
          <div class="pt-2 pb-20">
            <TaskList />
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
            <span class="text-xs font-medium">{{ tab.label }}</span>
            <!-- Timer countdown in tab when running -->
            <span
              v-if="tab.id === 'timer' && timerStore.isRunning"
              class="text-[10px] font-mono"
              :class="timerColorClass"
            >
              {{ formattedTime }}
            </span>
            <!-- Task count badge -->
            <span
              v-if="tab.id === 'tasks' && pendingTaskCount > 0"
              class="absolute top-2 right-1/4 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold bg-primary-500 text-white"
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
const user = useSupabaseUser()
const timerStore = useTimerStore()
const taskStore = useTaskStore()

// Tabs configuration
const tabs = [
  { id: 'timer', label: 'Timer', icon: 'i-heroicons-clock' },
  { id: 'tasks', label: 'Tasks', icon: 'i-heroicons-clipboard-document-list' }
]

// Active tab state
const activeTab = ref(0)
const swipeContainer = ref<HTMLElement | null>(null)
const tasksContainer = ref<HTMLElement | null>(null)

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
    scrollToTab(1)
    
    // Wait for horizontal scroll to complete
    setTimeout(() => {
      scrollToActiveTask(taskId, true)
    }, 500)
    return
  }
  
  // On desktop, scroll to the active task directly
  scrollToActiveTask(taskId, false)
}

// Scroll to a specific task and highlight it
function scrollToActiveTask(taskId: string, isMobile: boolean) {
  const taskElement = document.getElementById(`task-${taskId}`)
  if (!taskElement) return
  
  // For mobile, we need to find the scrollable container and scroll within it
  if (isMobile && tasksContainer.value) {
    // Find the task's index in the pending tasks list
    const taskIndex = taskStore.pendingTasks.findIndex(t => t.id === taskId)
    
    if (taskIndex >= 0) {
      // Measure actual task heights by looking at all task elements
      const allTaskElements = tasksContainer.value.querySelectorAll('[id^="task-"]')
      
      // Calculate the offset by summing up heights of all tasks before this one
      let taskTop = 0
      
      // First, find the header height (everything before the first task)
      if (allTaskElements.length > 0) {
        const firstTask = allTaskElements[0] as HTMLElement
        const firstTaskRect = firstTask.getBoundingClientRect()
        const containerRect = tasksContainer.value.getBoundingClientRect()
        // Header height = first task's top relative to container + current scroll
        const headerHeight = (firstTaskRect.top - containerRect.top) + tasksContainer.value.scrollTop
        taskTop = headerHeight
      }
      
      // Sum up heights of tasks before the target
      for (let i = 0; i < taskIndex && i < allTaskElements.length; i++) {
        const el = allTaskElements[i] as HTMLElement
        taskTop += el.offsetHeight + 8 // 8px for margin-bottom (mb-2)
      }
      
      // Get the target task's height
      const targetTaskHeight = taskIndex < allTaskElements.length
        ? (allTaskElements[taskIndex] as HTMLElement).offsetHeight
        : 100
      
      const containerHeight = tasksContainer.value.clientHeight
      
      // Calculate scroll position to center the task
      const scrollTop = taskTop - (containerHeight / 2) + (targetTaskHeight / 2)
      
      tasksContainer.value.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      })
    }
  } else {
    // On desktop, use scrollIntoView
    taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  
  // Add highlight animation after a short delay to ensure scroll is complete
  setTimeout(() => {
    taskElement.classList.add('highlight-pulse')
    setTimeout(() => {
      taskElement.classList.remove('highlight-pulse')
    }, 1500)
  }, 300)
}

// Handle scroll to update active tab
function onScroll() {
  if (!swipeContainer.value) return
  const containerWidth = swipeContainer.value.offsetWidth
  const scrollLeft = swipeContainer.value.scrollLeft
  const newActiveTab = Math.round(scrollLeft / containerWidth)
  if (newActiveTab !== activeTab.value && newActiveTab >= 0 && newActiveTab < tabs.length) {
    activeTab.value = newActiveTab
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
</style>
