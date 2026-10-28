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
  error_reason?: string;
}

export interface TypingUser {
  username: string;
  name?: string;
  timestamp: number;
}

export interface OutboxItem {
  client_id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  attempts: number;
  lastAttemptAt?: number;
}

const OUTBOX_STORAGE_PREFIX = 'dpsbuzz_chat_outbox_v1_';
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_MESSAGES_PER_MINUTE = 20;
const MAX_MESSAGE_LENGTH = 1000;
const RETRY_BACKOFF_MS = [2000, 5000, 10000]; // 3 automatic retries with growing waits

// Helper to log send failures safely (Zero message text, zero personal data)
async function logFailureDiagnostics(errorType: string, statusCode?: number, durationMs?: number) {
  try {
    await supabase.from('chat_send_failures').insert([
      {
        error_type: errorType,
        status_code: statusCode || null,
        duration_ms: durationMs || null,
      },
    ]);
  } catch {}
}

export function useChatMessages(chatId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isOffline, setIsOffline] = useState<boolean>(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser>>({});
  const [outboxCount, setOutboxCount] = useState<number>(0);

  const activeChatIdRef = useRef<string>(chatId);
  activeChatIdRef.current = chatId;
  const channelRef = useRef<any>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingStopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // In-flight send guard & flood protection timestamps
  const inFlightRef = useRef<Set<string>>(new Set());
  const sendTimestampsRef = useRef<number[]>([]);
  const outboxProcessingRef = useRef<boolean>(false);

  const outboxStorageKey = `${OUTBOX_STORAGE_PREFIX}${currentUserId.toLowerCase().trim()}`;

  // Read outbox from persistent localStorage
  const loadOutbox = useCallback((): OutboxItem[] => {
    if (typeof window === 'undefined' || !currentUserId) return [];
    try {
      const raw = localStorage.getItem(outboxStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [outboxStorageKey, currentUserId]);

  // Save outbox to persistent localStorage
  const saveOutbox = useCallback((items: OutboxItem[]) => {
    if (typeof window === 'undefined' || !currentUserId) return;
    try {
      localStorage.setItem(outboxStorageKey, JSON.stringify(items));
      setOutboxCount(items.length);
    } catch {}
  }, [outboxStorageKey, currentUserId]);

  const addToOutbox = useCallback((item: OutboxItem) => {
    const current = loadOutbox();
    const filtered = current.filter((x) => x.client_id !== item.client_id);
    const updated = [...filtered, item];
    saveOutbox(updated);
  }, [loadOutbox, saveOutbox]);

  const removeFromOutbox = useCallback((clientId: string) => {
    const current = loadOutbox();
    const updated = current.filter((x) => x.client_id !== clientId);
    saveOutbox(updated);
  }, [loadOutbox, saveOutbox]);

  // 1. Immediately wipe previous conversation state when chatId changes (Prevents cross-chat message leaks!)
  useEffect(() => {
    setMessages([]);
    setTypingUsers({});
    inFlightRef.current.clear();
  }, [chatId]);

  // 2. Fetch latest messages with indexed pagination & ordering
  const fetchHistoricalPayload = useCallback(async () => {
    if (!chatId) return;
    try {
      const altChatId = chatId.includes('__') ? chatId.split('__').reverse().join('__') : chatId;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`chat_id.eq.${chatId},chat_id.eq.${altChatId}`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.warn('Historical chat fetch warning:', error.message);
        return;
      }

      if (data && activeChatIdRef.current === chatId) {
        // Reverse descending results so they render chronologically (oldest at top, newest at bottom)
        const chronological = [...data].reverse().map((msg) => ({
          ...msg,
          is_read: Boolean(msg.read_at || msg.status === 'read'),
          isSeen: Boolean(msg.read_at || msg.status === 'read'),
          isDelivered: Boolean(msg.delivered_at || msg.read_at || msg.status === 'delivered' || msg.status === 'read'),
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

  // 3. Online/Offline & Window Focus Listeners with Auto-Reconnect
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (chatId) {
        fetchHistoricalPayload();
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [chatId, fetchHistoricalPayload]);

  // 4. Realtime Channel Subscription with Reconnect, Typing Broadcast & Status Handling
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
                index === matchesExisting ? { ...msg, ...freshMessage, status: freshMessage.status || 'sent' } : msg
              );
            }
            return [...previousState, { ...freshMessage, status: freshMessage.status || 'sent' }];
          });
        }
      )
      // Realtime listener for message updates (delivered_at and read_at live ticks)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const updated = payload.new as Message;
          if (!updated || (updated.chat_id && updated.chat_id !== activeChatIdRef.current)) return;
          setMessages((previousState) =>
            previousState.map((msg) => {
              const match = (updated.client_id && msg.client_id === updated.client_id) || msg.id === updated.id;
              if (!match) return msg;
              const isRead = Boolean(updated.read_at || updated.status === 'read');
              const isDelivered = Boolean(updated.delivered_at || updated.status === 'delivered' || isRead);
              return {
                ...msg,
                ...updated,
                status: isRead ? 'read' : isDelivered ? 'delivered' : (updated.status || msg.status || 'sent'),
                is_read: isRead,
                isSeen: isRead,
                isDelivered: isDelivered,
              };
            })
          );
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

  // 5. Auto-expire typing indicator on receiver if no event for 5 seconds (safety against stuck typing indicators)
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

  // 6. Send typing status with strict 3-second rate limit
  const sendTypingStatus = useCallback(
    (isTyping: boolean, senderName?: string) => {
      if (!channelRef.current || !chatId || !currentUserId) return;

      const isGroup = chatId.startsWith('conv-group-') || chatId.startsWith('group-') || chatId.includes('class-');
      if (isGroup) return;

      const now = Date.now();

      if (isTyping) {
        if (now - lastTypingSentRef.current < 3000) {
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

  // 7. Broadcast delivery or read receipts live
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

  // 8. Foreground sync
  useEffect(() => {
    if (!chatId) return;
    const handleSyncOnFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && chatId) {
        fetchHistoricalPayload();
      }
    };

    window.addEventListener('visibilitychange', handleSyncOnFocus);
    return () => {
      window.removeEventListener('visibilitychange', handleSyncOnFocus);
    };
  }, [chatId, fetchHistoricalPayload]);

  // 9. Single-Attempt Internal Send Function
  const attemptDatabaseSend = async (
    targetChatId: string,
    targetSenderId: string,
    content: string,
    trackingId: string
  ): Promise<{ success: boolean; data?: any; error?: any; reason?: string; isNetworkError?: boolean }> => {
    const t0 = Date.now();

    // Check offline state before even attempting
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, reason: 'No internet connection', isNetworkError: true };
    }

    try {
      // Abort controller timeout at 8 seconds so we don't hang indefinitely
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Check if already persisted on server (Prevents duplicate messages on network retries)
      const { data: existingRecord } = await supabase
        .from('messages')
        .select('id, client_id, chat_id, created_at')
        .eq('client_id', trackingId)
        .maybeSingle();

      if (existingRecord) {
        clearTimeout(timeoutId);
        return { success: true, data: existingRecord };
      }

      // Safe insert with returned row
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: targetChatId,
            sender_id: targetSenderId,
            text: content,
            client_id: trackingId,
          },
        ])
        .select();

      clearTimeout(timeoutId);
      const duration = Date.now() - t0;

      if (error) {
        // If unique constraint violation (23505), message already succeeded on server!
        if (error.code === '23505') {
          return { success: true, data: { client_id: trackingId } };
        }

        const isAuthError = error.code === '401' || error.message?.includes('JWT') || error.message?.includes('auth');
        const isRateLimited = error.code === '429' || error.message?.includes('rate limit');
        const is5xx = error.code?.startsWith('5') || error.code === '503';

        logFailureDiagnostics(isAuthError ? 'AUTH' : isRateLimited ? 'HTTP_429' : is5xx ? 'HTTP_5XX' : 'POSTGRES_ERROR', parseInt(error.code || '0', 10) || 500, duration);

        return {
          success: false,
          error,
          reason: isAuthError
            ? 'Session expired. Please re-login.'
            : isRateLimited
            ? 'Server is busy. Tap Retry.'
            : is5xx
            ? 'Server momentarily unavailable. Tap Retry.'
            : error.message || 'Failed to send message',
          isNetworkError: isRateLimited || is5xx,
        };
      }

      return { success: true, data: data && data[0] ? data[0] : null };
    } catch (e: any) {
      const duration = Date.now() - t0;
      const isTimeout = e?.name === 'AbortError' || e?.message?.includes('aborted');
      logFailureDiagnostics(isTimeout ? 'TIMEOUT' : 'NETWORK', 0, duration);

      return {
        success: false,
        error: e,
        reason: isTimeout ? 'Request timed out. Tap Retry.' : 'No internet connection',
        isNetworkError: true,
      };
    }
  };

  // 10. Robust Dispatch with Exponential Backoff Auto-Retries & Offline Outbox
  const dispatchNewMessage = async (messageContent: string, customTrackingId?: string, isExplicitRetry = false) => {
    const formattedContent = messageContent.trim();
    if (!formattedContent || !chatId) return;

    // Rate Limit Guard (Capacity Protection: 20 msgs/min per student)
    const now = Date.now();
    sendTimestampsRef.current = sendTimestampsRef.current.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (sendTimestampsRef.current.length >= MAX_MESSAGES_PER_MINUTE) {
      const rateLimitMsg: Message = {
        id: uuidv4(),
        client_id: null,
        chat_id: chatId,
        sender_id: 'system',
        text: '⚠️ You are sending messages too quickly. Please wait a moment before sending more.',
        created_at: new Date().toISOString(),
        status: 'error',
        error_reason: 'Rate limit reached (max 20 messages per minute)',
      };
      setMessages((prev) => [...prev, rateLimitMsg]);
      return;
    }

    // Message Length Guard
    if (formattedContent.length > MAX_MESSAGE_LENGTH) {
      alert(`Message too long! DPS Buzz allows a maximum of ${MAX_MESSAGE_LENGTH} characters per message.`);
      return;
    }

    sendTypingStatus(false);
    const ephemeralTrackingId = customTrackingId || uuidv4();

    // In-Flight Guard: Never send identical client_id simultaneously
    if (inFlightRef.current.has(ephemeralTrackingId) && !isExplicitRetry) {
      return;
    }
    inFlightRef.current.add(ephemeralTrackingId);
    sendTimestampsRef.current.push(now);

    const optimisticPayload: Message = {
      id: ephemeralTrackingId,
      client_id: ephemeralTrackingId,
      chat_id: chatId,
      sender_id: currentUserId,
      text: formattedContent,
      created_at: new Date().toISOString(),
      status: 'sending', // Instant clock!
    };

    // If explicit retry, update existing message in place; otherwise append
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.client_id === ephemeralTrackingId || m.id === ephemeralTrackingId);
      if (idx !== -1) {
        return prev.map((m, i) => (i === idx ? { ...m, status: 'sending', error_reason: undefined } : m));
      }
      return [...prev, optimisticPayload];
    });

    // Save to persistent offline outbox so message survives page reload or app restart
    addToOutbox({
      client_id: ephemeralTrackingId,
      chat_id: chatId,
      sender_id: currentUserId,
      text: formattedContent,
      created_at: optimisticPayload.created_at || new Date().toISOString(),
      attempts: 0,
      lastAttemptAt: now,
    });

    // Attempt loop with up to 3 automated retries
    let success = false;
    let lastReason = 'Failed to send';

    for (let attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_BACKOFF_MS[attempt - 1];
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const res = await attemptDatabaseSend(chatId, currentUserId, formattedContent, ephemeralTrackingId);

      if (res.success) {
        success = true;
        removeFromOutbox(ephemeralTrackingId);
        inFlightRef.current.delete(ephemeralTrackingId);

        const saved = res.data;
        // INSTANT 1 TICK: Switch immediately the millisecond the server returns
        setMessages((prev) =>
          prev.map((msg) =>
            msg.client_id === ephemeralTrackingId || msg.id === ephemeralTrackingId
              ? {
                  ...msg,
                  id: saved?.id || msg.id,
                  status: 'sent',
                  created_at: saved?.created_at || msg.created_at,
                  error_reason: undefined,
                }
              : msg
          )
        );
        return;
      }

      lastReason = res.reason || lastReason;

      // Do NOT auto-retry fatal non-network errors (e.g. permission denied or validation)
      if (!res.isNetworkError) {
        break;
      }
    }

    // All retries failed -> Mark as red 'error' with clear human reason and single-tap Retry
    inFlightRef.current.delete(ephemeralTrackingId);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.client_id === ephemeralTrackingId || msg.id === ephemeralTrackingId
          ? {
              ...msg,
              status: 'error',
              error_reason: lastReason,
            }
          : msg
      )
    );
  };

  // 11. Process Outbox: Automatically sends unsent messages when back online
  const processOutbox = useCallback(async () => {
    if (outboxProcessingRef.current || typeof navigator === 'undefined' || !navigator.onLine) return;
    outboxProcessingRef.current = true;

    try {
      const items = loadOutbox();
      for (const item of items) {
        if (!inFlightRef.current.has(item.client_id)) {
          await dispatchNewMessage(item.text, item.client_id, true);
        }
      }
    } finally {
      outboxProcessingRef.current = false;
    }
  }, [loadOutbox]);

  // Trigger outbox drain on mount and when connection restores
  useEffect(() => {
    if (!isOffline && connectionStatus === 'connected') {
      processOutbox();
    }
  }, [isOffline, connectionStatus, processOutbox]);

  // 12. Explicit retry handler for failed messages (Sends exactly once, deduplicated)
  const retryMessage = (msgId: string) => {
    const target = messages.find((m) => m.id === msgId || m.client_id === msgId);
    if (!target) return;
    dispatchNewMessage(target.text, target.client_id || target.id, true);
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
    isOffline,
    outboxCount,
    refreshHistory: fetchHistoricalPayload,
    processOutbox,
  };
}
