<template>
  <UCard
    :ui="{
      background: 'bg-gray-800',
      ring: 'ring-2 ring-gray-600',
      divide: 'divide-y divide-gray-600',
      shadow: 'shadow-2xl shadow-black/50',
      rounded: 'rounded-xl'
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Tasks</h2>
        <UButton
          icon="i-heroicons-plus"
          size="sm"
          label="Add Task"
          @click="openAddModal"
        />
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="taskStore.isLoading" class="py-8 text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-2 animate-spin text-primary-500" />
      <p class="text-gray-400">Loading tasks...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="taskStore.tasks.length === 0" class="text-center py-8 text-gray-500">
      <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 mx-auto mb-4" />
      <p>No tasks yet. Add your first task to get started!</p>
    </div>

    <!-- Task List -->
    <div v-else class="divide-y divide-gray-800">
      <!-- Pending Tasks -->
      <div v-if="taskStore.pendingTasks.length > 0" class="py-2">
        <h3 class="text-sm font-medium text-gray-400 mb-2 px-1">To Do ({{ taskStore.pendingTasks.length }})</h3>
        <ul class="space-y-2">
          <li 
            v-for="task in taskStore.pendingTasks" 
            :key="task.id"
            class="group"
          >
            <div
              class="rounded-lg transition-colors"
              :class="[
                task.is_active
                  ? 'bg-primary-500/20 ring-1 ring-primary-500/50'
                  : 'bg-gray-700/50 hover:bg-gray-700/80'
              ]"
            >
              <!-- Main Task Row -->
              <div class="flex items-center gap-3 p-3">
                <!-- Checkbox -->
                <UCheckbox 
                  :model-value="task.is_completed"
                  @update:model-value="taskStore.toggleComplete(task.id)"
                  color="primary"
                />
                
                <!-- Task Content (clickable to expand) -->
                <div 
                  class="flex-1 min-w-0 cursor-pointer"
                  @click="toggleExpand(task.id)"
                >
                  <div class="flex items-center gap-2">
                    <p class="text-gray-100 truncate">{{ task.title }}</p>
                    <!-- Expand Icon (only if subtasks exist) -->
                    <UIcon
                      v-if="task.subtasks.length > 0"
                      :name="expandedTaskId === task.id ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                      class="w-4 h-4 text-gray-400 flex-shrink-0"
                    />
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                    <!-- Pomodoro Count -->
                    <span class="text-xs text-gray-500 flex items-center gap-1">
                      <UIcon name="i-heroicons-fire" class="w-3 h-3" />
                      {{ task.pomodoro_count }} pomodoros
                    </span>
                    <!-- Total Focus Time -->
                    <span v-if="task.total_focus_time > 0" class="text-xs text-gray-500 flex items-center gap-1">
                      <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                      {{ formatFocusTime(task.total_focus_time) }}
                    </span>
                    <!-- Subtask Progress -->
                    <span v-if="task.subtasks.length > 0" class="text-xs text-gray-500 flex items-center gap-1">
                      <UIcon name="i-heroicons-check-circle" class="w-3 h-3" />
                      {{ getCompletedSubtasks(task) }}/{{ task.subtasks.length }}
                    </span>
                    <!-- Active Badge -->
                    <UBadge
                      v-if="task.is_active"
                      color="primary"
                      variant="soft"
                      size="xs"
                    >
                      Active
                    </UBadge>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <!-- Set Active Button -->
                  <UTooltip :text="task.is_active ? 'Deactivate' : 'Set as active'">
                    <UButton
                      :icon="task.is_active ? 'i-heroicons-pause' : 'i-heroicons-play'"
                      size="xs"
                      color="primary"
                      :variant="task.is_active ? 'soft' : 'outline'"
                      @click="toggleActive(task)"
                    />
                  </UTooltip>
                  
                  <!-- Edit Button -->
                  <UTooltip text="Edit">
                    <UButton
                      icon="i-heroicons-pencil"
                      size="xs"
                      color="primary"
                      variant="outline"
                      @click="openEditModal(task)"
                    />
                  </UTooltip>
                  
                  <!-- Delete Button -->
                  <UTooltip text="Delete">
                    <UButton
                      icon="i-heroicons-trash"
                      size="xs"
                      color="red"
                      variant="outline"
                      @click="confirmDelete(task)"
                    />
                  </UTooltip>
                </div>
              </div>
              
              <!-- Expanded Subtasks Section -->
              <div 
                v-if="expandedTaskId === task.id"
                class="px-3 pb-3 pt-0"
              >
                <div class="bg-gray-800/50 rounded-lg p-3 ml-8">
                  <!-- Subtask List -->
                  <ul v-if="task.subtasks.length > 0" class="space-y-2 mb-3">
                    <li
                      v-for="subtask in task.subtasks"
                      :key="subtask.id"
                      class="flex items-center gap-2 group/subtask"
                    >
                      <UCheckbox
                        :model-value="subtask.is_completed"
                        @update:model-value="taskStore.toggleSubtaskComplete(task.id, subtask.id)"
                        color="primary"
                        :ui="{ base: 'w-4 h-4' }"
                      />
                      <span 
                        class="flex-1 text-sm"
                        :class="subtask.is_completed ? 'text-gray-500 line-through' : 'text-gray-300'"
                      >
                        {{ subtask.title }}
                      </span>
                      <UButton
                        icon="i-heroicons-x-mark"
                        size="2xs"
                        color="gray"
                        variant="ghost"
                        class="opacity-0 group-hover/subtask:opacity-100"
                        @click="taskStore.deleteSubtask(task.id, subtask.id)"
                      />
                    </li>
                  </ul>
                  
                  <!-- Add Subtask Input -->
                  <div class="flex items-center gap-2">
                    <UInput
                      v-model="newSubtaskTitle"
                      placeholder="Add a subtask..."
                      size="sm"
                      color="gray"
                      variant="outline"
                      class="flex-1"
                      :ui="{
                        base: 'bg-gray-700 text-gray-100',
                        placeholder: 'placeholder-gray-500',
                        color: {
                          gray: {
                            outline: 'bg-gray-700 text-gray-100 ring-gray-600 focus:ring-primary-500'
                          }
                        }
                      }"
                      @keyup.enter="addSubtaskToTask(task.id)"
                    />
                    <UButton
                      icon="i-heroicons-plus"
                      size="sm"
                      color="primary"
                      variant="soft"
                      :disabled="!newSubtaskTitle.trim()"
                      @click="addSubtaskToTask(task.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Completed Tasks -->
      <div v-if="taskStore.completedTasks.length > 0" class="py-2">
        <h3 class="text-sm font-medium text-gray-400 mb-2 px-1">
          Completed ({{ taskStore.completedTasks.length }})
        </h3>
        <ul class="space-y-2">
          <li 
            v-for="task in taskStore.completedTasks" 
            :key="task.id"
            class="group"
          >
            <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
              <!-- Checkbox -->
              <UCheckbox 
                :model-value="task.is_completed"
                @update:model-value="taskStore.toggleComplete(task.id)"
                color="primary"
              />
              
              <!-- Task Content -->
              <div class="flex-1 min-w-0">
                <p class="text-gray-500 line-through truncate">{{ task.title }}</p>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-600 flex items-center gap-1">
                    <UIcon name="i-heroicons-fire" class="w-3 h-3" />
                    {{ task.pomodoro_count }} pomodoros
                  </span>
                  <span v-if="task.total_focus_time > 0" class="text-xs text-gray-600 flex items-center gap-1">
                    <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                    {{ formatFocusTime(task.total_focus_time) }}
                  </span>
                </div>
              </div>

              <!-- Delete Button -->
              <UButton
                icon="i-heroicons-trash"
                size="xs"
                color="red"
                variant="outline"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                @click="confirmDelete(task)"
              />
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Add/Edit Task Modal -->
    <UModal v-model="isModalOpen">
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
          <h3 class="text-lg font-semibold text-gray-100">
            {{ editingTask ? 'Edit Task' : 'Add New Task' }}
          </h3>
        </template>

        <form @submit.prevent="saveTask">
          <UFormGroup label="Task Title" required :ui="{ label: { base: 'text-gray-300' } }">
            <UInput
              v-model="taskTitle"
              placeholder="What do you want to focus on?"
              autofocus
              color="gray"
              variant="outline"
              :ui="{
                base: 'bg-gray-800 text-gray-100',
                placeholder: 'placeholder-gray-500',
                color: {
                  gray: {
                    outline: 'bg-gray-800 text-gray-100 ring-gray-700 focus:ring-primary-500'
                  }
                }
              }"
            />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="gray"
              variant="ghost"
              label="Cancel"
              @click="closeModal"
            />
            <UButton
              color="primary"
              :label="editingTask ? 'Save Changes' : 'Add Task'"
              :disabled="!taskTitle.trim()"
              @click="saveTask"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="isDeleteModalOpen">
      <UCard
        :ui="{
          background: 'bg-gray-900',
          ring: 'ring-1 ring-gray-800',
          header: { background: 'bg-gray-900' },
          body: { background: 'bg-gray-900' },
          footer: { background: 'bg-gray-900' }
        }"
      >
        <template #header>
          <h3 class="text-lg font-semibold text-red-400">Delete Task</h3>
        </template>

        <p class="text-gray-300">
          Are you sure you want to delete "<strong class="text-gray-100">{{ taskToDelete?.title }}</strong>"?
        </p>
        <p class="text-sm text-gray-500 mt-2">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="gray"
              variant="ghost"
              label="Cancel"
              @click="isDeleteModalOpen = false"
            />
            <UButton
              color="red"
              label="Delete"
              @click="deleteTask"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </UCard>
</template>

<script setup lang="ts">
import type { Task, LocalTask } from '~/types'

const taskStore = useTaskStore()

// Modal State
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const taskTitle = ref('')
const editingTask = ref<Task | LocalTask | null>(null)
const taskToDelete = ref<Task | LocalTask | null>(null)

// Expanded Task State (for viewing subtasks)
const expandedTaskId = ref<string | null>(null)

// New Subtask Input
const newSubtaskTitle = ref('')

// Toggle Expand Subtasks
function toggleExpand(taskId: string) {
  if (expandedTaskId.value === taskId) {
    expandedTaskId.value = null
  } else {
    expandedTaskId.value = taskId
    newSubtaskTitle.value = ''
  }
}

// Get completed subtasks count
function getCompletedSubtasks(task: Task | LocalTask): number {
  return task.subtasks.filter(s => s.is_completed).length
}

// Format focus time (seconds to human readable)
function formatFocusTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  
  return `${minutes}m`
}

// Add subtask to a task
async function addSubtaskToTask(taskId: string) {
  if (!newSubtaskTitle.value.trim()) return
  await taskStore.addSubtask(taskId, newSubtaskTitle.value.trim())
  newSubtaskTitle.value = ''
}

// Open Add Modal
function openAddModal() {
  editingTask.value = null
  taskTitle.value = ''
  isModalOpen.value = true
}

// Open Edit Modal
function openEditModal(task: Task | LocalTask) {
  editingTask.value = task
  taskTitle.value = task.title
  isModalOpen.value = true
}

// Close Modal
function closeModal() {
  isModalOpen.value = false
  editingTask.value = null
  taskTitle.value = ''
}

// Save Task (Add or Edit)
async function saveTask() {
  if (!taskTitle.value.trim()) return

  if (editingTask.value) {
    await taskStore.updateTask(editingTask.value.id, { 
      title: taskTitle.value.trim()
    })
  } else {
    await taskStore.addTask(taskTitle.value.trim())
  }

  closeModal()
}

// Toggle Active State
async function toggleActive(task: Task | LocalTask) {
  if (task.is_active) {
    await taskStore.setActiveTask(null)
  } else {
    await taskStore.setActiveTask(task.id)
  }
}

// Confirm Delete
function confirmDelete(task: Task | LocalTask) {
  taskToDelete.value = task
  isDeleteModalOpen.value = true
}

// Delete Task
async function deleteTask() {
  if (taskToDelete.value) {
    await taskStore.deleteTask(taskToDelete.value.id)
    taskToDelete.value = null
    isDeleteModalOpen.value = false
  }
}
</script>
