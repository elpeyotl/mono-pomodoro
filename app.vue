<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Prevent body scroll on mobile - only inner containers should scroll */
@media (max-width: 1023px) {
  html, body {
    height: 100%;
    overflow: hidden;
    position: fixed;
    width: 100%;
  }
  
  #__nuxt {
    height: 100%;
    overflow: hidden;
  }
}

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
