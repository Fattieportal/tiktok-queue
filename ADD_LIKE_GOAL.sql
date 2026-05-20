-- ADD_LIKE_GOAL.sql
-- Migration: add a nullable text column `like_goal` to `public.shops`

BEGIN;

-- Add column if it doesn't already exist (Postgres / Supabase)
ALTER TABLE IF EXISTS public.shops
  ADD COLUMN IF NOT EXISTS like_goal TEXT;

-- Helpful comment visible in some DB UIs
COMMENT ON COLUMN public.shops.like_goal IS 'Optional human-readable like goal shown by /api/like-goal (e.g. "100k likes — Win a giveaway")';

COMMIT;

-- Example: set a like-goal for a specific shop
-- UPDATE public.shops SET like_goal = '100k likes — Win a giveaway' WHERE name = 'mystery-box-nl';

-- To apply: paste this SQL into Supabase SQL editor (or run with psql against your database).
