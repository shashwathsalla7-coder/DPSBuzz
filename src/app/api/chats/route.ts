import { NextRequest, NextResponse } from 'next/server';
import {
  getServerStore,
  addServerChatMessage,
  getServerChatMessages,
  unsendServerChatMessage,
  purgeVanishServerChatMessages,
  markServerChatMessagesRead,
} from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const username = searchParams.get('username')?.toLowerCase().trim();

    // Specific conversation messages request
    if (conversationId) {
      if (!username) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Username is required to access private chat' },
          { status: 401 }
        );
      }

      let canonicalKey = conversationId;
      if (conversationId.includes('__')) {
        const participants = conversationId.split('__').map((p) => p.trim().toLowerCase());
        if (!participants.includes(username)) {
          return NextResponse.json(
            { success: false, error: 'Unauthorized: You are not a participant in this conversation' },
            { status: 403 }
          );
        }
        canonicalKey = participants.sort().join('__');
      } else if (conversationId.startsWith('conv-') && !conversationId.startsWith('conv-group-')) {
        const other = conversationId.replace(/^conv-/, '').toLowerCase().trim();
        if (!other || other === username) {
          return NextResponse.json({ success: true, messages: [] });
        }
        canonicalKey = [username, other].sort().join('__');
      }

      const messages = await getServerChatMessages(canonicalKey);
      return NextResponse.json({ success: true, messages });
    }

    // If no conversationId is passed, only return conversations where the user is a participant
    if (!username) {
      return NextResponse.json({ success: true, chatMessages: {} });
    }

    const store = await getServerStore();
    const userMessages: Record<string, any[]> = {};
    for (const [key, msgs] of Object.entries(store.chatMessages || {})) {
      if (key.includes('__')) {
        const participants = key.split('__').map((p) => p.trim().toLowerCase());
        if (participants.includes(username)) {
          userMessages[key] = msgs;
        }
      } else if (key.startsWith('conv-group-')) {
        userMessages[key] = msgs;
      }
    }

    return NextResponse.json({ success: true, chatMessages: userMessages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message, senderUsername, action, messageId } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId is required' }, { status: 400 });
    }

    if (action === 'unsend' && messageId) {
      await unsendServerChatMessage(conversationId, messageId);
      return NextResponse.json({ success: true, action: 'unsend', messageId });
    }

    if (action === 'purge_vanish') {
      await purgeVanishServerChatMessages(conversationId);
      return NextResponse.json({ success: true, action: 'purge_vanish' });
    }

    if (action === 'mark_read') {
      const reader = (body.readerUsername || senderUsername || '').toLowerCase().trim();
      if (reader) {
        await markServerChatMessagesRead(conversationId, reader);
      }
      return NextResponse.json({ success: true, action: 'mark_read' });
    }

    if (!message || !message.text) {
      return NextResponse.json({ success: false, error: 'Invalid message payload' }, { status: 400 });
    }

    // Verify sender belongs to this conversation
    const sender = (senderUsername || message.senderUsername || '').toLowerCase().trim();
    if (conversationId.includes('__')) {
      if (!sender) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Sender username is required for private direct messages' },
          { status: 401 }
        );
      }
      const participants = conversationId.split('__').map((p: string) => p.trim().toLowerCase());
      if (!participants.includes(sender)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Sender is not a participant in this conversation' },
          { status: 403 }
        );
      }
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
