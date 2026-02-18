-- Migration: Initial Schema
-- Created: 2026-02-06
-- Description: Create tasks table with RLS policies

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);

-- Create index on completed status
CREATE INDEX IF NOT EXISTS tasks_completed_idx ON tasks(completed);

-- Create index on due_date for sorting
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own tasks
CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for task statistics (per user)
CREATE OR REPLACE VIEW task_stats AS
SELECT
  user_id,
  COUNT(*) AS total_tasks,
  COUNT(*) FILTER (WHERE completed = true) AS completed_tasks,
  COUNT(*) FILTER (WHERE completed = false) AS incomplete_tasks,
  COUNT(*) FILTER (WHERE priority = 'high') AS high_priority_tasks,
  COUNT(*) FILTER (WHERE priority = 'medium') AS medium_priority_tasks,
  COUNT(*) FILTER (WHERE priority = 'low') AS low_priority_tasks
FROM tasks
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON task_stats TO authenticated;

-- Comments for documentation
COMMENT ON TABLE tasks IS 'User tasks with completion tracking';
COMMENT ON COLUMN tasks.user_id IS 'Owner of the task (references auth.users)';
COMMENT ON COLUMN tasks.priority IS 'Task priority: low, medium, or high';
COMMENT ON COLUMN tasks.due_date IS 'Optional due date for the task';
