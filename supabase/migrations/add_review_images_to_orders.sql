-- Add review_images column to orders table
-- This column stores an array of image URLs from Supabase Storage uploaded during review submission

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS review_images text[] DEFAULT '{}';

-- Add comment to document the column
COMMENT ON COLUMN orders.review_images IS 'Array of image URLs stored in Supabase Storage uploaded during review submission';
