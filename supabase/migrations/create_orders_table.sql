-- Create orders table
-- This table stores order information for projects
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_telegram_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'new',
  assignee_telegram_id BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  payment_type TEXT,
  prepayment_amount DECIMAL(12, 2),
  total_amount DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT orders_code_not_empty CHECK (char_length(trim(code)) > 0),
  CONSTRAINT orders_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT orders_client_name_not_empty CHECK (char_length(trim(client_name)) > 0),
  CONSTRAINT orders_client_phone_not_empty CHECK (char_length(trim(client_phone)) > 0)
);

-- Create unique index on code
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_code ON orders(code);

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_project_id ON orders(project_id);

-- Create index on user_telegram_id for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_user_telegram_id ON orders(user_telegram_id);

-- Create index on assignee_telegram_id for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_assignee_telegram_id ON orders(assignee_telegram_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Note: Row Level Security (RLS) is disabled by default.
-- Security is enforced at the application level by checking user_telegram_id in API endpoints.
-- If you want to enable RLS, you can create policies based on your authentication setup.
