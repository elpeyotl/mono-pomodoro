<template>
  <nav class="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-md">
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
        <div class="flex items-center gap-3">
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
            <!-- Logout Button -->
            <UButton
              icon="i-heroicons-arrow-left-on-rectangle"
              label="Logout"
              color="white"
              variant="outline"
              size="sm"
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
