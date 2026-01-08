import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { Task, LocalTask, Subtask, CustomTag, TagColor } from '~/types'

export const useTaskStore = defineStore('tasks', () => {
  // Lokale Tasks werden in localStorage gespeichert (Guest Mode)
  const localTasks = useStorage<LocalTask[]>('focus-app-tasks', [])
  
  // Benutzerdefinierte Tags (lokal für Guest Mode)
  const localTags = useStorage<CustomTag[]>('focus-app-custom-tags', [])
  
  // Supabase User (wird von @nuxtjs/supabase bereitgestellt)
  const user = useSupabaseUser()
  const supabase = useSupabaseClient() as any // Type assertion for untyped Supabase
  
  // Supabase Tasks und Tags (für eingeloggte User)
  const supabaseTasks = ref<Task[]>([])
  const supabaseTags = ref<CustomTag[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Tag-Filter (null = alle anzeigen)
  const activeTagFilter = useStorage<string | null>('focus-app-tag-filter', null)

  // Computed: Aktive Tags basierend auf Auth-Status
  const customTags = computed(() => {
    if (user.value) {
      return supabaseTags.value
    }
    return localTags.value
  })

  // Computed: Aktive Datenquelle basierend auf Auth-Status
  const rawTasks = computed(() => {
    if (user.value) {
      return supabaseTasks.value
    }
    return localTasks.value as Task[]
  })

  // Computed: Sortierte Tasks nach sort_order (manuelle Reihenfolge)
  const tasks = computed(() => {
    const sorted = [...rawTasks.value].sort((a, b) => {
      // Sortierung nach sort_order (niedrigere Werte zuerst)
      const orderA = a.sort_order ?? 999999
      const orderB = b.sort_order ?? 999999
      if (orderA !== orderB) return orderA - orderB
      // Fallback: nach Erstellungsdatum (neueste zuerst)
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
  function setTagFilter(tagId: string | null): void {
    activeTagFilter.value = tagId
  }

  // Helper: UUID generieren
  function generateId(): string {
    return crypto.randomUUID()
  }

  // Helper: Aktuelles Datum als ISO String
  function now(): string {
    return new Date().toISOString()
  }

  // ==================== Tag Operationen ====================

  // Tags von Supabase laden
  async function fetchTags(): Promise<void> {
    if (!user.value) return

    try {
      const { data, error: supabaseError } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: true })

      if (supabaseError) throw supabaseError
      supabaseTags.value = (data || []).map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color as TagColor
      }))
    } catch (e: any) {
      console.error('Error fetching tags:', e)
    }
  }

  // Neuen Tag erstellen
  async function createTag(name: string, color: TagColor): Promise<CustomTag> {
    const newTag: CustomTag = {
      id: generateId(),
      name: name.trim(),
      color
    }

    if (user.value) {
      // Supabase: Tag mit user_id erstellen
      try {
        const { data, error: supabaseError } = await supabase
          .from('tags')
          .insert({
            id: newTag.id,
            user_id: user.value.id,
            name: newTag.name,
            color: newTag.color
          })
          .select()
          .single()

        if (supabaseError) throw supabaseError
        if (data) {
          supabaseTags.value.push({
            id: data.id,
            name: data.name,
            color: data.color as TagColor
          })
        }
      } catch (e: any) {
        console.error('Error creating tag:', e)
      }
    } else {
      // localStorage: Tag lokal speichern
      localTags.value.push(newTag)
    }

    return newTag
  }

  // Tag löschen
  async function deleteTag(tagId: string): Promise<void> {
    if (user.value) {
      // Supabase: Tag löschen
      try {
        const { error: supabaseError } = await supabase
          .from('tags')
          .delete()
          .eq('id', tagId)

        if (supabaseError) throw supabaseError
        supabaseTags.value = supabaseTags.value.filter(t => t.id !== tagId)
      } catch (e: any) {
        console.error('Error deleting tag:', e)
      }

      // Tag auch von allen Tasks entfernen
      supabaseTasks.value = supabaseTasks.value.map(task => ({
        ...task,
        tags: task.tags?.filter(t => t !== tagId) || []
      }))
    } else {
      localTags.value = localTags.value.filter(t => t.id !== tagId)
      localTasks.value = localTasks.value.map(task => ({
        ...task,
        tags: task.tags?.filter(t => t !== tagId) || []
      }))
    }

    // Filter zurücksetzen wenn der gelöschte Tag aktiv war
    if (activeTagFilter.value === tagId) {
      activeTagFilter.value = null
    }
  }

  // Tag aktualisieren
  async function updateTag(tagId: string, updates: Partial<Omit<CustomTag, 'id'>>): Promise<void> {
    if (user.value) {
      try {
        const { error: supabaseError } = await supabase
          .from('tags')
          .update({
            ...updates,
            updated_at: now()
          })
          .eq('id', tagId)

        if (supabaseError) throw supabaseError

        const index = supabaseTags.value.findIndex(t => t.id === tagId)
        if (index !== -1) {
          supabaseTags.value[index] = { ...supabaseTags.value[index], ...updates }
        }
      } catch (e: any) {
        console.error('Error updating tag:', e)
      }
    } else {
      const index = localTags.value.findIndex(t => t.id === tagId)
      if (index !== -1) {
        localTags.value[index] = { ...localTags.value[index], ...updates }
      }
    }
  }

  // Tag nach ID finden
  function getTagById(tagId: string): CustomTag | undefined {
    return customTags.value.find(t => t.id === tagId)
  }

  // Lokale Tags zu Supabase migrieren (nach Login)
  async function syncLocalTagsToSupabase(): Promise<{ synced: number; errors: number }> {
    if (!user.value || localTags.value.length === 0) {
      return { synced: 0, errors: 0 }
    }

    let synced = 0
    let errors = 0

    for (const localTag of localTags.value) {
      try {
        const { error: supabaseError } = await supabase
          .from('tags')
          .insert({
            id: localTag.id,
            user_id: user.value.id,
            name: localTag.name,
            color: localTag.color
          })

        if (supabaseError) throw supabaseError
        synced++
      } catch (e) {
        console.error('Error syncing tag:', e)
        errors++
      }
    }

    // Nach erfolgreicher Sync: lokale Tags löschen und neu laden
    if (synced > 0) {
      localTags.value = []
      await fetchTags()
    }

    return { synced, errors }
  }

  // ==================== CRUD Operationen ====================

  // Helper: Nächste sort_order berechnen (am Anfang der Liste)
  function getNextSortOrder(): number {
    const allTasks = rawTasks.value
    if (allTasks.length === 0) return 0
    const minOrder = Math.min(...allTasks.map(t => t.sort_order ?? 0))
    return minOrder - 1
  }

  // Task erstellen (mit optionalen Tags)
  async function addTask(title: string, tags: string[] = []): Promise<void> {
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
      sort_order: getNextSortOrder(),
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
      // Wenn der Task aktiv ist und als completed markiert wird,
      // speichere die aktuelle Focus-Zeit vom Timer
      if (task.is_active && !task.is_completed) {
        const timerStore = useTimerStore()
        
        // Nur speichern wenn wir im Focus-Modus sind und der Timer läuft oder gelaufen ist
        if (timerStore.currentMode === 'focus') {
          const elapsedTime = timerStore.getElapsedFocusTime()
          if (elapsedTime > 0) {
            // Focus-Zeit zum Task hinzufügen
            await addFocusTime(id, elapsedTime)
          }
          // Timer-Session zurücksetzen
          timerStore.resetSession()
          // Timer stoppen
          timerStore.setRunning(false)
        }
      }
      
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

  // Lokale Tasks und Tags zu Supabase migrieren (nach Login)
  async function syncLocalToSupabase(): Promise<{ synced: number; errors: number }> {
    if (!user.value) {
      return { synced: 0, errors: 0 }
    }

    let synced = 0
    let errors = 0

    // Zuerst Tags synchronisieren
    const tagResult = await syncLocalTagsToSupabase()
    synced += tagResult.synced
    errors += tagResult.errors

    // Dann Tasks synchronisieren
    if (localTasks.value.length > 0) {
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
      if (synced > tagResult.synced) {
        localTasks.value = []
        await fetchTasks()
      }
    }

    return { synced, errors }
  }

  // Prüfen ob lokale Tasks existieren (für Sync-Prompt)
  const hasLocalTasks = computed(() => localTasks.value.length > 0)

  // ==================== Watchers ====================

  // Bei User-Änderung Tasks und Tags laden
  watch(user, async (newUser) => {
    if (newUser) {
      await Promise.all([fetchTasks(), fetchTags()])
    } else {
      supabaseTasks.value = []
      supabaseTags.value = []
    }
  }, { immediate: true })

  // Tag zu einem Task hinzufügen/entfernen
  async function toggleTaskTag(taskId: string, tagId: string): Promise<void> {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const currentTags = task.tags || []
    const hasTag = currentTags.includes(tagId)
    
    const updatedTags = hasTag
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId]
    
    await updateTask(taskId, { tags: updatedTags })
  }

  // ==================== Drag & Drop Sortierung ====================

  // Tasks neu sortieren nach Drag & Drop
  async function reorderTasks(reorderedTaskIds: string[]): Promise<void> {
    // Neue sort_order Werte zuweisen
    const updates: { id: string; sort_order: number }[] = reorderedTaskIds.map((id, index) => ({
      id,
      sort_order: index
    }))

    if (user.value) {
      // Supabase: Batch-Update
      isLoading.value = true
      error.value = null
      
      try {
        for (const update of updates) {
          const { error: supabaseError } = await supabase
            .from('tasks')
            .update({ sort_order: update.sort_order, updated_at: now() })
            .eq('id', update.id)

          if (supabaseError) throw supabaseError
        }
        
        // Lokalen State aktualisieren
        for (const update of updates) {
          const index = supabaseTasks.value.findIndex(t => t.id === update.id)
          if (index !== -1) {
            supabaseTasks.value[index] = {
              ...supabaseTasks.value[index],
              sort_order: update.sort_order,
              updated_at: now()
            }
          }
        }
      } catch (e: any) {
        error.value = e.message
        console.error('Error reordering tasks:', e)
      } finally {
        isLoading.value = false
      }
    } else {
      // localStorage: Direkt aktualisieren
      for (const update of updates) {
        const index = localTasks.value.findIndex(t => t.id === update.id)
        if (index !== -1) {
          localTasks.value[index] = {
            ...localTasks.value[index],
            sort_order: update.sort_order,
            updated_at: now()
          }
        }
      }
    }
  }

  // Prüfen ob lokale Tags existieren (für Sync-Prompt)
  const hasLocalTags = computed(() => localTags.value.length > 0)

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
    hasLocalTags,
    activeTagFilter,
    customTags,
    
    // Task Actions
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    setActiveTask,
    incrementPomodoro,
    addFocusTime,
    reorderTasks,
    
    // Tag Actions
    setTagFilter,
    toggleTaskTag,
    createTag,
    deleteTag,
    updateTag,
    getTagById,
    fetchTags,
    
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
