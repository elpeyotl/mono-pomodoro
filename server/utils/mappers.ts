// Die API spricht weiterhin snake_case wie früher Supabase, damit Typen und Stores gleich bleiben.
import type { InferSelectModel } from 'drizzle-orm'
import type { tasks, tags, focusSessions } from '../db/schema'

type TaskRow = InferSelectModel<typeof tasks>
type TagRow = InferSelectModel<typeof tags>
type SessionRow = InferSelectModel<typeof focusSessions>

export function taskToApi(t: TaskRow) {
  return {
    id: t.id,
    user_id: t.userId,
    title: t.title,
    description: t.description,
    due_date: t.dueDate,
    subtasks: t.subtasks,
    tags: t.tags,
    is_completed: t.isCompleted,
    pomodoro_count: t.pomodoroCount,
    total_focus_time: t.totalFocusTime,
    is_active: t.isActive,
    sort_order: t.sortOrder,
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString()
  }
}

export function tagToApi(t: TagRow) {
  return { id: t.id, name: t.name, color: t.color }
}

export function sessionToApi(s: SessionRow) {
  return {
    id: s.id,
    user_id: s.userId,
    task_id: s.taskId,
    duration_seconds: s.durationSeconds,
    started_at: s.startedAt.toISOString(),
    ended_at: s.endedAt.toISOString(),
    completed_pomodoro: s.completedPomodoro,
    created_at: s.createdAt.toISOString()
  }
}

const toDate = (v: unknown) => (typeof v === 'string' || v instanceof Date ? new Date(v) : undefined)

// Nur bekannte Felder übernehmen (Whitelist). user_id kommt nie vom Client.
export function taskFromApi(body: Record<string, any>) {
  const out: Record<string, unknown> = {}
  if ('title' in body) out.title = String(body.title).trim()
  if ('description' in body) out.description = body.description ?? null
  if ('due_date' in body) out.dueDate = body.due_date || null
  if ('subtasks' in body) out.subtasks = Array.isArray(body.subtasks) ? body.subtasks : []
  if ('tags' in body) out.tags = Array.isArray(body.tags) ? body.tags.map(String) : []
  if ('is_completed' in body) out.isCompleted = Boolean(body.is_completed)
  if ('pomodoro_count' in body) out.pomodoroCount = Number(body.pomodoro_count) || 0
  if ('total_focus_time' in body) out.totalFocusTime = Math.round(Number(body.total_focus_time) || 0)
  if ('is_active' in body) out.isActive = Boolean(body.is_active)
  if ('sort_order' in body) out.sortOrder = Math.round(Number(body.sort_order) || 0)
  if ('created_at' in body) out.createdAt = toDate(body.created_at)
  return out
}
