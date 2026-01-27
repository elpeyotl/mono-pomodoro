<template>
  <UCard
    :ui="{
      background: 'bg-gray-800',
      ring: 'ring-2 ring-gray-600',
      divide: 'divide-y divide-gray-600',
      shadow: 'shadow-2xl shadow-black/50',
      rounded: 'rounded-xl'
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Statistics</h2>
        <UButtonGroup>
          <UButton
            :color="viewMode === 'daily' ? 'primary' : 'white'"
            :variant="viewMode === 'daily' ? 'soft' : 'outline'"
            label="Daily"
            size="sm"
            @click="viewMode = 'daily'"
          />
          <UButton
            :color="viewMode === 'weekly' ? 'primary' : 'white'"
            :variant="viewMode === 'weekly' ? 'soft' : 'outline'"
            label="Weekly"
            size="sm"
            @click="viewMode = 'weekly'"
          />
        </UButtonGroup>
      </div>
    </template>

    <!-- Today's Summary -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="text-center p-4 bg-gray-700/50 rounded-lg">
        <div class="text-2xl sm:text-3xl font-bold text-primary-400">
          {{ formatTime(statisticsStore.todayStats.total_focus_time) }}
        </div>
        <div class="text-xs sm:text-sm text-gray-400 mt-1">Focus Today</div>
      </div>
      <div class="text-center p-4 bg-gray-700/50 rounded-lg">
        <div class="text-2xl sm:text-3xl font-bold text-orange-400">
          {{ statisticsStore.todayStats.completed_pomodoros }}
        </div>
        <div class="text-xs sm:text-sm text-gray-400 mt-1">Pomodoros</div>
      </div>
      <div class="text-center p-4 bg-gray-700/50 rounded-lg">
        <div class="text-2xl sm:text-3xl font-bold text-blue-400">
          {{ statisticsStore.todayStats.sessions_count }}
        </div>
        <div class="text-xs sm:text-sm text-gray-400 mt-1">Sessions</div>
      </div>
    </div>

    <!-- Daily View - Last 7 Days -->
    <div v-if="viewMode === 'daily'" class="space-y-2">
      <h3 class="text-sm font-medium text-gray-400 mb-3">Last 7 Days</h3>

      <div v-if="!hasData" class="text-center py-6 text-gray-500">
        <UIcon name="i-heroicons-chart-bar" class="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p class="text-sm">No focus sessions yet.</p>
        <p class="text-xs mt-1">Complete your first pomodoro to see statistics!</p>
      </div>

      <div
        v-else
        v-for="day in last7Days"
        :key="day.date"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/30 transition-colors"
      >
        <div class="w-16 sm:w-20 text-xs sm:text-sm text-gray-400 flex-shrink-0">
          {{ formatDayLabel(day.date) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary-500 rounded-full transition-all duration-500"
              :style="{ width: `${getBarWidth(day.total_focus_time)}%` }"
            ></div>
          </div>
        </div>
        <div class="w-14 sm:w-16 text-right text-xs sm:text-sm text-gray-300 flex-shrink-0">
          {{ formatTime(day.total_focus_time) }}
        </div>
        <div class="w-10 sm:w-12 text-right text-xs text-orange-400 flex-shrink-0">
          {{ day.completed_pomodoros }}x
        </div>
      </div>
    </div>

    <!-- Weekly View -->
    <div v-else class="space-y-4">
      <h3 class="text-sm font-medium text-gray-400 mb-3">Weekly Summary</h3>

      <div v-if="!hasData" class="text-center py-6 text-gray-500">
        <UIcon name="i-heroicons-chart-bar" class="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p class="text-sm">No focus sessions yet.</p>
        <p class="text-xs mt-1">Complete your first pomodoro to see statistics!</p>
      </div>

      <div
        v-else
        v-for="week in weeklyStats"
        :key="week.week_start"
        class="p-3 bg-gray-700/30 rounded-lg"
      >
        <div class="flex justify-between items-center mb-3">
          <span class="text-sm text-gray-300">
            {{ formatWeekRange(week.week_start, week.week_end) }}
          </span>
          <div class="flex items-center gap-3">
            <span class="text-xs text-orange-400">
              {{ week.completed_pomodoros }} pomodoros
            </span>
            <span class="text-sm font-medium text-primary-400">
              {{ formatTime(week.total_focus_time) }}
            </span>
          </div>
        </div>

        <!-- Mini bar chart for each day -->
        <div class="flex gap-1 h-12">
          <div
            v-for="day in week.daily_breakdown"
            :key="day.date"
            class="flex-1 flex flex-col justify-end items-center"
          >
            <div
              class="w-full bg-primary-500/80 rounded-t transition-all"
              :style="{ height: `${Math.min(100, (day.total_focus_time / 7200) * 100)}%` }"
              :title="`${formatDayLabel(day.date)}: ${formatTime(day.total_focus_time)}`"
            ></div>
            <div class="text-[10px] text-gray-500 mt-1">
              {{ getDayInitial(day.date) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { useStatisticsStore } from '~/stores/statisticsStore'

const statisticsStore = useStatisticsStore()

const viewMode = ref<'daily' | 'weekly'>('daily')

// Last 7 days data
const last7Days = computed(() => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)
  return statisticsStore.getDailyStats(
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ).reverse()
})

// Weekly stats (last 4 weeks)
const weeklyStats = computed(() => statisticsStore.getWeeklyStats(4))

// Check if we have any data
const hasData = computed(() =>
  statisticsStore.sessions.length > 0 ||
  statisticsStore.todayStats.sessions_count > 0
)

// Max time for bar scaling (2 hours = 7200 seconds as baseline)
const maxDailyTime = computed(() => {
  const times = last7Days.value.map(d => d.total_focus_time)
  const max = Math.max(...times, 3600) // Minimum 1 hour for scale
  return max
})

function getBarWidth(seconds: number): number {
  if (maxDailyTime.value === 0) return 0
  return Math.min(100, (seconds / maxDailyTime.value) * 100)
}

function formatTime(seconds: number): string {
  if (seconds === 0) return '0m'
  if (seconds < 60) return `${seconds}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (date.getTime() === today.getTime()) return 'Today'

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getTime() === yesterday.getTime()) return 'Yesterday'

  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function formatWeekRange(start: string, end: string): string {
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')
  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function getDayInitial(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'narrow' })
}
</script>
