-- =====================================================
-- DPS BUZZ - Migration 002: Production Empty State & Official Account
-- 1. Official Account: DPS Buzz Official (@dpsbuzz_official)
-- 2. Auto-follow trigger: Every new student auto-follows official account
-- 3. Groups table & Auto-create one group per class & section from roster
-- 4. Admin Wipe Test Data function
-- 5. Admin Table Row Counts auditing function
-- =====================================================

-- =====================================================
-- 1. GROUPS & GROUP MEMBERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  class TEXT,                     -- e.g. "8" or NULL for whole-school clubs
  section TEXT,                   -- e.g. "A" or NULL
  category TEXT DEFAULT 'class' CHECK (category IN ('class', 'house', 'club', 'activity')),
  avatar_url TEXT,
  banner_url TEXT,
  is_official BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view groups" ON public.groups
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view group members" ON public.group_members
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage groups" ON public.groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- 2. AUTO-CREATE GROUPS PER CLASS & SECTION FROM ROSTER
-- Requirement #5: Auto-create one group per class and section from roster
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_create_class_groups_on_roster()
RETURNS TRIGGER AS $$
DECLARE
  v_group_name TEXT;
BEGIN
  IF NEW.class IS NOT NULL AND NEW.section IS NOT NULL THEN
    v_group_name := 'Class ' || NEW.class || '-' || UPPER(NEW.section);
    
    INSERT INTO public.groups (name, description, class, section, category, is_official)
    VALUES (
      v_group_name,
      'Official class group for Class ' || NEW.class || '-' || UPPER(NEW.section) || ' • DPS Buzz',
      NEW.class,
      UPPER(NEW.section),
      'class',
      true
    )
    ON CONFLICT (name) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_create_class_groups ON public.student_roster;
CREATE TRIGGER trigger_auto_create_class_groups
  AFTER INSERT ON public.student_roster
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_class_groups_on_roster();

-- Seed 4 House Groups (Lions, Tigers, Eagles, Cheetahs)
INSERT INTO public.groups (name, description, category, is_official) VALUES
  ('Lions House 🦁', 'Official house club for DPS Lions • Yellow & Gold', 'house', true),
  ('Tigers House 🐯', 'Official house club for DPS Tigers • Orange & Black', 'house', true),
  ('Eagles House 🦅', 'Official house club for DPS Eagles • Blue & White', 'house', true),
  ('Cheetahs House 🐆', 'Official house club for DPS Cheetahs • Red & Amber', 'house', true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. OFFICIAL ACCOUNT SEED & AUTO-FOLLOW TRIGGER
-- Requirement #3: One official account "DPS Buzz Official" that only admin controls,
-- and every new student auto-follows it.
-- =====================================================

-- Constant UUID for DPS Buzz Official
DO $$
DECLARE
  v_official_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  -- Insert official profile if not exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = 'dpsbuzz_official') THEN
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      avatar_url,
      bio,
      role,
      is_verified,
      is_approved,
      follower_count,
      following_count,
      spirit_points
    ) VALUES (
      v_official_id,
      'dpsbuzz_official',
      'DPS Buzz Official 🐝',
      NULL,
      'The official pulse of campus. News, notices, events & campus highlights.',
      'admin',
      true,
      true,
      0,
      0,
      1000
    );
  END IF;
END $$;

-- Update handle_new_user to auto-follow DPS Buzz Official
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
  v_official_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  v_class_group_id UUID;
BEGIN
  -- Extract metadata
  v_admission_number := NEW.raw_user_meta_data->>'admission_number';
  v_full_name := NEW.raw_user_meta_data->>'full_name';

  -- Try to match roster
  SELECT * INTO v_roster_row
  FROM public.student_roster
  WHERE UPPER(admission_number) = UPPER(v_admission_number)
    AND UPPER(TRIM(name)) = UPPER(TRIM(v_full_name))
    AND is_claimed = false;

  IF v_roster_row IS NOT NULL THEN
    v_is_verified := true;
    v_is_approved := true;
    v_class := v_roster_row.class;
    v_section := v_roster_row.section;

    UPDATE public.student_roster
    SET is_claimed = true, claimed_by = NEW.id, claimed_at = now()
    WHERE id = v_roster_row.id;
  END IF;

  -- Create student profile
  INSERT INTO public.profiles (
    id, username, full_name, class, section,
    admission_number, is_verified, is_approved
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(v_full_name, NEW.raw_user_meta_data->>'full_name'),
    v_class,
    v_section,
    v_admission_number,
    v_is_verified,
    v_is_approved
  );

  -- AUTO-FOLLOW: Every new student auto-follows "DPS Buzz Official"
  IF v_official_id != NEW.id THEN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.id, v_official_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;

    -- Update official account follower count
    UPDATE public.profiles
    SET follower_count = follower_count + 1
    WHERE id = v_official_id;

    -- Update student's following count
    UPDATE public.profiles
    SET following_count = following_count + 1
    WHERE id = NEW.id;
  END IF;

  -- AUTO-JOIN: Join their class group if verified
  IF v_class IS NOT NULL AND v_section IS NOT NULL THEN
    SELECT id INTO v_class_group_id
    FROM public.groups
    WHERE class = v_class AND section = UPPER(v_section);

    IF v_class_group_id IS NOT NULL THEN
      INSERT INTO public.group_members (group_id, user_id, role)
      VALUES (v_class_group_id, NEW.id, 'member')
      ON CONFLICT (group_id, user_id) DO NOTHING;

      UPDATE public.groups
      SET member_count = member_count + 1
      WHERE id = v_class_group_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. WIPE TEST DATA FUNCTION
-- Requirement #2: "wipe test data" button in admin panel
-- Purges all test data but preserves admin, official account, app_settings, empty roster
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_wipe_test_data()
RETURNS JSON AS $$
DECLARE
  v_official_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: only admin can wipe test data';
  END IF;

  -- 1. Delete all follows except follows to official account
  DELETE FROM public.follows
  WHERE follower_id NOT IN (SELECT id FROM public.profiles WHERE role = 'admin' OR id = v_official_id);

  -- 2. Delete notifications, reports, blocks, user badges
  DELETE FROM public.notifications;
  DELETE FROM public.reports;
  DELETE FROM public.blocks;
  DELETE FROM public.user_badges;
  DELETE FROM public.hidden_content;

  -- 3. Delete group memberships for non-admin accounts
  DELETE FROM public.group_members
  WHERE user_id NOT IN (SELECT id FROM public.profiles WHERE role = 'admin' OR id = v_official_id);

  -- 4. Reset roster claim status
  UPDATE public.student_roster
  SET is_claimed = false, claimed_by = NULL, claimed_at = NULL;

  -- 5. Delete all test student profiles (preserve admin and official account)
  DELETE FROM public.profiles
  WHERE role != 'admin' AND id != v_official_id;

  -- 6. Reset counts on official account
  UPDATE public.profiles
  SET follower_count = 0, following_count = 0, post_count = 0
  WHERE id = v_official_id;

  RETURN json_build_object(
    'success', true,
    'message', 'All test data wiped successfully. Preserved: Admin account, DPS Buzz Official, app settings, and roster structure.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TABLE ROW COUNTS AUDITING FUNCTION
-- Requirement #7: Show proof that it is empty: row counts for every table
-- =====================================================
CREATE OR REPLACE FUNCTION public.admin_get_table_counts()
RETURNS JSON AS $$
DECLARE
  v_profiles_count INTEGER;
  v_roster_count INTEGER;
  v_follows_count INTEGER;
  v_reports_count INTEGER;
  v_blocks_count INTEGER;
  v_badges_count INTEGER;
  v_user_badges_count INTEGER;
  v_notifications_count INTEGER;
  v_hidden_content_count INTEGER;
  v_banned_words_count INTEGER;
  v_settings_count INTEGER;
  v_groups_count INTEGER;
  v_group_members_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_profiles_count FROM public.profiles;
  SELECT COUNT(*) INTO v_roster_count FROM public.student_roster;
  SELECT COUNT(*) INTO v_follows_count FROM public.follows;
  SELECT COUNT(*) INTO v_reports_count FROM public.reports;
  SELECT COUNT(*) INTO v_blocks_count FROM public.blocks;
  SELECT COUNT(*) INTO v_badges_count FROM public.badges;
  SELECT COUNT(*) INTO v_user_badges_count FROM public.user_badges;
  SELECT COUNT(*) INTO v_notifications_count FROM public.notifications;
  SELECT COUNT(*) INTO v_hidden_content_count FROM public.hidden_content;
  SELECT COUNT(*) INTO v_banned_words_count FROM public.banned_words;
  SELECT COUNT(*) INTO v_settings_count FROM public.app_settings;
  SELECT COUNT(*) INTO v_groups_count FROM public.groups;
  SELECT COUNT(*) INTO v_group_members_count FROM public.group_members;

  RETURN json_build_object(
    'profiles', v_profiles_count,
    'student_roster', v_roster_count,
    'follows', v_follows_count,
    'reports', v_reports_count,
    'blocks', v_blocks_count,
    'badges', v_badges_count,
    'user_badges', v_user_badges_count,
    'notifications', v_notifications_count,
    'hidden_content', v_hidden_content_count,
    'banned_words', v_banned_words_count,
    'app_settings', v_settings_count,
    'groups', v_groups_count,
    'group_members', v_group_members_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
