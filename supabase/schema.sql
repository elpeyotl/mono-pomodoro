-- =====================================================
-- Focus App - Supabase Database Schema
-- =====================================================
-- Führe dieses Script im Supabase SQL Editor aus:
-- Dashboard > SQL Editor > New Query > Paste & Run
-- =====================================================

-- Tasks Tabelle erstellen
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtasks JSONB DEFAULT '[]'::jsonb,  -- Array von Subtasks als JSON
    is_completed BOOLEAN DEFAULT FALSE,
    pomodoro_count INTEGER DEFAULT 0,
    total_focus_time INTEGER DEFAULT 0,  -- Gesamte Focus-Zeit in Sekunden
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Falls Tabelle bereits existiert, neue Spalten hinzufügen
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS total_focus_time INTEGER DEFAULT 0;
-- Falls notes-Spalte existiert und entfernt werden soll:
-- ALTER TABLE tasks DROP COLUMN IF EXISTS notes;

-- Row Level Security aktivieren
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Bestehende Policies löschen (falls vorhanden)
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Policy: User kann nur eigene Tasks sehen
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: User kann eigene Tasks erstellen
CREATE POLICY "Users can create own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: User kann eigene Tasks aktualisieren
CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: User kann eigene Tasks löschen
CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(is_active) WHERE is_active = TRUE;

-- Trigger-Funktion für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für automatisches updated_at Update
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Verifizierung: Zeige erstellte Tabelle
-- =====================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
