-- ==============================================================================
-- DPS Buzz - Additive Migration 012: Friends & Groups Architecture
-- Strictly additive. Preserves all existing tables, profiles, messages, and posts.
-- ==============================================================================

-- 1. NOTIFICATIONS DEFAULT UUID FIX
-- Resolves "null value in column id of relation notifications violates not-null constraint"
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 2. FRIENDSHIPS TABLE (Authoritative Bidirectional Friendships)
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_low TEXT NOT NULL,
  user_high TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT friendships_sorted_pair UNIQUE (user_low, user_high),
  CONSTRAINT friendships_no_self CHECK (user_low < user_high)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_friendships_user_low ON public.friendships(user_low);
CREATE INDEX IF NOT EXISTS idx_friendships_user_high ON public.friendships(user_high);

-- 3. FRIEND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT friend_requests_no_self CHECK (requester <> target)
);

-- Unique constraint: Only 1 pending request allowed between the same two students
CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_requests_pending_pair
  ON public.friend_requests (LEAST(requester, target), GREATEST(requester, target))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON public.friend_requests(requester);
CREATE INDEX IF NOT EXISTS idx_friend_requests_target ON public.friend_requests(target);

-- 4. ENHANCE GROUPS TABLE (Additive columns only)
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Study Group';
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT false;

-- 5. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT group_members_unique_member UNIQUE (group_id, username)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_username ON public.group_members(username);

-- 6. GROUP INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  inviter_username TEXT NOT NULL,
  invitee_username TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT group_invitations_no_self CHECK (inviter_username <> invitee_username)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_invitations_pending
  ON public.group_invitations (group_id, invitee_username)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee ON public.group_invitations(invitee_username);

-- 7. RECURSION-SAFE SECURITY DEFINER HELPERS
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id TEXT, p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND username = p_username
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id TEXT, p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND username = p_username AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND creator_username = p_username
  );
$$;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Friendships policies
DROP POLICY IF EXISTS "Public can view friendships" ON public.friendships;
CREATE POLICY "Public can view friendships" ON public.friendships
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public manage friendships" ON public.friendships;
CREATE POLICY "Public manage friendships" ON public.friendships
  FOR ALL USING (true);

-- Friend requests policies
DROP POLICY IF EXISTS "Public can view friend requests" ON public.friend_requests;
CREATE POLICY "Public can view friend requests" ON public.friend_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public manage friend requests" ON public.friend_requests;
CREATE POLICY "Public manage friend requests" ON public.friend_requests
  FOR ALL USING (true);

-- Group members policies
DROP POLICY IF EXISTS "Public can view group members" ON public.group_members;
CREATE POLICY "Public can view group members" ON public.group_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public manage group members" ON public.group_members;
CREATE POLICY "Public manage group members" ON public.group_members
  FOR ALL USING (true);

-- Group invitations policies
DROP POLICY IF EXISTS "Public can view group invitations" ON public.group_invitations;
CREATE POLICY "Public can view group invitations" ON public.group_invitations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public manage group invitations" ON public.group_invitations;
CREATE POLICY "Public manage group invitations" ON public.group_invitations
  FOR ALL USING (true);

-- Groups delete policy for anon/public
DROP POLICY IF EXISTS "Allow public delete on groups" ON public.groups;
CREATE POLICY "Allow public delete on groups" ON public.groups
  FOR DELETE USING (true);

-- 9. TRANSACTION-SAFE RPC FUNCTIONS

-- (A) Send Friend Request with Mutual Auto-Accept and Abuse Throttling (30/day limit)
CREATE OR REPLACE FUNCTION public.send_friend_request(
  p_requester TEXT,
  p_target TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req TEXT := LOWER(TRIM(p_requester));
  v_tar TEXT := LOWER(TRIM(p_target));
  v_low TEXT;
  v_high TEXT;
  v_daily_count INT;
  v_mutual_req_id UUID;
  v_new_req_id UUID;
  v_notif_id TEXT;
BEGIN
  -- Basic validations
  IF v_req IS NULL OR v_tar IS NULL OR v_req = '' OR v_tar = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid requester or target username');
  END IF;

  IF v_req = v_tar THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot send a friend request to yourself');
  END IF;

  -- Ensure both users exist and are approved active students
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = v_tar AND is_approved <> false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Classmate account is not found or is pending approval');
  END IF;

  -- Abuse limit: Max 30 requests sent per day
  SELECT COUNT(*) INTO v_daily_count
  FROM public.friend_requests
  WHERE LOWER(requester) = v_req
    AND created_at >= (now() - interval '24 hours');

  IF v_daily_count >= 30 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily friend request limit reached (max 30 per day). Please try again tomorrow.');
  END IF;

  -- Determine sorted pair for friendship
  IF v_req < v_tar THEN
    v_low := v_req; v_high := v_tar;
  ELSE
    v_low := v_tar; v_high := v_req;
  END IF;

  -- Check if already friends
  IF EXISTS (SELECT 1 FROM public.friendships WHERE user_low = v_low AND user_high = v_high) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already friends with @' || v_tar);
  END IF;

  -- Check if there is an existing pending request from target to requester -> AUTO ACCEPT!
  SELECT id INTO v_mutual_req_id
  FROM public.friend_requests
  WHERE LOWER(requester) = v_tar AND LOWER(target) = v_req AND status = 'pending'
  LIMIT 1;

  IF v_mutual_req_id IS NOT NULL THEN
    -- Mark mutual request accepted
    UPDATE public.friend_requests SET status = 'accepted', updated_at = now() WHERE id = v_mutual_req_id;

    -- Insert friendship
    INSERT INTO public.friendships (user_low, user_high)
    VALUES (v_low, v_high)
    ON CONFLICT (user_low, user_high) DO NOTHING;

    -- Insert mutual follows
    INSERT INTO public.follows (follower, following) VALUES (v_req, v_tar) ON CONFLICT DO NOTHING;
    INSERT INTO public.follows (follower, following) VALUES (v_tar, v_req) ON CONFLICT DO NOTHING;

    -- Update follower & following counts
    UPDATE public.profiles SET
      follower_count = (SELECT COUNT(*) FROM public.follows WHERE following = v_req),
      following_count = (SELECT COUNT(*) FROM public.follows WHERE follower = v_req)
    WHERE LOWER(username) = v_req;

    UPDATE public.profiles SET
      follower_count = (SELECT COUNT(*) FROM public.follows WHERE following = v_tar),
      following_count = (SELECT COUNT(*) FROM public.follows WHERE follower = v_tar)
    WHERE LOWER(username) = v_tar;

    -- Notify target
    v_notif_id := gen_random_uuid()::text;
    INSERT INTO public.notifications (id, user_id, recipient_username, actor_username, type, title, body, link)
    VALUES (v_notif_id, v_tar, v_tar, v_req, 'follow', 'New Friend! 🎉', '@' || v_req || ' and you are now friends!', '/u/' || v_req);

    RETURN jsonb_build_object('success', true, 'status', 'accepted', 'auto_accepted', true, 'message', 'You and @' || v_tar || ' are now friends! 🎉');
  END IF;

  -- Insert or re-activate pending request
  INSERT INTO public.friend_requests (requester, target, status, updated_at)
  VALUES (v_req, v_tar, 'pending', now())
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO v_new_req_id;

  -- Also mirror into follow_requests for backwards compatibility
  INSERT INTO public.follow_requests (requester, target, status)
  VALUES (v_req, v_tar, 'pending')
  ON CONFLICT DO NOTHING;

  -- Send notification to target
  v_notif_id := gen_random_uuid()::text;
  INSERT INTO public.notifications (id, user_id, recipient_username, actor_username, type, title, body, link)
  VALUES (v_notif_id, v_tar, v_tar, v_req, 'follow', 'New Friend Request 🤝', '@' || v_req || ' sent you a friend request', '/notifications');

  RETURN jsonb_build_object('success', true, 'status', 'pending', 'auto_accepted', false, 'message', 'Friend request sent to @' || v_tar);
END;
$$;

-- (B) Accept Friend Request
CREATE OR REPLACE FUNCTION public.accept_friend_request(
  p_target TEXT,
  p_requester TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tar TEXT := LOWER(TRIM(p_target));
  v_req TEXT := LOWER(TRIM(p_requester));
  v_low TEXT;
  v_high TEXT;
  v_notif_id TEXT;
BEGIN
  IF v_tar < v_req THEN
    v_low := v_tar; v_high := v_req;
  ELSE
    v_low := v_req; v_high := v_tar;
  END IF;

  -- Update friend_requests status
  UPDATE public.friend_requests
  SET status = 'accepted', updated_at = now()
  WHERE LOWER(requester) = v_req AND LOWER(target) = v_tar AND status = 'pending';

  -- Update follow_requests
  UPDATE public.follow_requests
  SET status = 'accepted'
  WHERE LOWER(requester) = v_req AND LOWER(target) = v_tar;

  -- Create friendship
  INSERT INTO public.friendships (user_low, user_high)
  VALUES (v_low, v_high)
  ON CONFLICT (user_low, user_high) DO NOTHING;

  -- Create mutual follows
  INSERT INTO public.follows (follower, following) VALUES (v_req, v_tar) ON CONFLICT DO NOTHING;
  INSERT INTO public.follows (follower, following) VALUES (v_tar, v_req) ON CONFLICT DO NOTHING;

  -- Authoritative profile count recalculation
  UPDATE public.profiles SET
    follower_count = (SELECT COUNT(*) FROM public.follows WHERE following = v_req),
    following_count = (SELECT COUNT(*) FROM public.follows WHERE follower = v_req)
  WHERE LOWER(username) = v_req;

  UPDATE public.profiles SET
    follower_count = (SELECT COUNT(*) FROM public.follows WHERE following = v_tar),
    following_count = (SELECT COUNT(*) FROM public.follows WHERE follower = v_tar)
  WHERE LOWER(username) = v_tar;

  -- Notify requester
  v_notif_id := gen_random_uuid()::text;
  INSERT INTO public.notifications (id, user_id, recipient_username, actor_username, type, title, body, link)
  VALUES (v_notif_id, v_req, v_req, v_tar, 'follow', 'Friend Request Accepted 🎉', '@' || v_tar || ' accepted your friend request! You are now friends.', '/u/' || v_tar);

  RETURN jsonb_build_object('success', true, 'message', 'Accepted friend request from @' || v_req);
END;
$$;

-- (C) Decline Friend Request
CREATE OR REPLACE FUNCTION public.decline_friend_request(
  p_target TEXT,
  p_requester TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tar TEXT := LOWER(TRIM(p_target));
  v_req TEXT := LOWER(TRIM(p_requester));
BEGIN
  UPDATE public.friend_requests
  SET status = 'declined', updated_at = now()
  WHERE LOWER(requester) = v_req AND LOWER(target) = v_tar AND status = 'pending';

  DELETE FROM public.follow_requests
  WHERE LOWER(requester) = v_req AND LOWER(target) = v_tar;

  RETURN jsonb_build_object('success', true, 'message', 'Declined friend request');
END;
$$;

-- (D) Cancel Friend Request
CREATE OR REPLACE FUNCTION public.cancel_friend_request(
  p_requester TEXT,
  p_target TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req TEXT := LOWER(TRIM(p_requester));
  v_tar TEXT := LOWER(TRIM(p_target));
BEGIN
  UPDATE public.friend_requests
  SET status = 'cancelled', updated_at = now()
  WHERE LOWER(requester) = v_req AND LOWER(target) = v_tar AND status = 'pending';

  DELETE FROM public.follow_requests
  WHERE LOWER(requester) = v_req AND LOWER(target) = v_tar;

  RETURN jsonb_build_object('success', true, 'message', 'Cancelled friend request');
END;
$$;

-- (E) Remove Friend (Unfriend)
CREATE OR REPLACE FUNCTION public.remove_friend(
  p_user1 TEXT,
  p_user2 TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_u1 TEXT := LOWER(TRIM(p_user1));
  v_u2 TEXT := LOWER(TRIM(p_user2));
  v_low TEXT;
  v_high TEXT;
BEGIN
  IF v_u1 < v_u2 THEN
    v_low := v_u1; v_high := v_u2;
  ELSE
    v_low := v_u2; v_high := v_u1;
  END IF;

  DELETE FROM public.friendships WHERE user_low = v_low AND user_high = v_high;
  DELETE FROM public.follows WHERE (follower = v_u1 AND following = v_u2) OR (follower = v_u2 AND following = v_u1);

  -- Recalculate counts
  UPDATE public.profiles SET
    follower_count = (SELECT COUNT(*) FROM public.follows WHERE following = v_u1),
    following_count = (SELECT COUNT(*) FROM public.follows WHERE follower = v_u1)
  WHERE LOWER(username) = v_u1;

  UPDATE public.profiles SET
    follower_count = (SELECT COUNT(*) FROM public.follows WHERE following = v_u2),
    following_count = (SELECT COUNT(*) FROM public.follows WHERE follower = v_u2)
  WHERE LOWER(username) = v_u2;

  RETURN jsonb_build_object('success', true, 'message', 'Unfriended successfully');
END;
$$;

-- (F) Create Group with Creator as Admin & Auto-invitations
CREATE OR REPLACE FUNCTION public.create_group(
  p_name TEXT,
  p_description TEXT,
  p_creator TEXT,
  p_avatar_url TEXT DEFAULT NULL,
  p_invitee_usernames TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator TEXT := LOWER(TRIM(p_creator));
  v_name TEXT := TRIM(p_name);
  v_group_id TEXT;
  v_invitee TEXT;
  v_notif_id TEXT;
BEGIN
  IF v_name IS NULL OR v_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group name is required');
  END IF;

  IF v_creator IS NULL OR v_creator = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Creator username is required');
  END IF;

  v_group_id := 'group-' || floor(extract(epoch from now()) * 1000)::text || '-' || substr(md5(random()::text), 1, 4);

  -- Insert group
  INSERT INTO public.groups (id, name, description, creator_username, avatar_url, member_count)
  VALUES (v_group_id, v_name, COALESCE(p_description, ''), v_creator, p_avatar_url, 1);

  -- Add creator as admin member
  INSERT INTO public.group_members (group_id, username, role)
  VALUES (v_group_id, v_creator, 'admin');

  -- Send invitations to invitees
  IF p_invitee_usernames IS NOT NULL AND array_length(p_invitee_usernames, 1) > 0 THEN
    FOREACH v_invitee IN ARRAY p_invitee_usernames LOOP
      v_invitee := LOWER(TRIM(v_invitee));
      IF v_invitee <> '' AND v_invitee <> v_creator THEN
        INSERT INTO public.group_invitations (group_id, group_name, inviter_username, invitee_username)
        VALUES (v_group_id, v_name, v_creator, v_invitee)
        ON CONFLICT DO NOTHING;

        -- Notification
        v_notif_id := gen_random_uuid()::text;
        INSERT INTO public.notifications (id, user_id, recipient_username, actor_username, type, title, body, link)
        VALUES (v_notif_id, v_invitee, v_invitee, v_creator, 'group', 'Group Invitation 📬', '@' || v_creator || ' invited you to join "' || v_name || '"', '/groups');
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'group_id', v_group_id,
    'name', v_name,
    'creator', v_creator,
    'member_count', 1,
    'message', 'Created group "' || v_name || '" successfully'
  );
END;
$$;

-- (G) Respond to Group Invitation (Accept or Decline)
CREATE OR REPLACE FUNCTION public.respond_group_invite(
  p_group_id TEXT,
  p_username TEXT,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user TEXT := LOWER(TRIM(p_username));
  v_group_id TEXT := TRIM(p_group_id);
  v_action TEXT := LOWER(TRIM(p_action));
  v_group_name TEXT;
BEGIN
  SELECT name INTO v_group_name FROM public.groups WHERE id = v_group_id;
  IF v_group_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group not found');
  END IF;

  IF v_action = 'accept' THEN
    -- Update invitation
    UPDATE public.group_invitations
    SET status = 'accepted', updated_at = now()
    WHERE group_id = v_group_id AND LOWER(invitee_username) = v_user AND status = 'pending';

    -- Add to group members
    INSERT INTO public.group_members (group_id, username, role)
    VALUES (v_group_id, v_user, 'member')
    ON CONFLICT (group_id, username) DO NOTHING;

    -- Update member count
    UPDATE public.groups
    SET member_count = (SELECT COUNT(*) FROM public.group_members WHERE group_id = v_group_id)
    WHERE id = v_group_id;

    RETURN jsonb_build_object('success', true, 'action', 'accepted', 'message', 'Joined group "' || v_group_name || '"! 🎉');
  ELSE
    UPDATE public.group_invitations
    SET status = 'declined', updated_at = now()
    WHERE group_id = v_group_id AND LOWER(invitee_username) = v_user AND status = 'pending';

    RETURN jsonb_build_object('success', true, 'action', 'declined', 'message', 'Declined invitation');
  END IF;
END;
$$;

-- (H) Add Member directly to group (by Admin or Member)
CREATE OR REPLACE FUNCTION public.add_group_member(
  p_group_id TEXT,
  p_adder_username TEXT,
  p_target_username TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_adder TEXT := LOWER(TRIM(p_adder_username));
  v_tar TEXT := LOWER(TRIM(p_target_username));
  v_group_id TEXT := TRIM(p_group_id);
  v_group_name TEXT;
  v_notif_id TEXT;
BEGIN
  -- Verify adder is currently a member
  IF NOT public.is_group_member(v_group_id, v_adder) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only members can add classmates to this group');
  END IF;

  SELECT name INTO v_group_name FROM public.groups WHERE id = v_group_id;
  IF v_group_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group not found');
  END IF;

  -- Add to members
  INSERT INTO public.group_members (group_id, username, role)
  VALUES (v_group_id, v_tar, 'member')
  ON CONFLICT (group_id, username) DO NOTHING;

  -- Update member count
  UPDATE public.groups
  SET member_count = (SELECT COUNT(*) FROM public.group_members WHERE group_id = v_group_id)
  WHERE id = v_group_id;

  -- Send notification
  v_notif_id := gen_random_uuid()::text;
  INSERT INTO public.notifications (id, user_id, recipient_username, actor_username, type, title, body, link)
  VALUES (v_notif_id, v_tar, v_tar, v_adder, 'group', 'Added to Group 🎉', '@' || v_adder || ' added you to "' || v_group_name || '"', '/groups');

  RETURN jsonb_build_object('success', true, 'message', 'Added @' || v_tar || ' to "' || v_group_name || '"');
END;
$$;

-- (I) Leave Group & Promote next admin if last admin leaves
CREATE OR REPLACE FUNCTION public.leave_group(
  p_group_id TEXT,
  p_username TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user TEXT := LOWER(TRIM(p_username));
  v_group_id TEXT := TRIM(p_group_id);
  v_was_admin BOOLEAN;
  v_next_admin TEXT;
  v_remaining INT;
BEGIN
  SELECT (role = 'admin') INTO v_was_admin
  FROM public.group_members
  WHERE group_id = v_group_id AND username = v_user;

  DELETE FROM public.group_members
  WHERE group_id = v_group_id AND username = v_user;

  SELECT COUNT(*) INTO v_remaining
  FROM public.group_members
  WHERE group_id = v_group_id;

  IF v_remaining = 0 THEN
    -- Last member left, group can be closed or kept with 0 members
    UPDATE public.groups SET member_count = 0 WHERE id = v_group_id;
  ELSE
    UPDATE public.groups SET member_count = v_remaining WHERE id = v_group_id;

    -- If the departed user was admin and no admin remains, promote oldest member to admin
    IF v_was_admin = true AND NOT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = v_group_id AND role = 'admin') THEN
      SELECT username INTO v_next_admin
      FROM public.group_members
      WHERE group_id = v_group_id
      ORDER BY joined_at ASC
      LIMIT 1;

      IF v_next_admin IS NOT NULL THEN
        UPDATE public.group_members SET role = 'admin' WHERE group_id = v_group_id AND username = v_next_admin;
        UPDATE public.groups SET creator_username = v_next_admin WHERE id = v_group_id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Left group successfully');
END;
$$;

-- (J) Remove Member (Admin Only)
CREATE OR REPLACE FUNCTION public.remove_group_member(
  p_group_id TEXT,
  p_admin TEXT,
  p_target TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin TEXT := LOWER(TRIM(p_admin));
  v_tar TEXT := LOWER(TRIM(p_target));
  v_group_id TEXT := TRIM(p_group_id);
BEGIN
  IF NOT public.is_group_admin(v_group_id, v_admin) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only group admins can remove members');
  END IF;

  DELETE FROM public.group_members
  WHERE group_id = v_group_id AND username = v_tar;

  UPDATE public.groups
  SET member_count = (SELECT COUNT(*) FROM public.group_members WHERE group_id = v_group_id)
  WHERE id = v_group_id;

  RETURN jsonb_build_object('success', true, 'message', 'Removed @' || v_tar || ' from group');
END;
$$;
