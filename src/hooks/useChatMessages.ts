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
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export function useChatMessages(chatId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const activeChatIdRef = useRef<string>(chatId);
  activeChatIdRef.current = chatId;

  // 1. Immediately wipe previous conversation state when chatId changes (Prevents cross-chat message leaks!)
  useEffect(() => {
    setMessages([]);
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
          status: (msg.status as Message['status']) || 'sent',
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

  // 3. Realtime Channel Subscription with Reconnect & Status Handling
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

          setMessages((previousState) => {
            const matchesExisting = previousState.findIndex((existingMsg) => {
              const byClientHandshake = freshMessage.client_id && existingMsg.client_id === freshMessage.client_id;
              const byDatabaseRecordId = existingMsg.id === freshMessage.id;
              return Boolean(byClientHandshake || byDatabaseRecordId);
            });

            if (matchesExisting !== -1) {
              return previousState.map((msg, index) =>
                index === matchesExisting ? { ...freshMessage, status: 'sent' } : msg
              );
            }
            return [...previousState, { ...freshMessage, status: 'sent' }];
          });
        }
      )
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

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      supabase.removeChannel(chatChannel);
    };
  }, [chatId, fetchHistoricalPayload]);

  // 4. Foreground / Network recovery: refetch missed messages when coming back online or switching tabs
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

  // 5. Send message with client_id handshake and clear status flow
  const dispatchNewMessage = async (messageContent: string, customTrackingId?: string) => {
    const formattedContent = messageContent.trim();
    if (!formattedContent || !chatId) return;

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

    // Show immediately in UI
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
        // Do not immediately fail; API server route will confirm delivery
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

  // 6. Explicit retry handler for failed messages
  const retryMessage = (msgId: string) => {
    const target = messages.find((m) => m.id === msgId || m.client_id === msgId);
    if (!target) return;
    dispatchNewMessage(target.text, target.client_id || target.id);
  };

  return {
    messages,
    sendMessage: dispatchNewMessage,
    retryMessage,
    isLoadingHistory: isPending,
    connectionStatus,
    refreshHistory: fetchHistoricalPayload,
  };
}
