'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronRight, X, MessageCircle, Bell, Gamepad2 } from 'lucide-react';
import { DataStore, DUMMY_TEST_USERNAMES } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import {
  showBackgroundNotification,
  requestNotificationPermission,
  getNotificationPermission,
} from '@/lib/pushNotifications';
import { supabase } from '@/hooks/useChatMessages';

interface IncomingChatToast {
  id: string;
  senderUsername: string;
  senderName: string;
  senderAvatar?: string | null;
  text: string;
  time: string;
  conversationId: string;
  isGameInvite?: boolean;
  gameType?: 'connect4' | 'cricket';
}

export function GlobalNotificationListener() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeToast, setActiveToast] = useState<IncomingChatToast | null>(null);
  const [showPermBanner, setShowPermBanner] = useState<boolean>(false);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const seenPostIdsRef = useRef<Set<string>>(new Set());
  const isFirstRunRef = useRef(true);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

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

  // Gentle high-fidelity Web Audio chime with shared singleton
  const playNotificationChime = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const win = window as any;
      if (!win.__dpsbuzzNotifAudioCtx || win.__dpsbuzzNotifAudioCtx.state === 'closed') {
        win.__dpsbuzzNotifAudioCtx = new AudioCtx();
      }
      const ctx = win.__dpsbuzzNotifAudioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
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
        // Query server sync with mode=incoming (~1.5 KB payload instead of 628 KB full dump)
        const syncUrl = `/api/sync?username=${encodeURIComponent(uname)}&mode=incoming&t=${Date.now()}`;
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
                let isGameInvite = false;
                let gameType: 'connect4' | 'cricket' | undefined = undefined;

                if (typeof msg.text === 'string' && msg.text.startsWith('🔴 [CONNECT4_GAME]:')) {
                  isGameInvite = true;
                  gameType = 'connect4';
                  toastText = '🔴 Challenged you to a Connect 4 duel! 🎮';
                  notifTitle = `🔴 @${senderUser} challenged you to Connect 4!`;
                } else if (typeof msg.text === 'string' && msg.text.startsWith('🎮 [CRICKET_GAME]:')) {
                  isGameInvite = true;
                  gameType = 'cricket';
                  toastText = '🏏 Challenged you to Guess the Cricketer! 🏆';
                  notifTitle = `🎮 @${senderUser} challenged you to Guess the Cricketer!`;
                } else {
                  const storyMatch = msg.text.match(/^(?:You replied to their story|Replied to their story|Replied to your story|Replied to story):\s*["']?([\s\S]*?)["']?\s*(?:💬)?$/i);
                  if (storyMatch) {
                    const content = storyMatch[1].replace(/^["']|["']$/g, '').trim();
                    toastText = `Replied to your story: "${content}" 💬`;
                    notifTitle = `📖 @${senderUser} replied to your story`;
                  }
                }

                newestIncomingMsg = {
                  id: msg.id,
                  senderUsername: senderUser,
                  senderName,
                  senderAvatar: senderProf?.avatar || null,
                  text: toastText,
                  time: msg.time || 'Just now',
                  conversationId: convKey,
                  isGameInvite,
                  gameType,
                };

                // Add to notifications feed in DataStore
                DataStore.addNotification({
                  userId: uname,
                  type: isGameInvite ? 'connect4' : 'chat',
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
            pathnameRef.current === '/chats' &&
            activeChatUser !== '' &&
            activeChatUser === newestIncomingMsg.senderUsername.toLowerCase();

          // If they are in another chat (or anywhere else in the app), SHOW THE HEADS-UP NOTIFICATION!
          if (!isCurrentlyInThisChat) {
            playNotificationChime();
            setActiveToast(newestIncomingMsg);
          }
        }

        // Check for new posts or reels from other students and trigger direct device push notification
        let hasNewPosts = false;
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
                hasNewPosts = true;
                const authorProf = allProfiles.find((p) => (p.username || '').toLowerCase() === postAuthor);
                const authorName = authorProf?.fullName || post.username;
                const isReel = Boolean(post.isReel || post.isVideo);
                const postSnippet = post.caption ? post.caption.slice(0, 100) : (isReel ? 'Shared a new reel on DPS Buzz 🎬' : 'Shared a new photo on DPS Buzz 📸');
                const notifTitle = isReel ? `🎬 New Reel from @${post.username}` : `📸 New Post from @${post.username}`;
                const targetLink = isReel ? `/reels?id=${post.id}` : `/u/${post.username}?post=${post.id}`;

                DataStore.addNotification({
                  userId: uname,
                  type: isReel ? 'reel' : 'post',
                  title: notifTitle,
                  body: postSnippet,
                  link: targetLink,
                });

                showBackgroundNotification(`DPS Buzz • ${authorName}`, {
                  body: postSnippet,
                  icon: post.avatar || authorProf?.avatar || '/icons/icon-192.png',
                  tag: `${isReel ? 'reel' : 'post'}-${post.id}`,
                  url: targetLink,
                  vibrate: [150, 80, 150],
                }).catch(() => {});

                playNotificationChime();
              }
            }
          }
        }

        if (hasNewMessages || hasNewPosts) {
          window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
        }
      } catch {}
    };

    // Run immediately and poll every 30s when visible (real-time events handle 0ms instant updates)
    checkIncoming();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      checkIncoming();
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkIncoming();
      }
    };

    // Trigger on tab refocus
    window.addEventListener('storage', checkIncoming);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkIncoming);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [playNotificationChime]);

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
      let isAuthorized = false;
      if (isGroup) {
        const groupId = conversationId.replace(/^conv-/, '');
        const groupMembers = DataStore.getGroupMembers(groupId).map((m: any) =>
          typeof m === 'string' ? m.toLowerCase().trim() : (m.username || '').toLowerCase().trim()
        );
        isAuthorized = groupMembers.includes(uname) || uname === 'shashwath71845';
      } else if (conversationId && conversationId.includes('__')) {
        const participants = conversationId.split('__').map((p: string) => p.trim().toLowerCase());
        isAuthorized = participants.includes(uname) || uname === 'shashwath71845';
      }

      if (!isAuthorized) return;

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
      let isGameInvite = false;
      let gameType: 'connect4' | 'cricket' | undefined = undefined;

      if (typeof message.text === 'string' && message.text.startsWith('🔴 [CONNECT4_GAME]:')) {
        isGameInvite = true;
        gameType = 'connect4';
        toastText = '🔴 Challenged you to a Connect 4 duel! 🎮';
        notifTitle = `🔴 @${senderUser} challenged you to Connect 4!`;
      } else if (typeof message.text === 'string' && message.text.startsWith('🎮 [CRICKET_GAME]:')) {
        isGameInvite = true;
        gameType = 'cricket';
        toastText = '🏏 Challenged you to Guess the Cricketer! 🏆';
        notifTitle = `🎮 @${senderUser} challenged you to Guess the Cricketer!`;
      } else {
        const storyMatch = (message.text || '').match(/^(?:You replied to their story|Replied to their story|Replied to your story|Replied to story):\s*["']?([\s\S]*?)["']?\s*(?:💬)?$/i);
        if (storyMatch) {
          const content = storyMatch[1].replace(/^["']|["']$/g, '').trim();
          toastText = `Replied to your story: "${content}" 💬`;
          notifTitle = `📖 @${senderUser} replied to your story`;
        }
      }

      const toastItem: IncomingChatToast = {
        id: message.id,
        senderUsername: senderUser,
        senderName,
        senderAvatar: senderProf?.avatar || null,
        text: toastText,
        time: message.time || 'Just now',
        conversationId,
        isGameInvite,
        gameType,
      };

      // Record in notifications feed
      DataStore.addNotification({
        userId: uname,
        type: isGameInvite ? 'connect4' : 'chat',
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
    let c4Channel: BroadcastChannel | null = null;
    let cricketChannel: BroadcastChannel | null = null;
    let sbChannel: any = null;

    // Live Cross-Device Supabase Realtime Listener (Instant notification across phone, tablet & PC)
    const currentUser = DataStore.getCurrentUser();
    const uname = (currentUser?.username || '').toLowerCase().trim();

    if (uname && uname !== 'guest') {
      try {
        sbChannel = supabase
          .channel(`realtime:global_student_notifs:${uname}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
              const freshMessage = payload.new as any;
              if (!freshMessage || !freshMessage.chat_id) return;
              const senderId = (freshMessage.sender_id || '').toLowerCase().trim();
              if (senderId === uname) return;

              // Check if current user is participant
              const chatId = freshMessage.chat_id;
              let isRecipient = false;
              let otherUser = '';

              if (chatId.includes('__')) {
                const parts = chatId.split('__').map((p: string) => p.trim().toLowerCase());
                if (parts.includes(uname)) {
                  isRecipient = true;
                  otherUser = parts.find((p: string) => p !== uname) || senderId;
                }
              } else if (chatId.startsWith('conv-group-') || chatId.startsWith('group-')) {
                const groupId = chatId.replace(/^conv-/, '');
                const groupMembers = DataStore.getGroupMembers(groupId).map((m: any) =>
                  typeof m === 'string' ? m.toLowerCase().trim() : (m.username || '').toLowerCase().trim()
                );
                if (groupMembers.includes(uname) || uname === 'shashwath71845') {
                  isRecipient = true;
                  otherUser = 'group';
                }
              } else if (chatId.startsWith('conv-')) {
                const cleanTarget = chatId.replace(/^conv-/, '').toLowerCase().trim();
                if (cleanTarget === uname || senderId !== uname) {
                  isRecipient = true;
                  otherUser = senderId;
                }
              }

              if (!isRecipient) return;
              if (seenMessageIdsRef.current.has(freshMessage.id) || (freshMessage.client_id && seenMessageIdsRef.current.has(freshMessage.client_id))) {
                return;
              }
              seenMessageIdsRef.current.add(freshMessage.id);
              if (freshMessage.client_id) seenMessageIdsRef.current.add(freshMessage.client_id);

              const allProfiles = DataStore.getProfiles();
              const senderProf = allProfiles.find((p) => (p.username || '').toLowerCase() === senderId);
              const senderName = senderProf ? senderProf.fullName : senderId;

              let previewText = freshMessage.text || 'Sent an attachment 📸';
              let notifTitle = `💬 New Message from @${senderId}`;
              let isGameInvite = false;
              let gameType: 'connect4' | 'cricket' | undefined = undefined;

              if (typeof freshMessage.text === 'string' && freshMessage.text.startsWith('🔴 [CONNECT4_GAME]:')) {
                isGameInvite = true;
                gameType = 'connect4';
                previewText = '🔴 Challenged you to a Connect 4 duel! 🎮';
                notifTitle = `🔴 @${senderId} challenged you to Connect 4!`;
              } else if (typeof freshMessage.text === 'string' && freshMessage.text.startsWith('🎮 [CRICKET_GAME]:')) {
                isGameInvite = true;
                gameType = 'cricket';
                previewText = '🏏 Challenged you to Guess the Cricketer! 🏆';
                notifTitle = `🎮 @${senderId} challenged you to Guess the Cricketer!`;
              }

              // Sound & physical vibration
              playNotificationChime();
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try { navigator.vibrate([200, 100, 200]); } catch {}
              }

              // System OS push notification on device
              showBackgroundNotification(`DPS Buzz • ${senderName}`, {
                body: previewText,
                icon: senderProf?.avatar || '/icons/icon-192.png',
                tag: `chat-${senderId}`,
                url: `/chats?user=${encodeURIComponent(senderId)}`,
                vibrate: [200, 100, 200],
              }).catch(() => {});

              // In-app toast banner
              const activeChatUser = (typeof window !== 'undefined' ? (sessionStorage.getItem('dpsbuzz_active_chat_user') || '') : '').toLowerCase().trim();
              const isCurrentlyInThisChat =
                pathnameRef.current === '/chats' &&
                activeChatUser !== '' &&
                activeChatUser === senderId;

              if (!isCurrentlyInThisChat) {
                setActiveToast({
                  id: freshMessage.id,
                  senderUsername: senderId,
                  senderName,
                  senderAvatar: senderProf?.avatar || null,
                  text: previewText,
                  time: freshMessage.created_at ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(freshMessage.created_at)) : 'Just now',
                  conversationId: chatId,
                  isGameInvite,
                  gameType,
                });
              }

              // Notification center history
              DataStore.addNotification({
                userId: uname,
                type: isGameInvite ? 'connect4' : 'chat',
                title: notifTitle,
                body: previewText,
                link: `/chats?user=${senderId}`,
              });

              window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime notification channel error:', err);
      }
    }

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('dpsbuzz_realtime_chats');
        channel.onmessage = (e) => {
          handleRealtimeIncoming(e.data);
        };
      } catch {}

      try {
        c4Channel = new BroadcastChannel('dpsbuzz_connect4_realtime');
        c4Channel.onmessage = (e) => {
          const currentUser = DataStore.getCurrentUser();
          const uname = (currentUser?.username || '').toLowerCase().trim();
          if (e.data?.type === 'invite' && e.data?.opponent?.toLowerCase() === uname) {
            window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
            window.dispatchEvent(new CustomEvent('dpsbuzz_connect4_update'));
          }
        };
      } catch {}

      try {
        cricketChannel = new BroadcastChannel('dpsbuzz_cricket_realtime');
        cricketChannel.onmessage = (e) => {
          const currentUser = DataStore.getCurrentUser();
          const uname = (currentUser?.username || '').toLowerCase().trim();
          if (e.data?.type === 'invite' && e.data?.opponent?.toLowerCase() === uname) {
            window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
            window.dispatchEvent(new CustomEvent('dpsbuzz_cricket_update'));
          }
        };
      } catch {}
    }

    const handleCustomChatEvent = (e: any) => {
      handleRealtimeIncoming(e.detail);
    };
    window.addEventListener('dpsbuzz:chat_event', handleCustomChatEvent);

    return () => {
      if (channel) channel.close();
      if (c4Channel) c4Channel.close();
      if (cricketChannel) cricketChannel.close();
      if (sbChannel) {
        try { supabase.removeChannel(sbChannel); } catch {}
      }
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
              borderColor: 'rgba(6, 182, 212, 0.4)',
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
              borderColor: 'rgba(6, 182, 212, 0.45)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(6, 182, 212, 0.25)',
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
              <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${activeToast.isGameInvite ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-emerald-500'} border-2 border-[#121212] flex items-center justify-center`}>
                {activeToast.isGameInvite ? (
                  <Gamepad2 size={9} className="text-white" />
                ) : (
                  <MessageCircle size={8} className="text-white fill-white" />
                )}
              </span>
            </div>

            {/* Message Content: Sender Profile Name + Message Preview */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold truncate text-white flex items-center gap-1.5">
                  <span>{activeToast.senderName}</span>
                  <span className="text-[11px] text-zinc-400 font-normal">@{activeToast.senderUsername}</span>
                  {activeToast.isGameInvite && (
                    <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-[9px] font-black text-white shrink-0">
                      GAME
                    </span>
                  )}
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
                <span>{activeToast.isGameInvite ? 'Play 🎮' : 'Reply'}</span>
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
