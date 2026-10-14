'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronRight, X } from 'lucide-react';
import { DataStore } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

interface IncomingChatToast {
  id: string;
  senderUsername: string;
  senderName: string;
  senderAvatar?: string | null;
  text: string;
  time: string;
  conversationId: string;
}

export function GlobalNotificationListener() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeToast, setActiveToast] = useState<IncomingChatToast | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const isFirstRunRef = useRef(true);

  // Play synthetic gentle high-fidelity chime (Web Audio API)
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  };

  useEffect(() => {
    // Populate already known messages on initial load so we don't spam toasts for old history
    try {
      const localMsgs = JSON.parse(localStorage.getItem('dpsbuzz_chat_messages_v1') || '{}');
      for (const list of Object.values(localMsgs)) {
        if (Array.isArray(list)) {
          for (const m of list as any[]) {
            if (m && m.id) seenMessageIdsRef.current.add(m.id);
          }
        }
      }
    } catch {}

    const checkIncoming = async () => {
      const user = DataStore.getCurrentUser();
      const currentUsername = (user?.username || '').toLowerCase().trim();
      if (!currentUsername || currentUsername === 'guest') return;

      try {
        const res = await fetch('/api/sync?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.chatMessages) return;

        const allProfiles = DataStore.getProfiles();
        let newestIncomingMsg: IncomingChatToast | null = null;
        let hasNewMessages = false;

        for (const [convKey, list] of Object.entries(data.chatMessages)) {
          if (!Array.isArray(list) || list.length === 0) continue;

          // Check if current user is part of this conversation
          let otherUsername = '';
          if (convKey.includes('__')) {
            const parts = convKey.split('__').map((p) => p.trim().toLowerCase());
            if (parts.includes(currentUsername)) {
              otherUsername = parts.find((p) => p !== currentUsername) || '';
            }
          } else if (convKey.startsWith('conv-') && !convKey.startsWith('conv-group-')) {
            const raw = convKey.replace(/^conv-/, '').toLowerCase();
            if (raw !== currentUsername) {
              otherUsername = raw;
            }
          }

          if (!otherUsername) continue;

          for (const msg of list as any[]) {
            if (!msg || !msg.id) continue;

            const isFromSomeoneElse = msg.senderUsername
              ? msg.senderUsername.toLowerCase() !== currentUsername
              : msg.sender !== 'me';

            if (!seenMessageIdsRef.current.has(msg.id)) {
              seenMessageIdsRef.current.add(msg.id);
              hasNewMessages = true;

              // If it's from someone else and this is NOT initial page load
              if (isFromSomeoneElse && !isFirstRunRef.current) {
                const senderProf = allProfiles.find(
                  (p) => (p.username || '').toLowerCase() === (msg.senderUsername || otherUsername).toLowerCase()
                );
                const senderName = senderProf ? senderProf.fullName : (msg.senderUsername || otherUsername);

                newestIncomingMsg = {
                  id: msg.id,
                  senderUsername: msg.senderUsername || otherUsername,
                  senderName,
                  senderAvatar: senderProf?.avatar,
                  text: msg.text,
                  time: msg.time || 'Just now',
                  conversationId: convKey,
                };

                // Add to notifications feed in DataStore
                DataStore.addNotification({
                  userId: currentUsername,
                  type: 'chat',
                  title: `💬 New Message from @${msg.senderUsername || otherUsername}`,
                  body: msg.text,
                  link: `/chats?user=${msg.senderUsername || otherUsername}`,
                });

                // Trigger browser push notification if permitted
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  try {
                    new Notification(`DPS Buzz • @${msg.senderUsername || otherUsername}`, {
                      body: msg.text,
                      icon: '/icons/icon-192.png',
                    });
                  } catch {}
                }
              }
            }
          }
        }

        isFirstRunRef.current = false;

        // If there's an incoming message and user is not currently in THAT active chat:
        if (newestIncomingMsg) {
          try {
            const convs = JSON.parse(localStorage.getItem('dpsbuzz_chat_conversations_v2') || '[]');
            const localMsgs = JSON.parse(localStorage.getItem('dpsbuzz_chat_messages_v1') || '{}');

            const otherUser = newestIncomingMsg.senderUsername.toLowerCase();
            const fullList = data.chatMessages[newestIncomingMsg.conversationId] || [];
            localMsgs[newestIncomingMsg.conversationId] = fullList;
            localMsgs[`conv-${otherUser}`] = fullList;
            localStorage.setItem('dpsbuzz_chat_messages_v1', JSON.stringify(localMsgs));

            const existingIdx = convs.findIndex((c: any) => (c.username || '').toLowerCase() === otherUser || c.id === `conv-${otherUser}` || c.id === newestIncomingMsg!.conversationId);
            if (existingIdx >= 0) {
              convs[existingIdx].lastMessage = newestIncomingMsg.text;
              convs[existingIdx].timeAgo = newestIncomingMsg.time;
              convs[existingIdx].isUnread = true;
              convs[existingIdx].unreadCount = (convs[existingIdx].unreadCount || 0) + 1;
            } else {
              convs.unshift({
                id: `conv-${otherUser}`,
                name: newestIncomingMsg.senderName,
                username: otherUser,
                avatar: newestIncomingMsg.senderAvatar || null,
                studentClass: 'Student',
                lastMessage: newestIncomingMsg.text,
                timeAgo: newestIncomingMsg.time,
                isUnread: true,
                unreadCount: 1,
              });
            }
            localStorage.setItem('dpsbuzz_chat_conversations_v2', JSON.stringify(convs));
          } catch {}

          const isCurrentlyInThisChat = pathname === '/chats' && window.location.search.includes(newestIncomingMsg.senderUsername);
          if (!isCurrentlyInThisChat) {
            playNotificationChime();
            setActiveToast(newestIncomingMsg);
          }
        }

        if (hasNewMessages) {
          window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
        }
      } catch {}
    };

    // Run immediately and poll every 2.5s
    checkIncoming();
    const interval = setInterval(checkIncoming, 2500);
    return () => clearInterval(interval);
  }, [pathname]);

  // Auto-dismiss toast banner after 5.5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  const colors = getAvatarColorPair(activeToast.senderUsername);
  const initials = activeToast.senderName.slice(0, 2).toUpperCase();

  return (
    <div
      className="fixed top-3 left-3 right-3 max-w-md mx-auto z-50 animate-slide-down select-none"
      role="alert"
      aria-live="assertive"
    >
      <div
        className="rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl flex items-center gap-3 transition-all cursor-pointer hover:opacity-95"
        style={{
          backgroundColor: 'var(--surface-sunken)',
          borderColor: 'var(--primary)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--primary)',
        }}
        onClick={() => {
          setActiveToast(null);
          router.push(`/chats?user=${encodeURIComponent(activeToast.senderUsername)}`);
        }}
      >
        {/* Sender Avatar */}
        <div
          className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 border"
          style={{
            backgroundColor: colors.bg,
            color: colors.text,
            borderColor: 'var(--line)',
          }}
        >
          {activeToast.senderAvatar ? (
            <img src={activeToast.senderAvatar} alt={activeToast.senderName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-bold truncate text-[var(--text)] flex items-center gap-1.5">
              <span>{activeToast.senderName}</span>
              <span className="text-[10px] text-[var(--text-muted)] font-normal">@{activeToast.senderUsername}</span>
            </p>
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">{activeToast.time}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 font-medium">
            {activeToast.text}
          </p>
        </div>

        {/* Action Button & Close */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setActiveToast(null);
              router.push(`/chats?user=${encodeURIComponent(activeToast.senderUsername)}`);
            }}
            className="px-2.5 py-1.5 rounded-xl gradient-bg text-white text-[11px] font-bold flex items-center gap-1 shadow-xs hover:opacity-90 active:scale-95 cursor-pointer"
          >
            <span>Reply</span>
            <ChevronRight size={12} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => setActiveToast(null)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--line)] cursor-pointer"
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default GlobalNotificationListener;
