import { NextRequest, NextResponse } from 'next/server';
import { getSession, isStaff, isAdmin } from '@/lib/auth/session';
import { getServerStore, addServerChatNote, deleteServerChatNote } from '@/lib/serverStore';

export async function GET() {
  try {
    const store = await getServerStore();
    return NextResponse.json({ success: true, notes: store.chatNotes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    const body = await req.json();
    const { note } = body;
    if (note && typeof note === 'object') note.username = session.username;

    if (!note || !note.username) {
      return NextResponse.json({ success: false, error: 'Invalid note payload' }, { status: 400 });
    }

    const updated = await addServerChatNote(note);
    return NextResponse.json({ success: true, note, totalNotes: updated.chatNotes.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const requested = (searchParams.get('username') || session.username).toLowerCase().trim();
    const username = isAdmin(session) ? requested : session.username;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username required' }, { status: 400 });
    }

    const updated = await deleteServerChatNote(username);
    return NextResponse.json({ success: true, totalNotes: updated.chatNotes.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
