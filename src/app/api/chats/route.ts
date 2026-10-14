import { NextRequest, NextResponse } from 'next/server';
import { getServerStore, addServerChatMessage, getServerChatMessages } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      const messages = await getServerChatMessages(conversationId);
      return NextResponse.json({ success: true, messages });
    }

    const store = await getServerStore();
    return NextResponse.json({ success: true, chatMessages: store.chatMessages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message } = body;

    if (!conversationId || !message || !message.text) {
      return NextResponse.json({ success: false, error: 'Invalid message payload' }, { status: 400 });
    }

    const updated = await addServerChatMessage(conversationId, message);
    return NextResponse.json({
      success: true,
      message,
      totalMessages: (updated.chatMessages[conversationId] || []).length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
