<template>
  <div>
    <!-- Info Button -->
    <UButton
      icon="i-heroicons-question-mark-circle"
      color="primary"
      variant="ghost"
      size="sm"
      @click="isOpen = true"
    />

    <!-- Info Modal -->
    <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard :ui="{ 
        ring: '', 
        divide: 'divide-y divide-gray-800',
        body: { padding: 'p-0' },
        header: { padding: 'px-4 py-3 sm:px-6' },
        footer: { padding: 'px-4 py-3 sm:px-6' }
      }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Mono Logo -->
              <div class="relative w-8 h-8">
                <div class="absolute inset-0 rounded-full bg-primary-500/20" />
                <div class="absolute inset-1.5 rounded-full bg-primary-500" />
              </div>
              <div>
                <h3 class="text-lg font-semibold">mono</h3>
                <p class="text-xs text-gray-400">v{{ appVersion }}</p>
              </div>
            </div>
            <UButton
              icon="i-heroicons-x-mark"
              color="primary"
              variant="ghost"
              size="sm"
              @click="isOpen = false"
            />
          </div>
        </template>

        <!-- Tabs -->
        <UTabs :items="tabs" class="w-full" :ui="{
          list: {
            background: 'bg-gray-900',
            marker: { background: 'bg-primary-500/20' },
            tab: {
              base: 'font-medium',
              active: 'text-primary-400',
              inactive: 'text-gray-400 hover:text-primary-300'
            }
          }
        }">
          <template #item="{ item }">
            <div class="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
              <!-- About Tab -->
              <div v-if="item.key === 'about'" class="space-y-6">
                <div>
                  <h4 class="text-sm font-medium text-primary-400 uppercase tracking-wider mb-3">
                    What is mono?
                  </h4>
                  <p class="text-gray-300 text-sm leading-relaxed">
                    mono is a minimalist focus app built around the Pomodoro Technique. 
                    It helps you stay focused on one task at a time – because multitasking is a myth.
                  </p>
                </div>

                <div>
                  <h4 class="text-sm font-medium text-primary-400 uppercase tracking-wider mb-3">
                    The Pomodoro Technique
                  </h4>
                  <p class="text-gray-300 text-sm leading-relaxed mb-4">
                    Developed by Francesco Cirillo in the late 1980s, the Pomodoro Technique is a 
                    time management method that uses a timer to break work into focused intervals.
                  </p>
                  
                  <div class="grid grid-cols-3 gap-3">
                    <div class="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div class="text-2xl font-bold text-primary-400">25</div>
                      <div class="text-xs text-gray-400">min focus</div>
                    </div>
                    <div class="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div class="text-2xl font-bold text-green-400">5</div>
                      <div class="text-xs text-gray-400">min break</div>
                    </div>
                    <div class="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div class="text-2xl font-bold text-blue-400">15</div>
                      <div class="text-xs text-gray-400">min long break</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 class="text-sm font-medium text-primary-400 uppercase tracking-wider mb-3">
                    How it works
                  </h4>
                  <ol class="space-y-2 text-sm text-gray-300">
                    <li class="flex items-start gap-2">
                      <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center">1</span>
                      <span>Pick a task and set it as active</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center">2</span>
                      <span>Work on the task for 25 minutes (one "pomodoro")</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center">3</span>
                      <span>Take a 5-minute break when the timer rings</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center">4</span>
                      <span>After 4 pomodoros, take a longer 15-minute break</span>
                    </li>
                  </ol>
                </div>
              </div>

              <!-- Features Tab -->
              <div v-else-if="item.key === 'features'" class="space-y-4">
                <div v-for="feature in features" :key="feature.title" 
                     class="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
                  <UIcon :name="feature.icon" class="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 class="text-sm font-medium text-white">{{ feature.title }}</h5>
                    <p class="text-xs text-gray-400 mt-0.5">{{ feature.description }}</p>
                  </div>
                </div>
              </div>

              <!-- Shortcuts Tab -->
              <div v-else-if="item.key === 'shortcuts'" class="space-y-3">
                <div v-for="shortcut in shortcuts" :key="shortcut.key" 
                     class="flex items-center justify-between p-2 rounded-lg bg-gray-800/30">
                  <span class="text-sm text-gray-300">{{ shortcut.action }}</span>
                  <kbd class="px-2 py-1 text-xs font-mono bg-gray-700 rounded text-gray-300">
                    {{ shortcut.key }}
                  </kbd>
                </div>
              </div>

              <!-- Changelog Tab -->
              <div v-else-if="item.key === 'changelog'" class="space-y-6">
                <div v-for="release in changelog" :key="release.version" class="relative">
                  <!-- Version Header -->
                  <div class="flex items-center gap-3 mb-3">
                    <span class="px-2 py-0.5 text-xs font-mono bg-primary-500/20 text-primary-400 rounded">
                      v{{ release.version }}
                    </span>
                    <span class="text-xs text-gray-500">{{ release.date }}</span>
                    <span v-if="release.version === appVersion" 
                          class="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded uppercase">
                      current
                    </span>
                  </div>
                  
                  <!-- Changes -->
                  <ul class="space-y-1.5 pl-4 border-l border-gray-800">
                    <li v-for="(change, idx) in release.changes" :key="idx" 
                        class="text-sm text-gray-300 flex items-start gap-2">
                      <UIcon 
                        :name="getChangeIcon(change.type)" 
                        :class="getChangeColor(change.type)"
                        class="w-4 h-4 flex-shrink-0 mt-0.5" 
                      />
                      <span>{{ change.text }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </template>
        </UTabs>

        <template #footer>
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>Made with ❤️ for focused work</span>
            <a href="https://github.com/elpeyotl/mono-pomodoro" 
               target="_blank" 
               class="flex items-center gap-1 hover:text-gray-300 transition-colors">
              <UIcon name="i-simple-icons-github" class="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const isOpen = ref(false)

// App Version - also exported for use in other components
const appVersion = '1.11.1'

// Tabs
const tabs = [
  { key: 'about', label: 'About', icon: 'i-heroicons-information-circle' },
  { key: 'features', label: 'Features', icon: 'i-heroicons-sparkles' },
  { key: 'shortcuts', label: 'Shortcuts', icon: 'i-heroicons-command-line' },
  { key: 'changelog', label: 'Changelog', icon: 'i-heroicons-document-text' }
]

// Features
const features = [
  {
    icon: 'i-heroicons-clock',
    title: 'Pomodoro Timer',
    description: 'Customizable focus, break, and long break intervals with audio notifications'
  },
  {
    icon: 'i-heroicons-list-bullet',
    title: 'Task Management',
    description: 'Create, organize, and track tasks with drag & drop reordering'
  },
  {
    icon: 'i-heroicons-tag',
    title: 'Tags & Filtering',
    description: 'Organize tasks with custom tags and filter by category'
  },
  {
    icon: 'i-heroicons-cloud',
    title: 'Cloud Sync',
    description: 'Sign in with Google to sync your tasks across devices'
  },
  {
    icon: 'i-heroicons-device-phone-mobile',
    title: 'PWA Support',
    description: 'Install as an app on your phone or desktop'
  },
  {
    icon: 'i-heroicons-arrow-path',
    title: 'Realtime Updates',
    description: 'Changes sync instantly across all your devices'
  },
  {
    icon: 'i-heroicons-chart-bar',
    title: 'Focus Tracking',
    description: 'Track your focus time and pomodoro count per task'
  },
  {
    icon: 'i-heroicons-moon',
    title: 'Dark Mode',
    description: 'Easy on the eyes with a beautiful dark interface'
  }
]

// Keyboard Shortcuts
const shortcuts = [
  { key: 'Space', action: 'Start / Pause timer' },
  { key: 'R', action: 'Reset timer' },
  { key: 'S', action: 'Skip to next phase' },
  { key: 'N', action: 'Focus new task input' },
  { key: 'Esc', action: 'Close modals / Cancel' }
]

// Changelog
const changelog = [
  {
    version: '1.11.1',
    date: 'January 9, 2026',
    changes: [
      { type: 'improvement', text: 'Test release to verify PWA update prompt functionality' }
    ]
  },
  {
    version: '1.11.0',
    date: 'January 9, 2026',
    changes: [
      { type: 'feature', text: 'PWA Update Prompt: Get notified when a new version is available' },
      { type: 'improvement', text: 'One-click update without closing the app' },
      { type: 'improvement', text: 'No more manual refresh needed for updates' }
    ]
  },
  {
    version: '1.10.0',
    date: 'January 9, 2026',
    changes: [
      { type: 'feature', text: 'Gamification: Confetti animation when completing tasks 🎊' },
      { type: 'feature', text: 'Big celebration confetti when all tasks of a tag are completed' },
      { type: 'improvement', text: 'Visual feedback makes completing tasks more satisfying' }
    ]
  },
  {
    version: '1.9.0',
    date: 'January 9, 2026',
    changes: [
      { type: 'feature', text: 'Overtime mode: Timer counts into negative when Auto-Start is OFF' },
      { type: 'feature', text: 'Finish your task at your own pace, then click Skip when ready' },
      { type: 'improvement', text: 'Green color indicator when in overtime mode (positive reinforcement!)' },
      { type: 'improvement', text: 'Overtime is added to focus time tracking' },
      { type: 'improvement', text: 'Auto-Start now defaults to OFF for more flexibility' },
      { type: 'fix', text: 'Fixed SSR hydration issue causing double timer completion' }
    ]
  },
  {
    version: '1.8.0',
    date: 'January 9, 2026',
    changes: [
      { type: 'feature', text: 'Email/Password authentication with password reset' },
      { type: 'feature', text: 'Swipe hint for new mobile users' },
      { type: 'feature', text: 'Vercel Analytics integration' },
      { type: 'fix', text: 'Timer background color now changes correctly on mode switch' },
      { type: 'fix', text: 'Timer works correctly in inactive browser tabs' },
      { type: 'fix', text: 'Session count display fixed for single-session intervals' },
      { type: 'improvement', text: 'Mobile: Sticky header with timer in footer' },
      { type: 'improvement', text: 'Mobile: Better task navigation with index-based scrolling' },
      { type: 'improvement', text: 'Mobile: Body scroll re-enabled for better UX' }
    ]
  },
  {
    version: '1.7.0',
    date: 'January 8, 2026',
    changes: [
      { type: 'feature', text: 'Onboarding flow for new users (3 steps)' },
      { type: 'feature', text: 'Welcome tutorial explaining Pomodoro technique' },
      { type: 'feature', text: 'Task management guide' },
      { type: 'feature', text: 'Keyboard shortcuts introduction' }
    ]
  },
  {
    version: '1.6.0',
    date: 'January 8, 2026',
    changes: [
      { type: 'feature', text: 'Info modal with Pomodoro explanation and app guide' },
      { type: 'feature', text: 'Features overview with all app capabilities' },
      { type: 'feature', text: 'Keyboard shortcuts reference' },
      { type: 'feature', text: 'Version history and changelog' }
    ]
  },
  {
    version: '1.5.0',
    date: 'January 8, 2026',
    changes: [
      { type: 'feature', text: 'Smart tag filter switch when navigating to active task' },
      { type: 'feature', text: 'Multiselect mode for batch deleting completed tasks' },
      { type: 'feature', text: 'Supabase Realtime for instant cross-device sync' },
      { type: 'fix', text: 'Fixed duplicate tasks when creating with Realtime enabled' }
    ]
  },
  {
    version: '1.4.0',
    date: 'January 7, 2026',
    changes: [
      { type: 'feature', text: 'Click on "Working on" to navigate to active task' },
      { type: 'feature', text: 'Tag pre-selection when creating new tasks' },
      { type: 'feature', text: 'Highlight animation for active task' },
      { type: 'fix', text: 'Focus time now saves when completing active task' }
    ]
  },
  {
    version: '1.3.0',
    date: 'January 6, 2026',
    changes: [
      { type: 'feature', text: 'PWA support - install as native app' },
      { type: 'feature', text: 'Mobile-optimized swipe navigation' },
      { type: 'feature', text: 'Bottom tab bar for mobile' },
      { type: 'improvement', text: 'Improved scroll behavior on small screens' }
    ]
  },
  {
    version: '1.2.0',
    date: 'January 5, 2026',
    changes: [
      { type: 'feature', text: 'Custom tags for task organization' },
      { type: 'feature', text: 'Tag filtering with count badges' },
      { type: 'feature', text: 'Drag & drop task reordering' },
      { type: 'feature', text: 'Timer settings sync to cloud' }
    ]
  },
  {
    version: '1.1.0',
    date: 'January 4, 2026',
    changes: [
      { type: 'feature', text: 'Keyboard shortcuts for power users' },
      { type: 'feature', text: 'Focus time tracking per task' },
      { type: 'feature', text: 'Animated wave background' },
      { type: 'feature', text: 'Audio notifications' }
    ]
  },
  {
    version: '1.0.0',
    date: 'January 3, 2026',
    changes: [
      { type: 'feature', text: 'Initial release' },
      { type: 'feature', text: 'Pomodoro timer with customizable intervals' },
      { type: 'feature', text: 'Task management with subtasks' },
      { type: 'feature', text: 'Google authentication & cloud sync' }
    ]
  }
]

function getChangeIcon(type: string): string {
  switch (type) {
    case 'feature': return 'i-heroicons-plus-circle'
    case 'fix': return 'i-heroicons-wrench-screwdriver'
    case 'improvement': return 'i-heroicons-arrow-trending-up'
    default: return 'i-heroicons-minus-circle'
  }
}

function getChangeColor(type: string): string {
  switch (type) {
    case 'feature': return 'text-green-400'
    case 'fix': return 'text-orange-400'
    case 'improvement': return 'text-blue-400'
    default: return 'text-gray-400'
  }
}
</script>
