<template>
  <nav class="sticky top-0 z-50 border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-md">
    <div class="container mx-auto px-4">
      <div class="flex h-16 items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <!-- Mono Logo - Single Circle representing Monotasking -->
          <div class="relative w-8 h-8">
            <div class="absolute inset-0 rounded-full bg-primary-500/20 group-hover:bg-primary-500/30 transition-colors" />
            <div class="absolute inset-1.5 rounded-full bg-primary-500 group-hover:scale-110 transition-transform" />
          </div>
          <span class="text-xl font-bold tracking-tight">mono</span>
        </NuxtLink>

        <!-- Auth Section -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Info Button -->
          <AppInfo />
          
          <!-- Install App Button (only shown when installable) -->
          <UButton
            v-if="canInstall"
            icon="i-heroicons-arrow-down-tray"
            label="Install"
            color="primary"
            variant="soft"
            size="sm"
            class="hidden sm:inline-flex"
            @click="installApp"
          />
          <UButton
            v-if="canInstall"
            icon="i-heroicons-arrow-down-tray"
            color="primary"
            variant="soft"
            size="sm"
            class="sm:hidden"
            @click="installApp"
          />
          
          <template v-if="!user">
            <UButton
              icon="i-heroicons-arrow-right-on-rectangle"
              label="Login with Google"
              color="primary"
              variant="soft"
              @click="signInWithGoogle"
            />
          </template>
          <template v-else>
            <!-- User Email Display -->
            <div class="flex items-center gap-2 text-sm text-gray-300">
              <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-primary-400" />
              <span class="hidden sm:inline max-w-[150px] truncate">{{ user.email }}</span>
            </div>
            <!-- Logout Button - Desktop with label -->
            <UButton
              icon="i-heroicons-arrow-left-on-rectangle"
              label="Logout"
              color="white"
              variant="outline"
              size="sm"
              class="hidden sm:inline-flex"
              @click="signOut"
            />
            <!-- Logout Button - Mobile icon only -->
            <UButton
              icon="i-heroicons-arrow-left-on-rectangle"
              color="white"
              variant="outline"
              size="sm"
              class="sm:hidden"
              @click="signOut"
            />
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// PWA Install Prompt
const deferredPrompt = ref<any>(null)
const canInstall = ref(false)

// Listen for the beforeinstallprompt event
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      deferredPrompt.value = e
      // Update UI to show install button
      canInstall.value = true
      console.log('PWA: Install prompt available')
    })

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed')
      canInstall.value = false
      deferredPrompt.value = null
    })

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA: Already installed')
      canInstall.value = false
    }
  }
})

async function installApp() {
  if (!deferredPrompt.value) {
    console.log('PWA: No install prompt available')
    return
  }

  // Show the install prompt
  deferredPrompt.value.prompt()

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.value.userChoice
  console.log(`PWA: User response to install prompt: ${outcome}`)

  // Clear the deferred prompt
  deferredPrompt.value = null
  canInstall.value = false
}

async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/confirm`
    }
  })
}

async function signOut() {
  try {
    // Try to sign out from Supabase
    await supabase.auth.signOut({ scope: 'local' })
  } catch (error: any) {
    // Ignore session errors - the user is already logged out
    console.warn('Logout error (ignored):', error.message)
  }
  
  // Clear all Supabase-related items from localStorage
  if (typeof window !== 'undefined') {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }
  
  // Force reload to clear any cached state
  window.location.href = '/'
}
</script>
