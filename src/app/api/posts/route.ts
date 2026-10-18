import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, addServerPost, deleteServerPost } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const cursor = searchParams.get('cursor');

    const store = await getServerStore();
    let posts = store.posts || [];

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
    if (!post || !post.caption || !post.username) {
      return NextResponse.json({ success: false, error: 'Invalid post object' }, { status: 400 });
    }

    const updated = await addServerPost(post);
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
    return NextResponse.json({ success: true, deletedId: id, totalPosts: updated.posts.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
