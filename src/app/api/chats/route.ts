import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import {
  getServerStore,
  addServerChatMessage,
  getServerChatMessages,
  unsendServerChatMessage,
  purgeVanishServerChatMessages,
  markServerChatMessagesRead,
} from '@/lib/serverStore';
import { getD1MessagesForUser, insertD1Message, isD1Configured } from '@/lib/cloudflare/dbService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

function ensureCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME || 'ogfaxmjw';
  const api_key = process.env.CLOUDINARY_API_KEY || '585871931796836';
  const api_secret = process.env.CLOUDINARY_API_SECRET || 'Fpudf-0uhRPjKpFdmQzOiXZTh1M';
  if (!cloud_name || !api_key || !api_secret) return false;
  try {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });
    return true;
  } catch {
    return false;
  }
}

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

    const effectiveUser = username || authUser;

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
          const isAllowed =
            (username && participants.includes(username)) ||
            (authUser && participants.includes(authUser)) ||
            effectiveUser === 'shashwath71845';

          if (!isAllowed) {
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

      // Hydrate & merge from Supabase messages table if configured
      let mergedMessages = [...messages];
      if (supabaseUrl && supabaseKey) {
        try {
          const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
          const altKey = canonicalKey.includes('__') ? canonicalKey.split('__').reverse().join('__') : canonicalKey;
          const { data: dbRows, error: dbErr } = await sb
            .from('messages')
            .select('*')
            .or(`chat_id.eq.${canonicalKey},chat_id.eq.${altKey}`)
            .order('created_at', { ascending: true })
            .limit(500);

          if (!dbErr && Array.isArray(dbRows) && dbRows.length > 0) {
            const seenIds = new Set<string>();
            for (const m of mergedMessages) {
              if (m.id) seenIds.add(m.id);
              if (m.client_id) seenIds.add(m.client_id);
            }
            for (const row of dbRows) {
              const rowKey = row.client_id || row.id;
              let previewObj: any = null;
              if (row.post_preview && typeof row.post_preview === 'object') {
                previewObj = row.post_preview;
              } else if (typeof row.post_preview === 'string') {
                try { previewObj = JSON.parse(row.post_preview); } catch {}
              }
              if (!previewObj && (row.post_id || row.message_type === 'post_share')) {
                previewObj = { id: row.post_id || '', username: '', caption: '' };
              }
              if (!seenIds.has(rowKey) && (!row.id || !seenIds.has(row.id)) && (!row.client_id || !seenIds.has(row.client_id))) {
                if (row.id) seenIds.add(row.id);
                if (row.client_id) seenIds.add(row.client_id);
                mergedMessages.push({
                  id: row.id,
                  client_id: row.client_id,
                  text: row.text,
                  sender: (row.sender_id || '').toLowerCase() === (effectiveUser || '').toLowerCase() ? 'me' : 'them',
                  senderUsername: row.sender_id,
                  time: row.created_at ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(row.created_at)) : 'Recently',
                  createdAt: row.created_at,
                  status: row.read_at ? 'read' : row.delivered_at ? 'delivered' : (row.status || 'sent'),
                  is_read: Boolean(row.read_at || row.is_read),
                  isSeen: Boolean(row.read_at || row.is_read),
                  isDelivered: Boolean(row.delivered_at || row.read_at || row.status === 'delivered' || row.status === 'read'),
                  sharedPost: previewObj,
                  message_type: row.message_type || (previewObj ? 'post_share' : 'text'),
                  post_id: row.post_id || previewObj?.id,
                  post_preview: previewObj,
                  isChatPhoto: Boolean(previewObj?.id?.startsWith('chat-photo-') || previewObj?.caption === 'Chat photo' || previewObj?.caption === 'Shared a photo'),
                });
              } else {
                const existingIdx = mergedMessages.findIndex((m: any) => (m.client_id && m.client_id === row.client_id) || m.id === row.id || (row.client_id && m.id === row.client_id));
                if (existingIdx >= 0 && previewObj && !mergedMessages[existingIdx].sharedPost) {
                  mergedMessages[existingIdx].sharedPost = previewObj;
                  mergedMessages[existingIdx].post_preview = previewObj;
                  mergedMessages[existingIdx].post_id = row.post_id || previewObj.id;
                  mergedMessages[existingIdx].message_type = row.message_type || 'post_share';
                }
              }
            }
          }
        } catch (dbErr) {
          console.warn('Supabase conversation fetch error:', dbErr);
        }
      }

      mergedMessages.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : (a.timestamp || 0);
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : (b.timestamp || 0);
        return ta - tb;
      });

      const recentMessages = mergedMessages.length > 250 ? mergedMessages.slice(-250) : mergedMessages;
      return NextResponse.json({ success: true, messages: recentMessages, unsentMessageIds: store.unsentMessageIds || [] }, { headers: NO_CACHE_HEADERS });
    }

    // If no conversationId is passed, only return conversations where the user is a participant
    if (!username) {
      return NextResponse.json({ success: true, chatMessages: {}, unsentMessageIds: [] }, { headers: NO_CACHE_HEADERS });
    }

    const BLOCKED_TEST_ACCOUNTS = new Set(['testaccount', 'testing', 'ab', 'test_insert_probe', 'test_uuid5_user']);

    const store = await getServerStore();
    const isAdmin = username === 'shashwath71845';
    const userMessages: Record<string, any[]> = {};
    for (const [key, msgs] of Object.entries(store.chatMessages || {})) {
      if (key.includes('__')) {
        const participants = key.split('__').map((p) => p.trim().toLowerCase());
        if (participants.some((p) => BLOCKED_TEST_ACCOUNTS.has(p))) continue;
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
      } else if (isAdmin || key.toLowerCase().includes(username)) {
        userMessages[key] = msgs;
      }
    }

    // Hydrate & merge from Cloudflare D1 (never pauses, permanent chat database)
    if (isD1Configured() && effectiveUser) {
      try {
        const d1Msgs = await getD1MessagesForUser(effectiveUser);
        for (const [chatKey, msgs] of Object.entries(d1Msgs)) {
          if (!userMessages[chatKey]) userMessages[chatKey] = [];
          for (const m of msgs) {
            if (!userMessages[chatKey].some((existing: any) => existing.id === m.id)) {
              userMessages[chatKey].push({
                ...m,
                sender: (m.senderUsername || '').toLowerCase() === (effectiveUser || '').toLowerCase() ? 'me' : 'them',
              });
            }
          }
        }
      } catch (d1Err) {
        console.warn('Cloudflare D1 chats discovery notice:', d1Err);
      }
    }

    // Also auto-discover conversations from Supabase messages table for cross-device & fresh logins
    if (supabaseUrl && supabaseKey) {
      try {
        const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
        const { data: dbRows, error: dbErr } = await sb
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${username},chat_id.ilike.%${username}%`)
          .order('created_at', { ascending: true })
          .limit(1000);

        if (!dbErr && Array.isArray(dbRows)) {
          for (const row of dbRows) {
            const chatKey = row.chat_id;
            if (!chatKey) continue;
            if (chatKey.includes('__')) {
              const parts = chatKey.split('__').map((p: string) => p.trim().toLowerCase());
              if (parts.some((p: string) => BLOCKED_TEST_ACCOUNTS.has(p))) continue;
              if (!parts.includes(username) && username !== 'shashwath71845') continue; // STRICT PRIVACY: Never leak chats
            }
            if (!userMessages[chatKey]) {
              userMessages[chatKey] = [];
            }
            if (!userMessages[chatKey].some((m: any) => m.id === row.id || (row.client_id && m.client_id === row.client_id))) {
              let previewObj: any = null;
              if (row.post_preview && typeof row.post_preview === 'object') {
                previewObj = row.post_preview;
              } else if (typeof row.post_preview === 'string') {
                try { previewObj = JSON.parse(row.post_preview); } catch {}
              }
              if (!previewObj && (row.post_id || row.message_type === 'post_share')) {
                previewObj = { id: row.post_id || '', username: '', caption: '' };
              }
              userMessages[chatKey].push({
                id: row.id,
                client_id: row.client_id,
                text: row.text,
                sender: (row.sender_id || '').toLowerCase() === username ? 'me' : 'them',
                senderUsername: row.sender_id,
                time: row.created_at ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(row.created_at)) : 'Recently',
                createdAt: row.created_at,
                status: row.read_at ? 'read' : row.delivered_at ? 'delivered' : (row.status || 'sent'),
                is_read: Boolean(row.read_at || row.is_read),
                isSeen: Boolean(row.read_at || row.is_read),
                isDelivered: Boolean(row.delivered_at || row.read_at || row.status === 'delivered' || row.status === 'read'),
                sharedPost: previewObj,
                message_type: row.message_type || (previewObj ? 'post_share' : 'text'),
                post_id: row.post_id || previewObj?.id,
                post_preview: previewObj,
                isChatPhoto: Boolean(previewObj?.id?.startsWith('chat-photo-') || previewObj?.caption === 'Chat photo' || previewObj?.caption === 'Shared a photo'),
              });
            }
          }
        }
      } catch (err) {
        console.warn('Supabase chat discovery query error:', err);
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
        if (supabaseUrl && supabaseKey) {
          try {
            const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
            const now = new Date().toISOString();
            await sb
              .from('messages')
              .update({ read_at: now, delivered_at: now, status: 'read' })
              .eq('chat_id', conversationId)
              .neq('sender_id', reader)
              .is('read_at', null);

            // Record into message_receipts if client_ids provided
            if (Array.isArray(body.messageIds) && body.messageIds.length > 0) {
              const rows = body.messageIds.map((mid: string) => ({
                chat_id: conversationId,
                client_id: mid,
                user_id: reader,
                delivered_at: now,
                read_at: now,
              }));
              await sb.from('message_receipts').upsert(rows, { onConflict: 'chat_id,client_id,user_id' });
            }
          } catch (e) {
            console.warn('Supabase mark_read warning:', e);
          }
        }
      }
      return NextResponse.json({ success: true, action: 'mark_read' }, { headers: NO_CACHE_HEADERS });
    }

    if (action === 'mark_delivered') {
      const recipient = (body.recipientUsername || body.readerUsername || senderUsername || '').toLowerCase().trim();
      if (recipient && supabaseUrl && supabaseKey) {
        try {
          const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
          const now = new Date().toISOString();
          await sb
            .from('messages')
            .update({ delivered_at: now, status: 'delivered' })
            .eq('chat_id', conversationId)
            .neq('sender_id', recipient)
            .is('delivered_at', null)
            .is('read_at', null);

          if (Array.isArray(body.messageIds) && body.messageIds.length > 0) {
            const rows = body.messageIds.map((mid: string) => ({
              chat_id: conversationId,
              client_id: mid,
              user_id: recipient,
              delivered_at: now,
            }));
            await sb.from('message_receipts').upsert(rows, { onConflict: 'chat_id,client_id,user_id' });
          }
        } catch (e) {
          console.warn('Supabase mark_delivered warning:', e);
        }
      }
      return NextResponse.json({ success: true, action: 'mark_delivered' }, { headers: NO_CACHE_HEADERS });
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

    const sender = (senderUsername || authUser || message.senderUsername || '').toLowerCase().trim();

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
    } else if (conversationId.startsWith('conv-group-') || conversationId.startsWith('group-')) {
      if (!sender) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Sender username is required for group chat' },
          { status: 401, headers: NO_CACHE_HEADERS }
        );
      }
      const groupId = conversationId.replace(/^conv-/, '');
      const store = await getServerStore();
      const isAdmin = sender === 'shashwath71845';
      const groupMembers = (store.groupMembers?.[groupId] || []).map((m: string) => m.toLowerCase().trim());
      const group = (store.groups || []).find((g: any) => g.id === groupId);
      const membersFromGroup = Array.isArray(group?.members) ? group.members.map((m: string) => m.toLowerCase().trim()) : [];
      const isCreator = (group?.creator_username || group?.creator || group?.creatorUsername || '').toLowerCase().trim() === sender;
      const isMember = groupMembers.includes(sender) || membersFromGroup.includes(sender) || isCreator;

      if (!isAdmin && !isMember) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: You are not an enrolled member of this group' },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }
    }

    const updated = await addServerChatMessage(conversationId, message);

    // Directly persist to Cloudflare D1 for permanent cross-device chat sync
    if (isD1Configured() && (message.text || message.sharedPost || message.image || message.mediaUrl)) {
      try {
        const msgId = message.id || message.client_id || `msg_${Date.now()}`;
        const content = message.text || (message.sharedPost ? 'Shared a post 📸' : (message.image ? '📷 Photo' : ''));
        await insertD1Message({
          id: msgId,
          chatId: conversationId,
          senderId: sender,
          recipientId: conversationId.includes('__') ? conversationId.split('__').find((p: string) => p !== sender) : null,
          content,
          mediaUrl: message.mediaUrl || message.image || null,
          createdAt: message.createdAt || new Date().toISOString(),
        });
      } catch (d1Err) {
        console.warn('Cloudflare D1 message insert warning:', d1Err);
      }
    }

    // Directly persist to Supabase messages table for reliable multi-device sync
    if (supabaseUrl && supabaseKey && (message.text || message.sharedPost || message.image || message.mediaUrl)) {
      try {
        const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
        const rowData: any = {
          client_id: message.client_id || message.id,
          chat_id: conversationId,
          sender_id: sender,
          text: message.text || (message.sharedPost ? 'Shared a post 📸' : (message.image ? '📷 Photo' : '')),
          created_at: message.createdAt || new Date().toISOString(),
          status: 'sent',
        };

        if (message.sharedPost || message.post_id) {
          rowData.message_type = 'post_share';
          rowData.post_id = message.post_id || message.sharedPost?.id || null;
          let preview = message.post_preview || message.sharedPost || null;
          if (preview && typeof preview === 'object') {
            const rawImg = preview.imageUrl || preview.image || '';
            if (typeof rawImg === 'string' && rawImg.startsWith('data:')) {
              try {
                if (ensureCloudinary()) {
                  const uploadRes = await cloudinary.uploader.upload(rawImg, {
                    folder: 'dpsbuzz/chat_shares',
                    resource_type: 'image',
                  });
                  if (uploadRes?.secure_url) {
                    preview = { ...preview, imageUrl: uploadRes.secure_url };
                    if (preview.image) preview.image = uploadRes.secure_url;
                  }
                }
              } catch (upErr) {
                console.warn('Direct upload of shared post image to Cloudinary warning:', upErr);
              }
            }
          }
          rowData.post_preview = preview;
        } else if (message.image || message.mediaUrl || message.isChatPhoto) {
          rowData.message_type = 'photo';
        }

        const { error: insErr } = await sb.from('messages').insert([rowData]);
        if (insErr && insErr.code !== '23505') {
          // If optional columns failed, retry with core schema columns
          delete rowData.message_type;
          delete rowData.post_id;
          delete rowData.post_preview;
          await sb.from('messages').insert([rowData]);
        }
      } catch (sbErr) {
        console.warn('Server Supabase message sync warning:', sbErr);
      }
    }
    return NextResponse.json({
      success: true,
      message,
      totalMessages: (updated.chatMessages[conversationId] || []).length,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
