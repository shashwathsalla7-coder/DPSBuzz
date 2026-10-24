-- =====================================================
-- DPS BUZZ - Migration 009: Instagram-Style Music System
-- Tables: music_library_tracks, music_blocklist, music_reports
-- Additive columns on stories and posts
-- RLS policies guaranteeing student privacy & school safety
-- NEVER deletes or modifies existing user stories or posts
-- =====================================================

-- 1. SCHOOL LIBRARY TRACKS TABLE
CREATE TABLE IF NOT EXISTS public.music_library_tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration NUMERIC NOT NULL DEFAULT 180,
  cover_image TEXT,
  audio_url TEXT NOT NULL,
  genre TEXT DEFAULT 'School Upload',
  mood TEXT DEFAULT 'Vibe',
  license TEXT DEFAULT 'DPS Buzz Internal School License (Royalty-Free)',
  credit_text TEXT NOT NULL,
  source_page_url TEXT DEFAULT '/admin',
  is_hidden BOOLEAN DEFAULT false,
  confirmed_rights BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MUSIC BLOCKLIST TABLE
CREATE TABLE IF NOT EXISTS public.music_blocklist (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('track', 'artist')),
  identifier TEXT NOT NULL UNIQUE, -- track ID or artist name (lowercased)
  reason TEXT,
  blocked_by TEXT DEFAULT 'school_admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MUSIC REPORTS TABLE (Student Child-Safety Reports)
CREATE TABLE IF NOT EXISTS public.music_reports (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL,
  track_title TEXT NOT NULL,
  track_artist TEXT NOT NULL,
  reporter_username TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ADDITIVE COLUMNS ON STORIES TABLE
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_source TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_track_id TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_start_seconds NUMERIC;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_length_seconds NUMERIC;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_title TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_artist TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_license TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_credit TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_source_url TEXT;

-- 5. ADDITIVE COLUMNS ON POSTS TABLE
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_source TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_track_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_start_seconds NUMERIC;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_length_seconds NUMERIC;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_title TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_artist TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_license TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_credit TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS music_source_url TEXT;

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_music_library_tracks_hidden ON public.music_library_tracks(is_hidden);
CREATE INDEX IF NOT EXISTS idx_music_blocklist_ident ON public.music_blocklist(identifier);
CREATE INDEX IF NOT EXISTS idx_music_reports_status ON public.music_reports(status);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.music_library_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_reports ENABLE ROW LEVEL SECURITY;

-- Library: Students can read non-hidden tracks
DROP POLICY IF EXISTS "Anyone can read active library tracks" ON public.music_library_tracks;
CREATE POLICY "Anyone can read active library tracks"
  ON public.music_library_tracks
  FOR SELECT
  USING (is_hidden = false);

-- Library: Only Admin can insert, update, or delete tracks
DROP POLICY IF EXISTS "Only admin can modify library tracks" ON public.music_library_tracks;
CREATE POLICY "Only admin can modify library tracks"
  ON public.music_library_tracks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Blocklist: Students can read blocklist to filter client-side if needed
DROP POLICY IF EXISTS "Anyone can read blocklist" ON public.music_blocklist;
CREATE POLICY "Anyone can read blocklist"
  ON public.music_blocklist
  FOR SELECT
  USING (true);

-- Blocklist: Only Admin can add or remove blocked items
DROP POLICY IF EXISTS "Only admin can modify blocklist" ON public.music_blocklist;
CREATE POLICY "Only admin can modify blocklist"
  ON public.music_blocklist
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reports: Authenticated students can submit reports
DROP POLICY IF EXISTS "Authenticated users can submit music reports" ON public.music_reports;
CREATE POLICY "Authenticated users can submit music reports"
  ON public.music_reports
  FOR INSERT
  WITH CHECK (true);

-- Reports: Students can only read their own reports; Admin can read all
DROP POLICY IF EXISTS "Students see own reports or admin sees all" ON public.music_reports;
CREATE POLICY "Students see own reports or admin sees all"
  ON public.music_reports
  FOR SELECT
  USING (
    reporter_username = (SELECT username FROM public.profiles WHERE id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Reports: Only Admin can update report status
DROP POLICY IF EXISTS "Only admin can update reports" ON public.music_reports;
CREATE POLICY "Only admin can update reports"
  ON public.music_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
