import { NextRequest, NextResponse } from 'next/server';
import {
  getServerStore,
  addServerChatMessage,
  getServerChatMessages,
  unsendServerChatMessage,
  purgeVanishServerChatMessages,
  markServerChatMessagesRead,
} from '@/lib/serverStore';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const username = searchParams.get('username')?.toLowerCase().trim();
    const isGroupParam = searchParams.get('isGroup') === 'true';

    const userCookie = req.cookies.get('dpsbuzz_user')?.value;
    let authUser = '';
    if (userCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userCookie));
        authUser = (parsed?.username || '').toLowerCase().trim();
      } catch {}
    }

    const effectiveUser = authUser || username;

    // Specific conversation messages request
    if (conversationId) {
      if (!effectiveUser) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Session login required to access private chat' },
          { status: 401, headers: NO_CACHE_HEADERS }
        );
      }

      let canonicalKey = conversationId;
      const isGroup =
        isGroupParam ||
        conversationId.startsWith('conv-group-') ||
        conversationId.startsWith('group-') ||
        conversationId.includes('group') ||
        conversationId.includes('class-') ||
        conversationId.includes('house-') ||
        conversationId.includes('club-');

      if (!isGroup) {
        if (conversationId.includes('__')) {
          const participants = conversationId.split('__').map((p) => p.trim().toLowerCase());
          if (!participants.includes(effectiveUser) && effectiveUser !== 'shashwath71845') {
            return NextResponse.json(
              { success: false, error: 'Unauthorized: You are not a participant in this conversation' },
              { status: 403, headers: NO_CACHE_HEADERS }
            );
          }
          canonicalKey = participants.sort().join('__');
        } else if (conversationId.startsWith('conv-')) {
          const other = conversationId.replace(/^conv-/, '').toLowerCase().trim();
          if (!other || other === effectiveUser) {
            return NextResponse.json({ success: true, messages: [] }, { headers: NO_CACHE_HEADERS });
          }
          canonicalKey = [effectiveUser, other].sort().join('__');
        }
      } else if (conversationId.startsWith('conv-group-') || conversationId.startsWith('group-')) {
        const groupId = conversationId.replace(/^conv-/, '');
        const store = await getServerStore();
        const isAdmin = username === 'shashwath71845';
        const groupMembers = (store.groupMembers?.[groupId] || []).map((m: string) => m.toLowerCase().trim());
        const group = (store.groups || []).find((g: any) => g.id === groupId);
        const membersFromGroup = Array.isArray(group?.members) ? group.members.map((m: string) => m.toLowerCase().trim()) : [];
        const isMember = groupMembers.includes(effectiveUser) || membersFromGroup.includes(effectiveUser);
        const isInvited = (store.groupJoinRequests || []).some(
          (r: any) => r.groupId === groupId && r.username.toLowerCase().trim() === effectiveUser && r.status === 'pending'
        );
        if (!isAdmin && !isMember && !isInvited) {
          return NextResponse.json(
            { success: false, error: 'Unauthorized: You are not a member of this group' },
            { status: 403, headers: NO_CACHE_HEADERS }
          );
        }
      }

      const messages = await getServerChatMessages(canonicalKey);
      const store = await getServerStore();
      return NextResponse.json({ success: true, messages, unsentMessageIds: store.unsentMessageIds || [] }, { headers: NO_CACHE_HEADERS });
    }

    // If no conversationId is passed, only return conversations where the user is a participant
    if (!username) {
      return NextResponse.json({ success: true, chatMessages: {}, unsentMessageIds: [] }, { headers: NO_CACHE_HEADERS });
    }

    const store = await getServerStore();
    const isAdmin = username === 'shashwath71845';
    const userMessages: Record<string, any[]> = {};
    for (const [key, msgs] of Object.entries(store.chatMessages || {})) {
      if (key.includes('__')) {
        const participants = key.split('__').map((p) => p.trim().toLowerCase());
        if (participants.includes(username)) {
          userMessages[key] = msgs;
        }
      } else if (key.startsWith('conv-group-') || key.startsWith('group-')) {
        const groupId = key.replace(/^conv-/, '');
        const groupMembers = (store.groupMembers?.[groupId] || []).map((m: string) => m.toLowerCase().trim());
        const group = (store.groups || []).find((g: any) => g.id === groupId);
        const membersFromGroup = Array.isArray(group?.members) ? group.members.map((m: string) => m.toLowerCase().trim()) : [];
        const isMember = groupMembers.includes(username) || membersFromGroup.includes(username);
        const isInvited = (store.groupJoinRequests || []).some(
          (r: any) => r.groupId === groupId && r.username.toLowerCase().trim() === username && r.status === 'pending'
        );
        if (isAdmin || isMember || isInvited) {
          userMessages[key] = msgs;
        }
      } else {
        userMessages[key] = msgs;
      }
    }

    return NextResponse.json({ success: true, chatMessages: userMessages, unsentMessageIds: store.unsentMessageIds || [] }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message, senderUsername, action, messageId } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId is required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    if (action === 'unsend' && messageId) {
      await unsendServerChatMessage(conversationId, messageId);
      return NextResponse.json({ success: true, action: 'unsend', messageId }, { headers: NO_CACHE_HEADERS });
    }

    if (action === 'purge_vanish') {
      await purgeVanishServerChatMessages(conversationId);
      return NextResponse.json({ success: true, action: 'purge_vanish' }, { headers: NO_CACHE_HEADERS });
    }

    if (action === 'mark_read') {
      const reader = (body.readerUsername || senderUsername || '').toLowerCase().trim();
      if (reader) {
        await markServerChatMessagesRead(conversationId, reader);
      }
      return NextResponse.json({ success: true, action: 'mark_read' }, { headers: NO_CACHE_HEADERS });
    }

    if (!message || (!message.text && !message.sharedPost && !message.mediaUrl && !message.audioUrl && !message.image && !message.id)) {
      return NextResponse.json({ success: false, error: 'Invalid message payload' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    // Verify sender belongs to this conversation
    const userCookie = req.cookies.get('dpsbuzz_user')?.value;
    let authUser = '';
    if (userCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userCookie));
        authUser = (parsed?.username || '').toLowerCase().trim();
      } catch {}
    }

    const sender = (authUser || senderUsername || message.senderUsername || '').toLowerCase().trim();

    // Prevent identity forgery
    if (authUser && senderUsername && authUser !== 'shashwath71845' && senderUsername.toLowerCase().trim() !== authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Cannot send message as another user' },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    if (conversationId.includes('__')) {
      if (!sender) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Sender username is required for private direct messages' },
          { status: 401, headers: NO_CACHE_HEADERS }
        );
      }
      const participants = conversationId.split('__').map((p: string) => p.trim().toLowerCase());
      if (!participants.includes(sender) && sender !== 'shashwath71845') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Sender is not a participant in this conversation' },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }
    }

    const updated = await addServerChatMessage(conversationId, message);
    return NextResponse.json({
      success: true,
      message,
      totalMessages: (updated.chatMessages[conversationId] || []).length,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
