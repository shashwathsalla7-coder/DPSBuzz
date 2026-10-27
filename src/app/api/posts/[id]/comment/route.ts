import { NextRequest, NextResponse } from 'next/server';
import { addServerComment, getServerStore } from '@/lib/serverStore';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: dbComments, error } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', id)
          .order('created_at', { ascending: true });

        if (!error && Array.isArray(dbComments)) {
          const mapped = dbComments.map((c) => ({
            id: c.id,
            username: c.username,
            userAvatar: c.user_avatar,
            text: c.text,
            image: c.image,
            timeAgo: 'Recently',
            createdAt: c.created_at,
          }));
          return NextResponse.json({ success: true, comments: mapped });
        }
      } catch {}
    }

    const store = await getServerStore();
    return NextResponse.json({ success: true, comments: store.comments[id] || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { comment } = body;

    if (!comment || (!comment.text && !comment.image) || !comment.username) {
      return NextResponse.json({ success: false, error: 'Comment must contain text or an image' }, { status: 400 });
    }

    const commentId = comment.id || `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newComment = {
      id: commentId,
      username: comment.username,
      userAvatar: comment.userAvatar || null,
      text: comment.text || '',
      image: comment.image || null,
      timeAgo: 'Just now',
    };

    // 1. Direct write to Supabase database
    const supabase = getSupabase();
    let dbCommentsList: any[] | null = null;
    if (supabase) {
      try {
        await supabase.from('comments').upsert({
          id: commentId,
          post_id: id,
          username: newComment.username,
          user_avatar: newComment.userAvatar,
          text: newComment.text,
          image: newComment.image,
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        const { count } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', id);

        if (typeof count === 'number') {
          await supabase.from('posts').update({ comments_count: count }).eq('id', id);
        }

        const { data: refreshed } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', id)
          .order('created_at', { ascending: true });

        if (Array.isArray(refreshed)) {
          dbCommentsList = refreshed.map((c) => ({
            id: c.id,
            username: c.username,
            userAvatar: c.user_avatar,
            text: c.text,
            image: c.image,
            timeAgo: 'Just now',
            createdAt: c.created_at,
          }));
        }
      } catch (sbErr) {
        console.warn('Supabase comment insert notice:', sbErr);
      }
    }

    // 2. ServerStore backup
    const updated = await addServerComment(id, newComment);

    return NextResponse.json({
      success: true,
      comments: dbCommentsList || updated.comments[id] || [newComment],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
