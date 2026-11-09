import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { toggleServerLike } from '@/lib/serverStore';
import { createClient } from '@/lib/db/d1Supabase';

const supabaseUrl = 'd1'; // data lives in Cloudflare D1
const supabaseKey = 'd1';

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const cleanUser = session.username;
    let isLiked = false;
    let likesCount = 0;

    // 1. Database operation in Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', id)
          .eq('username', cleanUser)
          .maybeSingle();

        if (existing) {
          await supabase.from('likes').delete().eq('id', existing.id);
          isLiked = false;
        } else {
          await supabase.from('likes').insert({ post_id: id, username: cleanUser });
          isLiked = true;
        }

        const { count } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', id);

        likesCount = typeof count === 'number' ? count : 0;
        await supabase.from('posts').update({ likes_count: likesCount }).eq('id', id);

        // Keep serverStore in sync as secondary cache
        toggleServerLike(id, cleanUser).catch(() => {});

        return NextResponse.json({ success: true, isLiked, likesCount });
      } catch (sbErr) {
        console.warn('Supabase toggle like notice:', sbErr);
      }
    }

    // 2. Fallback to serverStore if Supabase is temporarily unreachable
    const result = await toggleServerLike(id, cleanUser);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
