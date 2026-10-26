import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerStore, addServerPost, deleteServerPost } from '@/lib/serverStore';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const cursor = searchParams.get('cursor');

    const store = await getServerStore();
    const postMap = new Map<string, any>();

    // 1. Seed from serverStore
    for (const p of store.posts || []) {
      if (p && p.id) postMap.set(p.id, p);
    }

    // 2. Merge from Supabase posts table
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: dbPosts } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (Array.isArray(dbPosts)) {
          for (const dp of dbPosts) {
            const mapped = {
              id: dp.id,
              userId: dp.user_id,
              username: dp.username,
              fullName: dp.full_name,
              avatar: dp.user_avatar,
              class: dp.class,
              caption: dp.caption || '',
              imageUrl: dp.image_url,
              images: dp.images || (dp.image_url ? [dp.image_url] : []),
              song: dp.song,
              habitCategory: dp.habit_category,
              habitTag: dp.habit_tag,
              likes: dp.likes_count || 0,
              comments: dp.comments_count || 0,
              repostCount: dp.repost_count || 0,
              isRepost: Boolean(dp.is_repost),
              repostedFrom: dp.reposted_from,
              createdAt: dp.created_at,
              timeAgo: 'Just now',
            };
            postMap.set(dp.id, mapped);
          }
        }
      } catch (err) {
        console.warn('Supabase posts query notice:', err);
      }
    }

    let posts = Array.from(postMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    if (cursor) {
      const cursorTime = Number(cursor);
      if (!isNaN(cursorTime)) {
        posts = posts.filter((p) => new Date(p.createdAt || 0).getTime() < cursorTime);
      }
    }

    // If client requested unpaginated all (legacy), return all
    if (!limitParam && !offsetParam && !cursor) {
      return NextResponse.json({ success: true, posts, total: posts.length });
    }

    const limit = Math.min(Math.max(Number(limitParam || 50), 1), 100);
    const offset = Math.max(Number(offsetParam || 0), 0);
    const total = posts.length;
    const paginated = posts.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      posts: paginated,
      total,
      hasMore: offset + limit < total,
      nextCursor: paginated.length > 0 ? new Date(paginated[paginated.length - 1].createdAt || 0).getTime() : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post } = body;
    // Allow empty caption if photo or repost is present
    if (!post || !post.username) {
      return NextResponse.json({ success: false, error: 'Invalid post object' }, { status: 400 });
    }

    // 1. Persist to serverStore
    const updated = await addServerPost(post);

    // 2. Persist to Supabase posts table
    const supabase = getSupabase();
    if (supabase) {
      try {
        const firstImg = post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : null);
        await supabase.from('posts').upsert({
          id: post.id,
          user_id: post.userId || post.username,
          username: post.username,
          full_name: post.fullName || post.username,
          user_avatar: post.avatar || null,
          class: post.class || null,
          caption: post.caption || '',
          image_url: firstImg,
          images: Array.isArray(post.images) ? post.images : (firstImg ? [firstImg] : []),
          song: post.song || null,
          habit_category: post.habitCategory || null,
          habit_tag: post.habitTag || null,
          likes_count: post.likes || 0,
          comments_count: post.comments || 0,
          repost_count: post.repostCount || 0,
          is_repost: Boolean(post.isRepost),
          reposted_from: post.repostedFrom || null,
          created_at: post.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (sbErr) {
        console.warn('Supabase post upsert notice:', sbErr);
      }
    }

    return NextResponse.json({ success: true, post, totalPosts: updated.posts.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing post id' }, { status: 400 });
    }

    const updated = await deleteServerPost(id);

    // Also delete from Supabase if table exists
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('posts').delete().eq('id', id);
      } catch {}
    }

    return NextResponse.json({ success: true, deletedId: id, totalPosts: updated.posts.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
