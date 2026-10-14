import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, addServerChatNote, deleteServerChatNote } from '@/lib/serverStore';

export async function GET() {
  try {
    const store = getServerStore();
    return NextResponse.json({ success: true, notes: store.chatNotes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { note } = body;

    if (!note || !note.username) {
      return NextResponse.json({ success: false, error: 'Invalid note payload' }, { status: 400 });
    }

    const updated = addServerChatNote(note);
    return NextResponse.json({ success: true, note, totalNotes: updated.chatNotes.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username required' }, { status: 400 });
    }

    const updated = deleteServerChatNote(username);
    return NextResponse.json({ success: true, totalNotes: updated.chatNotes.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
