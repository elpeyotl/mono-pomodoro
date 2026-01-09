<template>
  <UModal v-model="isOpen">
    <UCard class="max-w-md">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            {{ modalTitle }}
          </h3>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            size="sm"
            @click="isOpen = false"
          />
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

      <!-- Google OAuth Button -->
      <UButton
        icon="i-simple-icons-google"
        label="Continue with Google"
        color="white"
        variant="solid"
        block
        size="lg"
        :loading="isLoadingGoogle"
        @click="signInWithGoogle"
      />

      <!-- Divider -->
      <div class="flex items-center gap-3 my-6">
        <div class="flex-1 h-px bg-gray-700" />
        <span class="text-sm text-gray-500">or</span>
        <div class="flex-1 h-px bg-gray-700" />
      </div>

      <!-- Email/Password Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Email -->
        <UFormGroup label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            placeholder="your@email.com"
            icon="i-heroicons-envelope"
            size="lg"
            :disabled="isLoading"
            required
          />
        </UFormGroup>

        <!-- Password (not shown for reset) -->
        <UFormGroup v-if="mode !== 'reset'" label="Password" name="password">
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
          <template v-if="mode === 'register'" #hint>
            <span class="text-xs text-gray-500">Minimum 6 characters</span>
          </template>
        </UFormGroup>

        <!-- Confirm Password (only for register) -->
        <UFormGroup v-if="mode === 'register'" label="Confirm Password" name="confirmPassword">
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
          :label="submitButtonLabel"
          color="primary"
          block
          size="lg"
          :loading="isLoading"
        />
      </form>

      <!-- Mode Switch Links -->
      <div class="mt-6 text-center text-sm">
        <template v-if="mode === 'login'">
          <p class="text-gray-400">
            Don't have an account?
            <button
              type="button"
              class="text-primary-400 hover:text-primary-300 font-medium"
              @click="switchMode('register')"
            >
              Sign up
            </button>
          </p>
          <button
            type="button"
            class="mt-2 text-gray-500 hover:text-gray-400 text-xs"
            @click="switchMode('reset')"
          >
            Forgot password?
          </button>
        </template>
        <template v-else-if="mode === 'register'">
          <p class="text-gray-400">
            Already have an account?
            <button
              type="button"
              class="text-primary-400 hover:text-primary-300 font-medium"
              @click="switchMode('login')"
            >
              Sign in
            </button>
          </p>
        </template>
        <template v-else-if="mode === 'reset'">
          <p class="text-gray-400">
            Remember your password?
            <button
              type="button"
              class="text-primary-400 hover:text-primary-300 font-medium"
              @click="switchMode('login')"
            >
              Sign in
            </button>
          </p>
        </template>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()

// Modal state
const isOpen = defineModel<boolean>({ default: false })

// Form state
const mode = ref<'login' | 'register' | 'reset'>('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)

// Loading states
const isLoading = ref(false)
const isLoadingGoogle = ref(false)

// Messages
const successMessage = ref('')
const errorMessage = ref('')

// Computed
const modalTitle = computed(() => {
  switch (mode.value) {
    case 'login': return 'Sign In'
    case 'register': return 'Create Account'
    case 'reset': return 'Reset Password'
    default: return 'Sign In'
  }
})

const submitButtonLabel = computed(() => {
  switch (mode.value) {
    case 'login': return 'Sign In'
    case 'register': return 'Create Account'
    case 'reset': return 'Send Reset Link'
    default: return 'Submit'
  }
})

// Methods
function switchMode(newMode: 'login' | 'register' | 'reset') {
  mode.value = newMode
  errorMessage.value = ''
  successMessage.value = ''
  password.value = ''
  confirmPassword.value = ''
}

function resetForm() {
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  mode.value = 'login'
}

async function signInWithGoogle() {
  isLoadingGoogle.value = true
  errorMessage.value = ''
  
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/confirm`
      }
    })
    
    if (error) throw error
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to sign in with Google'
  } finally {
    isLoadingGoogle.value = false
  }
}

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''
  
  // Validation
  if (!email.value) {
    errorMessage.value = 'Please enter your email'
    return
  }
  
  if (mode.value !== 'reset' && !password.value) {
    errorMessage.value = 'Please enter your password'
    return
  }
  
  if (mode.value === 'register') {
    if (password.value.length < 6) {
      errorMessage.value = 'Password must be at least 6 characters'
      return
    }
    if (password.value !== confirmPassword.value) {
      errorMessage.value = 'Passwords do not match'
      return
    }
  }
  
  isLoading.value = true
  
  try {
    if (mode.value === 'login') {
      await signInWithEmail()
    } else if (mode.value === 'register') {
      await signUpWithEmail()
    } else if (mode.value === 'reset') {
      await resetPassword()
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'An error occurred'
  } finally {
    isLoading.value = false
  }
}

async function signInWithEmail() {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })
  
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password')
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Please verify your email before signing in')
    }
    throw error
  }
  
  // Success - close modal
  isOpen.value = false
  resetForm()
}

async function signUpWithEmail() {
  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      emailRedirectTo: `${window.location.origin}/confirm`
    }
  })
  
  if (error) {
    if (error.message.includes('already registered')) {
      throw new Error('This email is already registered. Try signing in instead.')
    }
    throw error
  }
  
  // Show success message
  successMessage.value = 'Check your email for a confirmation link to complete your registration.'
  password.value = ''
  confirmPassword.value = ''
}

async function resetPassword() {
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  
  if (error) throw error
  
  // Show success message
  successMessage.value = 'Check your email for a password reset link.'
}

// Reset form when modal closes
watch(isOpen, (newValue) => {
  if (!newValue) {
    // Delay reset to allow modal close animation
    setTimeout(resetForm, 300)
  }
})
</script>
