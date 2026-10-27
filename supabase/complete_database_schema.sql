-- =====================================================
-- DPS BUZZ: COMPLETE LIVE DATABASE SCHEMA
-- Migration: complete_database_schema.sql
-- Paste and run in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xdvoeddebquguuqgyscl/sql/new
-- Safe & Additive: Never drops or overwrites existing tables or user data
-- =====================================================

-- 0. Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Extend Profiles Table (Privacy, Approvals, Spirit Points)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spirit_points INTEGER DEFAULT 50;

-- 2. Extend Messages Table (Post Embeds & Types)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS post_id TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS post_preview JSONB;

-- 3. Core Posts Table (Posts, Reposts, Habit Badges, Music, Photo Grid)
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  user_avatar TEXT,
  class TEXT,
  caption TEXT DEFAULT '',
  image_url TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  song JSONB,
  habit_category TEXT,
  habit_tag TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  is_repost BOOLEAN DEFAULT false,
  reposted_from JSONB,
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  username TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Likes Table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, username)
);

-- 6. Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower TEXT NOT NULL,
  following TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower, following)
);

-- 7. Follow Requests Table (For Private Accounts)
CREATE TABLE IF NOT EXISTS public.follow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester, target)
);

-- 8. Stories Table (24-hour Auto-Expiring Stories)
CREATE TABLE IF NOT EXISTS public.stories (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  username TEXT NOT NULL,
  media_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Saved Posts Table
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(username, post_id)
);

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  recipient_username TEXT,
  actor_username TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. High Performance Database Indexes
CREATE INDEX IF NOT EXISTS idx_posts_username_created ON public.posts(username, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_username ON public.likes(username);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following);
CREATE INDEX IF NOT EXISTS idx_follow_requests_target ON public.follow_requests(target);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester ON public.follow_requests(requester);
CREATE INDEX IF NOT EXISTS idx_stories_username_expires ON public.stories(username, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_posts_username ON public.saved_posts(username);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

-- 12. Enable Row Level Security (RLS) & Add Permissions
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Allow select on posts') THEN
    CREATE POLICY "Allow select on posts" ON public.posts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Allow insert on posts') THEN
    CREATE POLICY "Allow insert on posts" ON public.posts FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Allow update on posts') THEN
    CREATE POLICY "Allow update on posts" ON public.posts FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Allow delete on posts') THEN
    CREATE POLICY "Allow delete on posts" ON public.posts FOR DELETE USING (true);
  END IF;

  -- Comments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Allow select on comments') THEN
    CREATE POLICY "Allow select on comments" ON public.comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Allow insert on comments') THEN
    CREATE POLICY "Allow insert on comments" ON public.comments FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Allow delete on comments') THEN
    CREATE POLICY "Allow delete on comments" ON public.comments FOR DELETE USING (true);
  END IF;

  -- Likes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Allow select on likes') THEN
    CREATE POLICY "Allow select on likes" ON public.likes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Allow insert on likes') THEN
    CREATE POLICY "Allow insert on likes" ON public.likes FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Allow delete on likes') THEN
    CREATE POLICY "Allow delete on likes" ON public.likes FOR DELETE USING (true);
  END IF;

  -- Follows
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Allow select on follows') THEN
    CREATE POLICY "Allow select on follows" ON public.follows FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Allow insert on follows') THEN
    CREATE POLICY "Allow insert on follows" ON public.follows FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Allow delete on follows') THEN
    CREATE POLICY "Allow delete on follows" ON public.follows FOR DELETE USING (true);
  END IF;

  -- Follow Requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'Allow select on follow_requests') THEN
    CREATE POLICY "Allow select on follow_requests" ON public.follow_requests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'Allow insert on follow_requests') THEN
    CREATE POLICY "Allow insert on follow_requests" ON public.follow_requests FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'Allow update on follow_requests') THEN
    CREATE POLICY "Allow update on follow_requests" ON public.follow_requests FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'Allow delete on follow_requests') THEN
    CREATE POLICY "Allow delete on follow_requests" ON public.follow_requests FOR DELETE USING (true);
  END IF;

  -- Stories
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Allow select on stories') THEN
    CREATE POLICY "Allow select on stories" ON public.stories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Allow insert on stories') THEN
    CREATE POLICY "Allow insert on stories" ON public.stories FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Allow delete on stories') THEN
    CREATE POLICY "Allow delete on stories" ON public.stories FOR DELETE USING (true);
  END IF;

  -- Saved Posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_posts' AND policyname = 'Allow select on saved_posts') THEN
    CREATE POLICY "Allow select on saved_posts" ON public.saved_posts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_posts' AND policyname = 'Allow insert on saved_posts') THEN
    CREATE POLICY "Allow insert on saved_posts" ON public.saved_posts FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_posts' AND policyname = 'Allow delete on saved_posts') THEN
    CREATE POLICY "Allow delete on saved_posts" ON public.saved_posts FOR DELETE USING (true);
  END IF;

  -- Notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Allow select on notifications') THEN
    CREATE POLICY "Allow select on notifications" ON public.notifications FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Allow insert on notifications') THEN
    CREATE POLICY "Allow insert on notifications" ON public.notifications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Allow update on notifications') THEN
    CREATE POLICY "Allow update on notifications" ON public.notifications FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Allow delete on notifications') THEN
    CREATE POLICY "Allow delete on notifications" ON public.notifications FOR DELETE USING (true);
  END IF;
END $$;

-- 13. Enable Realtime Publications
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.follows REPLICA IDENTITY FULL;
ALTER TABLE public.follow_requests REPLICA IDENTITY FULL;
ALTER TABLE public.stories REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'likes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'follows') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'follow_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_requests;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'stories') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
