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
    <div class="relative z-10">
      <AppNavbar />
      <main class="container mx-auto px-4 py-8">
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
