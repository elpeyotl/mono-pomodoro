<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <UCard class="max-w-md w-full text-center" :ui="{ background: 'bg-gray-900', ring: 'ring-1 ring-gray-800' }">
      <div class="py-8">
        <template v-if="isLoading">
          <UIcon 
            name="i-heroicons-arrow-path" 
            class="w-16 h-16 mx-auto mb-4 text-primary-500 animate-spin" 
          />
          <h2 class="text-xl font-semibold mb-2">Verifying login...</h2>
          <p class="text-gray-400 mb-6">Please wait while we confirm your authentication.</p>
          <UProgress animation="carousel" />
        </template>
        
        <template v-else-if="error">
          <UIcon 
            name="i-heroicons-x-circle" 
            class="w-16 h-16 mx-auto mb-4 text-red-500" 
          />
          <h2 class="text-xl font-semibold mb-2">Login Failed</h2>
          <p class="text-gray-400 mb-6">{{ error }}</p>
          <UButton 
            label="Try Again" 
            color="primary" 
            @click="navigateTo('/')"
          />
        </template>
        
        <template v-else>
          <UIcon 
            name="i-heroicons-check-circle" 
            class="w-16 h-16 mx-auto mb-4 text-green-500" 
          />
          <h2 class="text-xl font-semibold mb-2">Login Successful!</h2>
          <p class="text-gray-400 mb-2">Welcome, {{ userEmail }}!</p>
          <p class="text-gray-500 text-sm mb-6">Redirecting you to the app...</p>
          <UProgress animation="carousel" />
        </template>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const isLoading = ref(true)
const error = ref<string | null>(null)
const userEmail = computed(() => user.value?.email || 'User')

onMounted(async () => {
  try {
    // Check if we have hash params (OAuth callback)
    const hashParams = window.location.hash
    
    if (hashParams && hashParams.includes('access_token')) {
      // The @nuxtjs/supabase module should automatically handle this
      // but we wait a moment for it to process
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')
    
    if (errorParam) {
      error.value = errorDescription || errorParam
      isLoading.value = false
      return
    }
    
    // Wait for user to be available
    let attempts = 0
    while (!user.value && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 300))
      attempts++
    }
    
    isLoading.value = false
    
    if (user.value) {
      // Success - redirect after short delay
      setTimeout(() => {
        navigateTo('/')
      }, 1500)
    } else {
      error.value = 'Authentication failed. Please try again.'
    }
  } catch (e: any) {
    console.error('Auth confirmation error:', e)
    error.value = e.message || 'An unexpected error occurred'
    isLoading.value = false
  }
})
</script>
