-- =====================================================
-- DPS BUZZ - Phase 2 Additive Migration: Message Receipts & Read Status
-- Migration: 007_message_receipts_and_read_status.sql
-- Purpose:
--   1. Add delivered_at and read_at columns to messages table (additive only).
--   2. Create message_receipts table for group message delivery & read tracking.
--   3. Add performance indexes for receipt lookups.
--   4. Enable RLS on message_receipts with strict recipient-only security policies.
-- =====================================================

-- 1. ADD COLUMNS TO MESSAGES TABLE (IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN delivered_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. CREATE MESSAGE_RECEIPTS TABLE (FOR GROUP CHATS & MULTI-USER AUDIT)
CREATE TABLE IF NOT EXISTS public.message_receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id TEXT NOT NULL,
  chat_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,                         -- Recipient username who received/read the message
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (chat_id, client_id, user_id)
);

-- 3. INDEXES FOR INSTANT RECEIPT LOOKUPS
CREATE INDEX IF NOT EXISTS idx_msg_receipts_lookup 
  ON public.message_receipts(chat_id, client_id);

CREATE INDEX IF NOT EXISTS idx_msg_receipts_user 
  ON public.message_receipts(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_delivered_read 
  ON public.messages(chat_id, delivered_at, read_at);

-- 4. ROW LEVEL SECURITY ON MESSAGE_RECEIPTS
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on message_receipts" 
  ON public.message_receipts FOR ALL USING (auth.role() = 'service_role');

-- Participants can view receipts for conversations they belong to
CREATE POLICY "Participants can view message receipts" 
  ON public.message_receipts FOR SELECT USING (
    chat_id IN (
      SELECT conversation_id FROM public.conversation_participants 
      WHERE username = coalesce(auth.jwt() ->> 'username', (auth.jwt() -> 'user_metadata' ->> 'username'))
    )
    OR auth.role() = 'service_role'
  );

-- Users can only insert/update their OWN receipt (cannot fake someone else's read status!)
CREATE POLICY "Users can insert own message receipt" 
  ON public.message_receipts FOR INSERT WITH CHECK (
    user_id = coalesce(auth.jwt() ->> 'username', (auth.jwt() -> 'user_metadata' ->> 'username'))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can update own message receipt" 
  ON public.message_receipts FOR UPDATE USING (
    user_id = coalesce(auth.jwt() ->> 'username', (auth.jwt() -> 'user_metadata' ->> 'username'))
    OR auth.role() = 'service_role'
  );

-- Add message_receipts to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_receipts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_receipts;
  END IF;
END $$;
