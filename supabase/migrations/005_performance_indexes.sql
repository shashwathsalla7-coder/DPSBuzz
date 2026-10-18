-- =====================================================
-- DPS BUZZ - Performance Optimization Indexes
-- Migration: 005_performance_indexes.sql
-- Purpose: Eliminates sequential table scans on like lookups,
--          class queries, leaderboard sorting, and user posts.
-- =====================================================

-- 1. Index likes by user_id
-- Crucial for instant check of liked posts for the current student
CREATE INDEX IF NOT EXISTS idx_likes_user_id 
  ON public.likes(user_id);

-- 2. Index comments by user_id
-- Speeds up student activity tracking and comment history
CREATE INDEX IF NOT EXISTS idx_comments_user_id 
  ON public.comments(user_id);

-- 3. Composite index on posts: user_id + created_at
-- Speeds up profile post grids and author-specific feeds
CREATE INDEX IF NOT EXISTS idx_posts_user_created 
  ON public.posts(user_id, created_at DESC);

-- 4. Composite index on profiles: class + section
-- Speeds up class-filtered feeds, classmate searches, and class star boards
CREATE INDEX IF NOT EXISTS idx_profiles_class_section 
  ON public.profiles(class, section);

-- 5. Index on profiles for leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_profiles_spirit_points 
  ON public.profiles(spirit_points DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_follower_count 
  ON public.profiles(follower_count DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
  ON public.profiles(created_at DESC);

-- 6. Index on stories for active story queries
CREATE INDEX IF NOT EXISTS idx_stories_active 
  ON public.stories(expires_at, created_at DESC);

-- 7. Notices table index (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notices') THEN
    CREATE INDEX IF NOT EXISTS idx_notices_created_at ON public.notices(created_at DESC);
  END IF;
END $$;
