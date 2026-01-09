<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  
  <!-- Toast notifications container -->
  <UNotifications />
</template>

<style>
/* Highlight animation for task navigation */
@keyframes highlight-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(20, 184, 166, 0);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(20, 184, 166, 0.4);
  }
}

.highlight-pulse .task-item {
  animation: highlight-pulse 0.5s ease-in-out 3;
}
</style>
