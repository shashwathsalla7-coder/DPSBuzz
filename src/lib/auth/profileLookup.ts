import { createClient } from '@/lib/db/d1Supabase';
import { getD1ProfileByUsername, isD1Configured } from '@/lib/cloudflare/dbService';
import { getServerStore } from '@/lib/serverStore';
import type { Profile } from '@/lib/dataStore';
import type { SessionRole } from './session';

const supabaseUrl = 'd1'; // data lives in Cloudflare D1
const supabaseKey = 'd1';

const USERNAME_RE = /^[a-z0-9._]{3,30}$/;

export function normalizeUsername(input: unknown): string {
  return String(input || '').toLowerCase().trim().replace(/^@+/, '');
}

export function isValidUsername(u: string): boolean {
  return USERNAME_RE.test(u);
}

/**
 * Finds a REAL stored profile (D1 → Supabase → serverStore). Never returns the
 * synthesized "teacher_*" fallback profiles, so those can't be claimed.
 * Follows alias_of to the primary account.
 */
export async function findStoredProfile(rawUsername: string, depth = 0): Promise<Profile | null> {
  const username = normalizeUsername(rawUsername);
  if (!username || depth > 2) return null;

  if (isD1Configured()) {
    const p = (await getD1ProfileByUsername(username)) as (Profile & { alias_of?: string | null }) | null;
    if (p) {
      if (p.alias_of) return findStoredProfile(p.alias_of, depth + 1);
      return p;
    }
  }

  if (supabaseUrl && supabaseKey) {
    try {
      const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
      const { data } = await sb.from('profiles').select('*').eq('username', username).maybeSingle();
      if (data) {
        return {
          id: data.id,
          username: data.username,
          fullName: data.full_name,
          avatar: data.avatar_url,
          bio: data.bio || '',
          class: data.class || '8',
          section: data.section || 'A',
          role: data.role || 'student',
          isVerified: Boolean(data.is_verified),
          isApproved: Boolean(data.is_approved ?? true),
          isPrivate: Boolean(data.is_private ?? false),
          followerCount: data.follower_count || 0,
          followingCount: data.following_count || 0,
          postCount: data.post_count || 0,
          spiritPoints: data.spirit_points || 50,
          createdAt: data.created_at,
        } as Profile;
      }
    } catch {
      // fall through
    }
  }

  const store = await getServerStore();
  return store.profiles.find((p) => normalizeUsername(p.username) === username) || null;
}

export function roleOf(profile: Profile | null): SessionRole {
  const r = String((profile as any)?.role || 'student');
  if (r === 'admin') return 'admin';
  if (r === 'teacher') return 'teacher';
  return 'student';
}

export const ADMIN_USERNAME = normalizeUsername(process.env.ADMIN_USERNAME || 'shashwath71845');
