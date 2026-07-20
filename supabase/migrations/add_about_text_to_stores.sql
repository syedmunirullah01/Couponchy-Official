-- Run this in your Supabase SQL Editor
-- Adds about_text, faq_4, and faq_5 columns to the stores table

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS about_text TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS faq_4_question TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS faq_4_answer TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS faq_5_question TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS faq_5_answer TEXT DEFAULT '';
