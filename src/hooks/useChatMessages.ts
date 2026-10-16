'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid'; // Use UUIDs to track message instances

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here';

// Initialize your validated Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Message {
  id: string;        // Server database ID (or client temp UUID)
  client_id?: string; // Critical to pair optimistic messages with server updates
  chat_id: string;
  sender_id: string;
  text: string;
  created_at?: string;
  status?: 'sending' | 'sent' | 'error';
}

export function useChatMessages(chatId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync so our real-time closure always reads the latest state array
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 1. Initial Load Fetch
  useEffect(() => {
    if (!chatId) return;

    async function loadMessages() {
      // Guard against placeholder URL to prevent unhandled network crashes
      if (supabaseUrl.includes('your-project-id') || !supabaseUrl.startsWith('http')) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setMessages(data);
        }
      } catch (err) {
        console.warn('Could not load Supabase messages for chat:', chatId, err);
      }
    }
    loadMessages();
  }, [chatId]);

  // 2. Setup Realtime Listener with De-duplication Logic
  useEffect(() => {
    if (!chatId || supabaseUrl.includes('your-project-id')) return;

    let channel: any = null;
    try {
      channel = supabase
        .channel(`chat-room:${chatId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            const currentMessages = messagesRef.current;

            // Check if this incoming message was already created optimistically by this client
            const existingIndex = currentMessages.findIndex(
              (msg) => 
                (msg.client_id && msg.client_id === newMessage.client_id) || 
                msg.id === newMessage.id
            );

            if (existingIndex !== -1) {
              // Confirm the optimistic message by replacing it with the formal server data
              setMessages((prev) =>
                prev.map((msg, idx) => (idx === existingIndex ? { ...newMessage, status: 'sent' } : msg))
              );
            } else {
              // Message came from another user/device; safely append it
              setMessages((prev) => [...prev, { ...newMessage, status: 'sent' }]);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Could not subscribe to Supabase chat channel:', err);
    }

    // Clean up subscription when component unmounts or chat switches
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [chatId]);

  // 3. Robust Send Message Trigger
  const sendMessage = async (text: string) => {
    const clientGeneratedId = uuidv4();
    
    const optimisticMessage: Message = {
      id: clientGeneratedId, // Temp ID for list rendering keys
      client_id: clientGeneratedId,
      chat_id: chatId,
      sender_id: currentUserId,
      text,
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    // Immediately push to UI
    setMessages((prev) => [...prev, optimisticMessage]);

    // If Supabase credentials are placeholder values, mark as sent optimistically
    if (supabaseUrl.includes('your-project-id')) {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.client_id === clientGeneratedId ? { ...msg, status: 'sent' } : msg
          )
        );
      }, 300);
      return;
    }

    try {
      // Persist to Supabase Database
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: chatId,
            sender_id: currentUserId,
            text,
            client_id: clientGeneratedId, // Store client_id on schema to link back
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Failed to send message:', error);
        // Update UI state to show error status instead of silently discarding
        setMessages((prev) =>
          prev.map((msg) =>
            msg.client_id === clientGeneratedId ? { ...msg, status: 'error' } : msg
          )
        );
      } else if (data) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.client_id === clientGeneratedId ? { ...data, status: 'sent' } : msg
          )
        );
      }
    } catch (err) {
      console.error('Network error sending message to Supabase:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.client_id === clientGeneratedId ? { ...msg, status: 'error' } : msg
        )
      );
    }
  };

  return { messages, sendMessage };
}
