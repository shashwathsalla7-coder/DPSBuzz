import { NextRequest, NextResponse } from 'next/server';
import { addServerComment } from '@/lib/serverStore';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { comment } = body;

    if (!comment || !comment.text || !comment.username) {
      return NextResponse.json({ success: false, error: 'Invalid comment object' }, { status: 400 });
    }

    const updated = await addServerComment(id, comment);
    return NextResponse.json({ success: true, comments: updated.comments[id] || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
