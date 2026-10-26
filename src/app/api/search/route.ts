import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerStore } from '@/lib/serverStore';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

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
        isPrivate: Boolean(p.isPrivate),
        followerCount: p.followerCount || 0,
        followingCount: p.followingCount || 0,
        postCount: p.postCount || 0,
        spiritPoints: p.spiritPoints || 50,
      });
    }

    // 2. Query Supabase profiles table for live database students
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
              isPrivate: Boolean(existing?.isPrivate),
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

    let candidates = Array.from(candidateMap.values());

    // 3. In-memory fuzzy filter & class matching
    if (q) {
      candidates = candidates.filter((p) => {
        const u = p.username.toLowerCase();
        const n = (p.fullName || '').toLowerCase();
        const c = (p.class || '').toLowerCase();
        const s = (p.section || '').toLowerCase();
        return u.includes(q) || n.includes(q) || c.includes(q) || `${c}${s}`.includes(q);
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
