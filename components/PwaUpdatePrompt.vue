<script setup lang="ts">
// PWA Update Prompt - Shows a toast when a new version is available
// Uses @vite-pwa/nuxt's registerType: 'prompt' mode

const toast = useToast()

// Track if we've shown the update toast
const hasShownUpdate = ref(false)

onMounted(() => {
  // Only run on client
  if (typeof window === 'undefined') return
  
  // Get the PWA plugin from Nuxt app
  const nuxtApp = useNuxtApp()
  const pwa = nuxtApp.$pwa as {
    needRefresh?: { value: boolean }
    updateServiceWorker?: () => Promise<void>
  } | undefined
  
  if (!pwa) {
    console.log('PWA plugin not available')
    return
  }
  
  // Check for updates periodically
  const checkForUpdates = () => {
    if (pwa.needRefresh?.value && !hasShownUpdate.value) {
      hasShownUpdate.value = true
      showUpdateToast(pwa.updateServiceWorker)
    }
  }
  
  // Initial check
  checkForUpdates()
  
  // Check every 5 seconds (the service worker checks hourly, but we poll the state)
  const interval = setInterval(checkForUpdates, 5000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})

function showUpdateToast(updateFn?: () => Promise<void>) {
  toast.add({
    id: 'pwa-update',
    title: '🎉 New version available!',
    description: 'Click to update to the latest version of Mono.',
    icon: 'i-heroicons-arrow-path',
    color: 'primary',
    timeout: 0, // Don't auto-dismiss
    actions: [
      {
        label: 'Update now',
        click: () => handleUpdate(updateFn)
      },
      {
        label: 'Later',
        variant: 'ghost' as const,
        click: () => {
          toast.remove('pwa-update')
          // Reset so it can show again later
          setTimeout(() => {
            hasShownUpdate.value = false
          }, 60000) // Show again after 1 minute
        }
      }
    ]
  })
}

async function handleUpdate(updateFn?: () => Promise<void>) {
  toast.remove('pwa-update')
  
  // Show loading toast
  toast.add({
    id: 'pwa-updating',
    title: 'Updating...',
    description: 'Please wait while we update the app.',
    icon: 'i-heroicons-arrow-path',
    color: 'gray',
    timeout: 0
  })
  
  try {
    if (updateFn) {
      await updateFn()
    }
    // Reload the page to activate the new service worker
    window.location.reload()
  } catch (error) {
    console.error('Failed to update:', error)
    toast.remove('pwa-updating')
    toast.add({
      title: 'Update failed',
      description: 'Please try refreshing the page manually.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
      timeout: 5000
    })
  }
}
</script>

<template>
  <!-- This component doesn't render anything visible - it just manages the toast -->
  <div />
</template>
