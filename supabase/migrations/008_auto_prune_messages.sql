-- =====================================================
-- DPS BUZZ - Migration 008: 30-Day Message Auto-Prune Policy
-- Purpose:
--   Keeps database storage permanently under 120 MB
--   (Safely within Supabase 500 MB Free Plan limit)
-- =====================================================

CREATE OR REPLACE FUNCTION public.prune_old_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Permanently purge messages older than 30 days
  DELETE FROM public.messages 
  WHERE created_at < now() - INTERVAL '30 days';

  -- Purge message receipts older than 30 days
  DELETE FROM public.message_receipts 
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$;

-- Schedule daily midnight execution if pg_cron extension is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'daily-message-prune',
      '0 2 * * *', -- Every night at 2:00 AM UTC
      'SELECT public.prune_old_messages();'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Gracefully ignore if pg_cron is not enabled in this database tier
  NULL;
END $$;
