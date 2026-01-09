<script setup lang="ts">
// PWA Update Prompt - Shows a toast when a new version is available
// Uses direct Service Worker API instead of $pwa plugin for reliability

const toast = useToast()

// Track if we've shown the update toast
const hasShownUpdate = ref(false)
const waitingWorker = ref<ServiceWorker | null>(null)

onMounted(() => {
  // Only run on client with service worker support
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported')
    return
  }
  
  // Check for updates on mount and periodically
  checkForUpdates()
  
  // Check every 10 seconds for waiting service worker
  const interval = setInterval(checkForUpdates, 10000)
  
  // Listen for new service worker installing
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // New service worker has taken control, reload the page
    console.log('New service worker activated, reloading...')
    window.location.reload()
  })
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})

async function checkForUpdates() {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    
    if (!registration) {
      console.log('No service worker registration found')
      return
    }
    
    // Check if there's a waiting service worker
    if (registration.waiting && !hasShownUpdate.value) {
      console.log('Update available! Showing toast...')
      waitingWorker.value = registration.waiting
      hasShownUpdate.value = true
      showUpdateToast()
    }
    
    // Listen for new service worker becoming available
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is installed and waiting
          if (!hasShownUpdate.value) {
            console.log('New update installed, showing toast...')
            waitingWorker.value = newWorker
            hasShownUpdate.value = true
            showUpdateToast()
          }
        }
      })
    })
    
    // Trigger update check
    registration.update().catch(err => {
      console.log('Update check failed:', err)
    })
    
  } catch (error) {
    console.error('Error checking for updates:', error)
  }
}

function showUpdateToast() {
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
        click: handleUpdate
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

function handleUpdate() {
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
  
  // Tell the waiting service worker to skip waiting and become active
  if (waitingWorker.value) {
    waitingWorker.value.postMessage({ type: 'SKIP_WAITING' })
  }
  
  // The controllerchange event listener will reload the page
  // But as a fallback, reload after a short delay
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}
</script>

<template>
  <!-- This component doesn't render anything visible - it just manages the toast -->
  <div />
</template>
