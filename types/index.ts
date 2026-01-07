// Subtask Interface
export interface Subtask {
  id: string
  title: string
  is_completed: boolean
}

// Benutzerdefinierte Tags
export type TagColor = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'indigo' | 'purple' | 'pink' | 'gray'

export interface CustomTag {
  id: string
  name: string
  color: TagColor
}

// Vordefinierte Farben für Tags
export const TAG_COLORS: { value: TagColor; label: string; hex: string }[] = [
  { value: 'red', label: 'Rot', hex: '#ef4444' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'yellow', label: 'Gelb', hex: '#eab308' },
  { value: 'green', label: 'Grün', hex: '#22c55e' },
  { value: 'teal', label: 'Türkis', hex: '#14b8a6' },
  { value: 'blue', label: 'Blau', hex: '#3b82f6' },
  { value: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { value: 'purple', label: 'Lila', hex: '#a855f7' },
  { value: 'pink', label: 'Pink', hex: '#ec4899' },
  { value: 'gray', label: 'Grau', hex: '#6b7280' }
]

export interface Task {
  id: string
  user_id: string | null
  title: string
  subtasks: Subtask[]  // Checkliste mit Subtasks
  tags: string[]       // Array von Tag-IDs
  is_completed: boolean
  pomodoro_count: number
  total_focus_time: number  // Gesamte Focus-Zeit in Sekunden
  is_active: boolean
  sort_order: number   // Manuelle Sortierreihenfolge (0, 1, 2, ...)
  created_at: string
  updated_at: string
}

export interface LocalTask extends Omit<Task, 'user_id'> {
  // Lokale Tasks haben keine user_id
}

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

export interface TimerSettings {
  focus: number      // in Minuten (default: 25)
  shortBreak: number // in Minuten (default: 5)
  longBreak: number  // in Minuten (default: 15)
}

export interface TimerState {
  mode: TimerMode
  timeRemaining: number // in Sekunden
  isRunning: boolean
  completedPomodoros: number
}
