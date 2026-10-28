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
    const store = await getServerStore();
    const storyMap = new Map<string, any>();

    // 1. Seed from serverStore
    for (const s of store.stories || []) {
      if (s && s.id) storyMap.set(s.id, s);
    }

    // 2. Hydrate & merge from Supabase stories table
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: dbStories, error } = await supabase
          .from('stories')
          .select('*')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(dbStories)) {
          for (const s of dbStories) {
            let extra: any = {};
            if (s.caption && typeof s.caption === 'string' && s.caption.startsWith('{')) {
              try { extra = JSON.parse(s.caption); } catch {}
            }
            storyMap.set(s.id, {
              id: s.id,
              userId: s.user_id,
              username: s.username,
              fullName: extra.fullName || s.username,
              avatar: extra.avatar || null,
              imageUrl: s.media_url || extra.imageUrl || '',
              caption: extra.caption || (!s.caption?.startsWith('{') ? s.caption : '') || '',
              text: extra.text || (!s.caption?.startsWith('{') ? s.caption : '') || undefined,
              background: extra.background || '#0F131B',
              textColor: extra.textColor || '#FFFFFF',
              song: extra.song || undefined,
              filter: extra.filter || undefined,
              stickers: extra.stickers || undefined,
              textStyle: extra.textStyle || undefined,
              template: extra.template || undefined,
              templateData: extra.templateData || undefined,
              expiresAt: s.expires_at,
              createdAt: s.created_at,
              hasStory: true,
              isSeen: false,
              isNew: true,
            });
          }
        }
      } catch (err) {
        console.warn('Supabase stories query notice:', err);
      }
    }

    const stories = Array.from(storyMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return NextResponse.json({ success: true, stories }, { headers: NO_CACHE_HEADERS });
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
        const extraPayload = {
          caption: story.caption || story.text || '',
          text: story.text || '',
          background: story.background,
          textColor: story.textColor,
          song: story.song,
          filter: story.filter,
          stickers: story.stickers,
          textStyle: story.textStyle,
          template: story.template,
          templateData: story.templateData,
          fullName: story.fullName,
          avatar: story.avatar,
        };

        await supabase.from('stories').upsert({
          id: story.id || `story-${Date.now()}`,
          user_id: story.userId || story.username,
          username: story.username,
          media_url: story.imageUrl || story.mediaUrl || '',
          caption: JSON.stringify(extraPayload),
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
