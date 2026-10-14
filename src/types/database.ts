/**
 * Database types for DPS Buzz.
 * These types mirror the Supabase Postgres tables.
 * In production, generate these automatically with `supabase gen types typescript`.
 */

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  class: string | null;
  section: string | null;
  admission_number?: string;   // Hidden from other students
  role?: 'student' | 'admin';  // Hidden from other students
  is_verified: boolean;
  is_approved: boolean;
  is_banned?: boolean;         // Hidden from other students
  follower_count: number;
  following_count: number;
  post_count: number;
  spirit_points: number;
  profile_frame: string;
  story_ring_style: string;
  dark_mode?: boolean;
  notifications_enabled?: boolean;
  created_at: string;
  updated_at?: string;
}

/** Public profile view - excludes sensitive fields */
export interface PublicProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  class: string | null;
  section: string | null;
  is_verified: boolean;
  is_approved: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  spirit_points: number;
  profile_frame: string;
  story_ring_style: string;
  created_at: string;
}

export interface StudentRoster {
  id: string;
  name: string;
  class: string;
  section: string;
  admission_number: string;
  is_claimed: boolean;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'comment' | 'story' | 'message' | 'profile';
  target_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  admin_action: 'hide' | 'delete' | 'warn' | 'ban' | null;
  admin_notes: string | null;
  created_at: string;
}

export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'milestone' | 'achievement' | 'special' | 'surprise';
  trigger_condition: string | null;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'notice' | 'badge' | 'reward' | 'mention' | 'system';
  title: string;
  body: string | null;
  link: string | null;
  actor_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AppSettings {
  key: string;
  value: string;
  updated_at: string;
}

/** Sign-up validation result from the RPC function */
export interface SignupValidationResult {
  valid: boolean;
  roster_match?: boolean;
  error?: string;
  message?: string;
  class?: string;
  section?: string;
  name?: string;
}
