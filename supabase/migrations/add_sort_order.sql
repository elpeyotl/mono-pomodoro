-- Add sort_order column to tasks table for manual sorting
-- Run this in Supabase SQL Editor

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing tasks with sort_order based on created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) - 1 as rn
  FROM tasks
)
UPDATE tasks
SET sort_order = numbered.rn
FROM numbered
WHERE tasks.id = numbered.id;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(user_id, sort_order);
