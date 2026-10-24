"use client";
import { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export interface Message {
  id: string;
  client_id?: string | null;
  chat_id: string;
  sender_id: string;
  recipient_id?: string | null;
  text: string;
  created_at?: string;
  delivered_at?: string | null;
  read_at?: string | null;
  is_read?: boolean;
  isSeen?: boolean;
  isDelivered?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export interface TypingUser {
  username: string;
  name?: string;
  timestamp: number;
}

export function useChatMessages(chatId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser>>({});

  const activeChatIdRef = useRef<string>(chatId);
  activeChatIdRef.current = chatId;
  const channelRef = useRef<any>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingStopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Immediately wipe previous conversation state when chatId changes (Prevents cross-chat message leaks!)
  useEffect(() => {
    setMessages([]);
    setTypingUsers({});
  }, [chatId]);

  // 2. Fetch latest 30 messages with indexed pagination & ordering
  const fetchHistoricalPayload = useCallback(async () => {
    if (!chatId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.warn('Historical chat fetch warning:', error.message);
        return;
      }

      if (data && activeChatIdRef.current === chatId) {
        // Reverse descending results so they render chronologically (oldest at top, newest at bottom)
        const chronological = [...data].reverse().map((msg) => ({
          ...msg,
          is_read: Boolean(msg.read_at),
          isSeen: Boolean(msg.read_at),
          isDelivered: Boolean(msg.delivered_at || msg.read_at),
          status: (msg.status as Message['status']) || (msg.read_at ? 'read' : msg.delivered_at ? 'delivered' : 'sent'),
        }));

        startTransition(() => {
          setMessages(chronological);
        });
      }
    } catch (err) {
      console.warn('Historical chat fetch exception:', err);
    }
  }, [chatId]);

  // Initial load when chatId becomes valid
  useEffect(() => {
    if (!chatId) return;
    fetchHistoricalPayload();
  }, [chatId, fetchHistoricalPayload]);

  // 3. Realtime Channel Subscription with Reconnect, Typing Broadcast & Status Handling
  useEffect(() => {
    if (!chatId) return;
    let isMounted = true;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const channelName = `realtime:chat_room:${chatId}`;
    const chatChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const freshMessage = payload.new as Message;
          // STRICT PRIVACY CHECK: Ensure the incoming event strictly belongs to this active conversation!
          if (freshMessage.chat_id && freshMessage.chat_id !== activeChatIdRef.current) {
            return;
          }

          // If incoming message is from classmate, recipient device automatically emits delivery receipt
          if (freshMessage.sender_id && freshMessage.sender_id.toLowerCase() !== (currentUserId || '').toLowerCase()) {
            try {
              chatChannel.send({
                type: 'broadcast',
                event: 'receipt',
                payload: {
                  type: 'delivered',
                  messageIds: [freshMessage.id, freshMessage.client_id].filter(Boolean),
                  readerUsername: currentUserId,
                },
              });
            } catch {}
          }

          setMessages((previousState) => {
            const matchesExisting = previousState.findIndex((existingMsg) => {
              const byClientHandshake = freshMessage.client_id && existingMsg.client_id === freshMessage.client_id;
              const byDatabaseRecordId = existingMsg.id === freshMessage.id;
              return Boolean(byClientHandshake || byDatabaseRecordId);
            });

            if (matchesExisting !== -1) {
              return previousState.map((msg, index) =>
                index === matchesExisting ? { ...freshMessage, status: freshMessage.status || 'sent' } : msg
              );
            }
            return [...previousState, { ...freshMessage, status: freshMessage.status || 'sent' }];
          });
        }
      )
      // Real-time broadcast for Typing indicator (Zero DB writes!)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { username, name, isTyping } = payload.payload || {};
        const cleanUser = (username || '').toLowerCase().trim();
        const me = (currentUserId || '').toLowerCase().trim();
        if (!cleanUser || cleanUser === me) return; // Never show typing for yourself!

        setTypingUsers((prev) => {
          const next = { ...prev };
          if (isTyping) {
            next[cleanUser] = { username: cleanUser, name: name || cleanUser, timestamp: Date.now() };
          } else {
            delete next[cleanUser];
          }
          return next;
        });
      })
      // Real-time broadcast for Message delivery & read receipts (WhatsApp ticks live update)
      .on('broadcast', { event: 'receipt' }, (payload) => {
        const { type, messageIds } = payload.payload || {};
        if (!type) return;

        setMessages((prev) =>
          prev.map((msg) => {
            if (messageIds && messageIds.length > 0) {
              const match = messageIds.includes(msg.id) || (msg.client_id && messageIds.includes(msg.client_id));
              if (!match) return msg;
            }
            if (type === 'read') {
              return { ...msg, status: 'read', is_read: true, isSeen: true, read_at: new Date().toISOString() };
            }
            if (type === 'delivered' && msg.status !== 'read') {
              return { ...msg, status: 'delivered', isDelivered: true, delivered_at: new Date().toISOString() };
            }
            return msg;
          })
        );
      })
      .subscribe((status) => {
        if (!isMounted) return;
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnectionStatus('disconnected');
          // Auto-reconnect with 3-second catch-up fetch
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              if (isMounted) {
                fetchHistoricalPayload();
              }
            }, 3000);
          }
        }
      });

    channelRef.current = chatChannel;

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      channelRef.current = null;
      supabase.removeChannel(chatChannel);
    };
  }, [chatId, currentUserId, fetchHistoricalPayload]);

  // 4. Auto-expire typing indicator on receiver if no event for 5 seconds (safety against stuck typing indicators)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [u, item] of Object.entries(next)) {
          if (now - item.timestamp > 5000) {
            delete next[u];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // 5. Send typing status with strict 3-second rate limit
  const sendTypingStatus = useCallback(
    (isTyping: boolean, senderName?: string) => {
      if (!channelRef.current || !chatId || !currentUserId) return;

      // QUOTA OPTIMIZATION: Only send typing broadcast in 1-on-1 direct conversations.
      // Omit typing broadcast in class group chats to stay safely below 2M monthly free Realtime messages.
      const isGroup = chatId.startsWith('conv-group-') || chatId.startsWith('group-') || chatId.includes('class-');
      if (isGroup) return;

      const now = Date.now();

      if (isTyping) {
        // Only send at most once every 3 seconds while typing
        if (now - lastTypingSentRef.current < 3000) {
          // Restart inactivity timer to send stop typing after 3s of no keystrokes
          if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
          typingStopTimerRef.current = setTimeout(() => {
            sendTypingStatus(false, senderName);
          }, 3000);
          return;
        }

        lastTypingSentRef.current = now;
        try {
          channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { username: currentUserId, name: senderName || currentUserId, isTyping: true },
          });
        } catch {}

        if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = setTimeout(() => {
          sendTypingStatus(false, senderName);
        }, 3000);
      } else {
        if (typingStopTimerRef.current) {
          clearTimeout(typingStopTimerRef.current);
          typingStopTimerRef.current = null;
        }
        lastTypingSentRef.current = 0;
        try {
          channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { username: currentUserId, isTyping: false },
          });
        } catch {}
      }
    },
    [chatId, currentUserId]
  );

  // 6. Broadcast delivery or read receipts live
  const sendReceipt = useCallback(
    (type: 'delivered' | 'read', messageIds?: string[]) => {
      if (!channelRef.current || !chatId) return;
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'receipt',
          payload: { type, messageIds, readerUsername: currentUserId },
        });
      } catch {}
    },
    [chatId, currentUserId]
  );

  // 7. Foreground / Network recovery: refetch missed messages when coming back online or switching tabs
  useEffect(() => {
    if (!chatId) return;
    const handleSyncOnFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && chatId) {
        fetchHistoricalPayload();
      }
    };

    window.addEventListener('visibilitychange', handleSyncOnFocus);
    window.addEventListener('online', handleSyncOnFocus);

    return () => {
      window.removeEventListener('visibilitychange', handleSyncOnFocus);
      window.removeEventListener('online', handleSyncOnFocus);
    };
  }, [chatId, fetchHistoricalPayload]);

  // 8. Send message with client_id handshake and clear status flow
  const dispatchNewMessage = async (messageContent: string, customTrackingId?: string) => {
    const formattedContent = messageContent.trim();
    if (!formattedContent || !chatId) return;

    // Immediately cancel typing indicator when sending
    sendTypingStatus(false);

    const ephemeralTrackingId = customTrackingId || uuidv4();
    const optimisticPayload: Message = {
      id: ephemeralTrackingId,
      client_id: ephemeralTrackingId,
      chat_id: chatId,
      sender_id: currentUserId,
      text: formattedContent,
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    // Show immediately in UI with Clock
    setMessages((prev) => [...prev, optimisticPayload]);

    // Safety timeout: if server doesn't respond in 12s, allow user to retry
    const timeoutTimer = setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.client_id === ephemeralTrackingId && msg.status === 'sending'
            ? { ...msg, status: 'error' }
            : msg
        )
      );
    }, 12000);

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: chatId,
            sender_id: currentUserId,
            text: formattedContent,
            client_id: ephemeralTrackingId,
            status: 'sent',
          },
        ]);

      clearTimeout(timeoutTimer);

      if (error) {
        console.warn('Supabase realtime background sync warning:', error.message);
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.client_id === ephemeralTrackingId ? { ...msg, status: 'sent' } : msg
          )
        );
      }
    } catch (e) {
      clearTimeout(timeoutTimer);
      console.warn('Supabase realtime background sync exception:', e);
    }
  };

  // 9. Explicit retry handler for failed messages
  const retryMessage = (msgId: string) => {
    const target = messages.find((m) => m.id === msgId || m.client_id === msgId);
    if (!target) return;
    dispatchNewMessage(target.text, target.client_id || target.id);
  };

  return {
    messages,
    sendMessage: dispatchNewMessage,
    retryMessage,
    sendTypingStatus,
    sendReceipt,
    typingUsers,
    isLoadingHistory: isPending,
    connectionStatus,
    refreshHistory: fetchHistoricalPayload,
  };
}
