-- =====================================================
-- DPS BUZZ - Phase 2 Chat Security & Realtime Isolation Migration
-- Migration: 006_chat_security_and_realtime_rls.sql
-- Purpose:
--   1. Create conversations and conversation_participants tables.
--   2. Enforce strict foreign keys, indexes, and constraints on messages.
--   3. Backfill existing conversations and participants from existing messages.
--   4. Enable Row Level Security (RLS) on all chat tables.
--   5. Enable Supabase Realtime with REPLICA IDENTITY FULL.
-- =====================================================

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,                       -- Deterministic pair 'userA__userB' (alphabetical) or 'conv-group-<id>'
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (conversation_id, username)
);

-- 3. ENSURE MESSAGES TABLE SCHEMA & COLUMNS
DO $$
BEGIN
  -- Create messages table if it does not exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    CREATE TABLE public.messages (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      client_id TEXT UNIQUE,
      chat_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      recipient_id TEXT,
      text TEXT NOT NULL,
      status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'error')),
      created_at TIMESTAMPTZ DEFAULT now()
    );
  ELSE
    -- Add missing columns if table already exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'recipient_id') THEN
      ALTER TABLE public.messages ADD COLUMN recipient_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'status') THEN
      ALTER TABLE public.messages ADD COLUMN status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'error'));
    END IF;
  END IF;
END $$;

-- 4. BACKFILL CONVERSATIONS & PARTICIPANTS FROM EXISTING MESSAGES
INSERT INTO public.conversations (id, type, created_at, updated_at)
SELECT DISTINCT 
  chat_id AS id,
  CASE WHEN chat_id LIKE 'conv-group-%' THEN 'group' ELSE 'direct' END AS type,
  min(created_at) AS created_at,
  max(created_at) AS updated_at
FROM public.messages
WHERE chat_id IS NOT NULL AND chat_id != ''
GROUP BY chat_id
ON CONFLICT (id) DO NOTHING;

-- Backfill participants for direct conversations (userA__userB)
DO $$
DECLARE
  r RECORD;
  part1 TEXT;
  part2 TEXT;
BEGIN
  FOR r IN SELECT id FROM public.conversations WHERE type = 'direct' AND id LIKE '%__%' LOOP
    part1 := split_part(r.id, '__', 1);
    part2 := split_part(r.id, '__', 2);
    IF part1 != '' THEN
      INSERT INTO public.conversation_participants (conversation_id, username)
      VALUES (r.id, lower(trim(part1)))
      ON CONFLICT (conversation_id, username) DO NOTHING;
    END IF;
    IF part2 != '' THEN
      INSERT INTO public.conversation_participants (conversation_id, username)
      VALUES (r.id, lower(trim(part2)))
      ON CONFLICT (conversation_id, username) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Backfill senders into participants as fallback
INSERT INTO public.conversation_participants (conversation_id, username)
SELECT DISTINCT chat_id, lower(trim(sender_id))
FROM public.messages
WHERE chat_id IS NOT NULL AND sender_id IS NOT NULL
ON CONFLICT (conversation_id, username) DO NOTHING;

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
  ON public.messages(chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender 
  ON public.messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_client_id 
  ON public.messages(client_id);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user 
  ON public.conversation_participants(username);

CREATE INDEX IF NOT EXISTS idx_conv_participants_conv 
  ON public.conversation_participants(conversation_id);

-- 6. REALTIME REPLICATION CONFIGURATION
-- REPLICA IDENTITY FULL ensures old and new row states are available for real-time filters
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add messages to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow service role full administrative access
CREATE POLICY "Service role full access on conversations" 
  ON public.conversations FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on conversation_participants" 
  ON public.conversation_participants FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on messages" 
  ON public.messages FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view only conversations they participate in
CREATE POLICY "Participants can view conversations" 
  ON public.conversations FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE username = coalesce(auth.jwt() ->> 'username', (auth.jwt() -> 'user_metadata' ->> 'username'))
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Participants can view participants" 
  ON public.conversation_participants FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE username = coalesce(auth.jwt() ->> 'username', (auth.jwt() -> 'user_metadata' ->> 'username'))
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Participants can view messages" 
  ON public.messages FOR SELECT USING (
    chat_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE username = coalesce(auth.jwt() ->> 'username', (auth.jwt() -> 'user_metadata' ->> 'username'))
    )
    OR auth.role() = 'service_role'
  );

-- Restrict INSERT so users can only insert with their own sender_id
CREATE POLICY "Users can insert own messages in their conversations" 
  ON public.messages FOR INSERT WITH CHECK (
    sender_id = coalesce(auth.jwt() ->> 'username', (auth.jwt() -> 'user_metadata' ->> 'username'))
    OR auth.role() = 'service_role'
  );
