-- Create project_members table
-- This table stores the relationship between projects and team members
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_telegram_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  role TEXT DEFAULT 'Участник',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT project_members_unique UNIQUE (project_id, member_telegram_id)
);

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);

-- Create index on member_telegram_id for faster queries
CREATE INDEX IF NOT EXISTS idx_project_members_member_telegram_id ON project_members(member_telegram_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_project_members_updated_at();
