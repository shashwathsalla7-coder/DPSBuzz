import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, addServerPost, deleteServerPost } from '@/lib/serverStore';

export async function GET() {
  try {
    const store = getServerStore();
    return NextResponse.json({ success: true, posts: store.posts });
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

    const updated = addServerPost(post);
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

    const updated = deleteServerPost(id);
    return NextResponse.json({ success: true, deletedId: id, totalPosts: updated.posts.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

