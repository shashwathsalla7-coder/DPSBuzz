import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import { getServerStore, upsertServerProfile, recordServerNewUserAlert } from '@/lib/serverStore';
import { getD1Profiles, getD1ProfileByUsername, upsertD1Profile, isD1Configured } from '@/lib/cloudflare/dbService';
import { getSession, setSessionCookie, canActAs, isAdmin } from '@/lib/auth/session';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { credentialsAvailable, getCredential, setPassword } from '@/lib/auth/credentials';
import { ADMIN_USERNAME, findStoredProfile, isValidUsername, normalizeUsername } from '@/lib/auth/profileLookup';
import { checkRateLimit, getClientIp, isValidMediaUrl } from '@/lib/security';

const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'ogfaxmjw';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

if (CLOUD_NAME && API_KEY && API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
}

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

    // Duplicate check by student full name and class
    const checkName = searchParams.get('checkName')?.toLowerCase().trim();
    const checkClass = searchParams.get('class');
    const checkSection = searchParams.get('section')?.toUpperCase();

    // Logged-out visitors (sign-up page) may only ask "is this username taken?".
    const viewerSession = getSession(req);
    if (!viewerSession && !(checkName && checkClass)) {
      if (!username) {
        return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401, headers: NO_CACHE_HEADERS });
      }
      const exists = Boolean(await findStoredProfile(username)) || username === ADMIN_USERNAME;
      return NextResponse.json({ success: true, exists }, { headers: NO_CACHE_HEADERS });
    }

    // ------------------------------------------------------------------------
    // FAST PATH: Lookup single user in Cloudflare D1 first (<100ms)
    // ------------------------------------------------------------------------
    if (username && !checkName) {
      if (isD1Configured()) {
        try {
          const d1Profile = await getD1ProfileByUsername(username);
          if (d1Profile && (d1Profile as any).alias_of) {
            const primaryUser = (d1Profile as any).alias_of;
            const primaryProfile = await getD1ProfileByUsername(primaryUser);
            if (primaryProfile) {
              return NextResponse.json(
                { success: true, profile: primaryProfile, resolvedFromAlias: username },
                { headers: NO_CACHE_HEADERS }
              );
            }
          }
          if (d1Profile) {
            return NextResponse.json({ success: true, profile: d1Profile }, { headers: NO_CACHE_HEADERS });
          }
        } catch (d1Err) {
          console.warn('Cloudflare D1 profile lookup notice:', d1Err);
        }
      }
    }

    const store = await getServerStore();

    if (checkName && checkClass) {
      // 1. Check Cloudflare D1
      if (isD1Configured()) {
        try {
          const d1Profiles = await getD1Profiles();
          const match = d1Profiles.find((p: any) =>
            (p.fullName || p.full_name || '').toLowerCase().trim() === checkName &&
            String(p.class) === String(checkClass) &&
            (!checkSection || p.section === checkSection) &&
            p.role !== 'test' &&
            !p.alias_of
          );
          if (match) {
            return NextResponse.json({
              success: true,
              exists: true,
              username: viewerSession ? match.username : undefined,
              fullName: match.fullName || (match as any).full_name,
              class: match.class,
              section: match.section,
            }, { headers: NO_CACHE_HEADERS });
          }
        } catch {}
      }

      // 2. Check store profiles
      const storeMatch = store.profiles.find((p) =>
        (p.fullName || '').toLowerCase().trim() === checkName &&
        String(p.class) === String(checkClass) &&
        (!checkSection || p.section === checkSection) &&
        (p as any).role !== 'test'
      );
      if (storeMatch) {
        return NextResponse.json({
          success: true,
          exists: true,
          username: viewerSession ? storeMatch.username : undefined,
          fullName: storeMatch.fullName,
          class: storeMatch.class,
          section: storeMatch.section,
        }, { headers: NO_CACHE_HEADERS });
      }

      return NextResponse.json({ success: true, exists: false }, { headers: NO_CACHE_HEADERS });
    }

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
        let d1Profile = await getD1ProfileByUsername(username);
        // If this username is an alias of another account, resolve to primary account
        if (d1Profile && (d1Profile as any).alias_of) {
          const primaryUser = (d1Profile as any).alias_of;
          const primaryProfile = await getD1ProfileByUsername(primaryUser);
          if (primaryProfile) {
            return NextResponse.json({ success: true, profile: primaryProfile, resolvedFromAlias: username }, { headers: NO_CACHE_HEADERS });
          }
        }
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
        query = /^[0-9a-f-]{36}$/i.test(username)
          ? query.eq('id', username)
          : query.ilike('username', username.replace(/[%_\\]/g, '\\$&'));
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

    // 3. Fallback for generated Class Teachers (teacher_<grade>_<sec>)
    if (username.startsWith('teacher_')) {
      const clean = username.replace('teacher_', '');
      const parts = clean.split('_');
      const gradePart = parts[0] || 'Faculty';
      const clsDisplay = isNaN(Number(gradePart)) ? gradePart.toUpperCase() : `Class ${gradePart}`;
      const secPart = (parts[1] || 'A').toUpperCase();
      const teacherProfile = {
        id: `teach_${gradePart}_${secPart}`,
        username,
        fullName: `Faculty (${clsDisplay}-${secPart} Class Teacher)`,
        avatar: null,
        bio: `Official Class Teacher of ${clsDisplay}-${secPart} • Senior Faculty • DPS Campus`,
        class: gradePart,
        section: secPart,
        gradeDisplay: clsDisplay,
        role: 'teacher',
        isVerified: true,
        isApproved: true,
        followerCount: 40,
        followingCount: 40,
        postCount: 0,
        spiritPoints: 1000,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, profile: teacherProfile }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404, headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { isNewSignup } = body;
    const profile = body?.profile;
    if (!profile || !profile.username) {
      return NextResponse.json({ success: false, error: 'Invalid profile object' }, { status: 400 });
    }

    const cleanUser = normalizeUsername(profile.username);
    const session = getSession(req);

    if (isNewSignup) {
      // ---- New account: validate on the server, store a hashed password, start a session ----
      if (!isValidUsername(cleanUser)) {
        return NextResponse.json(
          { success: false, error: 'Username must be 3–30 characters: letters, numbers, dots or underscores.' },
          { status: 400 }
        );
      }
      const schoolCode = String(process.env.SCHOOL_INVITE_CODE || 'DPS71845').trim().toUpperCase();
      if (String(body?.inviteCode || '').trim().toUpperCase() !== schoolCode) {
        return NextResponse.json({ success: false, error: 'Invalid school code. Ask your class teacher for it.' }, { status: 403 });
      }
      const weak = validatePasswordStrength(body?.password);
      if (weak) return NextResponse.json({ success: false, error: weak }, { status: 400 });
      if (cleanUser === ADMIN_USERNAME || cleanUser.startsWith('teacher_') || cleanUser === 'madam_principal') {
        return NextResponse.json({ success: false, error: 'This username is reserved.' }, { status: 400 });
      }
      if (!credentialsAvailable()) {
        return NextResponse.json({ success: false, error: 'Sign-up is temporarily unavailable.' }, { status: 503 });
      }
      const ip = getClientIp(req);
      if (!checkRateLimit(`signup:ip:${ip}`, 500, 60 * 60 * 1000).allowed) {
        return NextResponse.json({ success: false, error: 'Too many sign-ups from this network. Try again later.' }, { status: 429 });
      }
      if (await findStoredProfile(cleanUser)) {
        return NextResponse.json({ success: false, error: 'This username is already taken.' }, { status: 409 });
      }
      try {
        if (await getCredential(cleanUser)) {
          return NextResponse.json({ success: false, error: 'This username is already taken.' }, { status: 409 });
        }
        await setPassword(cleanUser, await hashPassword(body.password));
      } catch (err) {
        console.error('[auth/profile] signup credential error:', err);
        return NextResponse.json({ success: false, error: 'Sign-up is temporarily unavailable.' }, { status: 503 });
      }
    } else if (!canActAs(session, cleanUser)) {
      // ---- Profile update: only the owner (or an admin) may change it ----
      return NextResponse.json({ success: false, error: 'You can only edit your own profile.' }, { status: 403 });
    }

    // Students can never grant themselves privileges or inflate their counters.
    if (!isAdmin(session)) {
      const existing = isNewSignup ? null : await findStoredProfile(cleanUser);
      profile.role = existing ? (existing as any).role || 'student' : 'student';
      profile.isVerified = existing ? Boolean((existing as any).isVerified) : true;
      profile.isApproved = existing ? Boolean((existing as any).isApproved ?? true) : true;
      profile.followerCount = existing ? existing.followerCount : 0;
      profile.followingCount = existing ? existing.followingCount : 0;
      profile.postCount = existing ? existing.postCount : 0;
      profile.spiritPoints = existing ? existing.spiritPoints : 50;
      if (existing?.id) profile.id = existing.id;
    }
    delete profile.password;

    // Guard: Convert any base64 avatar to Cloudinary CDN URL before saving
    let finalAvatar = profile.avatar || null;
    if (finalAvatar && typeof finalAvatar === 'string' && finalAvatar.startsWith('data:image/')) {
      try {
        if (API_KEY && API_SECRET) {
          const uploadRes = await cloudinary.uploader.upload(finalAvatar, {
            folder: 'dpsbuzz/avatars',
            public_id: `avatar_${cleanUser}_${Date.now()}`,
            resource_type: 'image',
          });
          finalAvatar = uploadRes.secure_url;
        } else {
          finalAvatar = null;
        }
      } catch (uploadErr) {
        console.warn('[auth/profile] Base64 avatar upload failed:', uploadErr);
        finalAvatar = null;
      }
    } else if (finalAvatar && !isValidMediaUrl(finalAvatar)) {
      finalAvatar = null;
    }

    const cleanProfile = { ...profile, username: cleanUser, avatar: finalAvatar };

    // 1. Persist to serverStore
    await upsertServerProfile(cleanProfile);

    // 2. Direct persistence to Cloudflare D1 (permanent text database)
    if (isD1Configured()) {
      try {
        await upsertD1Profile(cleanProfile);
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
          avatar_url: finalAvatar,
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
        await recordServerNewUserAlert(cleanProfile);
      } catch (alertError) {
        console.error('Non-blocking error triggering new user signup alert:', alertError);
      }
    }

    const res = NextResponse.json({ success: true, profile: cleanProfile, alertTriggered: Boolean(isNewSignup) });
    if (isNewSignup) {
      setSessionCookie(res, { username: cleanUser, id: cleanProfile.id || `prof_${cleanUser}`, role: 'student' });
    }
    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
