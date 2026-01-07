import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { Task, LocalTask, Subtask, TaskTag } from '~/types'

export const useTaskStore = defineStore('tasks', () => {
  // Lokale Tasks werden in localStorage gespeichert (Guest Mode)
  const localTasks = useStorage<LocalTask[]>('focus-app-tasks', [])
  
  // Supabase User (wird von @nuxtjs/supabase bereitgestellt)
  const user = useSupabaseUser()
  const supabase = useSupabaseClient() as any // Type assertion for untyped Supabase
  
  // Supabase Tasks (für eingeloggte User)
  const supabaseTasks = ref<Task[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Tag-Filter (null = alle anzeigen)
  const activeTagFilter = useStorage<TaskTag | null>('focus-app-tag-filter', null)

  // Computed: Aktive Datenquelle basierend auf Auth-Status
  const rawTasks = computed(() => {
    if (user.value) {
      return supabaseTasks.value
    }
    return localTasks.value as Task[]
  })

  // Computed: Sortierte Tasks (aktiver Task oben, dann nach Erstellungsdatum)
  const tasks = computed(() => {
    const sorted = [...rawTasks.value].sort((a, b) => {
      // Aktiver Task immer oben
      if (a.is_active && !b.is_active) return -1
      if (!a.is_active && b.is_active) return 1
      // Dann nach Erstellungsdatum (neueste zuerst)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return sorted
  })

  // Computed: Gefilterte Tasks nach Tag
  const filteredTasks = computed(() => {
    if (!activeTagFilter.value) {
      return tasks.value
    }
    return tasks.value.filter(task => task.tags?.includes(activeTagFilter.value!))
  })

  // Computed: Aktiver Task (für Timer-Verknüpfung)
  const activeTask = computed(() => {
    return tasks.value.find(task => task.is_active && !task.is_completed)
  })

  // Computed: Unerledigte Tasks (gefiltert)
  const pendingTasks = computed(() => {
    return filteredTasks.value.filter(task => !task.is_completed)
  })

  // Computed: Erledigte Tasks (gefiltert)
  const completedTasks = computed(() => {
    return filteredTasks.value.filter(task => task.is_completed)
  })

  // Tag-Filter setzen
  function setTagFilter(tag: TaskTag | null): void {
    activeTagFilter.value = tag
  }

  // Helper: UUID generieren
  function generateId(): string {
    return crypto.randomUUID()
  }

  // Helper: Aktuelles Datum als ISO String
  function now(): string {
    return new Date().toISOString()
  }

  // ==================== CRUD Operationen ====================

  // Task erstellen (mit optionalen Tags)
  async function addTask(title: string, tags: TaskTag[] = []): Promise<void> {
    if (!title.trim()) return

    const newTask: LocalTask = {
      id: generateId(),
      title: title.trim(),
      subtasks: [],
      tags: tags,
      is_completed: false,
      pomodoro_count: 0,
      total_focus_time: 0,
      is_active: false,
      created_at: now(),
      updated_at: now()
    }

    if (user.value) {
      // Supabase: Task mit user_id erstellen
      isLoading.value = true
      error.value = null
      
      try {
        const { data, error: supabaseError } = await supabase
          .from('tasks')
          .insert({
            ...newTask,
            user_id: user.value.id
          })
          .select()
          .single()

        if (supabaseError) throw supabaseError
        if (data) supabaseTasks.value.push(data as Task)
      } catch (e: any) {
        error.value = e.message
        console.error('Error adding task:', e)
      } finally {
        isLoading.value = false
      }
    } else {
      // localStorage: Task lokal speichern
      localTasks.value.push(newTask)
    }
  }

  // Task aktualisieren
  async function updateTask(id: string, updates: Partial<LocalTask>): Promise<void> {
    const updatedData = {
      ...updates,
      updated_at: now()
    }

    if (user.value) {
      isLoading.value = true
      error.value = null
      
      try {
        const { error: supabaseError } = await supabase
          .from('tasks')
          .update(updatedData)
          .eq('id', id)

        if (supabaseError) throw supabaseError
        
        // Lokalen State aktualisieren
        const index = supabaseTasks.value.findIndex(t => t.id === id)
        if (index !== -1) {
          supabaseTasks.value[index] = { ...supabaseTasks.value[index], ...updatedData }
        }
      } catch (e: any) {
        error.value = e.message
        console.error('Error updating task:', e)
      } finally {
        isLoading.value = false
      }
    } else {
      const index = localTasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        localTasks.value[index] = { ...localTasks.value[index], ...updatedData }
      }
    }
  }

  // Task löschen
  async function deleteTask(id: string): Promise<void> {
    if (user.value) {
      isLoading.value = true
      error.value = null
      
      try {
        const { error: supabaseError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id)

        if (supabaseError) throw supabaseError
        
        supabaseTasks.value = supabaseTasks.value.filter(t => t.id !== id)
      } catch (e: any) {
        error.value = e.message
        console.error('Error deleting task:', e)
      } finally {
        isLoading.value = false
      }
    } else {
      localTasks.value = localTasks.value.filter(t => t.id !== id)
    }
  }

  // Task als erledigt markieren
  async function toggleComplete(id: string): Promise<void> {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      await updateTask(id, { 
        is_completed: !task.is_completed,
        is_active: false // Erledigte Tasks können nicht aktiv sein
      })
    }
  }

  // Task als aktiv setzen (für Timer)
  async function setActiveTask(id: string | null): Promise<void> {
    // Zuerst alle Tasks deaktivieren
    for (const task of tasks.value) {
      if (task.is_active) {
        await updateTask(task.id, { is_active: false })
      }
    }
    
    // Dann den gewählten Task aktivieren
    if (id) {
      await updateTask(id, { is_active: true })
    }
  }

  // Pomodoro-Zähler erhöhen
  async function incrementPomodoro(id: string): Promise<void> {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      await updateTask(id, { pomodoro_count: task.pomodoro_count + 1 })
    }
  }

  // Focus-Zeit hinzufügen (in Sekunden)
  async function addFocusTime(id: string, seconds: number): Promise<void> {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      await updateTask(id, { total_focus_time: (task.total_focus_time || 0) + seconds })
    }
  }

  // ==================== Subtask Operationen ====================

  // Subtask hinzufügen
  async function addSubtask(taskId: string, title: string): Promise<void> {
    if (!title.trim()) return
    
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const newSubtask: Subtask = {
      id: generateId(),
      title: title.trim(),
      is_completed: false
    }

    const updatedSubtasks = [...task.subtasks, newSubtask]
    await updateTask(taskId, { subtasks: updatedSubtasks })
  }

  // Subtask löschen
  async function deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const updatedSubtasks = task.subtasks.filter(s => s.id !== subtaskId)
    await updateTask(taskId, { subtasks: updatedSubtasks })
  }

  // Subtask als erledigt markieren
  async function toggleSubtaskComplete(taskId: string, subtaskId: string): Promise<void> {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const updatedSubtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, is_completed: !s.is_completed } : s
    )
    await updateTask(taskId, { subtasks: updatedSubtasks })
  }

  // Subtask Titel aktualisieren
  async function updateSubtaskTitle(taskId: string, subtaskId: string, title: string): Promise<void> {
    if (!title.trim()) return
    
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const updatedSubtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, title: title.trim() } : s
    )
    await updateTask(taskId, { subtasks: updatedSubtasks })
  }

  // Computed: Subtask Fortschritt für einen Task
  function getSubtaskProgress(taskId: string): { completed: number; total: number } {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task || task.subtasks.length === 0) {
      return { completed: 0, total: 0 }
    }
    const completed = task.subtasks.filter(s => s.is_completed).length
    return { completed, total: task.subtasks.length }
  }

  // ==================== Supabase Sync ====================

  // Tasks von Supabase laden
  async function fetchTasks(): Promise<void> {
    if (!user.value) return

    isLoading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError
      supabaseTasks.value = (data || []) as Task[]
    } catch (e: any) {
      error.value = e.message
      console.error('Error fetching tasks:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Lokale Tasks zu Supabase migrieren (nach Login)
  async function syncLocalToSupabase(): Promise<{ synced: number; errors: number }> {
    if (!user.value || localTasks.value.length === 0) {
      return { synced: 0, errors: 0 }
    }

    let synced = 0
    let errors = 0

    for (const localTask of localTasks.value) {
      try {
        const { error: supabaseError } = await supabase
          .from('tasks')
          .insert({
            ...localTask,
            user_id: user.value.id
          })

        if (supabaseError) throw supabaseError
        synced++
      } catch (e) {
        console.error('Error syncing task:', e)
        errors++
      }
    }

    // Nach erfolgreicher Sync: lokale Tasks löschen und neu laden
    if (synced > 0) {
      localTasks.value = []
      await fetchTasks()
    }

    return { synced, errors }
  }

  // Prüfen ob lokale Tasks existieren (für Sync-Prompt)
  const hasLocalTasks = computed(() => localTasks.value.length > 0)

  // ==================== Watchers ====================

  // Bei User-Änderung Tasks laden
  watch(user, async (newUser) => {
    if (newUser) {
      await fetchTasks()
    } else {
      supabaseTasks.value = []
    }
  }, { immediate: true })

  // Tag zu einem Task hinzufügen/entfernen
  async function toggleTag(taskId: string, tag: TaskTag): Promise<void> {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const currentTags = task.tags || []
    const hasTag = currentTags.includes(tag)
    
    const updatedTags = hasTag
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    
    await updateTask(taskId, { tags: updatedTags })
  }

  return {
    // State
    tasks,
    filteredTasks,
    activeTask,
    pendingTasks,
    completedTasks,
    isLoading,
    error,
    hasLocalTasks,
    activeTagFilter,
    
    // Task Actions
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    setActiveTask,
    incrementPomodoro,
    addFocusTime,
    
    // Tag Actions
    setTagFilter,
    toggleTag,
    
    // Subtask Actions
    addSubtask,
    deleteSubtask,
    toggleSubtaskComplete,
    updateSubtaskTitle,
    getSubtaskProgress,
    
    // Sync Actions
    fetchTasks,
    syncLocalToSupabase
  }
})
