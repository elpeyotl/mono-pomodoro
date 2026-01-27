-- Migration: Add description and due_date columns to tasks table
-- Run this in Supabase SQL Editor

-- Add optional description field (TEXT for longer notes)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

-- Add optional due_date field (DATE only, no time component)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL;

-- Create index for due_date queries (for filtering/sorting by deadline)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;

-- Create index for overdue task queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_overdue ON tasks(user_id, due_date, is_completed)
WHERE due_date IS NOT NULL AND is_completed = FALSE;
