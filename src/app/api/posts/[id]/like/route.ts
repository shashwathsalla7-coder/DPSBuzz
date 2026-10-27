import { NextRequest, NextResponse } from 'next/server';
import { toggleServerLike } from '@/lib/serverStore';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

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
    const body = await req.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username required' }, { status: 400 });
    }

    const cleanUser = username.toLowerCase().trim();
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
