<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">Reset Password</h1>
          <p class="text-gray-400 mt-2">Enter your new password below</p>
        </div>
      </template>

      <!-- Success Message -->
      <div v-if="successMessage" class="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <div class="flex items-center gap-2 text-green-400">
          <UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
          <span class="text-sm">{{ successMessage }}</span>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div class="flex items-center gap-2 text-red-400">
          <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5" />
          <span class="text-sm">{{ errorMessage }}</span>
        </div>
      </div>

      <form v-if="!successMessage" @submit.prevent="updatePassword" class="space-y-4">
        <!-- New Password -->
        <UFormGroup label="New Password" name="password">
          <UInput
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-heroicons-lock-closed"
            size="lg"
            :disabled="isLoading"
            required
            :ui="{ trailing: { padding: { lg: 'pr-10' } } }"
          >
            <template #trailing>
              <UButton
                :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                color="gray"
                variant="ghost"
                size="xs"
                :padded="false"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
          <template #hint>
            <span class="text-xs text-gray-500">Minimum 6 characters</span>
          </template>
        </UFormGroup>

        <!-- Confirm Password -->
        <UFormGroup label="Confirm Password" name="confirmPassword">
          <UInput
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-heroicons-lock-closed"
            size="lg"
            :disabled="isLoading"
            required
          />
        </UFormGroup>

        <!-- Submit Button -->
        <UButton
          type="submit"
          label="Update Password"
          color="primary"
          block
          size="lg"
          :loading="isLoading"
        />
      </form>

      <!-- Back to Home Link -->
      <div class="mt-6 text-center">
        <NuxtLink to="/" class="text-primary-400 hover:text-primary-300 text-sm">
          ← Back to Home
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const router = useRouter()

// Form state
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function updatePassword() {
  errorMessage.value = ''
  successMessage.value = ''
  
  // Validation
  if (!password.value) {
    errorMessage.value = 'Please enter a new password'
    return
  }
  
  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }
  
  isLoading.value = true
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })
    
    if (error) throw error
    
    successMessage.value = 'Password updated successfully! Redirecting...'
    
    // Redirect to home after 2 seconds
    setTimeout(() => {
      router.push('/')
    }, 2000)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to update password'
  } finally {
    isLoading.value = false
  }
}
</script>
