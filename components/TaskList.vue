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
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Tasks</h2>
          <div class="flex items-center gap-2">
            <!-- Manage Tags Button -->
            <UButton
              icon="i-heroicons-tag"
              size="sm"
              color="primary"
              variant="outline"
              label="Tags"
              @click="isTagManagerOpen = true"
            />
            <UButton
              icon="i-heroicons-plus"
              size="sm"
              label="Add Task"
              @click="openAddModal"
            />
          </div>
        </div>
        
        <!-- Tag Filter - Minimalistisch: Punkt + heller Text + Count Badge -->
        <div v-if="taskStore.customTags.length > 0" class="flex items-center gap-2 flex-wrap">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
            :class="!taskStore.activeTagFilter
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'"
            @click="taskStore.setTagFilter(null)"
          >
            Alle
            <span
              v-if="getAllPendingTasksCount() > 0"
              class="ml-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-xs font-bold"
              :class="!taskStore.activeTagFilter
                ? 'bg-primary-500/30 text-primary-300'
                : 'bg-gray-600 text-gray-300'"
            >
              {{ getAllPendingTasksCount() }}
            </span>
          </button>
          <button
            v-for="tag in taskStore.customTags"
            :key="tag.id"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
            :class="taskStore.activeTagFilter === tag.id
              ? 'bg-gray-700/50'
              : 'hover:bg-gray-700/30'"
            @click="taskStore.setTagFilter(tag.id)"
          >
            <span
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :style="{ backgroundColor: getColorHex(tag.color) }"
            ></span>
            <span class="text-gray-100">{{ tag.name }}</span>
            <span
              v-if="getTaskCountForTag(tag.id) > 0"
              class="ml-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-xs font-bold"
              :style="{
                backgroundColor: getColorHex(tag.color) + '40',
                color: getColorHex(tag.color)
              }"
            >
              {{ getTaskCountForTag(tag.id) }}
            </span>
          </button>
        </div>
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
        <h3 class="text-sm font-medium text-gray-400 mb-2 px-1 flex items-center gap-2">
          To Do ({{ taskStore.pendingTasks.length }})
          <span class="text-xs text-gray-500 font-normal">
            <UIcon name="i-heroicons-arrows-up-down" class="w-3 h-3 inline" /> Drag to reorder
          </span>
        </h3>
        <draggable
          v-model="pendingTasksLocal"
          item-key="id"
          handle=".drag-handle"
          ghost-class="opacity-50"
          animation="200"
          @end="onDragEnd"
        >
          <template #item="{ element: task }">
            <div :id="`task-${task.id}`" class="group mb-2">
              <div
                class="rounded-lg transition-colors task-item"
                :class="[
                  task.is_active
                    ? 'bg-primary-500/20 ring-1 ring-primary-500/50'
                    : 'bg-gray-700/50 hover:bg-gray-700/80'
                ]"
              >
                <!-- Main Task Row -->
                <div class="flex items-center gap-3 p-3">
                  <!-- Drag Handle -->
                  <div class="drag-handle cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-colors">
                    <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
                  </div>
                  
                  <!-- Checkbox with Confetti -->
                  <div :ref="(el) => setCheckboxRef(task.id, el as HTMLElement)">
                    <UCheckbox
                      :model-value="task.is_completed"
                      @update:model-value="handleTaskComplete(task, $event)"
                      color="primary"
                    />
                  </div>
                
                  <!-- Task Content (clickable to expand) -->
                  <div
                    class="flex-1 min-w-0 cursor-pointer"
                    @click="toggleExpand(task.id)"
                  >
                    <div class="flex items-center gap-2">
                      <p class="text-gray-100 truncate font-medium">{{ task.title }}</p>
                      <!-- Expand Icon (only if subtasks exist) -->
                      <UIcon
                        v-if="task.subtasks.length > 0"
                        :name="expandedTaskId === task.id ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                        class="w-4 h-4 text-gray-400 flex-shrink-0"
                      />
                    </div>
                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                      <!-- Tags - Größer und besser lesbar -->
                      <span
                        v-for="tagId in (task.tags || [])"
                        :key="tagId"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold"
                        :style="getTagStyle(tagId)"
                      >
                        <span
                          class="w-2 h-2 rounded-full"
                          :style="{ backgroundColor: getTagTextColor(tagId) }"
                        ></span>
                        {{ getTagName(tagId) }}
                      </span>
                      <!-- Pomodoro Count -->
                      <span class="text-xs text-gray-300 flex items-center gap-1">
                        <UIcon name="i-heroicons-fire" class="w-3 h-3 text-orange-400" />
                        {{ task.pomodoro_count }} pomodoros
                      </span>
                      <!-- Total Focus Time -->
                      <span v-if="task.total_focus_time > 0" class="text-xs text-gray-300 flex items-center gap-1">
                        <UIcon name="i-heroicons-clock" class="w-3 h-3 text-blue-400" />
                        {{ formatFocusTime(task.total_focus_time) }}
                      </span>
                      <!-- Subtask Progress -->
                      <span v-if="task.subtasks.length > 0" class="text-xs text-gray-300 flex items-center gap-1">
                        <UIcon name="i-heroicons-check-circle" class="w-3 h-3 text-green-400" />
                        {{ getCompletedSubtasks(task) }}/{{ task.subtasks.length }}
                      </span>
                      <!-- Active Badge -->
                      <span
                        v-if="task.is_active"
                        class="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold bg-primary-500/30 text-primary-300"
                      >
                        ● Active
                      </span>
                    </div>
                  </div>

                  <!-- Actions - Always visible on mobile, hover on desktop -->
                  <div class="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <!-- Set Active Button -->
                    <UButton
                      :icon="task.is_active ? 'i-heroicons-pause' : 'i-heroicons-play'"
                      size="xs"
                      color="primary"
                      :variant="task.is_active ? 'soft' : 'outline'"
                      :aria-label="task.is_active ? 'Deactivate' : 'Start Focus'"
                      @click="toggleActive(task)"
                    />
                    
                    <!-- Edit Button -->
                    <UButton
                      icon="i-heroicons-pencil"
                      size="xs"
                      color="primary"
                      variant="outline"
                      aria-label="Edit"
                      @click="openEditModal(task)"
                    />
                    
                    <!-- Delete Button -->
                    <UButton
                      icon="i-heroicons-trash"
                      size="xs"
                      color="red"
                      variant="outline"
                      aria-label="Delete"
                      @click="confirmDelete(task)"
                    />
                  </div>
                </div>
                
                <!-- Expanded Subtasks Section -->
                <div
                  v-if="expandedTaskId === task.id"
                  class="px-3 pb-3 pt-0"
                >
                  <div class="bg-gray-800/50 rounded-lg p-3 ml-12">
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
            </div>
          </template>
        </draggable>
      </div>

      <!-- Completed Tasks -->
      <div v-if="taskStore.completedTasks.length > 0" class="py-2">
        <div class="flex items-center justify-between mb-2 px-1">
          <h3 class="text-sm font-medium text-gray-400">
            Completed ({{ taskStore.completedTasks.length }})
          </h3>
          
          <!-- Multiselect Controls -->
          <div class="flex items-center gap-2">
            <template v-if="isMultiselectMode">
              <!-- Select All / Deselect All -->
              <UButton
                :icon="selectedCompletedTasks.length === taskStore.completedTasks.length ? 'i-heroicons-x-mark' : 'i-heroicons-check'"
                size="xs"
                color="primary"
                variant="soft"
                :label="selectedCompletedTasks.length === taskStore.completedTasks.length ? 'Deselect' : 'All'"
                @click="toggleSelectAll"
              />
              
              <!-- Delete Selected -->
              <UButton
                icon="i-heroicons-trash"
                size="xs"
                color="red"
                variant="soft"
                :label="`Delete (${selectedCompletedTasks.length})`"
                :disabled="selectedCompletedTasks.length === 0"
                @click="confirmDeleteSelected"
              />
              
              <!-- Cancel -->
              <UButton
                icon="i-heroicons-x-mark"
                size="xs"
                color="white"
                variant="outline"
                @click="exitMultiselectMode"
              />
            </template>
            <template v-else>
              <!-- Enter Multiselect Mode -->
              <UButton
                icon="i-heroicons-trash"
                size="xs"
                color="gray"
                variant="ghost"
                label="Clean up"
                @click="enterMultiselectMode"
              />
            </template>
          </div>
        </div>
        
        <ul class="space-y-2">
          <li
            v-for="task in taskStore.completedTasks"
            :key="task.id"
            class="group"
          >
            <div
              class="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer"
              :class="[
                isMultiselectMode && selectedCompletedTasks.includes(task.id)
                  ? 'bg-red-500/20 ring-1 ring-red-500/50'
                  : 'bg-gray-700/30 hover:bg-gray-700/50'
              ]"
              @click="isMultiselectMode ? toggleTaskSelection(task.id) : null"
            >
              <!-- Selection Checkbox (Multiselect Mode) -->
              <UCheckbox
                v-if="isMultiselectMode"
                :model-value="selectedCompletedTasks.includes(task.id)"
                @update:model-value="toggleTaskSelection(task.id)"
                color="red"
                @click.stop
              />
              
              <!-- Restore Checkbox (Normal Mode) -->
              <UCheckbox
                v-else
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

              <!-- Delete Button - Only in normal mode -->
              <UButton
                v-if="!isMultiselectMode"
                icon="i-heroicons-trash"
                size="xs"
                color="red"
                variant="outline"
                class="md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                aria-label="Delete"
                @click.stop="confirmDelete(task)"
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

        <form @submit.prevent="saveTask" class="space-y-4">
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
          
          <!-- Tag Selection -->
          <UFormGroup label="Tags" :ui="{ label: { base: 'text-gray-300' } }">
            <div v-if="taskStore.customTags.length === 0" class="text-gray-500 text-sm py-2">
              No tags yet. <button type="button" class="text-primary-400 hover:underline" @click="isTagManagerOpen = true">Create your first tag</button>
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <button
                v-for="tag in taskStore.customTags"
                :key="tag.id"
                type="button"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                :class="selectedTags.includes(tag.id) 
                  ? 'ring-2 ring-offset-2 ring-offset-gray-900' 
                  : 'opacity-60 hover:opacity-100'"
                :style="getTagButtonStyle(tag, selectedTags.includes(tag.id))"
                @click="toggleTagSelection(tag.id)"
              >
                <UIcon
                  :name="selectedTags.includes(tag.id) ? 'i-heroicons-check-circle-solid' : 'i-heroicons-plus-circle'"
                  class="w-4 h-4"
                />
                {{ tag.name }}
              </button>
            </div>
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

    <!-- Tag Manager Modal -->
    <UModal v-model="isTagManagerOpen">
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
          <h3 class="text-lg font-semibold text-gray-100">Manage Tags</h3>
        </template>

        <div class="space-y-4">
          <!-- Create New Tag -->
          <div class="space-y-3">
            <label class="text-sm font-medium text-gray-300">Create New Tag</label>
            <div class="flex items-center gap-2">
              <UInput
                v-model="newTagName"
                placeholder="Tag name..."
                size="sm"
                color="gray"
                variant="outline"
                class="flex-1"
                :ui="{
                  base: 'bg-gray-800 text-gray-100',
                  placeholder: 'placeholder-gray-500',
                  color: {
                    gray: {
                      outline: 'bg-gray-800 text-gray-100 ring-gray-700 focus:ring-primary-500'
                    }
                  }
                }"
                @keyup.enter="createNewTag"
              />
              <UButton
                icon="i-heroicons-plus"
                size="sm"
                color="primary"
                :disabled="!newTagName.trim()"
                @click="createNewTag"
              />
            </div>
            
            <!-- Color Selection -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in TAG_COLORS"
                :key="color.value"
                type="button"
                class="w-8 h-8 rounded-full transition-all flex items-center justify-center"
                :class="newTagColor === color.value ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white scale-110' : 'hover:scale-105'"
                :style="{ backgroundColor: color.hex }"
                @click="newTagColor = color.value"
              >
                <UIcon 
                  v-if="newTagColor === color.value" 
                  name="i-heroicons-check" 
                  class="w-4 h-4 text-white"
                />
              </button>
            </div>
          </div>

          <!-- Existing Tags -->
          <div v-if="taskStore.customTags.length > 0" class="space-y-2">
            <label class="text-sm font-medium text-gray-300">Your Tags</label>
            <ul class="space-y-2">
              <li
                v-for="tag in taskStore.customTags"
                :key="tag.id"
                class="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50"
              >
                <span 
                  class="w-4 h-4 rounded-full flex-shrink-0" 
                  :style="{ backgroundColor: getColorHex(tag.color) }"
                ></span>
                <span class="flex-1 text-gray-200 font-medium">{{ tag.name }}</span>
                <UButton
                  icon="i-heroicons-trash"
                  size="xs"
                  color="red"
                  variant="ghost"
                  @click="taskStore.deleteTag(tag.id)"
                />
              </li>
            </ul>
          </div>
          <div v-else class="text-center py-4 text-gray-500">
            <UIcon name="i-heroicons-tag" class="w-8 h-8 mx-auto mb-2" />
            <p>No tags yet. Create your first tag above!</p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              color="gray"
              variant="ghost"
              label="Close"
              @click="isTagManagerOpen = false"
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

    <!-- Delete Multiple Confirmation Modal -->
    <UModal v-model="isDeleteMultipleModalOpen">
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
          <h3 class="text-lg font-semibold text-red-400">Delete {{ selectedCompletedTasks.length }} Tasks</h3>
        </template>

        <p class="text-gray-300">
          Are you sure you want to delete <strong class="text-gray-100">{{ selectedCompletedTasks.length }} completed tasks</strong>?
        </p>
        <p class="text-sm text-gray-500 mt-2">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="gray"
              variant="ghost"
              label="Cancel"
              @click="isDeleteMultipleModalOpen = false"
            />
            <UButton
              color="red"
              :label="`Delete ${selectedCompletedTasks.length} Tasks`"
              @click="deleteSelectedTasks"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </UCard>
</template>

<script setup lang="ts">
import type { Task, LocalTask, CustomTag, TagColor } from '~/types'
import { TAG_COLORS } from '~/types'
import draggable from 'vuedraggable'

const taskStore = useTaskStore()
const timerStore = useTimerStore()
const { miniConfetti, celebrationConfetti } = useConfetti()

// Modal State
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isDeleteMultipleModalOpen = ref(false)
const isTagManagerOpen = ref(false)
const taskTitle = ref('')
const selectedTags = ref<string[]>([])
const editingTask = ref<Task | LocalTask | null>(null)
const taskToDelete = ref<Task | LocalTask | null>(null)

// Multiselect State for Completed Tasks
const isMultiselectMode = ref(false)
const selectedCompletedTasks = ref<string[]>([])

// Tag Manager State
const newTagName = ref('')
const newTagColor = ref<TagColor>('blue')

// Expanded Task State (for viewing subtasks)
const expandedTaskId = ref<string | null>(null)

// New Subtask Input
const newSubtaskTitle = ref('')

// Local copy of pending tasks for drag & drop
const pendingTasksLocal = ref<(Task | LocalTask)[]>([])

// Confetti state
const checkboxRefs = ref<Map<string, HTMLElement>>(new Map())

// Set checkbox ref for confetti positioning
function setCheckboxRef(taskId: string, el: HTMLElement | null) {
  if (el) {
    checkboxRefs.value.set(taskId, el)
  } else {
    checkboxRefs.value.delete(taskId)
  }
}

// Handle task completion with confetti
async function handleTaskComplete(task: Task | LocalTask, completed: boolean) {
  if (completed) {
    // Get the checkbox element for confetti positioning
    const checkboxEl = checkboxRefs.value.get(task.id)
    
    // Trigger mini confetti at checkbox position
    miniConfetti(checkboxEl)
    
    // Complete the task
    await taskStore.toggleComplete(task.id)
    
    // Check if all tasks are completed (for celebration)
    await nextTick()
    checkForCelebration()
  } else {
    // Just uncomplete the task (no confetti)
    await taskStore.toggleComplete(task.id)
  }
}

// Check if all tasks are completed for big celebration
function checkForCelebration() {
  const activeFilter = taskStore.activeTagFilter
  
  if (activeFilter) {
    // Check if all tasks with this tag are completed
    const tasksWithTag = taskStore.tasks.filter(t => t.tags?.includes(activeFilter))
    const allCompleted = tasksWithTag.length > 0 && tasksWithTag.every(t => t.is_completed)
    
    if (allCompleted) {
      celebrationConfetti()
    }
  } else {
    // Check if all tasks are completed
    const allCompleted = taskStore.tasks.length > 0 && taskStore.tasks.every(t => t.is_completed)
    
    if (allCompleted) {
      celebrationConfetti()
    }
  }
}

// Sync pendingTasksLocal with store
watch(() => taskStore.pendingTasks, (newTasks) => {
  pendingTasksLocal.value = [...newTasks]
}, { immediate: true, deep: true })

// Handle drag end - save new order
async function onDragEnd() {
  const taskIds = pendingTasksLocal.value.map(t => t.id)
  await taskStore.reorderTasks(taskIds)
}

// Get color hex value
function getColorHex(color: TagColor): string {
  const colorDef = TAG_COLORS.find(c => c.value === color)
  return colorDef?.hex || '#6b7280'
}

// Get all pending tasks count (unfiltered)
function getAllPendingTasksCount(): number {
  return taskStore.tasks.filter(task => !task.is_completed).length
}

// Get task count for a specific tag (all pending tasks, unfiltered)
function getTaskCountForTag(tagId: string): number {
  // Use tasks directly (not filtered) to always show correct count
  return taskStore.tasks.filter(task =>
    !task.is_completed && task.tags?.includes(tagId)
  ).length
}

// Get tag name by ID
function getTagName(tagId: string): string {
  const tag = taskStore.getTagById(tagId)
  return tag?.name || 'Unknown'
}

// Get tag text color (for contrast)
function getTagTextColor(tagId: string): string {
  const tag = taskStore.getTagById(tagId)
  if (!tag) return '#ffffff'
  return '#ffffff'
}

// Get tag style for display
function getTagStyle(tagId: string): Record<string, string> {
  const tag = taskStore.getTagById(tagId)
  if (!tag) return { backgroundColor: '#374151', color: '#9ca3af' }
  
  const hex = getColorHex(tag.color)
  return {
    backgroundColor: hex + '30', // 30% opacity
    color: hex,
    borderLeft: `3px solid ${hex}`
  }
}

// Get tag button style for selection
function getTagButtonStyle(tag: CustomTag, isSelected: boolean): Record<string, string> {
  const hex = getColorHex(tag.color)
  if (isSelected) {
    return {
      backgroundColor: hex,
      color: '#ffffff',
      ringColor: hex
    }
  }
  return {
    backgroundColor: hex + '20',
    color: hex
  }
}

// Get filter button style
function getFilterButtonStyle(tag: CustomTag, isSelected: boolean): Record<string, string> {
  const hex = getColorHex(tag.color)
  if (isSelected) {
    return {
      backgroundColor: hex,
      color: '#ffffff',
      ringColor: hex
    }
  }
  return {
    backgroundColor: hex + '25',
    color: hex
  }
}

// Toggle tag selection
function toggleTagSelection(tagId: string) {
  const index = selectedTags.value.indexOf(tagId)
  if (index === -1) {
    selectedTags.value.push(tagId)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

// Create new tag
function createNewTag() {
  if (!newTagName.value.trim()) return
  taskStore.createTag(newTagName.value.trim(), newTagColor.value)
  newTagName.value = ''
  newTagColor.value = 'blue'
}

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
  // Pre-select the active tag filter if one is set
  selectedTags.value = taskStore.activeTagFilter
    ? [taskStore.activeTagFilter]
    : []
  isModalOpen.value = true
}

// Open Edit Modal
function openEditModal(task: Task | LocalTask) {
  editingTask.value = task
  taskTitle.value = task.title
  selectedTags.value = [...(task.tags || [])]
  isModalOpen.value = true
}

// Close Modal
function closeModal() {
  isModalOpen.value = false
  editingTask.value = null
  taskTitle.value = ''
  selectedTags.value = []
}

// Save Task (Add or Edit)
async function saveTask() {
  if (!taskTitle.value.trim()) return

  if (editingTask.value) {
    await taskStore.updateTask(editingTask.value.id, {
      title: taskTitle.value.trim(),
      tags: selectedTags.value
    })
  } else {
    await taskStore.addTask(taskTitle.value.trim(), selectedTags.value)
  }

  closeModal()
}

// Toggle Active State and auto-start timer
async function toggleActive(task: Task | LocalTask) {
  if (task.is_active) {
    // Deactivate task
    await taskStore.setActiveTask(null)
  } else {
    // Activate task and start timer
    await taskStore.setActiveTask(task.id)
    
    // Auto-start timer if not already running
    if (!timerStore.isRunning) {
      // Switch to focus mode if in break
      if (timerStore.currentMode !== 'focus') {
        timerStore.setMode('focus')
      }
      timerStore.setRunning(true)
    }
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

// ==================== Multiselect Functions ====================

// Enter multiselect mode
function enterMultiselectMode() {
  isMultiselectMode.value = true
  selectedCompletedTasks.value = []
}

// Exit multiselect mode
function exitMultiselectMode() {
  isMultiselectMode.value = false
  selectedCompletedTasks.value = []
}

// Toggle task selection
function toggleTaskSelection(taskId: string) {
  const index = selectedCompletedTasks.value.indexOf(taskId)
  if (index === -1) {
    selectedCompletedTasks.value.push(taskId)
  } else {
    selectedCompletedTasks.value.splice(index, 1)
  }
}

// Toggle select all
function toggleSelectAll() {
  if (selectedCompletedTasks.value.length === taskStore.completedTasks.length) {
    // Deselect all
    selectedCompletedTasks.value = []
  } else {
    // Select all
    selectedCompletedTasks.value = taskStore.completedTasks.map(t => t.id)
  }
}

// Confirm delete selected
function confirmDeleteSelected() {
  if (selectedCompletedTasks.value.length === 0) return
  isDeleteMultipleModalOpen.value = true
}

// Delete selected tasks
async function deleteSelectedTasks() {
  if (selectedCompletedTasks.value.length === 0) return
  
  await taskStore.deleteTasks(selectedCompletedTasks.value)
  
  // Reset state
  selectedCompletedTasks.value = []
  isMultiselectMode.value = false
  isDeleteMultipleModalOpen.value = false
}
</script>

