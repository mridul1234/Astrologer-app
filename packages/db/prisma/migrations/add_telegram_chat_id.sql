-- ============================================================
-- Migration: Replace whatsappNumber → telegramChatId
-- Table: Astrologer
--
-- Run this on your production DB (Supabase SQL Editor):
--   1. Go to https://supabase.com → your project → SQL Editor
--   2. Paste this entire file and click "Run"
--
-- This renames the column so existing rows are preserved.
-- ============================================================

-- Step 1: Add the new column
ALTER TABLE "Astrologer"
  ADD COLUMN IF NOT EXISTS "telegramChatId" TEXT;

-- Step 2: Copy any existing data across (in case whatsappNumber had values)
UPDATE "Astrologer"
  SET "telegramChatId" = "whatsappNumber"
  WHERE "whatsappNumber" IS NOT NULL;

-- Step 3: Drop the old column
ALTER TABLE "Astrologer"
  DROP COLUMN IF EXISTS "whatsappNumber";

-- Done ✅
-- You can verify with:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'Astrologer';
