-- Run this in your Supabase SQL Editor
-- Adds auto_renew column to the offers table
-- true  = no manual expiry was given at upload → cron will renew every 15 days
-- false = expiry date was manually set → cron will NOT renew this offer

ALTER TABLE offers
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT false;

-- Backfill: mark all existing offers that have no expiry date as auto_renew = true
UPDATE offers
SET auto_renew = true
WHERE (expiry_date IS NULL OR expiry_date = '');
