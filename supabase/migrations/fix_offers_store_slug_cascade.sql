-- Run this in your Supabase SQL Editor to fix Foreign Key constraint for updating/deleting store slugs

-- 1. Drop existing restrictive foreign key constraint if present
ALTER TABLE offers
DROP CONSTRAINT IF EXISTS offers_store_slug_fkey;

-- 2. Add foreign key constraint with ON UPDATE CASCADE and ON DELETE CASCADE
ALTER TABLE offers
ADD CONSTRAINT offers_store_slug_fkey
FOREIGN KEY (store_slug)
REFERENCES stores(slug)
ON UPDATE CASCADE
ON DELETE CASCADE;
