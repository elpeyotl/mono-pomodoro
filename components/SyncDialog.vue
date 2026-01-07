<template>
  <UModal v-model="isOpen">
    <UCard
      :ui="{
        background: 'bg-gray-900',
        ring: 'ring-1 ring-gray-800',
        header: { background: 'bg-gray-900', base: 'text-gray-100' },
        body: { background: 'bg-gray-900' },
        footer: { background: 'bg-gray-900' }
      }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary-500/20 rounded-lg">
            <UIcon name="i-heroicons-cloud-arrow-up" class="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-100">Lokale Tasks gefunden</h3>
            <p class="text-sm text-gray-400">Du hast {{ localTaskCount }} Tasks im Guest-Modus erstellt</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-gray-300">
          Möchtest du deine lokalen Tasks mit deinem Account synchronisieren? 
          Nach der Synchronisation werden alle Tasks in der Cloud gespeichert und sind auf allen Geräten verfügbar.
        </p>
        
        <!-- Preview of local tasks -->
        <div class="bg-gray-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
          <div class="text-xs text-gray-500 mb-2">Vorschau:</div>
          <ul class="space-y-1">
            <li 
              v-for="task in previewTasks" 
              :key="task.id"
              class="flex items-center gap-2 text-sm text-gray-300"
            >
              <UIcon 
                :name="task.is_completed ? 'i-heroicons-check-circle' : 'i-heroicons-circle'" 
                :class="task.is_completed ? 'text-green-500' : 'text-gray-500'"
                class="w-4 h-4 flex-shrink-0"
              />
              <span :class="{ 'line-through text-gray-500': task.is_completed }">
                {{ task.title }}
              </span>
              <span v-if="task.pomodoro_count > 0" class="text-xs text-gray-500">
                ({{ task.pomodoro_count }} 🍅)
              </span>
            </li>
            <li v-if="localTaskCount > 5" class="text-xs text-gray-500 italic">
              ... und {{ localTaskCount - 5 }} weitere
            </li>
          </ul>
        </div>

        <!-- Sync result -->
        <div v-if="syncResult" class="flex items-center gap-2 p-3 rounded-lg" :class="syncResultClass">
          <UIcon :name="syncResultIcon" class="w-5 h-5" />
          <span>{{ syncResultMessage }}</span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="white"
            variant="outline"
            label="Überspringen"
            :disabled="isSyncing"
            @click="skipSync"
          />
          <UButton
            color="red"
            variant="soft"
            label="Lokale Tasks löschen"
            :disabled="isSyncing"
            @click="deleteLocalTasks"
          />
          <UButton
            color="primary"
            :label="isSyncing ? 'Synchronisiere...' : 'Synchronisieren'"
            :loading="isSyncing"
            @click="performSync"
          />
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import type { LocalTask } from '~/types'

const taskStore = useTaskStore()
const user = useSupabaseUser()

// Local storage for tracking if sync was offered
const syncOffered = useStorage<boolean>('focus-app-sync-offered', false)

// Dialog state
const isOpen = ref(false)
const isSyncing = ref(false)
const syncResult = ref<'success' | 'partial' | 'error' | null>(null)
const syncStats = ref({ synced: 0, errors: 0 })

// Local tasks from storage
const localTasks = useStorage<LocalTask[]>('focus-app-tasks', [])
const localTaskCount = computed(() => localTasks.value.length)
const previewTasks = computed(() => localTasks.value.slice(0, 5))

// Sync result UI
const syncResultClass = computed(() => {
  switch (syncResult.value) {
    case 'success': return 'bg-green-500/20 text-green-400'
    case 'partial': return 'bg-yellow-500/20 text-yellow-400'
    case 'error': return 'bg-red-500/20 text-red-400'
    default: return ''
  }
})

const syncResultIcon = computed(() => {
  switch (syncResult.value) {
    case 'success': return 'i-heroicons-check-circle'
    case 'partial': return 'i-heroicons-exclamation-triangle'
    case 'error': return 'i-heroicons-x-circle'
    default: return ''
  }
})

const syncResultMessage = computed(() => {
  switch (syncResult.value) {
    case 'success': return `${syncStats.value.synced} Tasks erfolgreich synchronisiert!`
    case 'partial': return `${syncStats.value.synced} synchronisiert, ${syncStats.value.errors} Fehler`
    case 'error': return 'Synchronisation fehlgeschlagen. Bitte versuche es erneut.'
    default: return ''
  }
})

// Watch for user login with local tasks
watch([user, () => taskStore.hasLocalTasks], ([newUser, hasLocal]) => {
  if (newUser && hasLocal && !syncOffered.value) {
    // User just logged in and has local tasks
    isOpen.value = true
  }
}, { immediate: true })

async function performSync() {
  isSyncing.value = true
  syncResult.value = null
  
  try {
    const result = await taskStore.syncLocalToSupabase()
    syncStats.value = result
    
    if (result.errors === 0 && result.synced > 0) {
      syncResult.value = 'success'
      // Close dialog after success
      setTimeout(() => {
        isOpen.value = false
        syncOffered.value = true
      }, 1500)
    } else if (result.synced > 0) {
      syncResult.value = 'partial'
    } else {
      syncResult.value = 'error'
    }
  } catch (e) {
    console.error('Sync error:', e)
    syncResult.value = 'error'
  } finally {
    isSyncing.value = false
  }
}

function skipSync() {
  syncOffered.value = true
  isOpen.value = false
}

function deleteLocalTasks() {
  localTasks.value = []
  syncOffered.value = true
  isOpen.value = false
}

// Expose method to manually trigger sync dialog
function openSyncDialog() {
  if (user.value && localTaskCount.value > 0) {
    syncOffered.value = false
    isOpen.value = true
  }
}

defineExpose({ openSyncDialog })
</script>
