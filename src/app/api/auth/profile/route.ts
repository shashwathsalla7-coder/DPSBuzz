import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';
import { getServerStore, upsertServerProfile, recordServerNewUserAlert } from '@/lib/serverStore';
import { getD1Profiles, getD1ProfileByUsername, upsertD1Profile, isD1Configured } from '@/lib/cloudflare/dbService';

const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawParam = searchParams.get('username') || searchParams.get('id') || '';
    const username = rawParam.toLowerCase().trim().replace(/^@+/, '');
    const store = await getServerStore();

    if (!username) {
      // 1. Fetch from Cloudflare D1 first (never pauses)
      if (isD1Configured()) {
        try {
          const d1Profiles = await getD1Profiles();
          if (d1Profiles.length > 0) {
            const map = new Map<string, any>();
            for (const sp of store.profiles) map.set(sp.username.toLowerCase(), sp);
            for (const dp of d1Profiles) map.set(dp.username.toLowerCase(), dp);
            return NextResponse.json({ success: true, profiles: Array.from(map.values()) }, { headers: NO_CACHE_HEADERS });
          }
        } catch {}
      }

      // 2. Merge Supabase DB profiles with server store if available
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: dbProfiles } = await supabase.from('profiles').select('*');
          if (Array.isArray(dbProfiles) && dbProfiles.length > 0) {
            const map = new Map<string, any>();
            for (const sp of store.profiles) map.set(sp.username.toLowerCase(), sp);
            for (const dp of dbProfiles) {
              const u = dp.username.toLowerCase();
              const existing = map.get(u);
              map.set(u, {
                id: dp.id,
                username: dp.username,
                fullName: dp.full_name || dp.username,
                avatar: dp.avatar_url || existing?.avatar || null,
                bio: dp.bio || existing?.bio || '',
                class: dp.class || existing?.class || '8',
                section: dp.section || existing?.section || 'A',
                role: dp.role || existing?.role || 'student',
                isVerified: dp.is_verified ?? existing?.isVerified ?? true,
                isApproved: dp.is_approved ?? existing?.isApproved ?? true,
                isPrivate: dp.is_private ?? existing?.isPrivate ?? false,
                followerCount: dp.follower_count || existing?.followerCount || 0,
                followingCount: dp.following_count || existing?.followingCount || 0,
                postCount: dp.post_count || existing?.postCount || 0,
                spiritPoints: dp.spirit_points || existing?.spiritPoints || 50,
                createdAt: dp.created_at || existing?.createdAt,
              });
            }
            return NextResponse.json({ success: true, profiles: Array.from(map.values()) }, { headers: NO_CACHE_HEADERS });
          }
        } catch {}
      }
      return NextResponse.json({ success: true, profiles: store.profiles }, { headers: NO_CACHE_HEADERS });
    }

    // 1. Direct fetch from Cloudflare D1 (never pauses, fast edge)
    if (isD1Configured()) {
      try {
        const d1Profile = await getD1ProfileByUsername(username);
        if (d1Profile) {
          upsertServerProfile(d1Profile as any).catch(() => {});
          return NextResponse.json({ success: true, profile: d1Profile }, { headers: NO_CACHE_HEADERS });
        }
      } catch (d1Err) {
        console.warn('Cloudflare D1 profile lookup notice:', d1Err);
      }
    }

    // 2. Direct fetch from Supabase profiles as source of truth (tolerant of case & id)
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase.from('profiles').select('*');
      if (username.length === 36 && username.includes('-')) {
        query = query.or(`id.eq.${username},username.ilike.${username}`);
      } else {
        query = query.ilike('username', username);
      }
      const { data: dbProfile } = await query.maybeSingle();

      if (dbProfile) {
        const mapped = {
          id: dbProfile.id,
          username: dbProfile.username,
          fullName: dbProfile.full_name,
          avatar: dbProfile.avatar_url,
          bio: dbProfile.bio,
          class: dbProfile.class || '8',
          section: dbProfile.section || 'A',
          role: dbProfile.role || 'student',
          isVerified: Boolean(dbProfile.is_verified),
          isApproved: Boolean(dbProfile.is_approved ?? true),
          isPrivate: Boolean(dbProfile.is_private ?? false),
          followerCount: dbProfile.follower_count || 0,
          followingCount: dbProfile.following_count || 0,
          postCount: dbProfile.post_count || 0,
          spiritPoints: dbProfile.spirit_points || 50,
          createdAt: dbProfile.created_at,
        };
        // Auto-cache to server store
        upsertServerProfile(mapped as any).catch(() => {});
        return NextResponse.json({ success: true, profile: mapped }, { headers: NO_CACHE_HEADERS });
      }
    }

    // 2. Check local serverStore fallback
    const match = store.profiles.find((p) => p.username.toLowerCase().replace(/^@+/, '') === username);
    if (match) {
      return NextResponse.json({ success: true, profile: match }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404, headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, isNewSignup } = body;
    if (!profile || !profile.username) {
      return NextResponse.json({ success: false, error: 'Invalid profile object' }, { status: 400 });
    }

    const cleanUser = profile.username.toLowerCase().trim();

    // 1. Persist to serverStore
    await upsertServerProfile({ ...profile, username: cleanUser });

    // 2. Direct persistence to Cloudflare D1 (permanent text database)
    if (isD1Configured()) {
      try {
        await upsertD1Profile({ ...profile, username: cleanUser });
      } catch (d1Err) {
        console.warn('Cloudflare D1 profile upsert warning:', d1Err);
      }
    }

    // 3. Direct persistence to Supabase profiles table (optional fallback)
    const supabase = getSupabase();
    if (supabase) {
      try {
        const userUuid = profile.id && profile.id.length === 36 ? profile.id : uuidv5(cleanUser, UUID_NAMESPACE);
        await supabase.from('profiles').upsert({
          id: userUuid,
          username: cleanUser,
          full_name: profile.fullName || cleanUser,
          avatar_url: profile.avatar || null,
          bio: profile.bio || '',
          class: profile.class || '8',
          section: profile.section || 'A',
          role: profile.role || 'student',
          is_verified: Boolean(profile.isVerified),
          is_approved: Boolean(profile.isApproved ?? true),
          is_private: Boolean(profile.isPrivate ?? false),
          follower_count: profile.followerCount || 0,
          following_count: profile.followingCount || 0,
          post_count: profile.postCount || 0,
          spirit_points: profile.spiritPoints || 50,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'username' });
      } catch (sbErr) {
        console.warn('Supabase profile upsert warning:', sbErr);
      }
    }

    // Trigger new user signup alert safely
    if (isNewSignup) {
      try {
        await recordServerNewUserAlert(profile);
      } catch (alertError) {
        console.error('Non-blocking error triggering new user signup alert:', alertError);
      }
    }

    return NextResponse.json({ success: true, profile, alertTriggered: Boolean(isNewSignup) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
