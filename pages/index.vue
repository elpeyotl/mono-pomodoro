<template>
  <div class="space-y-6 lg:space-y-8">
    <!-- Welcome Message -->
    <div class="text-center">
      <h1 class="text-2xl lg:text-3xl font-bold mb-2">
        {{ user ? `Welcome back, ${user.email?.split('@')[0]}` : 'One task at a time.' }}
      </h1>
      <p class="text-gray-400 text-sm lg:text-base">
        {{ user ? 'Your focus sessions are synced to the cloud.' : 'You are in guest mode. Login to sync your data.' }}
      </p>
    </div>

    <!-- Desktop Layout: Side by Side (only on large screens >= 1024px) -->
    <div class="hidden lg:grid lg:grid-cols-2 gap-8 items-start">
      <!-- Timer - Left Side -->
      <div class="lg:sticky lg:top-8">
        <PomodoroTimer />
      </div>

      <!-- Task List - Right Side -->
      <div>
        <TaskList />
      </div>
    </div>

    <!-- Mobile/Tablet Layout: Swipeable Tabs (< 1024px) -->
    <div class="lg:hidden">
      <!-- Tab Indicator Dots (above content) -->
      <div class="flex justify-center gap-2 mb-4">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.id"
          class="w-2 h-2 rounded-full transition-all duration-300"
          :class="activeTab === index ? 'bg-primary-500 w-6' : 'bg-gray-600'"
          @click="scrollToTab(index)"
        />
      </div>

      <!-- Swipeable Container -->
      <div
        ref="swipeContainer"
        class="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
        :style="{ scrollBehavior: 'smooth', height: containerHeight }"
        @scroll="onScroll"
      >
        <!-- Timer Card - centered content with padding -->
        <div
          class="flex-shrink-0 w-full snap-center px-2 flex items-center justify-center"
          :style="{ height: containerHeight }"
        >
          <div class="w-full max-w-md">
            <PomodoroTimer />
          </div>
        </div>

        <!-- Tasks Card - scrollable content with padding -->
        <div
          class="flex-shrink-0 w-full snap-center px-2 overflow-y-auto scrollbar-hide"
          :style="{ height: containerHeight }"
        >
          <div class="pb-4">
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
            class="flex-1 flex flex-col items-center gap-1 py-3 px-4 transition-colors"
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

      <!-- Spacer for bottom tab bar -->
      <div class="h-20"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'

const user = useSupabaseUser()
const timerStore = useTimerStore()
const taskStore = useTaskStore()

// Window size for dynamic container height
const { height: windowHeight } = useWindowSize()

// Calculate container height: viewport - navbar (64px) - welcome section (~100px) - tab dots (32px) - bottom bar (80px) - padding (40px)
const containerHeight = computed(() => {
  const offset = 316 // Total offset for fixed elements
  const minHeight = 400 // Minimum height
  const calculatedHeight = windowHeight.value - offset
  return `${Math.max(calculatedHeight, minHeight)}px`
})

// Tabs configuration
const tabs = [
  { id: 'timer', label: 'Timer', icon: 'i-heroicons-clock' },
  { id: 'tasks', label: 'Tasks', icon: 'i-heroicons-clipboard-document-list' }
]

// Active tab state
const activeTab = ref(0)
const swipeContainer = ref<HTMLElement | null>(null)

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
