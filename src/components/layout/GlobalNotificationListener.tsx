'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronRight, X, MessageCircle, Bell } from 'lucide-react';
import { DataStore, DUMMY_TEST_USERNAMES } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import {
  showBackgroundNotification,
  requestNotificationPermission,
  getNotificationPermission,
} from '@/lib/pushNotifications';

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
  const [showPermBanner, setShowPermBanner] = useState<boolean>(false);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const seenPostIdsRef = useRef<Set<string>>(new Set());
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const perm = getNotificationPermission();
      const dismissed = localStorage.getItem('dpsbuzz_notif_prompt_dismissed');
      if (perm === 'default' && !dismissed) {
        setShowPermBanner(true);
      }
    }
  }, []);

  const handleEnablePermissions = async () => {
    const res = await requestNotificationPermission();
    if (res === 'granted') {
      setShowPermBanner(false);
    }
  };

  const handleDismissBanner = () => {
    setShowPermBanner(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dpsbuzz_notif_prompt_dismissed', 'true');
    }
  };

  // Gentle high-fidelity Web Audio chime
  const playNotificationChime = useCallback(() => {
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
  }, []);

  const handleOpenChatFromToast = useCallback((senderUsername: string) => {
    setActiveToast(null);
    if (typeof window !== 'undefined') {
      // 1. Dispatch custom event for instantaneous in-memory switch if already on /chats
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:open_chat', {
          detail: { username: senderUsername },
        })
      );
    }
    // 2. Route navigation
    router.push(`/chats?user=${encodeURIComponent(senderUsername)}`);
  }, [router]);

  useEffect(() => {
    const user = DataStore.getCurrentUser();
    const currentUsername = (user?.username || '').toLowerCase().trim();

    // Populate already known messages and posts on initial load so old items don't spam notifications
    try {
      if (currentUsername && currentUsername !== 'guest') {
        const userMsgKey = `dpsbuzz_chat_messages_${currentUsername}_v3`;
        const localMsgs = JSON.parse(localStorage.getItem(userMsgKey) || '{}');
        for (const list of Object.values(localMsgs)) {
          if (Array.isArray(list)) {
            for (const m of list as any[]) {
              if (m && m.id) seenMessageIdsRef.current.add(m.id);
            }
          }
        }
      }
      const existingPosts = DataStore.getPosts(true);
      for (const p of existingPosts) {
        if (p && p.id) seenPostIdsRef.current.add(p.id);
      }
    } catch {}

    const checkIncoming = async () => {
      const currentUser = DataStore.getCurrentUser();
      const uname = (currentUser?.username || '').toLowerCase().trim();
      if (!uname || uname === 'guest') return;

      try {
        // Query server sync WITH the authenticated username query param
        const syncUrl = `/api/sync?username=${encodeURIComponent(uname)}&t=${Date.now()}`;
        const res = await fetch(syncUrl);
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
            if (parts.includes(uname)) {
              otherUsername = parts.find((p) => p !== uname) || '';
            }
          } else if (convKey.startsWith('conv-group-')) {
            otherUsername = 'group';
          }

          if (!otherUsername) continue;

          for (const msg of list as any[]) {
            if (!msg || !msg.id) continue;

            const isFromSomeoneElse = msg.senderUsername
              ? msg.senderUsername.toLowerCase() !== uname
              : msg.sender !== 'me';

            if (!seenMessageIdsRef.current.has(msg.id)) {
              seenMessageIdsRef.current.add(msg.id);
              hasNewMessages = true;

              const isCallMessage =
                Boolean(msg.isCallLog) ||
                (typeof msg.text === 'string' &&
                  (msg.text.includes('📞') ||
                    msg.text.includes('📹') ||
                    msg.text.includes('Voice call') ||
                    msg.text.includes('Video call') ||
                    msg.text.includes('Missed voice call') ||
                    msg.text.includes('Missed video call')));

              // If it's from someone else and this is NOT initial page load and NOT an automated call log
              if (isFromSomeoneElse && !isFirstRunRef.current && !isCallMessage) {
                const senderUser = (msg.senderUsername || otherUsername).toLowerCase().trim();
                const senderProf = allProfiles.find(
                  (p) => (p.username || '').toLowerCase() === senderUser
                );
                const senderName = senderProf ? senderProf.fullName : (msg.senderUsername || otherUsername);

                const tier = DataStore.getInboxTier(uname, senderUser);
                let toastText = msg.text;
                let notifTitle = tier === 'REQUESTS'
                  ? `💬 Message Request from @${senderUser}`
                  : `💬 New Message from @${senderUser}`;
                const storyMatch = msg.text.match(/^(?:You replied to their story|Replied to their story|Replied to your story|Replied to story):\s*["']?([\s\S]*?)["']?\s*(?:💬)?$/i);
                if (storyMatch) {
                  const content = storyMatch[1].replace(/^["']|["']$/g, '').trim();
                  toastText = `Replied to your story: "${content}" 💬`;
                  notifTitle = `📖 @${senderUser} replied to your story`;
                }

                newestIncomingMsg = {
                  id: msg.id,
                  senderUsername: senderUser,
                  senderName,
                  senderAvatar: senderProf?.avatar || null,
                  text: toastText,
                  time: msg.time || 'Just now',
                  conversationId: convKey,
                };

                // Add to notifications feed in DataStore
                DataStore.addNotification({
                  userId: uname,
                  type: 'chat',
                  title: notifTitle,
                  body: toastText,
                  link: tier === 'REQUESTS' ? `/chats?view=requests` : `/chats?user=${senderUser}`,
                });

                // Trigger system device notification (Service Worker ready on mobile + desktop)
                showBackgroundNotification(`DPS Buzz • ${senderName}`, {
                  body: toastText,
                  icon: senderProf?.avatar || '/icons/icon-192.png',
                  tag: `chat-${senderUser}`,
                  url: tier === 'REQUESTS' ? '/chats?view=requests' : `/chats?user=${encodeURIComponent(senderUser)}`,
                  vibrate: [200, 100, 200],
                }).catch(() => {});
              }
            }
          }
        }

        isFirstRunRef.current = false;

        // If there's an incoming message:
        if (newestIncomingMsg) {
          try {
            const userConvKey = `dpsbuzz_chat_conversations_${uname}_v3`;
            const userMsgKey = `dpsbuzz_chat_messages_${uname}_v3`;
            const convs = JSON.parse(localStorage.getItem(userConvKey) || '[]');
            const localMsgs = JSON.parse(localStorage.getItem(userMsgKey) || '{}');

            const otherUser = newestIncomingMsg.senderUsername.toLowerCase();
            const fullList = data.chatMessages[newestIncomingMsg.conversationId] || [];
            localMsgs[newestIncomingMsg.conversationId] = fullList;
            localStorage.setItem(userMsgKey, JSON.stringify(localMsgs));

            const existingIdx = convs.findIndex(
              (c: any) =>
                (c.username || '').toLowerCase() === otherUser ||
                c.id === `conv-${otherUser}` ||
                c.id === newestIncomingMsg!.conversationId
            );

            const incomingTier = DataStore.getInboxTier(uname, otherUser);

            if (existingIdx >= 0) {
              convs[existingIdx].lastMessage = newestIncomingMsg.text;
              convs[existingIdx].timeAgo = newestIncomingMsg.time;
              convs[existingIdx].isUnread = true;
              convs[existingIdx].inboxTier = incomingTier;
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
                inboxTier: incomingTier,
                isUnread: true,
                unreadCount: 1,
              });
            }
            localStorage.setItem(userConvKey, JSON.stringify(convs));
          } catch {}

          // Determine if user is currently inside THIS specific sender's chat
          const activeChatUser = (typeof window !== 'undefined' ? (sessionStorage.getItem('dpsbuzz_active_chat_user') || '') : '').toLowerCase().trim();
          const isCurrentlyInThisChat =
            pathname === '/chats' &&
            activeChatUser !== '' &&
            activeChatUser === newestIncomingMsg.senderUsername.toLowerCase();

          // If they are in another chat (or anywhere else in the app), SHOW THE HEADS-UP NOTIFICATION!
          if (!isCurrentlyInThisChat) {
            playNotificationChime();
            setActiveToast(newestIncomingMsg);
          }
        }

        // Check for new posts from other students and trigger direct device push notification
        if (Array.isArray(data.posts)) {
          const deletedUsers = DataStore.getDeletedUsernames();
          for (const post of data.posts) {
            if (!post || !post.id) continue;
            if (!seenPostIdsRef.current.has(post.id)) {
              seenPostIdsRef.current.add(post.id);

              const postAuthor = (post.username || '').toLowerCase().trim();
              if (
                !isFirstRunRef.current &&
                postAuthor &&
                postAuthor !== uname &&
                !DUMMY_TEST_USERNAMES.has(postAuthor) &&
                !deletedUsers.has(postAuthor)
              ) {
                const authorProf = allProfiles.find((p) => (p.username || '').toLowerCase() === postAuthor);
                const authorName = authorProf?.fullName || post.username;
                const postSnippet = post.caption ? post.caption.slice(0, 100) : 'Shared a new photo on DPS Buzz 📸';

                DataStore.addNotification({
                  userId: uname,
                  type: 'post',
                  title: `📸 New Post from @${post.username}`,
                  body: postSnippet,
                  link: '/home',
                });

                showBackgroundNotification(`DPS Buzz • ${authorName}`, {
                  body: postSnippet,
                  icon: post.avatar || authorProf?.avatar || '/icons/icon-192.png',
                  tag: `post-${post.id}`,
                  url: '/home',
                  vibrate: [150, 80, 150],
                }).catch(() => {});

                playNotificationChime();
              }
            }
          }
        }

        if (hasNewMessages) {
          window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
        }
      } catch {}
    };

    // Run immediately and poll every 800ms for continuous sync
    checkIncoming();
    const interval = setInterval(checkIncoming, 800);

    // Also trigger immediately on internal updates
    window.addEventListener('dpsbuzz:content_updated', checkIncoming);
    window.addEventListener('storage', checkIncoming);

    return () => {
      clearInterval(interval);
      window.removeEventListener('dpsbuzz:content_updated', checkIncoming);
      window.removeEventListener('storage', checkIncoming);
    };
  }, [pathname, playNotificationChime]);

  // Real-Time 0ms Instant Push / Chime Listener via BroadcastChannel & CustomEvent
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRealtimeIncoming = (data: any) => {
      if (!data || data.type !== 'MESSAGE_SENT' || !data.message) return;
      const { conversationId, message, senderUsername } = data;
      const currentUser = DataStore.getCurrentUser();
      const uname = (currentUser?.username || '').toLowerCase().trim();
      if (!uname || uname === 'guest') return;

      const senderUser = (message.senderUsername || senderUsername || '').toLowerCase().trim();
      if (senderUser === uname) return; // Do not notify yourself

      // Verify if current user is involved in this conversation
      const isGroup = conversationId && conversationId.startsWith('conv-group-');
      const isDirectWithMe = conversationId && conversationId.includes('__') &&
        conversationId.split('__').map((p: string) => p.trim().toLowerCase()).includes(uname);

      if (!isGroup && !isDirectWithMe) return;

      if (seenMessageIdsRef.current.has(message.id)) return;
      seenMessageIdsRef.current.add(message.id);

      const allProfiles = DataStore.getProfiles();
      const senderProf = allProfiles.find((p) => (p.username || '').toLowerCase() === senderUser);
      const senderName = senderProf ? senderProf.fullName : senderUser;
      const tier = DataStore.getInboxTier(uname, senderUser);

      let toastText = message.text || 'Sent an attachment';
      let notifTitle = tier === 'REQUESTS'
        ? `💬 Message Request from @${senderUser}`
        : `💬 New Message from @${senderUser}`;

      const storyMatch = (message.text || '').match(/^(?:You replied to their story|Replied to their story|Replied to your story|Replied to story):\s*["']?([\s\S]*?)["']?\s*(?:💬)?$/i);
      if (storyMatch) {
        const content = storyMatch[1].replace(/^["']|["']$/g, '').trim();
        toastText = `Replied to your story: "${content}" 💬`;
        notifTitle = `📖 @${senderUser} replied to your story`;
      }

      const toastItem: IncomingChatToast = {
        id: message.id,
        senderUsername: senderUser,
        senderName,
        senderAvatar: senderProf?.avatar || null,
        text: toastText,
        time: message.time || 'Just now',
        conversationId,
      };

      // Record in notifications feed
      DataStore.addNotification({
        userId: uname,
        type: 'chat',
        title: notifTitle,
        body: toastText,
        link: tier === 'REQUESTS' ? `/chats?view=requests` : `/chats?user=${senderUser}`,
      });

      // Device push notification directly to phone/PC
      showBackgroundNotification(`DPS Buzz • ${senderName}`, {
        body: toastText,
        icon: senderProf?.avatar || '/icons/icon-192.png',
        tag: `chat-${senderUser}`,
        url: tier === 'REQUESTS' ? `/chats?view=requests` : `/chats?user=${encodeURIComponent(senderUser)}`,
        vibrate: [200, 100, 200],
      }).catch(() => {});

      // Check if user is currently inside THIS specific sender's chat
      const activeChatUser = (typeof window !== 'undefined' ? (sessionStorage.getItem('dpsbuzz_active_chat_user') || '') : '').toLowerCase().trim();
      const isCurrentlyInThisChat =
        pathname === '/chats' &&
        activeChatUser !== '' &&
        activeChatUser === senderUser;

      if (!isCurrentlyInThisChat) {
        playNotificationChime();
        setActiveToast(toastItem);
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('dpsbuzz_realtime_chats');
        channel.onmessage = (e) => {
          handleRealtimeIncoming(e.data);
        };
      } catch {}
    }

    const handleCustomChatEvent = (e: any) => {
      handleRealtimeIncoming(e.detail);
    };
    window.addEventListener('dpsbuzz:chat_event', handleCustomChatEvent);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('dpsbuzz:chat_event', handleCustomChatEvent);
    };
  }, [pathname, playNotificationChime]);

  // Auto-dismiss toast banner after 5.5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast && !showPermBanner) return null;

  return (
    <>
      {showPermBanner && !activeToast && (
        <div
          className="fixed top-3 left-3 right-3 max-w-md mx-auto z-[95] animate-slide-down select-none pointer-events-auto"
          role="region"
          aria-label="Enable notifications"
        >
          <div
            className="rounded-2xl border p-3 shadow-xl backdrop-blur-2xl flex items-center justify-between gap-3"
            style={{
              backgroundColor: 'rgba(18, 18, 18, 0.95)',
              borderColor: 'rgba(236, 72, 153, 0.35)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl">🔔</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Enable Device Notifications</p>
                <p className="text-[11px] text-zinc-300 truncate">Get instant alerts for chats & new posts</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleEnablePermissions}
                className="px-3 py-1.5 rounded-xl gradient-bg text-white text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 cursor-pointer"
              >
                Turn On
              </button>
              <button
                type="button"
                onClick={handleDismissBanner}
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeToast && (
        <div
          className="fixed top-3 left-3 right-3 max-w-md mx-auto z-[100] animate-slide-down select-none pointer-events-auto"
          role="alert"
          aria-live="assertive"
        >
          <div
            className="rounded-2xl border p-3 shadow-2xl backdrop-blur-2xl flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            style={{
              backgroundColor: 'rgba(18, 18, 18, 0.96)',
              borderColor: 'rgba(236, 72, 153, 0.45)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(236, 72, 153, 0.3)',
            }}
            onClick={() => handleOpenChatFromToast(activeToast.senderUsername)}
          >
            {/* Sender Avatar with Online Story Ring Accent */}
            <div className="relative shrink-0">
              <div
                className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs border"
                style={{
                  backgroundColor: getAvatarColorPair(activeToast.senderUsername).bg,
                  color: getAvatarColorPair(activeToast.senderUsername).text,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }}
              >
                {activeToast.senderAvatar ? (
                  <img src={activeToast.senderAvatar} alt={activeToast.senderName} className="w-full h-full object-cover" />
                ) : (
                  activeToast.senderName.slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121212] flex items-center justify-center">
                <MessageCircle size={8} className="text-white fill-white" />
              </span>
            </div>

            {/* Message Content: Sender Profile Name + Message Preview */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold truncate text-white flex items-center gap-1.5">
                  <span>{activeToast.senderName}</span>
                  <span className="text-[11px] text-zinc-400 font-normal">@{activeToast.senderUsername}</span>
                </p>
                <span className="text-[10px] text-zinc-400 shrink-0 font-medium">{activeToast.time}</span>
              </div>
              <p className="text-xs text-zinc-200 truncate mt-0.5 font-medium leading-snug">
                {activeToast.text}
              </p>
            </div>

            {/* Action Button & Close */}
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => handleOpenChatFromToast(activeToast.senderUsername)}
                className="px-3 py-1.5 rounded-xl gradient-bg text-white text-xs font-bold flex items-center gap-1 shadow-sm hover:opacity-90 active:scale-95 cursor-pointer"
              >
                <span>Reply</span>
                <ChevronRight size={13} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => setActiveToast(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GlobalNotificationListener;
