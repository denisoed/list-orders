-- Create projects table
-- This table stores project information for users
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT,
  completed INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT projects_title_not_empty CHECK (char_length(trim(title)) > 0)
);

-- Create index on user_telegram_id for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_telegram_id ON projects(user_telegram_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Note: Row Level Security (RLS) is disabled by default.
-- Security is enforced at the application level by checking user_telegram_id in API endpoints.
-- If you want to enable RLS, you can create policies based on your authentication setup.
