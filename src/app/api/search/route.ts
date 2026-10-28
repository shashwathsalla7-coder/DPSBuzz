import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerStore } from '@/lib/serverStore';
import { getD1Profiles, isD1Configured } from '@/lib/cloudflare/dbService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

const BLOCKED_TEST_USERNAMES = new Set([
  'testaccount', 'testing', 'ab', 'test_insert_probe', 'test_uuid5_user',
  'arjun_8a', 'priya_7b', 'demo-user-1', 'test_user', 'testuser',
]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const classFilter = searchParams.get('class') || 'All';
    const sectionFilter = searchParams.get('section') || 'All';

    const store = await getServerStore();
    const candidateMap = new Map<string, any>();

    // 1. Seed from serverStore profiles
    for (const p of store.profiles || []) {
      if (!p || !p.username) continue;
      const u = p.username.toLowerCase().trim();
      candidateMap.set(u, {
        id: p.id,
        username: p.username,
        fullName: p.fullName || p.username,
        avatar: p.avatar || null,
        bio: p.bio || '',
        class: p.class || '8',
        section: p.section || 'A',
        role: p.role || 'student',
        isVerified: p.isVerified ?? true,
        isApproved: p.isApproved ?? true,
        isPrivate: Boolean(p.isPrivate ?? (p as any).is_private ?? false),
        followerCount: p.followerCount || 0,
        followingCount: p.followingCount || 0,
        postCount: p.postCount || 0,
        spiritPoints: p.spiritPoints || 50,
      });
    }

    // 2. Query Cloudflare D1 profiles (never pauses, permanent database)
    if (isD1Configured()) {
      try {
        const d1Profiles = await getD1Profiles();
        for (const dp of d1Profiles) {
          const u = dp.username.toLowerCase().trim();
          candidateMap.set(u, dp);
        }
      } catch (d1Err) {
        console.warn('Cloudflare D1 search lookup notice:', d1Err);
      }
    }

    // 3. Query Supabase profiles table for live database students
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
        let query = supabase.from('profiles').select('*');

        if (q) {
          query = query.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`);
        }

        const { data: dbProfiles } = await query.limit(50);
        if (Array.isArray(dbProfiles)) {
          for (const dp of dbProfiles) {
            const u = dp.username.toLowerCase().trim();
            const existing = candidateMap.get(u);
            candidateMap.set(u, {
              id: dp.id,
              username: dp.username,
              fullName: dp.full_name || dp.username,
              avatar: dp.avatar_url || existing?.avatar || null,
              bio: dp.bio || existing?.bio || '',
              class: dp.class || existing?.class || '8',
              section: dp.section || existing?.section || 'A',
              role: dp.role || existing?.role || 'student',
              isVerified: dp.is_verified ?? existing?.isVerified ?? true,
              isApproved: existing?.isApproved ?? true,
              isPrivate: Boolean(dp.is_private ?? existing?.isPrivate ?? false),
              followerCount: dp.follower_count || existing?.followerCount || 0,
              followingCount: dp.following_count || existing?.followingCount || 0,
              postCount: dp.post_count || existing?.postCount || 0,
              spiritPoints: existing?.spiritPoints || 50,
            });
          }
        }
      } catch (err) {
        console.warn('Supabase search lookup notice:', err);
      }
    }

    let candidates = Array.from(candidateMap.values()).filter(
      (p) => !BLOCKED_TEST_USERNAMES.has((p.username || '').toLowerCase().trim())
    );

    // 3. In-memory fuzzy filter & class matching
    if (q) {
      candidates = candidates.filter((p) => {
        const u = (p.username || '').toLowerCase();
        const n = (p.fullName || '').toLowerCase();
        const c = String(p.class || '').toLowerCase().replace(/[^0-9]/g, '');
        const s = String(p.section || '').toLowerCase();

        // Exact class + section query match: e.g. "8 g", "8-g", "8g", "class 8 g"
        const classMatch = q.match(/^(?:class|grade)?\s*(\d{1,2})(?:th)?(?:\s*class)?\s*[-_\s/]?\s*([a-gA-G])?$/i);
        if (classMatch) {
          const qCls = classMatch[1];
          const qSec = classMatch[2]?.toLowerCase();
          if (c === qCls) {
            if (!qSec || s === qSec) return true;
          }
        }

        const classVariants = [
          c,
          `${c}${s}`,
          `${c} ${s}`,
          `${c}-${s}`,
          `class ${c}`,
          `class ${c} ${s}`,
          `class ${c}${s}`,
          `class ${c}-${s}`,
        ];

        return (
          u.includes(q) ||
          n.includes(q) ||
          classVariants.some((v) => v === q || v.includes(q))
        );
      });
    }

    if (classFilter !== 'All') {
      const cleanClass = classFilter.replace(/[^0-9]/g, '');
      candidates = candidates.filter((p) => (p.class || '').replace(/[^0-9]/g, '') === cleanClass);
    }

    if (sectionFilter !== 'All') {
      candidates = candidates.filter((p) => (p.section || 'A').toUpperCase() === sectionFilter.toUpperCase());
    }

    // Always sort verified school admin @shashwath71845 to the top, then alphabetically
    candidates.sort((a, b) => {
      if (a.username.toLowerCase() === 'shashwath71845') return -1;
      if (b.username.toLowerCase() === 'shashwath71845') return 1;
      return (a.fullName || a.username).localeCompare(b.fullName || b.username);
    });

    return NextResponse.json(
      { success: true, profiles: candidates, count: candidates.length },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Search failed' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
