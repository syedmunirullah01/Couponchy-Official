-- Run this in your Supabase SQL Editor
-- Adds sidebar_banner_image and sidebar_banner_url columns to the stores table

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS sidebar_banner_image TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS sidebar_banner_url TEXT DEFAULT '';
