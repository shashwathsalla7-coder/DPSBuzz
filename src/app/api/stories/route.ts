import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, addServerStory } from '@/lib/serverStore';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET() {
  try {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: dbStories, error } = await supabase
          .from('stories')
          .select('*')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(dbStories)) {
          const mapped = dbStories.map((s) => ({
            id: s.id,
            userId: s.user_id,
            username: s.username,
            imageUrl: s.media_url,
            caption: s.caption || '',
            expiresAt: s.expires_at,
            createdAt: s.created_at,
          }));
          return NextResponse.json({ success: true, stories: mapped }, { headers: NO_CACHE_HEADERS });
        }
      } catch {}
    }

    const store = await getServerStore();
    return NextResponse.json({ success: true, stories: store.stories }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { story } = body;
    if (!story || !story.username) {
      return NextResponse.json({ success: false, error: 'Invalid story object' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('stories').upsert({
          id: story.id || `story-${Date.now()}`,
          user_id: story.userId || story.username,
          username: story.username,
          media_url: story.imageUrl || story.mediaUrl || '',
          caption: story.caption || '',
          expires_at: story.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: story.createdAt || new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (sbErr) {
        console.warn('Supabase story insert notice:', sbErr);
      }
    }

    const updated = await addServerStory(story);
    return NextResponse.json({ success: true, story, totalStories: updated.stories.length }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
