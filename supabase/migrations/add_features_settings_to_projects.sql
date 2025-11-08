-- Add features_settings column to projects table
-- This column stores project feature flags as JSONB
-- Example: { "requireReview": false, "otherFeature": false }

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS features_settings JSONB DEFAULT '{"requireReview": false}'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN projects.features_settings IS 'Project feature flags stored as JSONB. Default: requireReview is disabled';

