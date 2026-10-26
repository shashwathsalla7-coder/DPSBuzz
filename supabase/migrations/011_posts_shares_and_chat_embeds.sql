-- =====================================================
-- DPS BUZZ - Additive Migration: Posts, Shares, Follows & Chat Embeds
-- Migration: 011_posts_shares_and_chat_embeds.sql
-- Additive only - Never drops or deletes any existing data
-- =====================================================

-- 1. EXTEND MESSAGES TABLE FOR POST SHARING IN CHATS
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS post_id TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS post_preview JSONB;

-- 2. EXTEND PROFILES TABLE FOR SEARCH, PRIVACY & APPROVALS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spirit_points INTEGER DEFAULT 50;

-- 3. CREATE POSTS TABLE (For Posts, Reposts & Feeds)
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower TEXT NOT NULL,
  following TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower, following)
);

-- 5. CREATE FOLLOW REQUESTS TABLE (For Private Profiles)
CREATE TABLE IF NOT EXISTS public.follow_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester, target)
);

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_posts_username_created ON public.posts(username, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following);
CREATE INDEX IF NOT EXISTS idx_follow_requests_target ON public.follow_requests(target);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester ON public.follow_requests(requester);
CREATE INDEX IF NOT EXISTS idx_messages_post_id ON public.messages(post_id);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Posts policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Anyone can view posts') THEN
    CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Anyone can insert posts') THEN
    CREATE POLICY "Anyone can insert posts" ON public.posts FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Anyone can update own posts') THEN
    CREATE POLICY "Anyone can update own posts" ON public.posts FOR UPDATE USING (true);
  END IF;

  -- Follows policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Anyone can view follows') THEN
    CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Anyone can insert follows') THEN
    CREATE POLICY "Anyone can insert follows" ON public.follows FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Anyone can delete follows') THEN
    CREATE POLICY "Anyone can delete follows" ON public.follows FOR DELETE USING (true);
  END IF;

  -- Follow Requests policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'Anyone can view follow requests') THEN
    CREATE POLICY "Anyone can view follow requests" ON public.follow_requests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'Anyone can insert follow requests') THEN
    CREATE POLICY "Anyone can insert follow requests" ON public.follow_requests FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'Anyone can update follow requests') THEN
    CREATE POLICY "Anyone can update follow requests" ON public.follow_requests FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follow_requests' AND policyname = 'Anyone can delete follow requests') THEN
    CREATE POLICY "Anyone can delete follow requests" ON public.follow_requests FOR DELETE USING (true);
  END IF;
END $$;

-- 8. RPC: GET SHARED POST PREVIEW (Safe, fast thumbnail fetch for chat embeds)
CREATE OR REPLACE FUNCTION public.get_shared_post_preview(target_post_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'fullName', p.full_name,
    'avatar', p.user_avatar,
    'class', p.class,
    'caption', substring(p.caption from 1 for 120),
    'imageUrl', coalesce(p.image_url, CASE WHEN array_length(p.images, 1) > 0 THEN p.images[1] ELSE NULL END),
    'exists', true
  ) INTO result
  FROM public.posts p
  WHERE p.id = target_post_id;

  IF result IS NULL THEN
    RETURN jsonb_build_object('exists', false, 'reason', 'This post is no longer available');
  END IF;

  RETURN result;
END;
$$;
