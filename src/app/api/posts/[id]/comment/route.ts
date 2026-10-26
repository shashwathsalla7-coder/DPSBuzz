import { NextRequest, NextResponse } from 'next/server';
import { addServerComment } from '@/lib/serverStore';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

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

    const updated = await addServerComment(id, comment);

    // Non-blocking sync to Supabase posts table comments_count
    if (supabaseUrl && supabaseKey) {
      (async () => {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
          const newCommentsCount = (updated.comments[id] || []).length;
          await supabase
            .from('posts')
            .update({ comments_count: newCommentsCount })
            .eq('id', id);
        } catch {}
      })().catch(() => {});
    }

    return NextResponse.json({ success: true, comments: updated.comments[id] || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
