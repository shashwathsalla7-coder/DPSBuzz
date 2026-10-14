-- =====================================================
-- DPS BUZZ - Cloudflare R2 Storage & Data Retention Migration
-- Migration: 003_cloudflare_r2_and_retention.sql
-- =====================================================

-- 1. Create post_images table storing R2 object metadata
CREATE TABLE IF NOT EXISTS public.post_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  dominant_color TEXT DEFAULT '#2B4BFF',
  sort_order INTEGER DEFAULT 0,
  file_size_bytes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON public.post_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_r2_key ON public.post_images(r2_key);

ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved post images" ON public.post_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_images.post_id AND posts.is_hidden = false
    )
  );

CREATE POLICY "Students can insert images for own posts" ON public.post_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_images.post_id AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can delete images for own posts" ON public.post_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_images.post_id AND posts.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 2. Add R2 metadata columns to profiles, stories, groups, and notices
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_r2_key TEXT,
  ADD COLUMN IF NOT EXISTS avatar_dominant_color TEXT DEFAULT '#2B4BFF';

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS media_r2_key TEXT,
  ADD COLUMN IF NOT EXISTS media_width INTEGER,
  ADD COLUMN IF NOT EXISTS media_height INTEGER,
  ADD COLUMN IF NOT EXISTS media_dominant_color TEXT DEFAULT '#2B4BFF';

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS avatar_r2_key TEXT;

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS attachment_r2_key TEXT,
  ADD COLUMN IF NOT EXISTS attachment_filename TEXT,
  ADD COLUMN IF NOT EXISTS attachment_size_bytes INTEGER;

-- 3. Seed Retention & Storage Settings in app_settings
INSERT INTO public.app_settings (key, value) VALUES
  ('chat_retention_days', '90'),
  ('post_photo_retention_months', '0'),
  ('r2_bucket_name', 'dpsbuzz-media'),
  ('r2_storage_lock_gb', '9.0')
ON CONFLICT (key) DO NOTHING;

-- 4. Storage Analytics RPC (with 9.0 GB Hard Lock Calculation)
CREATE OR REPLACE FUNCTION public.admin_get_storage_analytics()
RETURNS json AS $$
DECLARE
  v_db_size BIGINT := 0;
  v_total_photos BIGINT := 0;
  v_total_bytes BIGINT := 0;
  v_total_messages BIGINT := 0;
  v_lock_gb NUMERIC := 9.0;
  v_used_gb NUMERIC := 0;
  v_is_locked BOOLEAN := false;
BEGIN
  -- PostgreSQL Database Size
  SELECT pg_database_size(current_database()) INTO v_db_size;

  -- Post Images count and bytes
  SELECT COUNT(*), COALESCE(SUM(file_size_bytes), 0) INTO v_total_photos, v_total_bytes
  FROM public.post_images;

  -- Chat Messages count
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    SELECT COUNT(*) INTO v_total_messages FROM public.messages;
  END IF;

  -- Retrieve configurable lock threshold (default: 9.0 GB)
  SELECT COALESCE(value::NUMERIC, 9.0) INTO v_lock_gb
  FROM public.app_settings WHERE key = 'r2_storage_lock_gb';

  v_used_gb := ROUND((v_total_bytes::NUMERIC / (1024 * 1024 * 1024)), 3);
  v_is_locked := v_used_gb >= v_lock_gb;

  RETURN json_build_object(
    'db_size_bytes', v_db_size,
    'total_photos', v_total_photos,
    'photos_bytes', v_total_bytes,
    'photos_used_gb', v_used_gb,
    'total_messages', v_total_messages,
    'lock_threshold_gb', v_lock_gb,
    'is_locked', v_is_locked
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Automated Chat Pruner RPC (90-Day Retention)
CREATE OR REPLACE FUNCTION public.admin_prune_old_chat_messages()
RETURNS json AS $$
DECLARE
  v_days INTEGER;
  v_deleted_count INTEGER := 0;
BEGIN
  SELECT COALESCE(value::INTEGER, 90) INTO v_days
  FROM public.app_settings WHERE key = 'chat_retention_days';

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    DELETE FROM public.messages
    WHERE created_at < NOW() - (v_days || ' days')::INTERVAL;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  END IF;

  RETURN json_build_object('success', true, 'deleted_messages', v_deleted_count, 'retention_days', v_days);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Expired Stories Media Cleaner RPC (48h Lifetime)
CREATE OR REPLACE FUNCTION public.admin_get_expired_stories_for_cleanup()
RETURNS TABLE (story_id UUID, r2_key TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT id, media_r2_key
  FROM public.stories
  WHERE media_r2_key IS NOT NULL
    AND created_at < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
