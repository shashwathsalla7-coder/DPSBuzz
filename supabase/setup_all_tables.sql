-- =====================================================
-- DPS BUZZ: COMPLETE DATABASE SETUP SCRIPT
-- Paste and run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xdvoeddebquguuqgyscl/sql/new
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. REALTIME CHAT MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT,
  chat_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Realtime publication for instant live chat delivery
ALTER TABLE public.messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own messages" ON public.messages
  FOR SELECT USING (auth.uid()::text = sender_id OR auth.uid()::text = recipient_id OR auth.role() = 'service_role');

CREATE POLICY "Users insert own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id OR auth.role() = 'service_role');

CREATE POLICY "Users update own messages" ON public.messages
  FOR UPDATE USING (auth.uid()::text = sender_id OR auth.role() = 'service_role');

CREATE POLICY "Users delete own messages" ON public.messages
  FOR DELETE USING (auth.uid()::text = sender_id OR auth.role() = 'service_role');

-- Index for instant chat querying
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at ON public.messages(chat_id, created_at ASC);

-- =====================================================
-- 2. USER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  class TEXT DEFAULT '8',
  section TEXT DEFAULT 'A',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin', 'moderator')),
  is_verified BOOLEAN DEFAULT false,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on profiles" ON public.profiles
  FOR UPDATE USING (true);

-- Insert Super Admin Profile
INSERT INTO public.profiles (username, full_name, role, class, section, bio, is_verified)
VALUES (
  'shashwath71845',
  'Shashwath Salla',
  'admin',
  'Staff',
  'Admin',
  'DPS Buzz Super Administrator 🛡️ • Full Systems & Moderation Access',
  true
)
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- 3. APP SETTINGS & INVITATION CODES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow public write on settings" ON public.app_settings
  FOR ALL USING (true);

INSERT INTO public.app_settings (key, value)
VALUES 
  ('invite_code', 'DPS71845'),
  ('school_code', 'DPS71845'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 4. GROUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  creator_username TEXT NOT NULL,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on groups" ON public.groups
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on groups" ON public.groups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on groups" ON public.groups
  FOR UPDATE USING (true);
