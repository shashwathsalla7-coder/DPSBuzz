-- ============================================================================
-- 013: LOCK DOWN THE PUBLIC (anon) SUPABASE KEY
--
-- Why: the anon key is shipped to every browser. Before this migration it could
-- read every private chat message, notification, profile and app setting, and
-- insert/update posts and follows for anyone.
--
-- After this migration the browser has NO direct table access. All reads and
-- writes go through the Next.js API routes, which check the signed login
-- session and use the service-role key (service_role bypasses RLS).
--
-- RUN ORDER: deploy the new app code FIRST, then run this in the Supabase SQL
-- editor. Running it before the deploy will break chat on the old code.
-- ============================================================================

BEGIN;

-- 1. Enable RLS on every table in the public schema and drop every existing
--    policy (all of them were written for anon/authenticated access).
DO $$
DECLARE
  t record;
  p record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename);
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', p.policyname, t.tablename);
    END LOOP;
  END LOOP;
END $$;

-- 2. Remove table/sequence/function privileges from the browser roles.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 3. Same for anything created in the future.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

COMMIT;

-- 4. Verify (should return 0 rows / permission errors when using the anon key):
--    curl "$SUPABASE_URL/rest/v1/messages?select=id&limit=1" -H "apikey: $ANON_KEY"
