-- Add time_zone column to users table to store preferred timezone for notifications
ALTER TABLE users
ADD COLUMN IF NOT EXISTS time_zone TEXT;

-- Document the new column purpose
COMMENT ON COLUMN users.time_zone IS 'Preferred IANA time zone identifier for formatting notifications.';
