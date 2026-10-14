-- =====================================================
-- DPS BUZZ - Phase 1 Database Migration
-- Tables: app_settings, student_roster, profiles, follows, reports, blocks, badges, user_badges
-- All tables have Row Level Security (RLS) enabled
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron"; -- For scheduled tasks (story cleanup, leaderboard snapshots)

-- =====================================================
-- 1. APP SETTINGS
-- Global config like invite code, feature toggles
-- =====================================================
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed the default invite code
INSERT INTO public.app_settings (key, value) VALUES
  ('invite_code', 'DPSBUZZ2026'),
  ('spirit_points_enabled', 'false'),
  ('maintenance_mode', 'false');

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for invite code validation)
CREATE POLICY "Anyone can read settings" ON public.app_settings
  FOR SELECT USING (true);

-- Only admin (service_role or admin user) can modify settings
CREATE POLICY "Only admin can modify settings" ON public.app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 2. STUDENT ROSTER
-- CSV upload target. The "truth list" of real students.
-- =====================================================
CREATE TABLE public.student_roster (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,            -- e.g. "8"
  section TEXT NOT NULL,          -- e.g. "A"
  admission_number TEXT NOT NULL UNIQUE,
  is_claimed BOOLEAN DEFAULT false,
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.student_roster ENABLE ROW LEVEL SECURITY;

-- Students can check if their admission number exists (for sign-up validation)
-- But they can only see their own row, not browse the whole roster
CREATE POLICY "Students can verify own admission" ON public.student_roster
  FOR SELECT USING (
    -- Allow checking during sign-up (no auth yet) via RPC function
    -- Or allow seeing own claimed row
    (auth.uid() IS NOT NULL AND claimed_by = auth.uid())
  );

-- Admin can do everything
CREATE POLICY "Admin full access to roster" ON public.student_roster
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 3. PROFILES
-- Main user profiles. Split into public view + private data.
-- =====================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT '' CHECK (char_length(bio) <= 150),
  class TEXT,
  section TEXT,
  -- PRIVATE fields (not exposed to other students via view)
  admission_number TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_verified BOOLEAN DEFAULT false,  -- Matched the roster
  is_approved BOOLEAN DEFAULT false,  -- Admin approved or auto-approved
  is_banned BOOLEAN DEFAULT false,
  -- Cached counts (updated by triggers)
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  -- Rewards & gamification
  spirit_points INTEGER DEFAULT 0,
  profile_frame TEXT DEFAULT 'default',
  story_ring_style TEXT DEFAULT 'default',
  -- Preferences
  dark_mode BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Public view: hides admission_number, role, is_banned from other students
-- Students query this view instead of the profiles table directly
CREATE VIEW public.profiles_public AS
SELECT
  id, username, full_name, avatar_url, bio,
  class, section,
  is_verified, is_approved,
  follower_count, following_count, post_count,
  spirit_points, profile_frame, story_ring_style,
  created_at
FROM public.profiles
WHERE is_banned = false AND is_approved = true;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Students can see approved, non-banned profiles (public fields only via view)
CREATE POLICY "Anyone can view approved profiles" ON public.profiles
  FOR SELECT USING (
    -- Own profile: see everything
    id = auth.uid()
    OR
    -- Other profiles: only if approved and not banned
    (is_approved = true AND is_banned = false)
  );

-- Students can only update their own username, bio, and avatar
CREATE POLICY "Students can update own profile (limited fields)" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- We enforce field-level restrictions via a trigger below
  );

-- Admin can update any profile
CREATE POLICY "Admin can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profiles are created via the sign-up trigger
CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true); -- Controlled by the sign-up function

-- =====================================================
-- TRIGGER: Restrict student profile updates to allowed fields
-- Students can ONLY change: username, bio, avatar_url, dark_mode, notifications_enabled
-- Everything else reverts to the old value
-- =====================================================
CREATE OR REPLACE FUNCTION public.enforce_profile_update_restrictions()
RETURNS TRIGGER AS $$
BEGIN
  -- If the updater is not an admin, revert protected fields
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    NEW.role := OLD.role;
    NEW.is_verified := OLD.is_verified;
    NEW.is_approved := OLD.is_approved;
    NEW.is_banned := OLD.is_banned;
    NEW.follower_count := OLD.follower_count;
    NEW.following_count := OLD.following_count;
    NEW.post_count := OLD.post_count;
    NEW.spirit_points := OLD.spirit_points;
    NEW.profile_frame := OLD.profile_frame;
    NEW.story_ring_style := OLD.story_ring_style;
    NEW.admission_number := OLD.admission_number;
    NEW.class := OLD.class;
    NEW.section := OLD.section;
    NEW.full_name := OLD.full_name;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_enforce_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_update_restrictions();

-- =====================================================
-- 4. FOLLOWS
-- With anti-cheat: rate limiting and spam detection
-- =====================================================
CREATE TABLE public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  -- Can't follow yourself
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);
CREATE INDEX idx_follows_created ON public.follows(created_at);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Anyone can see follows
CREATE POLICY "Anyone can view follows" ON public.follows
  FOR SELECT USING (true);

-- Students can follow/unfollow
CREATE POLICY "Students can follow" ON public.follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Students can unfollow" ON public.follows
  FOR DELETE USING (follower_id = auth.uid());

-- =====================================================
-- TRIGGER: Rate-limit follows (max 30 per hour)
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_follow_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_follows INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_follows
  FROM public.follows
  WHERE follower_id = NEW.follower_id
    AND created_at > now() - INTERVAL '1 hour';

  IF recent_follows >= 30 THEN
    RAISE EXCEPTION 'Follow rate limit exceeded. You can follow up to 30 people per hour.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_follow_rate_limit
  BEFORE INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.check_follow_rate_limit();

-- =====================================================
-- TRIGGER: Update follower/following counts on follow/unfollow
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_follow_counts();

-- =====================================================
-- 5. REPORTS
-- Universal reporting system for posts, comments, stories, messages, profiles
-- Auto-hides content after 3 reports
-- =====================================================
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'story', 'message', 'profile')),
  target_id TEXT NOT NULL,  -- UUID stored as text for flexibility
  reason TEXT NOT NULL CHECK (char_length(reason) <= 500),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_action TEXT CHECK (admin_action IN ('hide', 'delete', 'warn', 'ban')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Students can create reports
CREATE POLICY "Students can create reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Students can see their own reports
CREATE POLICY "Students can view own reports" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());

-- Admin can see and manage all reports
CREATE POLICY "Admin full access to reports" ON public.reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 6. BLOCKS
-- =====================================================
CREATE TABLE public.blocks (
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own blocks
CREATE POLICY "Users see own blocks" ON public.blocks
  FOR SELECT USING (blocker_id = auth.uid());

CREATE POLICY "Users can block" ON public.blocks
  FOR INSERT WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can unblock" ON public.blocks
  FOR DELETE USING (blocker_id = auth.uid());

-- =====================================================
-- 7. BADGES
-- System-defined badges
-- =====================================================
CREATE TABLE public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,        -- Emoji or icon identifier
  type TEXT NOT NULL CHECK (type IN ('milestone', 'achievement', 'special', 'surprise')),
  trigger_condition TEXT,    -- e.g. '25_followers', 'first_post', 'manual'
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage badges" ON public.badges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed default badges
INSERT INTO public.badges (name, description, icon, type, trigger_condition) VALUES
  ('First Post 🎉', 'Shared your first post on DPS Buzz', '🎉', 'achievement', 'first_post'),
  ('Social Bee 🐝', 'Reached 25 followers', '🐝', 'milestone', '25_followers'),
  ('Rising Star ⭐', 'Reached 50 followers', '⭐', 'milestone', '50_followers'),
  ('Popular Kid 🔥', 'Reached 100 followers', '🔥', 'milestone', '100_followers'),
  ('School Celebrity 👑', 'Reached 250 followers', '👑', 'milestone', '250_followers'),
  ('Legend 💎', 'Reached 500 followers', '💎', 'milestone', '500_followers'),
  ('Star of the Week 🏆', 'Top of the Star Board this week', '🏆', 'special', 'star_of_week'),
  ('Active Bee 📱', 'Posted 10 times', '📱', 'achievement', '10_posts'),
  ('Helpful Friend 🤝', 'Earned 50 spirit points', '🤝', 'achievement', '50_spirit_points'),
  ('OG Member 🎖️', 'One of the first 50 students to join', '🎖️', 'special', 'early_adopter');

-- =====================================================
-- 8. USER BADGES
-- Which badges each student has earned
-- =====================================================
CREATE TABLE public.user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user badges" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "Only service role awards badges" ON public.user_badges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- SIGN-UP VALIDATION FUNCTION
-- Called via Supabase RPC during sign-up
-- Validates admission_number + full_name + invite_code
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_signup(
  p_admission_number TEXT,
  p_full_name TEXT,
  p_invite_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_settings_code TEXT;
  v_roster_row public.student_roster%ROWTYPE;
  v_result JSON;
BEGIN
  -- Check invite code
  SELECT value INTO v_settings_code
  FROM public.app_settings
  WHERE key = 'invite_code';

  IF UPPER(p_invite_code) != UPPER(v_settings_code) THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid invite code');
  END IF;

  -- Check roster
  SELECT * INTO v_roster_row
  FROM public.student_roster
  WHERE UPPER(admission_number) = UPPER(p_admission_number);

  IF v_roster_row IS NULL THEN
    -- Not in roster - will go to approval queue
    RETURN json_build_object('valid', true, 'roster_match', false, 'message', 'Your admission number was not found in the school roster. Your account will need admin approval.');
  END IF;

  -- Check if name matches (case-insensitive, trimmed)
  IF UPPER(TRIM(v_roster_row.name)) != UPPER(TRIM(p_full_name)) THEN
    RETURN json_build_object('valid', false, 'error', 'Name does not match school records for this admission number');
  END IF;

  -- Check if already claimed
  IF v_roster_row.is_claimed THEN
    RETURN json_build_object('valid', false, 'error', 'This admission number has already been used to create an account');
  END IF;

  -- All good - roster match
  RETURN json_build_object(
    'valid', true,
    'roster_match', true,
    'class', v_roster_row.class,
    'section', v_roster_row.section,
    'name', v_roster_row.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Create profile after sign-up
-- Called by a Supabase Auth trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_roster_row public.student_roster%ROWTYPE;
  v_is_verified BOOLEAN := false;
  v_is_approved BOOLEAN := false;
  v_class TEXT;
  v_section TEXT;
  v_admission_number TEXT;
  v_full_name TEXT;
BEGIN
  -- Extract metadata from the sign-up
  v_admission_number := NEW.raw_user_meta_data->>'admission_number';
  v_full_name := NEW.raw_user_meta_data->>'full_name';

  -- Try to match roster
  SELECT * INTO v_roster_row
  FROM public.student_roster
  WHERE UPPER(admission_number) = UPPER(v_admission_number)
    AND UPPER(TRIM(name)) = UPPER(TRIM(v_full_name))
    AND is_claimed = false;

  IF v_roster_row IS NOT NULL THEN
    -- Roster match! Auto-approve
    v_is_verified := true;
    v_is_approved := true;
    v_class := v_roster_row.class;
    v_section := v_roster_row.section;

    -- Mark roster entry as claimed
    UPDATE public.student_roster
    SET is_claimed = true, claimed_by = NEW.id, claimed_at = now()
    WHERE id = v_roster_row.id;
  END IF;

  -- Create the profile
  INSERT INTO public.profiles (
    id, username, full_name, class, section,
    admission_number, is_verified, is_approved
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    v_full_name,
    v_class,
    v_section,
    v_admission_number,
    v_is_verified,
    v_is_approved
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth trigger to create profile on sign-up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- NOTIFICATIONS TABLE (needed for Phase 1 bell icon)
-- =====================================================
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'message', 'notice', 'badge', 'reward', 'mention', 'system')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can mark own as read" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role creates notifications
CREATE POLICY "Service role creates notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 9. AUTO-HIDE CONTENT ON 3 REPORTS (Requirement #4)
-- =====================================================
CREATE TABLE public.hidden_content (
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'story', 'message', 'profile')),
  target_id TEXT NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 3,
  hidden_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending_admin_review' CHECK (status IN ('pending_admin_review', 'restored_by_admin', 'permanently_deleted')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  PRIMARY KEY (target_type, target_id)
);

ALTER TABLE public.hidden_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to hidden content" ON public.hidden_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can check if content is hidden" ON public.hidden_content
  FOR SELECT USING (true);

-- Trigger function: automatically hides content when report count reaches 3
CREATE OR REPLACE FUNCTION public.check_report_auto_hide()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.reports
  WHERE target_type = NEW.target_type
    AND target_id = NEW.target_id
    AND status != 'dismissed';

  IF v_count >= 3 THEN
    INSERT INTO public.hidden_content (target_type, target_id, report_count)
    VALUES (NEW.target_type, NEW.target_id, v_count)
    ON CONFLICT (target_type, target_id)
    DO UPDATE SET report_count = EXCLUDED.report_count, status = 'pending_admin_review';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_hide_on_reports
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.check_report_auto_hide();

-- =====================================================
-- 10. PROFANITY FILTER & BANNED WORDS (Requirement #8)
-- Admin can add custom words. Initial default list seeded.
-- =====================================================
CREATE TABLE public.banned_words (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  severity TEXT DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read banned words for client-side filter" ON public.banned_words
  FOR SELECT USING (true);

CREATE POLICY "Only admin can manage banned words" ON public.banned_words
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed default profanity words (standard safety + common abusive words)
INSERT INTO public.banned_words (word, severity) VALUES
  ('abuse', 'medium'),
  ('bastard', 'high'),
  ('bitch', 'high'),
  ('bloody', 'low'),
  ('crap', 'low'),
  ('damn', 'low'),
  ('dick', 'high'),
  ('faggot', 'high'),
  ('fuck', 'high'),
  ('idiot', 'low'),
  ('moron', 'low'),
  ('nigger', 'high'),
  ('piss', 'medium'),
  ('retard', 'high'),
  ('shit', 'medium'),
  ('slut', 'high'),
  ('stupid', 'low'),
  ('whore', 'high'),
  ('chutiya', 'high'),
  ('gandha', 'medium'),
  ('harami', 'high'),
  ('kamina', 'medium'),
  ('kutta', 'low'),
  ('madarchod', 'high'),
  ('bhenchod', 'high'),
  ('saala', 'low')
ON CONFLICT (word) DO NOTHING;

-- Helper function to check text against banned words
CREATE OR REPLACE FUNCTION public.check_text_profanity(p_text TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_word RECORD;
BEGIN
  FOR v_word IN SELECT word FROM public.banned_words LOOP
    IF p_text ~* ('\y' || v_word.word || '\y') THEN
      RETURN true; -- Contains profanity
    END IF;
  END LOOP;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. CLAIMED ACCOUNTS & ONE-TAP RESET (Requirement #3)
-- Admin view to see claimed accounts and reset if hijacked
-- =====================================================
CREATE OR REPLACE VIEW public.admin_claimed_accounts AS
SELECT
  r.id AS roster_id,
  r.admission_number,
  r.name AS student_name,
  r.class,
  r.section,
  r.claimed_at,
  p.id AS user_id,
  p.username,
  p.created_at AS account_created_at
FROM public.student_roster r
LEFT JOIN public.profiles p ON r.claimed_by = p.id
WHERE r.is_claimed = true
ORDER BY r.claimed_at DESC;

-- One-tap reset function for admin:
CREATE OR REPLACE FUNCTION public.admin_reset_claim(p_roster_id UUID)
RETURNS JSON AS $$
DECLARE
  v_claimed_by UUID;
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: only admin can reset claims';
  END IF;

  SELECT claimed_by INTO v_claimed_by
  FROM public.student_roster
  WHERE id = p_roster_id;

  IF v_claimed_by IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Roster entry is not claimed');
  END IF;

  -- 1. Unclaim the roster entry so the real student can claim it again
  UPDATE public.student_roster
  SET is_claimed = false, claimed_by = NULL, claimed_at = NULL
  WHERE id = p_roster_id;

  -- 2. Mark the claimed profile as unapproved / banned pending investigation
  UPDATE public.profiles
  SET is_approved = false, is_verified = false, is_banned = true
  WHERE id = v_claimed_by;

  RETURN json_build_object('success', true, 'message', 'Claim reset successfully. The roster entry is now free to be claimed by the real student.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- Run these in Supabase dashboard SQL editor or Storage API:
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('avatars', 'avatars', true),
--   ('posts', 'posts', true),
--   ('stories', 'stories', true),
--   ('notices', 'notices', true),
--   ('chats', 'chats', false);
