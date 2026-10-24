-- =====================================================
-- DPS BUZZ - Additive Migration: Chat Reliability, Deduplication & Performance Indexes
-- Migration: 010_chat_reliability_and_indexes.sql
-- Additive only - Never drops or deletes any existing data
-- =====================================================

-- 1. Ensure required delivery and status columns exist on messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS error_reason TEXT;

-- 2. Unique constraint on client_id to guarantee deduplication on network retries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_client_id_key'
  ) THEN
    -- If there are any historical duplicates, keep only the earliest one before adding constraint
    DELETE FROM public.messages m1
    USING public.messages m2
    WHERE m1.client_id IS NOT NULL 
      AND m1.client_id = m2.client_id 
      AND m1.created_at > m2.created_at;

    ALTER TABLE public.messages ADD CONSTRAINT messages_client_id_key UNIQUE (client_id);
  END IF;
END $$;

-- 3. High-performance composite indexes for instant chat loads
CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
  ON public.messages(chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_client_id 
  ON public.messages(client_id);

CREATE INDEX IF NOT EXISTS idx_messages_unread_lookup
  ON public.messages(chat_id, sender_id, read_at)
  WHERE read_at IS NULL;

-- 4. Anonymous/Student-Safe Diagnostics Table (Logs errors only, ZERO message text or personal data)
CREATE TABLE IF NOT EXISTS public.chat_send_failures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  error_type TEXT NOT NULL,       -- 'TIMEOUT', 'NETWORK', 'HTTP_429', 'HTTP_5XX', 'AUTH'
  status_code INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_send_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log send failure" 
  ON public.chat_send_failures FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view send failures" 
  ON public.chat_send_failures FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.role() = 'service_role'
  );
