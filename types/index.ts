// Subtask Interface
export interface Subtask {
  id: string
  title: string
  is_completed: boolean
}

export interface Task {
  id: string
  user_id: string | null
  title: string
  subtasks: Subtask[]  // Checkliste mit Subtasks
  is_completed: boolean
  pomodoro_count: number
  total_focus_time: number  // Gesamte Focus-Zeit in Sekunden
  is_active: boolean
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
