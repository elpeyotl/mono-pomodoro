<template>
  <div class="min-h-screen text-gray-100 relative">
    <!-- Three.js Wave Background -->
    <ClientOnly>
      <WaveBackground
        :mode="timerStore.currentMode"
        :is-running="timerStore.isRunning"
      />
    </ClientOnly>
    
    <!-- Content -->
    <div class="relative z-10 min-h-screen flex flex-col">
      <AppNavbar />
      <main class="container mx-auto px-4 py-4 lg:py-8 flex-1 pb-20 lg:pb-8">
        <slot />
      </main>
    </div>
    
    <!-- Sync Dialog (appears after login if local tasks exist) -->
    <SyncDialog />
  </div>
</template>

<script setup lang="ts">
import { useTimerStore } from '~/stores/timerStore'

const timerStore = useTimerStore()
</script>
