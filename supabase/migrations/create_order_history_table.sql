-- Create order_history table to store timeline events for orders
CREATE TABLE IF NOT EXISTS order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  created_by BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL,
  created_by_name TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc', now())
);

-- Index for quick lookup by order
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);

-- Index for sorting by creation time
CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON order_history(created_at DESC);

-- Enable updated timestamps for manual inserts (no trigger needed as rows are immutable)
COMMENT ON TABLE order_history IS 'Timeline of order changes for the task details history block.';
