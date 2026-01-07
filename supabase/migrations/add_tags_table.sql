-- Create tags table for user-defined tags
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique tag names per user
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tags
CREATE POLICY "Users can view own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own tags
CREATE POLICY "Users can insert own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tags
CREATE POLICY "Users can update own tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own tags
CREATE POLICY "Users can delete own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
