-- Create table to track sent reminders for orders
CREATE TABLE IF NOT EXISTS order_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reminder_offset TEXT NOT NULL,
  target_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT order_reminder_logs_offset_check CHECK (
    reminder_offset IN ('15m', '30m', '1h', '2h', '3h', '6h', '12h', '1d', '2d')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_reminder_logs_unique
  ON order_reminder_logs(order_id, reminder_offset, target_datetime);

CREATE INDEX IF NOT EXISTS idx_order_reminder_logs_order_id
  ON order_reminder_logs(order_id);

CREATE INDEX IF NOT EXISTS idx_order_reminder_logs_target_datetime
  ON order_reminder_logs(target_datetime DESC);
