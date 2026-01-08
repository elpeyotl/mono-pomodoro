<template>
  <UModal
    v-model="isOpen"
    :ui="{
      width: 'sm:max-w-lg',
      overlay: { background: 'bg-gray-900/75' }
    }"
    :prevent-close="true"
  >
    <UCard :ui="{ 
      ring: '', 
      divide: '',
      body: { padding: 'p-6 sm:p-8' }
    }">
      <!-- Progress Dots -->
      <div class="flex justify-center gap-2 mb-6">
        <div 
          v-for="i in 3" 
          :key="i"
          class="w-2 h-2 rounded-full transition-all duration-300"
          :class="i === currentStep ? 'bg-primary-500 w-6' : 'bg-gray-600'"
        />
      </div>

      <!-- Step Content -->
      <div class="text-center">
        <!-- Step 1: Welcome & Pomodoro -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div class="flex justify-center">
            <div class="relative w-20 h-20">
              <div class="absolute inset-0 rounded-full bg-primary-500/20 animate-pulse" />
              <div class="absolute inset-3 rounded-full bg-primary-500" />
            </div>
          </div>
          
          <div>
            <h2 class="text-2xl font-bold text-white mb-2">Welcome to mono! 👋</h2>
            <p class="text-gray-400">Your minimalist focus companion</p>
          </div>

          <div class="bg-gray-800/50 rounded-xl p-5 text-left">
            <h3 class="text-sm font-medium text-primary-400 uppercase tracking-wider mb-4">
              The Pomodoro Technique
            </h3>
            <div class="grid grid-cols-3 gap-3 mb-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-primary-400">25</div>
                <div class="text-xs text-gray-400">min focus</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-400">5</div>
                <div class="text-xs text-gray-400">min break</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-400">15</div>
                <div class="text-xs text-gray-400">min long break</div>
              </div>
            </div>
            <p class="text-sm text-gray-300">
              Work in focused 25-minute sessions, then take short breaks. 
              After 4 sessions, enjoy a longer break!
            </p>
          </div>
        </div>

        <!-- Step 2: Tasks -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="flex justify-center">
            <div class="w-20 h-20 rounded-xl bg-gray-800/50 flex items-center justify-center">
              <UIcon name="i-heroicons-list-bullet" class="w-10 h-10 text-primary-400" />
            </div>
          </div>
          
          <div>
            <h2 class="text-2xl font-bold text-white mb-2">Organize Your Tasks</h2>
            <p class="text-gray-400">One task at a time – that's the mono way</p>
          </div>

          <div class="bg-gray-800/50 rounded-xl p-5 text-left space-y-4">
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-plus" class="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p class="text-sm font-medium text-white">Create tasks</p>
                <p class="text-xs text-gray-400">Add what you need to focus on</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-play" class="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p class="text-sm font-medium text-white">Set one as active</p>
                <p class="text-xs text-gray-400">Click the play button to focus on it</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-tag" class="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p class="text-sm font-medium text-white">Use tags to organize</p>
                <p class="text-xs text-gray-400">Filter tasks by project or category</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Start Focusing -->
        <div v-if="currentStep === 3" class="space-y-6">
          <div class="flex justify-center">
            <div class="w-20 h-20 rounded-xl bg-gray-800/50 flex items-center justify-center">
              <UIcon name="i-heroicons-rocket-launch" class="w-10 h-10 text-primary-400" />
            </div>
          </div>
          
          <div>
            <h2 class="text-2xl font-bold text-white mb-2">Ready to Focus!</h2>
            <p class="text-gray-400">You're all set to start your first session</p>
          </div>

          <div class="bg-gray-800/50 rounded-xl p-5 text-left space-y-4">
            <div class="flex items-start gap-3">
              <kbd class="px-2 py-1 text-xs font-mono bg-gray-700 rounded text-gray-300">Space</kbd>
              <p class="text-sm text-gray-300">Start / Pause timer</p>
            </div>
            <div class="flex items-start gap-3">
              <kbd class="px-2 py-1 text-xs font-mono bg-gray-700 rounded text-gray-300">N</kbd>
              <p class="text-sm text-gray-300">Create new task</p>
            </div>
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-question-mark-circle" class="w-5 h-5 text-primary-400" />
              <p class="text-sm text-gray-300">Click the <span class="text-primary-400">?</span> icon anytime for help</p>
            </div>
          </div>

          <div class="pt-2">
            <p class="text-xs text-gray-500">
              💡 Tip: Sign in with Google to sync your tasks across devices
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex items-center justify-between mt-8">
        <UButton
          v-if="currentStep > 1"
          icon="i-heroicons-arrow-left"
          color="primary"
          variant="ghost"
          @click="prevStep"
        >
          Back
        </UButton>
        <UButton
          v-else
          color="primary"
          variant="ghost"
          @click="skip"
        >
          Skip
        </UButton>

        <UButton
          v-if="currentStep < 3"
          icon="i-heroicons-arrow-right"
          trailing
          color="primary"
          @click="nextStep"
        >
          Next
        </UButton>
        <UButton
          v-else
          icon="i-heroicons-check"
          trailing
          color="primary"
          @click="complete"
        >
          Let's Go!
        </UButton>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const STORAGE_KEY = 'mono_onboarding_completed'

const isOpen = ref(false)
const currentStep = ref(1)

// Check if onboarding should be shown
onMounted(() => {
  if (typeof window !== 'undefined') {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      // Small delay to let the app render first
      setTimeout(() => {
        isOpen.value = true
      }, 500)
    }
  }
})

function nextStep() {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function skip() {
  markComplete()
}

function complete() {
  markComplete()
}

function markComplete() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, 'true')
  }
  isOpen.value = false
}

// Expose method to reset onboarding (for testing)
defineExpose({
  reset: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      currentStep.value = 1
      isOpen.value = true
    }
  }
})
</script>
