-- Add image_urls column to orders table
-- This column stores an array of image URLs from Supabase Storage

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- Add comment to document the column
COMMENT ON COLUMN orders.image_urls IS 'Array of image URLs stored in Supabase Storage for this order';

