"use client";
import { useEffect, useState, useTransition } from 'react';
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
  text: string;
  created_at?: string;
  status?: 'sending' | 'sent' | 'error';
}

export function useChatMessages(chatId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!chatId) return;
    let isMounted = true;
    async function fetchHistoricalPayload() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      if (error) return;
      if (isMounted && data) {
        startTransition(() => {
          setMessages(data.map(msg => ({ ...msg, status: 'sent' })));
        });
      }
    }
    fetchHistoricalPayload();
    return () => { isMounted = false; };
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const chatChannel = supabase
      .channel(`realtime:chat_room:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const freshMessage = payload.new as Message;
          setMessages((previousState) => {
            const matchesExisting = previousState.findIndex((existingMsg) => {
              const byClientHandshake = freshMessage.client_id && existingMsg.client_id === freshMessage.client_id;
              const byDatabaseRecordId = existingMsg.id === freshMessage.id;
              return !!(byClientHandshake || byDatabaseRecordId);
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
      .subscribe();
    return () => { supabase.removeChannel(chatChannel); };
  }, [chatId]);

  const dispatchNewMessage = async (messageContent: string, customTrackingId?: string) => {
    const formattedContent = messageContent.trim();
    if (!formattedContent) return;
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
    setMessages((prev) => [...prev, optimisticPayload]);
    const { error } = await supabase
      .from('messages')
      .insert([{ chat_id: chatId, sender_id: currentUserId, text: formattedContent, client_id: ephemeralTrackingId }]);
    if (error) {
      setMessages((prev) =>
        prev.map((msg) => msg.client_id === ephemeralTrackingId ? { ...msg, status: 'error' } : msg)
      );
    }
  };

  return { messages, sendMessage: dispatchNewMessage, isLoadingHistory: isPending };
}
