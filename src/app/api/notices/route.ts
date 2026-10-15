import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, saveServerStore } from '@/lib/serverStore';
import type { Notice } from '@/lib/dataStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const store = await getServerStore();
    const notices = Array.isArray(store.notices) ? store.notices : [];

    if (id) {
      const found = notices.find((n) => n.id === id);
      if (!found) {
        return NextResponse.json({ success: false, error: 'Notice not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, notice: found });
    }

    return NextResponse.json({ success: true, notices });
  } catch (error: any) {
    console.error('Error in GET /api/notices:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notice, notices } = body;

    const current = await getServerStore({ forceRefresh: true });
    let existingNotices = Array.isArray(current.notices) ? [...current.notices] : [];

    if (notice && notice.id) {
      // Filter out existing copy if any and unshift new one
      existingNotices = existingNotices.filter((n) => n.id !== notice.id);
      existingNotices.unshift(notice);
    } else if (Array.isArray(notices)) {
      const map = new Map<string, Notice>();
      for (const n of existingNotices) {
        if (n && n.id) map.set(n.id, n);
      }
      for (const n of notices) {
        if (n && n.id) map.set(n.id, n);
      }
      existingNotices = Array.from(map.values());
    }

    const updated = await saveServerStore({
      notices: existingNotices,
    });

    return NextResponse.json({
      success: true,
      notice: notice || null,
      count: updated.notices?.length || 0,
    });
  } catch (error: any) {
    console.error('Error in POST /api/notices:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save notice' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Notice ID is required' }, { status: 400 });
    }

    const current = await getServerStore({ forceRefresh: true });
    const existingNotices = Array.isArray(current.notices) ? current.notices : [];
    const filtered = existingNotices.filter((n) => n.id !== id);

    await saveServerStore({
      notices: filtered,
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error in DELETE /api/notices:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete notice' },
      { status: 500 }
    );
  }
}
