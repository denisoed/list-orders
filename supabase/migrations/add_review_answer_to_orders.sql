-- Add review_answer column to orders table
-- This column stores the reason why an order was returned for revision

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS review_answer TEXT;

-- Add comment to document the column
COMMENT ON COLUMN orders.review_answer IS 'Reason why the order was returned for revision';
