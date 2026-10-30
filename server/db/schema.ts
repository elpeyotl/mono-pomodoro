import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

const tz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' })

// ==================== Better Auth ====================
// IDs sind UUIDs, damit die User-IDs aus Supabase (auth.users) 1:1 übernommen werden können.

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow()
})

export const session = pgTable('session', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: tz('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow()
}, t => [index('session_user_id_idx').on(t.userId)])

export const account = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: tz('access_token_expires_at'),
  refreshTokenExpiresAt: tz('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow()
}, t => [index('account_user_id_idx').on(t.userId)])

export const verification = pgTable('verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: tz('expires_at').notNull(),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow()
}, t => [index('verification_identifier_idx').on(t.identifier)])

// ==================== App-Tabellen (wie bisher in Supabase) ====================

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: date('due_date', { mode: 'string' }),
  subtasks: jsonb('subtasks').notNull().default(sql`'[]'::jsonb`),
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  isCompleted: boolean('is_completed').notNull().default(false),
  pomodoroCount: integer('pomodoro_count').notNull().default(0),
  totalFocusTime: integer('total_focus_time').notNull().default(0),
  isActive: boolean('is_active').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow()
}, t => [
  index('idx_tasks_user_id').on(t.userId),
  index('idx_tasks_sort_order').on(t.userId, t.sortOrder)
])

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 20 }).notNull().default('blue'),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow()
}, t => [uniqueIndex('tags_user_id_name_key').on(t.userId, t.name)])

export const focusSessions = pgTable('focus_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  durationSeconds: integer('duration_seconds').notNull(),
  startedAt: tz('started_at').notNull(),
  endedAt: tz('ended_at').notNull(),
  completedPomodoro: boolean('completed_pomodoro').notNull().default(false),
  createdAt: tz('created_at').notNull().defaultNow()
}, t => [index('idx_focus_sessions_started_at').on(t.userId, t.startedAt)])

export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  // numeric statt integer wäre sauberer; Supabase hatte integer, wir bleiben kompatibel
  focusDuration: integer('focus_duration').notNull().default(25),
  shortBreakDuration: integer('short_break_duration').notNull().default(5),
  longBreakDuration: integer('long_break_duration').notNull().default(15),
  longBreakInterval: integer('long_break_interval').notNull().default(4),
  autoStart: boolean('auto_start').notNull().default(true),
  soundEnabled: boolean('sound_enabled').notNull().default(true),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow()
})
