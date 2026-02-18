-- Migration: Add Categories
-- Created: 2026-02-06
-- Description: Add categories table and relationship to tasks

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#a855f7',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint: one category name per user
  CONSTRAINT unique_category_name_per_user UNIQUE (user_id, name)
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Add category_id to tasks table
ALTER TABLE tasks
ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index on category_id
CREATE INDEX IF NOT EXISTS tasks_category_id_idx ON tasks(category_id);

-- Add trigger to auto-update updated_at for categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories for new users (optional)
-- This would typically be done via a trigger or in application code
-- Example:
-- CREATE FUNCTION create_default_categories()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO categories (user_id, name, color, icon)
--   VALUES
--     (NEW.id, 'Work', '#3b82f6', '💼'),
--     (NEW.id, 'Personal', '#10b981', '🏠'),
--     (NEW.id, 'Shopping', '#f59e0b', '🛒');
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER create_default_categories_trigger
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION create_default_categories();

-- Comments
COMMENT ON TABLE categories IS 'User-defined task categories';
COMMENT ON COLUMN categories.color IS 'Hex color code for category display';
COMMENT ON COLUMN categories.icon IS 'Emoji or icon identifier';
