'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  WifiOff,
  AlertCircle,
  MoreHorizontal,
  CheckCheck,
  Heart,
  Trash2,
  Plus,
  Users,
  Check,
  X,
  Phone,
  Video,
  Palette,
  Smile,
  Image as ImageIcon,
  Ghost,
  Camera,
  Shield,
  UserX,
} from 'lucide-react';
import { ChatsHeader } from '@/components/chats/ChatsHeader';
import { ChatSearch } from '@/components/chats/ChatSearch';
import { ConversationRow, ConversationItem } from '@/components/chats/ConversationRow';
import { RequestsList, MessageRequestItem } from '@/components/chats/RequestsList';
import { NewChatSheet, StudentContact } from '@/components/chats/NewChatSheet';
import { ChatsSkeleton } from '@/components/chats/ChatsSkeleton';
import { EmptyChats } from '@/components/chats/EmptyChats';
import { ChatActionsSheet } from '@/components/chats/ChatActionsSheet';
import { ChatNotesTray } from '@/components/chats/ChatNotesTray';
import { EmojiPickerDrawer } from '@/components/chats/EmojiPickerDrawer';
import {
  ChatBackgroundSelector,
  type ChatBackgroundOption,
  GRADIENT_BACKGROUNDS,
  GALLERY_BACKGROUNDS,
} from '@/components/chats/ChatBackgroundSelector';
import { getAvatarColorPair } from '@/config/tokens';
import { DataStore, DUMMY_TEST_USERNAMES, ChatNote } from '@/lib/dataStore';
import { showBackgroundNotification } from '@/lib/pushNotifications';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  senderUsername?: string;
  time: string;
  reaction?: string;
  isCallLog?: boolean;
  sharedPost?: {
    id: string;
    username: string;
    imageUrl?: string | null;
    caption?: string;
  };
  is_vanish_mode_message?: boolean;
  isVanishMode?: boolean;
  is_deleted?: boolean;
  is_read?: boolean;
  isSeen?: boolean;
  readAt?: number;
  isDelivered?: boolean;
  createdAt?: string;
  isSending?: boolean;
  image?: string;
  mediaUrl?: string;
  audioUrl?: string;
}

const INITIAL_CONVERSATIONS: ConversationItem[] = [];

const INITIAL_REQUESTS: MessageRequestItem[] = [];

type ChipTab = 'all' | 'groups' | 'requests';

function ChatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stateParam = searchParams.get('state');
  const viewParam = searchParams.get('view') || searchParams.get('tab');
  const userParam = searchParams.get('user');

  const currentUser = useMemo(() => DataStore.getCurrentUser(), []);
  const currentUsername = useMemo(() => {
    return (currentUser?.username || '').toLowerCase().trim();
  }, [currentUser]);
  const isAdminUser = currentUser?.role === 'admin' || currentUsername === 'shashwath71845';
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(() => !isAdminUser && DataStore.isMaintenanceActive());

  const getCanonicalConvId = (conv: ConversationItem): string => {
    if (conv.isGroup || conv.type === 'group' || conv.id.startsWith('conv-group-')) {
      return conv.id;
    }
    const target = (conv.username || conv.id.replace(/^conv-/, '')).toLowerCase().trim();
    if (target && currentUsername && target !== currentUsername) {
      return [currentUsername, target].sort().join('__');
    }
    return conv.id;
  };

  const getListForConv = (
    msgState: Record<string, ChatMessage[]>,
    canonicalId: string,
    rawId?: string
  ): ChatMessage[] => {
    const cList = msgState[canonicalId];
    const rList = rawId ? msgState[rawId] : undefined;
    const hasC = Array.isArray(cList) && cList.length > 0;
    const hasR = Array.isArray(rList) && rList.length > 0;

    if (hasC && hasR) {
      const map = new Map<string, ChatMessage>();
      for (const m of cList!) map.set(m.id, m);
      for (const m of rList!) {
        if (!map.has(m.id)) {
          map.set(m.id, m);
        } else {
          map.set(m.id, { ...map.get(m.id)!, ...m });
        }
      }
      return Array.from(map.values());
    }
    if (hasC) return cList!;
    if (hasR) return rList!;
    return (cList || rList || []) as ChatMessage[];
  };

  const refreshLiveStudents = () => {
    try {
      const all = DataStore.getProfiles();
      const current = DataStore.getCurrentUser();
      const isShashwath = current.username?.toLowerCase() === 'shashwath71845';

      const formatted: StudentContact[] = all
        .filter(
          (s) =>
            s &&
            s.username &&
            s.username.toLowerCase() !== current.username.toLowerCase() &&
            s.username.toLowerCase() !== 'admin' &&
            // If the other user is shashwath71845, ALWAYS include him for all students!
            (s.username.toLowerCase() === 'shashwath71845' || s.role !== 'admin' || isShashwath) &&
            !DUMMY_TEST_USERNAMES.has(s.username.toLowerCase())
        )
        .map((s) => {
          const isShash = s.username.toLowerCase() === 'shashwath71845';
          return {
            id: s.id,
            name: s.fullName,
            username: s.username,
            studentClass: isShash ? 'School Admin' : `${s.class}-${s.section || 'A'}`,
            avatarUrl: s.avatar,
            isFollowing: isShashwath || isShash || s.class === current.class,
          };
        });

      if (!isShashwath) {
        formatted.sort((a, b) => {
          if (a.username.toLowerCase() === 'shashwath71845') return -1;
          if (b.username.toLowerCase() === 'shashwath71845') return 1;
          return 0;
        });
      }

      setLiveStudents(formatted);
    } catch {
      setLiveStudents([]);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      setIsMaintenanceActive(!isAdminUser && DataStore.isMaintenanceActive());
      if (typeof window !== 'undefined') {
        try {
          if (currentUsername && currentUsername !== 'guest') {
            const userMsgKey = `dpsbuzz_chat_messages_${currentUsername}_v3`;
            const savedMsgs = localStorage.getItem(userMsgKey);
            if (savedMsgs) {
              const parsed = JSON.parse(savedMsgs);
              const cleanMap: Record<string, ChatMessage[]> = {};
              for (const [k, v] of Object.entries(parsed)) {
                if (!Array.isArray(v)) continue;
                if (k.startsWith('conv-group-')) {
                  cleanMap[k] = v as ChatMessage[];
                } else if (k.includes('__')) {
                  const parts = k.split('__').map((p) => p.trim().toLowerCase());
                  if (parts.includes(currentUsername)) {
                    cleanMap[k] = v as ChatMessage[];
                  }
                } else if (k.startsWith('conv-')) {
                  const otherUser = k.replace(/^conv-/, '').toLowerCase().trim();
                  if (otherUser && otherUser !== currentUsername) {
                    const cKey = [currentUsername, otherUser].sort().join('__');
                    cleanMap[cKey] = v as ChatMessage[];
                    cleanMap[k] = v as ChatMessage[];
                  }
                }
              }
              setChatMessages((prev) => {
                // Non-destructive merge with in-memory state
                const next = { ...prev };
                for (const [k, v] of Object.entries(cleanMap)) {
                  const existing = next[k] || [];
                  const msgMap = new Map(existing.map((m) => [m.id, m]));
                  for (const m of v) {
                    msgMap.set(m.id, { ...(msgMap.get(m.id) || {}), ...m });
                  }
                  next[k] = Array.from(msgMap.values());
                }
                return next;
              });
            }

            const userConvKey = `dpsbuzz_chat_conversations_${currentUsername}_v3`;
            const savedConvs = localStorage.getItem(userConvKey);
            if (savedConvs) {
              const parsed = JSON.parse(savedConvs);
              setConversations(parsed.filter((c: ConversationItem) => !c.username || !DUMMY_TEST_USERNAMES.has(c.username.toLowerCase())));
            }
          }
          refreshLiveStudents();
        } catch {}
      }
    };
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [isAdminUser, currentUsername]);

  const [activeChip, setActiveChip] = useState<ChipTab>(
    viewParam === 'requests' ? 'requests' : viewParam === 'groups' ? 'groups' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = DataStore.getCurrentUser();
        const uname = (u?.username || '').toLowerCase().trim();
        if (uname && uname !== 'guest') {
          const userConvKey = `dpsbuzz_chat_conversations_${uname}_v3`;
          const saved = localStorage.getItem(userConvKey);
          if (saved) {
            const parsed: ConversationItem[] = JSON.parse(saved);
            return parsed.filter((c) => !c.username || !DUMMY_TEST_USERNAMES.has(c.username.toLowerCase()));
          }
        }
      } catch {}
    }
    return INITIAL_CONVERSATIONS;
  });
  const [requestsState, setRequestsState] = useState<MessageRequestItem[]>(INITIAL_REQUESTS);
  const [isVanishMode, setIsVanishMode] = useState(false);
  const [demoState, setDemoState] = useState<'normal' | 'loading' | 'empty' | 'error' | 'offline'>(
    stateParam === 'loading'
      ? 'loading'
      : stateParam === 'empty'
      ? 'empty'
      : stateParam === 'error'
      ? 'error'
      : stateParam === 'offline'
      ? 'offline'
      : 'normal'
  );

  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [groupToast, setGroupToast] = useState<string | null>(null);
  const [longPressConv, setLongPressConv] = useState<ConversationItem | null>(null);
  const [deleteConfirmConv, setDeleteConfirmConv] = useState<ConversationItem | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const lastTapTimeRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  // Chat Wallpaper / Background & Emoji Drawer State
  const [isBgSelectorOpen, setIsBgSelectorOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [chatBackgrounds, setChatBackgrounds] = useState<Record<string, ChatBackgroundOption>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = DataStore.getCurrentUser();
        const uname = (u?.username || '').toLowerCase().trim();
        if (uname && uname !== 'guest') {
          const bgKey = `dpsbuzz_chat_backgrounds_${uname}_v2`;
          const saved = localStorage.getItem(bgKey);
          if (saved) return JSON.parse(saved);
        }
      } catch {}
    }
    return {};
  });
  const chatMediaInputRef = useRef<HTMLInputElement | null>(null);

  // Load persisted chat backgrounds from localStorage
  useEffect(() => {
    try {
      if (currentUsername && currentUsername !== 'guest') {
        const bgKey = `dpsbuzz_chat_backgrounds_${currentUsername}_v2`;
        const saved = localStorage.getItem(bgKey);
        if (saved) {
          setChatBackgrounds(JSON.parse(saved));
        }
      }
    } catch {}
  }, [currentUsername]);

  const handleSelectChatBg = (bg: ChatBackgroundOption, applyToAll = false) => {
    if (!activeConversation) return;
    const canonicalId = getCanonicalConvId(activeConversation);
    const rawId = activeConversation.id;

    setChatBackgrounds((prev) => {
      const next = { ...prev, [canonicalId]: bg, [rawId]: bg };
      if (applyToAll) {
        next['global_default'] = bg;
      }
      try {
        if (currentUsername && currentUsername !== 'guest') {
          const bgKey = `dpsbuzz_chat_backgrounds_${currentUsername}_v2`;
          localStorage.setItem(bgKey, JSON.stringify(next));
        }
        window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
      } catch {}
      return next;
    });
  };

  const showGroupToast = (msg: string) => {
    setGroupToast(msg);
    setTimeout(() => setGroupToast(null), 2500);
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroupConv: ConversationItem = {
      id: `conv-group-${Date.now()}`,
      name: newGroupName.trim(),
      username: newGroupName.toLowerCase().replace(/\s+/g, '_'),
      isGroup: true,
      groupInitials: newGroupName.slice(0, 2).toUpperCase(),
      lastMessage: `Group created · 1 joined, ${selectedGroupMembers.length} pending acceptance`,
      timeAgo: 'Just now',
      isUnread: false,
      studentClass: '8-A',
    };

    setConversations((prev) => [newGroupConv, ...prev]);
    setActiveChip('groups');
    setIsCreateGroupOpen(false);
    setNewGroupName('');
    setSelectedGroupMembers([]);
    showGroupToast(`Group "${newGroupConv.name}" created! Invitations sent.`);
  };
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = DataStore.getCurrentUser();
        const uname = (u?.username || '').toLowerCase().trim();
        if (uname && uname !== 'guest') {
          const userMsgKey = `dpsbuzz_chat_messages_${uname}_v3`;
          const saved = localStorage.getItem(userMsgKey);
          if (saved) return JSON.parse(saved);
        }
      } catch {}
    }
    return {};
  });

  // Automatically persist conversations to localStorage (scoped to current user)
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUsername) return;
    try {
      localStorage.setItem(`dpsbuzz_chat_conversations_${currentUsername}_v3`, JSON.stringify(conversations));
    } catch {}
  }, [conversations, currentUsername]);

  // Automatically persist messages to localStorage (scoped to current user)
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUsername) return;
    try {
      localStorage.setItem(`dpsbuzz_chat_messages_${currentUsername}_v3`, JSON.stringify(chatMessages));
    } catch {}
  }, [chatMessages, currentUsername]);

  // Computed Requests deriving from stranger threads + initial requests
  const computedRequests = useMemo<MessageRequestItem[]>(() => {
    if (!currentUsername || currentUsername === 'guest') return [];
    const reqs: MessageRequestItem[] = [];
    const seenUsers = new Set<string>();

    for (const conv of conversations) {
      if (conv.isGroup) continue;
      const target = (conv.username || conv.id.replace(/^conv-/, '')).toLowerCase().trim();
      if (!target || target === currentUsername) continue;
      if (DataStore.isBlocked(currentUsername, target)) continue;

      const tier = conv.inboxTier || DataStore.getInboxTier(currentUsername, target);
      if (tier === 'REQUESTS') {
        const msgs = chatMessages[conv.id] || chatMessages[[currentUsername, target].sort().join('__')] || [];
        const lastMsg = msgs[msgs.length - 1];
        const lastMsgIsMe = lastMsg
          ? (lastMsg.senderUsername ? lastMsg.senderUsername.toLowerCase() === currentUsername : lastMsg.sender === 'me')
          : false;

        if (!lastMsgIsMe && !DataStore.getAcceptedMessageRequests(currentUsername).includes(target)) {
          seenUsers.add(target);
          reqs.push({
            id: conv.id,
            name: conv.name,
            username: conv.username || target,
            avatar: conv.avatar || null,
            avatarUrl: conv.avatar || null,
            studentClass: conv.studentClass || 'Student',
            messagePreview: conv.lastMessage || 'Sent you a message',
            timeAgo: conv.timeAgo || 'Just now',
            mutualFollowsCount: DataStore.getMutualFollows(currentUsername, target).length,
          });
        }
      }
    }

    for (const r of requestsState) {
      const t = r.username.toLowerCase();
      if (!seenUsers.has(t) && !DataStore.isBlocked(currentUsername, t) && !DataStore.getAcceptedMessageRequests(currentUsername).includes(t)) {
        reqs.push(r);
      }
    }

    return reqs;
  }, [conversations, chatMessages, currentUsername, requestsState]);

  // Sync Vanish Mode state & mark conversation as read when actively opened
  useEffect(() => {
    if (activeConversation && !activeConversation.isGroup) {
      const canonicalId = getCanonicalConvId(activeConversation);
      setIsVanishMode(DataStore.getVanishMode(canonicalId));
      if (currentUsername) {
        DataStore.markChatRead(canonicalId, currentUsername);
      }
    } else {
      setIsVanishMode(false);
    }
  }, [activeConversation, currentUsername]);

  // Live accelerated polling (1.5s) when a conversation is actively open
  useEffect(() => {
    if (!activeConversation) return;
    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);

    const pollMessages = async () => {
      try {
        const queryUrl = `/api/chats?conversationId=${encodeURIComponent(canonicalId)}&username=${encodeURIComponent(currentUsername)}`;
        const res = await fetch(queryUrl);
        if (res.status === 403 || res.status === 401) {
          // Security Guard: User is not authorized to read this conversation!
          setActiveConversation(null);
          return;
        }
        const data = await res.json();
        if (data.unsentMessageIds && Array.isArray(data.unsentMessageIds)) {
          for (const unsentId of data.unsentMessageIds) {
            DataStore.addUnsentMessageId(unsentId);
          }
        }
        const tombstonedIds = DataStore.getUnsentMessageIds();

        if (data.success && Array.isArray(data.messages)) {
          let hasUnreadFromOther = false;
          setChatMessages((prev) => {
            const currentList = getListForConv(prev, canonicalId, rawId);
            const serverMsgs = data.messages.filter((m: any) => m && m.id && !tombstonedIds.has(m.id));
            const serverMsgIds = new Set(serverMsgs.map((m: any) => m.id));
            const now = Date.now();

            // Keep in-flight local messages that were sent in the last 6 seconds and not yet confirmed on server
            const preservedLocal = currentList.filter((m) => {
              if (tombstonedIds.has(m.id)) return false;
              if (serverMsgIds.has(m.id)) return false; // Handled by serverMsgs loop
              const isRecentSending = m.senderUsername === currentUsername && (m.isSending || (m.createdAt && now - new Date(m.createdAt).getTime() < 6000));
              return isRecentSending;
            });

            const msgMap = new Map(preservedLocal.map((m) => [m.id, m]));
            let changed = preservedLocal.length !== currentList.length;

            for (const rawMsg of serverMsgs) {
              const sMsg = { ...rawMsg, isDelivered: true };
              const sender = (sMsg.senderUsername || '').toLowerCase().trim();
              if (sender && sender !== currentUsername && !sMsg.is_read && !sMsg.isSeen && !sMsg.readAt) {
                hasUnreadFromOther = true;
              }
              const local = msgMap.get(sMsg.id);
              if (!local) {
                msgMap.set(sMsg.id, sMsg);
                changed = true;
              } else if (
                Boolean(local.is_read) !== Boolean(sMsg.is_read) ||
                Boolean(local.isSeen) !== Boolean(sMsg.isSeen) ||
                Boolean(local.isDelivered) !== Boolean(sMsg.isDelivered) ||
                local.reaction !== sMsg.reaction
              ) {
                msgMap.set(sMsg.id, { ...local, ...sMsg });
                changed = true;
              }
            }
            if (changed) {
              const merged = Array.from(msgMap.values());
              const nextMap = {
                ...prev,
                [rawId]: merged,
                [canonicalId]: merged,
              };
              try {
                if (currentUsername) {
                  localStorage.setItem(`dpsbuzz_chat_messages_${currentUsername}_v3`, JSON.stringify(nextMap));
                }
              } catch {}
              return nextMap;
            }
            return prev;
          });

          if (hasUnreadFromOther && currentUsername) {
            DataStore.markChatRead(canonicalId, currentUsername);
          }
        }
      } catch {}
    };

    pollMessages();
    const interval = setInterval(pollMessages, 1500);
    return () => clearInterval(interval);
  }, [activeConversation, currentUsername]);

  // Real-Time 0ms Instant Message Receiver (BroadcastChannel + CustomEvent)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRealtimeChatEvent = (eventData: any) => {
      if (!eventData || !eventData.type) return;
      const { type, conversationId, message, msgId, reaction, isVanishMode: nextVanish, senderUsername } = eventData;

      const isGroup = conversationId && conversationId.startsWith('conv-group-');
      const isDirectWithMe = conversationId && conversationId.includes('__') &&
        conversationId.split('__').map((p: string) => p.trim().toLowerCase()).includes(currentUsername);

      if (!isGroup && !isDirectWithMe) return;

      const isActiveThisConv =
        Boolean(activeConversation) &&
        (activeConversation!.id === conversationId ||
          getCanonicalConvId(activeConversation!) === conversationId);
      const matchingRawId = isActiveThisConv ? activeConversation?.id : undefined;

      if (type === 'MESSAGE_SENT' && message) {
        const incomingSender = (message.senderUsername || senderUsername || '').toLowerCase().trim();
        const isMe = incomingSender === currentUsername;
        const formattedMsg: ChatMessage = {
          ...message,
          sender: isMe ? 'me' : 'them',
        };

        setChatMessages((prev) => {
          const currentList = getListForConv(prev, conversationId, matchingRawId);
          if (currentList.some((m) => m.id === formattedMsg.id)) {
            return prev;
          }
          const updated = [...currentList, formattedMsg];
          const nextMap = {
            ...prev,
            [conversationId]: updated,
            ...(matchingRawId ? { [matchingRawId]: updated } : {}),
          };
          try {
            if (currentUsername) {
              localStorage.setItem(`dpsbuzz_chat_messages_${currentUsername}_v3`, JSON.stringify(nextMap));
            }
          } catch {}
          return nextMap;
        });

        const otherUser = conversationId.includes('__')
          ? conversationId.split('__').map((p: string) => p.trim().toLowerCase()).find((p: string) => p !== currentUsername) || incomingSender
          : incomingSender;

        const isCurrentlyViewingThis =
          activeConversation &&
          ((activeConversation.username || '').toLowerCase() === otherUser ||
            activeConversation.id === conversationId ||
            getCanonicalConvId(activeConversation) === conversationId);

        if (isCurrentlyViewingThis && !isMe && currentUsername) {
          DataStore.markChatRead(conversationId, currentUsername);
        } else if (!isMe) {
          // Trigger system notification if user is in background or viewing a different conversation
          const isDocHidden = typeof document !== 'undefined' && document.hidden;
          if (!isCurrentlyViewingThis || isDocHidden) {
            showBackgroundNotification(`💬 @${message.senderUsername || otherUser}`, {
              body: message.text || (message.sharedPost ? 'Sent a photo' : 'New message on DPS Buzz'),
              tag: `chat-${conversationId}`,
              url: `/chats?conv=${encodeURIComponent(conversationId)}`,
            });
          }
        }

        setConversations((prev) => {
          const existingIdx = prev.findIndex(
            (c) =>
              (c.username || '').toLowerCase() === otherUser ||
              c.id === `conv-${otherUser}` ||
              c.id === conversationId
          );
          const previewText = isMe ? `You: ${message.text || 'Photo'}` : (message.text || 'Photo');

          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              lastMessage: previewText,
              timeAgo: 'Just now',
              isUnread: isCurrentlyViewingThis ? false : !isMe,
              unreadCount: isCurrentlyViewingThis ? 0 : isMe ? updated[existingIdx].unreadCount : (updated[existingIdx].unreadCount || 0) + 1,
            };
            const [item] = updated.splice(existingIdx, 1);
            updated.unshift(item);
            try {
              if (currentUsername) {
                localStorage.setItem(`dpsbuzz_chat_conversations_${currentUsername}_v3`, JSON.stringify(updated));
              }
            } catch {}
            return updated;
          } else {
            const allProfiles = DataStore.getProfiles();
            const prof = allProfiles.find((p) => (p.username || '').toLowerCase() === otherUser);
            const incomingTier = DataStore.getInboxTier(currentUsername, otherUser);
            const newConv: ConversationItem = {
              id: `conv-${otherUser}`,
              name: prof ? prof.fullName : otherUser,
              username: otherUser,
              avatar: prof?.avatar || null,
              studentClass: prof ? `Class ${prof.class}-${prof.section || 'A'}` : 'Student',
              lastMessage: previewText,
              timeAgo: 'Just now',
              inboxTier: incomingTier,
              isUnread: isCurrentlyViewingThis ? false : !isMe,
              unreadCount: isCurrentlyViewingThis ? 0 : isMe ? 0 : 1,
            };
            const updated = [newConv, ...prev];
            try {
              if (currentUsername) {
                localStorage.setItem(`dpsbuzz_chat_conversations_${currentUsername}_v3`, JSON.stringify(updated));
              }
            } catch {}
            return updated;
          }
        });
      } else if (type === 'MESSAGE_UNSENT' && msgId) {
        setChatMessages((prev) => {
          const currentList = getListForConv(prev, conversationId, matchingRawId);
          const filtered = currentList.filter((m) => m.id !== msgId);
          return {
            ...prev,
            [conversationId]: filtered,
            ...(matchingRawId ? { [matchingRawId]: filtered } : {}),
          };
        });
      } else if (type === 'MESSAGE_REACTION' && msgId) {
        setChatMessages((prev) => {
          const currentList = getListForConv(prev, conversationId, matchingRawId);
          const updated = currentList.map((m) => (m.id === msgId ? { ...m, reaction } : m));
          return {
            ...prev,
            [conversationId]: updated,
            ...(matchingRawId ? { [matchingRawId]: updated } : {}),
          };
        });
      } else if (type === 'VANISH_TOGGLE') {
        if (activeConversation && getCanonicalConvId(activeConversation) === conversationId) {
          setIsVanishMode(!!nextVanish);
        }
      } else if (type === 'VANISH_PURGE') {
        setChatMessages((prev) => {
          const currentList = getListForConv(prev, conversationId, matchingRawId);
          const nonVanish = currentList.filter((m) => !m.is_vanish_mode_message && !m.isVanishMode);
          return {
            ...prev,
            [conversationId]: nonVanish,
            ...(matchingRawId ? { [matchingRawId]: nonVanish } : {}),
          };
        });
      } else if (type === 'MESSAGES_READ') {
        const reader = (eventData.senderUsername || '').toLowerCase().trim();
        setChatMessages((prev) => {
          const currentList = getListForConv(prev, conversationId, matchingRawId);
          let updatedAny = false;
          const marked = currentList.map((m) => {
            const sender = (m.senderUsername || '').toLowerCase().trim();
            if (sender && sender !== reader && !m.is_read && !m.isSeen && !m.readAt) {
              updatedAny = true;
              return { ...m, is_read: true, isSeen: true, readAt: Date.now() };
            }
            return m;
          });
          if (!updatedAny) return prev;
          return {
            ...prev,
            [conversationId]: marked,
            ...(matchingRawId ? { [matchingRawId]: marked } : {}),
          };
        });
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('dpsbuzz_realtime_chats');
        channel.onmessage = (e) => {
          handleRealtimeChatEvent(e.data);
        };
      } catch {}
    }

    const handleCustomChatEvent = (e: any) => {
      handleRealtimeChatEvent(e.detail);
    };
    window.addEventListener('dpsbuzz:chat_event', handleCustomChatEvent);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('dpsbuzz:chat_event', handleCustomChatEvent);
    };
  }, [currentUsername, activeConversation]);

  // Track active chat in sessionStorage for foreground heads-up notification silencing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeConversation && !activeConversation.isGroup) {
      const targetUser = (activeConversation.username || activeConversation.id.replace(/^conv-/, '')).toLowerCase().trim();
      sessionStorage.setItem('dpsbuzz_active_chat_user', targetUser);
    } else {
      sessionStorage.removeItem('dpsbuzz_active_chat_user');
    }
    return () => {
      sessionStorage.removeItem('dpsbuzz_active_chat_user');
    };
  }, [activeConversation]);

  // Mark messages as read when active conversation is opened or viewed
  useEffect(() => {
    if (!activeConversation || activeConversation.isGroup || !currentUsername) return;
    if (activeConversation.inboxTier === 'REQUESTS') return;

    const canonicalId = getCanonicalConvId(activeConversation);
    DataStore.markMessagesAsRead(canonicalId, currentUsername);
  }, [activeConversation, currentUsername]);

  // Handle incoming notification banner clicks / instantaneous switch
  useEffect(() => {
    const handleOpenChatEvent = (e: any) => {
      const targetUser = (e.detail?.username || '').toLowerCase().trim();
      if (!targetUser || (currentUsername && targetUser === currentUsername)) return;

      const all = DataStore.getProfiles();
      const prof = all.find((p) => (p.username || '').toLowerCase() === targetUser);
      const displayName = prof ? prof.fullName : targetUser;
      const displayClass = prof ? `Class ${prof.class}-${prof.section || 'A'}` : 'Student';

      setConversations((prev) => {
        const existing = prev.find((c) => (c.username || '').toLowerCase() === targetUser);
        if (existing) {
          const readConv = { ...existing, isUnread: false, unreadCount: 0 };
          setActiveConversation(readConv);
          const updated = prev.map((c) => (c.id === existing.id ? readConv : c));
          try {
            if (currentUsername) {
              localStorage.setItem(`dpsbuzz_chat_conversations_${currentUsername}_v3`, JSON.stringify(updated));
            }
            window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
          } catch {}
          return updated;
        }
        const newConv: ConversationItem = {
          id: `conv-${targetUser}`,
          name: displayName,
          username: targetUser,
          studentClass: displayClass,
          avatar: prof?.avatar || null,
          lastMessage: 'Started new conversation',
          timeAgo: 'Just now',
          isUnread: false,
          unreadCount: 0,
        };
        setActiveConversation(newConv);
        const updated = [newConv, ...prev];
        try {
          if (currentUsername) {
            localStorage.setItem(`dpsbuzz_chat_conversations_${currentUsername}_v3`, JSON.stringify(updated));
          }
          window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
        } catch {}
        return updated;
      });
    };

    window.addEventListener('dpsbuzz:open_chat' as any, handleOpenChatEvent);
    return () => window.removeEventListener('dpsbuzz:open_chat' as any, handleOpenChatEvent);
  }, [currentUsername]);

  // Keep demoState synced if query parameter changes
  useEffect(() => {
    if (stateParam === 'loading') setDemoState('loading');
    else if (stateParam === 'empty') setDemoState('empty');
    else if (stateParam === 'error') setDemoState('error');
    else if (stateParam === 'offline') setDemoState('offline');
    else setDemoState('normal');

    if (viewParam === 'requests') setActiveChip('requests');
    else if (viewParam === 'groups') setActiveChip('groups');
  }, [stateParam, viewParam]);

  // Automatically open direct chat when navigated from a user's profile with ?user=...
  useEffect(() => {
    if (!userParam) return;
    const targetUser = userParam.toLowerCase().trim();
    if (!targetUser || (currentUsername && targetUser === currentUsername)) return;

    const all = DataStore.getProfiles();
    const prof = all.find((p) => p.username?.toLowerCase() === targetUser);
    const displayName = prof ? prof.fullName : targetUser;
    const displayClass = prof ? `Class ${prof.class}-${prof.section || 'G'}` : 'Student';

    setConversations((prev) => {
      const existing = prev.find((c) => c.username?.toLowerCase() === targetUser);
      if (existing) {
        const readConv = { ...existing, isUnread: false, unreadCount: 0 };
        setActiveConversation(readConv);
        const updated = prev.map((c) => (c.id === existing.id ? readConv : c));
        try {
          if (currentUsername) {
            localStorage.setItem(`dpsbuzz_chat_conversations_${currentUsername}_v3`, JSON.stringify(updated));
          }
          window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
        } catch {}
        return updated;
      }
      const newConv: ConversationItem = {
        id: `conv-${targetUser}`,
        name: displayName,
        username: targetUser,
        studentClass: displayClass,
        lastMessage: 'Started new conversation',
        timeAgo: 'Just now',
        isUnread: false,
        unreadCount: 0,
      };
      setActiveConversation(newConv);
      const updated = [newConv, ...prev];
      try {
        if (currentUsername) {
          localStorage.setItem(`dpsbuzz_chat_conversations_${currentUsername}_v3`, JSON.stringify(updated));
        }
        window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
      } catch {}
      return updated;
    });
  }, [userParam, currentUsername]);

  // Student directory from DataStore for New Chat Sheet
  const [liveStudents, setLiveStudents] = useState<StudentContact[]>([]);
  useEffect(() => {
    refreshLiveStudents();
  }, []);

  // Continuous background sync from cloud store (every 2.0s) with strict user parameter
  useEffect(() => {
    const fetchLatestSync = async () => {
      try {
        const syncUrl = currentUsername ? `/api/sync?username=${encodeURIComponent(currentUsername)}` : '/api/sync';
        const res = await fetch(syncUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            // 1. Merge incoming chat messages strictly for this user
            if (data.unsentMessageIds && Array.isArray(data.unsentMessageIds)) {
              for (const unsentId of data.unsentMessageIds) {
                DataStore.addUnsentMessageId(unsentId);
              }
            }
            const syncTombstoned = DataStore.getUnsentMessageIds();

            if (data.chatMessages && typeof data.chatMessages === 'object') {
              setChatMessages((prev) => {
                const merged = { ...prev };
                let hasNew = false;
                for (const [key, list] of Object.entries(data.chatMessages)) {
                  const isGroup = key.startsWith('conv-group-');
                  const isDirectWithMe = key.includes('__') && key.split('__').map((p) => p.trim().toLowerCase()).includes(currentUsername);
                  if (!isGroup && !isDirectWithMe) continue;

                  if (Array.isArray(list)) {
                    let otherUser = '';
                    if (key.includes('__')) {
                      const parts = key.split('__').map((p) => p.trim().toLowerCase());
                      otherUser = parts.find((p) => p !== currentUsername) || '';
                    }
                    const rawKey = otherUser ? `conv-${otherUser}` : undefined;
                    const current = getListForConv(merged, key, rawKey);
                    const serverCleanList = (list as any[]).filter((m) => m && m.id && !syncTombstoned.has(m.id));
                    const serverIds = new Set(serverCleanList.map((m) => m.id));
                    const now = Date.now();

                    const preserved = current.filter((m) => {
                      if (syncTombstoned.has(m.id)) return false;
                      if (serverIds.has(m.id)) return false;
                      return m.senderUsername === currentUsername && (m.isSending || (m.createdAt && now - new Date(m.createdAt).getTime() < 6000));
                    });

                    const msgMap = new Map<string, ChatMessage>(preserved.map((m: any) => [m.id, m]));
                    let listChanged = preserved.length !== current.length;

                    for (const sMsg of serverCleanList) {
                      const local = msgMap.get(sMsg.id);
                      if (!local) {
                        msgMap.set(sMsg.id, sMsg);
                        listChanged = true;
                      } else if (
                        Boolean(local.is_read) !== Boolean(sMsg.is_read) ||
                        Boolean(local.isSeen) !== Boolean(sMsg.isSeen) ||
                        Boolean(local.isDelivered) !== Boolean(sMsg.isDelivered) ||
                        local.reaction !== sMsg.reaction
                      ) {
                        msgMap.set(sMsg.id, { ...local, ...sMsg });
                        listChanged = true;
                      }
                    }
                    if (listChanged) {
                      const updatedList = Array.from(msgMap.values());
                      merged[key] = updatedList;
                      if (rawKey) merged[rawKey] = updatedList;
                      hasNew = true;
                    }
                  }
                }
                if (hasNew) {
                  try {
                    if (currentUsername) {
                      localStorage.setItem(`dpsbuzz_chat_messages_${currentUsername}_v3`, JSON.stringify(merged));
                    }
                  } catch {}
                  return merged;
                }
                return prev;
              });
            }

            // 2. Merge incoming profiles so New Chat sheet immediately discovers all student accounts
            if (Array.isArray(data.profiles) && data.profiles.length > 0) {
              const localProfiles = DataStore.getProfiles();
              const profileMap = new Map(localProfiles.map((p) => [p.username.toLowerCase(), p]));
              let profChanged = false;
              for (const p of data.profiles) {
                if (p && p.username && !profileMap.has(p.username.toLowerCase())) {
                  profileMap.set(p.username.toLowerCase(), p);
                  profChanged = true;
                }
              }
              if (profChanged) {
                localStorage.setItem('dpsbuzz_profiles_v2', JSON.stringify(Array.from(profileMap.values())));
                window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
              }
            }
          }
        }
      } catch {}
    };

    fetchLatestSync();
    const interval = setInterval(fetchLatestSync, 2500);
    return () => clearInterval(interval);
  }, [currentUsername]);

  // Auto-sync inbox conversations list from chatMessages strictly scoped to current user
  useEffect(() => {
    if (!currentUsername) return;
    const allProfiles = DataStore.getProfiles();

    setConversations((prev) => {
      let changed = false;
      const updated = [...prev];

      for (const [key, msgs] of Object.entries(chatMessages)) {
        if (!Array.isArray(msgs) || msgs.length === 0) continue;
        const lastMsg = msgs[msgs.length - 1];
        if (!lastMsg) continue;

        let targetUser = '';
        let isGroupConv = false;
        if (key.includes('__')) {
          const parts = key.split('__').map((p) => p.trim().toLowerCase());
          if (parts.includes(currentUsername)) {
            targetUser = parts.find((p) => p !== currentUsername) || '';
          }
        } else if (key.startsWith('conv-group-')) {
          isGroupConv = true;
        }

        if (isGroupConv) {
          const convIdx = updated.findIndex((c) => c.id === key);
          if (convIdx >= 0) {
            const existing = updated[convIdx];
            if (existing.lastMessage !== lastMsg.text || existing.timeAgo !== (lastMsg.time || 'Just now')) {
              updated[convIdx] = {
                ...existing,
                lastMessage: lastMsg.text,
                timeAgo: lastMsg.time || 'Just now',
              };
              changed = true;
            }
          }
        } else if (targetUser && targetUser !== currentUsername) {
          const isMe = lastMsg.senderUsername
            ? lastMsg.senderUsername.toLowerCase() === currentUsername
            : lastMsg.sender === 'me';

          let msgPreview = isMe ? `You: ${lastMsg.text}` : lastMsg.text;
          const storyMatch = lastMsg.text.match(/^(?:You replied to their story|Replied to their story|Replied to your story|Replied to story):\s*["']?([\s\S]*?)["']?\s*(?:💬)?$/i);
          if (storyMatch) {
            const rawContent = storyMatch[1].replace(/^["']|["']$/g, '').trim();
            msgPreview = isMe
              ? `You replied to their story: "${rawContent}" 💬`
              : `Replied to your story: "${rawContent}" 💬`;
          }

          const convIdx = updated.findIndex((c) => (c.username || '').toLowerCase() === targetUser);

          if (convIdx >= 0) {
            const existing = updated[convIdx];
            if (existing.lastMessage !== msgPreview || existing.timeAgo !== (lastMsg.time || 'Just now')) {
              updated[convIdx] = {
                ...existing,
                lastMessage: msgPreview,
                timeAgo: lastMsg.time || 'Just now',
                isUnread: activeConversation?.username?.toLowerCase() === targetUser ? false : (!isMe || existing.isUnread),
              };
              changed = true;
            }
          } else {
            const prof = allProfiles.find((p) => (p.username || '').toLowerCase() === targetUser);
            updated.unshift({
              id: `conv-${targetUser}`,
              name: prof ? prof.fullName : targetUser,
              username: targetUser,
              studentClass: prof ? `Class ${prof.class}-${prof.section || 'A'}` : 'Student',
              avatar: prof?.avatar || null,
              lastMessage: msgPreview,
              timeAgo: lastMsg.time || 'Just now',
              isUnread: !isMe,
            });
            changed = true;
          }
        }
      }

      return changed ? updated : prev;
    });
  }, [chatMessages, currentUsername, activeConversation]);

  const liveFollowing = useMemo(() => liveStudents.filter((s) => s.isFollowing), [liveStudents]);
  const liveOthers = useMemo(() => liveStudents.filter((s) => !s.isFollowing), [liveStudents]);

  // Filter conversations with strict privacy check
  const filteredConversations = useMemo(() => {
    if (demoState === 'empty') return [];

    let list = [...conversations];

    // Privacy guard: Never include conversations that belong to other users or self
    list = list.filter((c) => {
      if (c.isGroup || c.type === 'group' || c.id.startsWith('conv-group-')) return true;
      const target = (c.username || c.id.replace(/^conv-/, '')).toLowerCase().trim();
      if (!target || target === currentUsername) return false;
      if (DataStore.isBlocked(currentUsername, target)) return false;

      // Instagram Architecture: In PRIMARY ('all') inbox, hide incoming message requests from strangers
      if (activeChip !== 'requests') {
        const tier = c.inboxTier || DataStore.getInboxTier(currentUsername, target);
        if (tier === 'REQUESTS') {
          const msgs = chatMessages[c.id] || chatMessages[[currentUsername, target].sort().join('__')] || [];
          const lastMsg = msgs[msgs.length - 1];
          const lastMsgIsMe = lastMsg
            ? (lastMsg.senderUsername ? lastMsg.senderUsername.toLowerCase() === currentUsername : lastMsg.sender === 'me')
            : false;
          if (!lastMsgIsMe && !DataStore.getAcceptedMessageRequests(currentUsername).includes(target)) {
            return false;
          }
        }
      }

      return true;
    });

    if (activeChip === 'groups') {
      list = list.filter((c) => c.isGroup || c.type === 'group');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.username && c.username.toLowerCase().includes(q)) ||
          (c.studentClass && c.studentClass.toLowerCase().includes(q)) ||
          (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
      );
    }

    return list;
  }, [conversations, chatMessages, activeChip, searchQuery, demoState, currentUsername]);

  // Separate pinned, today, earlier
  const { pinnedList, todayList, earlierList } = useMemo(() => {
    const pinned: ConversationItem[] = [];
    const today: ConversationItem[] = [];
    const earlier: ConversationItem[] = [];

    filteredConversations.forEach((conv) => {
      if (conv.isPinned) {
        pinned.push(conv);
      } else {
        const time = conv.timeAgo?.toLowerCase() || '';
        if (time.includes('m') || time.includes('h') || time.includes('now') || time.includes('just')) {
          today.push(conv);
        } else {
          earlier.push(conv);
        }
      }
    });

    return { pinnedList: pinned, todayList: today, earlierList: earlier };
  }, [filteredConversations]);

  const handleMuteToggle = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isMuted: !c.isMuted } : c))
    );
  };

  const handlePinToggle = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmConv) return;
    setConversations((prev) => prev.filter((c) => c.id !== deleteConfirmConv.id));
    setDeleteConfirmConv(null);
  };

  const openConversation = (conv: ConversationItem) => {
    const target = (conv.username || conv.id.replace(/^conv-/, '')).toLowerCase().trim();
    const isIncomingReq =
      !conv.isGroup &&
      target &&
      DataStore.getInboxTier(currentUsername, target) === 'REQUESTS';

    // Anonymity (Invisible Reads): Opening/reading a message request never emits seen or clears unread
    if (isIncomingReq) {
      setActiveConversation(conv);
      return;
    }

    const readConv = { ...conv, isUnread: false, unreadCount: 0 };
    setActiveConversation(readConv);
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === conv.id || (c.username && c.username.toLowerCase() === conv.username?.toLowerCase())
          ? { ...c, isUnread: false, unreadCount: 0 }
          : c
      );
      try {
        if (currentUsername && currentUsername !== 'guest') {
          localStorage.setItem(`dpsbuzz_chat_conversations_${currentUsername}_v3`, JSON.stringify(updated));
        }
        window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
      } catch {}
      return updated;
    });
  };

  const handleStartNewChat = (student: StudentContact) => {
    setIsNewChatOpen(false);
    const existing = conversations.find((c) => c.username === student.username);
    if (existing) {
      openConversation(existing);
    } else {
      const newConv: ConversationItem = {
        id: `conv-${student.username}`,
        name: student.name,
        username: student.username,
        studentClass: student.studentClass,
        lastMessage: 'Started new conversation',
        timeAgo: 'Just now',
        isUnread: false,
        unreadCount: 0,
      };
      setConversations((prev) => [newConv, ...prev]);
      openConversation(newConv);
    }
  };

  const handleReplyToNote = (note: ChatNote, replyText?: string) => {
    const student = liveStudents.find((s) => s.username.toLowerCase() === note.username.toLowerCase()) || {
      id: note.id,
      name: note.fullName || note.username,
      username: note.username,
      studentClass: '8-A',
      isFollowing: true,
    };

    let targetConv = conversations.find(
      (c) => !c.isGroup && c.username?.toLowerCase() === note.username.toLowerCase()
    );

    if (!targetConv) {
      targetConv = {
        id: `conv-${note.username.toLowerCase()}`,
        name: note.fullName || note.username,
        username: note.username,
        studentClass: student.studentClass || 'Class 8-A',
        lastMessage: replyText ? `You: ${replyText}` : 'Started new conversation',
        timeAgo: 'Just now',
        isUnread: false,
      };
      setConversations((prev) => [targetConv!, ...prev]);
    }

    if (replyText && replyText.trim()) {
      const rawId = targetConv.id;
      const canonicalId = getCanonicalConvId(targetConv);
      const trimmedReply = replyText.trim();

      const formattedText = note.song
        ? `🎵 Replying to note "${note.text}" (${note.song.title} - ${note.song.artist}): ${trimmedReply}`
        : `💭 Replying to note "${note.text}": ${trimmedReply}`;

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: formattedText,
        sender: 'me',
        senderUsername: currentUsername,
        time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()),
      };

      setChatMessages((prev) => {
        const currentList = getListForConv(prev, canonicalId, rawId);
        const updated = [...currentList, newMsg];
        const nextMap = {
          ...prev,
          [rawId]: updated,
          [canonicalId]: updated,
        };
        try {
          if (currentUsername) {
            localStorage.setItem(`dpsbuzz_chat_messages_${currentUsername}_v3`, JSON.stringify(nextMap));
          }
        } catch {}
        return nextMap;
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === rawId || c.id === canonicalId
            ? { ...c, lastMessage: `You: ${trimmedReply}`, timeAgo: 'Just now' }
            : c
        )
      );

      // Instant 0ms broadcast across all tabs and components
      DataStore.broadcastChatEvent({
        type: 'MESSAGE_SENT',
        conversationId: canonicalId,
        message: newMsg,
        senderUsername: currentUsername,
        recipientUsername: note.username,
      });

      // Dispatch to server endpoint for instant cross-device delivery
      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: canonicalId,
          senderUsername: currentUsername,
          recipientUsername: note.username,
          message: newMsg,
        }),
      }).catch(() => {});
    }

    setActiveConversation(targetConv);
  };

  const handleToggleVanishMode = () => {
    if (!activeConversation || activeConversation.isGroup) return;
    const canonicalId = getCanonicalConvId(activeConversation);
    const nextVal = !isVanishMode;
    setIsVanishMode(nextVal);
    DataStore.setVanishMode(canonicalId, nextVal);
  };

  const handleCloseActiveChat = () => {
    if (activeConversation) {
      const canonicalId = getCanonicalConvId(activeConversation);
      // Disappearance rule: purge vanish messages from storage & client state
      DataStore.purgeVanishMessages(canonicalId, currentUsername);
      setChatMessages((prev) => {
        const existing = prev[canonicalId] || [];
        const nonVanish = existing.filter((m) => !m.is_vanish_mode_message && !m.isVanishMode);
        return {
          ...prev,
          [canonicalId]: nonVanish,
          [activeConversation.id]: nonVanish,
        };
      });
    }
    setActiveConversation(null);
  };

  const handleAcceptRequestFromSandbox = (targetUser: string) => {
    const cleanTarget = targetUser.toLowerCase().trim();
    DataStore.acceptMessageRequest(currentUsername, cleanTarget);

    // Mutual follow explicitly ensured
    DataStore.followUser(currentUsername, cleanTarget);
    DataStore.followUser(cleanTarget, currentUsername);

    setRequestsState((prev) => prev.filter((r) => r.username.toLowerCase() !== cleanTarget));

    setConversations((prev) => {
      const existingIdx = prev.findIndex(
        (c) => (c.username || '').toLowerCase() === cleanTarget || c.id === `conv-${cleanTarget}`
      );
      if (existingIdx >= 0) {
        return prev.map((c, i) =>
          i === existingIdx ? { ...c, inboxTier: 'PRIMARY' as const, isUnread: false, unreadCount: 0 } : c
        );
      }
      const newConv: ConversationItem = {
        id: `conv-${cleanTarget}`,
        name: cleanTarget,
        username: cleanTarget,
        studentClass: 'Student',
        lastMessage: 'Message request accepted',
        timeAgo: 'Just now',
        inboxTier: 'PRIMARY' as const,
        isUnread: false,
      };
      return [newConv, ...prev];
    });

    if (activeConversation && (activeConversation.username || '').toLowerCase() === cleanTarget) {
      setActiveConversation((prev) =>
        prev ? { ...prev, inboxTier: 'PRIMARY', isUnread: false, unreadCount: 0 } : null
      );
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
    }
    DataStore.syncWithServer().catch(() => {});
  };

  const handleDeleteRequest = (targetUser: string) => {
    const cleanTarget = targetUser.toLowerCase().trim();
    setRequestsState((prev) => prev.filter((r) => r.username.toLowerCase() !== cleanTarget));
    setConversations((prev) =>
      prev.filter(
        (c) => (c.username || '').toLowerCase() !== cleanTarget && c.id !== `conv-${cleanTarget}`
      )
    );
    if (activeConversation && (activeConversation.username || '').toLowerCase() === cleanTarget) {
      setActiveConversation(null);
    }
  };

  const handleBlockStranger = (targetUser: string) => {
    const cleanTarget = targetUser.toLowerCase().trim();
    if (cleanTarget === currentUsername) {
      alert('You cannot block your own account.');
      return;
    }
    DataStore.blockUser(currentUsername, cleanTarget);
    handleDeleteRequest(cleanTarget);
    alert(`Blocked @${cleanTarget}. They can no longer send you messages.`);
  };

  const handleUnsendMessage = (msgId: string) => {
    if (!activeConversation) return;
    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);

    DataStore.addUnsentMessageId(msgId);

    setChatMessages((prev) => {
      const existing = getListForConv(prev, canonicalId, rawId);
      const filtered = existing.filter((m) => m.id !== msgId);
      const nextMap = {
        ...prev,
        [rawId]: filtered,
        [canonicalId]: filtered,
      };
      try {
        if (currentUsername) {
          localStorage.setItem(`dpsbuzz_chat_messages_${currentUsername}_v3`, JSON.stringify(nextMap));
        }
      } catch {}
      return nextMap;
    });

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === canonicalId || c.id === rawId || c.id === `conv-${canonicalId}`) {
          const currentMsgs = getListForConv(chatMessages, canonicalId, rawId).filter((m) => m.id !== msgId);
          const last = currentMsgs[currentMsgs.length - 1];
          return {
            ...c,
            lastMessage: last ? (last.text || (last.image ? '📷 Photo' : 'Message')) : '',
            timeAgo: last ? (last.time || 'now') : c.timeAgo,
          };
        }
        return c;
      })
    );

    DataStore.unsendMessage(canonicalId, msgId, currentUsername);
    setActiveReactionMsgId(null);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef<number>(0);

  const isNearBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    if (activeConversation) {
      const timer = setTimeout(() => scrollToBottom(false), 50);
      return () => clearTimeout(timer);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    if (!activeConversation) return;
    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);
    const msgs = chatMessages[rawId] || chatMessages[canonicalId] || [];
    const count = msgs.length;

    if (count > prevMsgCountRef.current) {
      const lastMsg = msgs[msgs.length - 1];
      const isSentByMe =
        lastMsg?.sender === 'me' ||
        (lastMsg?.senderUsername && lastMsg.senderUsername.toLowerCase() === currentUsername);
      if (isSentByMe || isNearBottom()) {
        scrollToBottom(true);
      }
    }
    prevMsgCountRef.current = count;
  }, [chatMessages, activeConversation, currentUsername]);

  const handleSendHeart = () => {
    if (isMaintenanceActive) {
      alert('Chat messaging is disabled during scheduled maintenance.');
      return;
    }
    if (!activeConversation) return;

    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: '❤️',
      sender: 'me',
      senderUsername: currentUsername,
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()),
      isDelivered: false,
      is_read: false,
      isSeen: false,
      ...(isVanishMode ? { is_vanish_mode_message: true, isVanishMode: true } : {}),
    };

    setChatMessages((prev) => {
      const currentList = getListForConv(prev, canonicalId, rawId);
      const updated = [...currentList, newMsg];
      const nextMap = {
        ...prev,
        [rawId]: updated,
        [canonicalId]: updated,
      };
      try {
        if (currentUsername) {
          localStorage.setItem(`dpsbuzz_chat_messages_${currentUsername}_v3`, JSON.stringify(nextMap));
        }
      } catch {}
      return nextMap;
    });

    setConversations((prev) =>
      prev.map((c) =>
        c.id === rawId || c.id === canonicalId
          ? { ...c, lastMessage: 'You: ❤️', timeAgo: 'Just now' }
          : c
      )
    );

    // Instant 0ms broadcast across all tabs and components
    DataStore.broadcastChatEvent({
      type: 'MESSAGE_SENT',
      conversationId: canonicalId,
      message: newMsg,
      senderUsername: currentUsername,
      recipientUsername: activeConversation.username,
    });

    // Dispatch to server endpoint for instant cross-device delivery
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: canonicalId,
        senderUsername: currentUsername,
        message: newMsg,
      }),
    })
      .then((res) => {
        if (res.ok) {
          setChatMessages((prev) => {
            const currentList = getListForConv(prev, canonicalId, rawId);
            const updated = currentList.map((m) =>
              m.id === newMsg.id ? { ...m, isDelivered: true } : m
            );
            return {
              ...prev,
              [rawId]: updated,
              [canonicalId]: updated,
            };
          });
        }
      })
      .catch((err) => console.warn('Failed to sync chat message:', err));
  };

  const REACTION_EMOJIS = ['❤️', '😂', '🔥', '😮', '😢', '👍'];

  const handleToggleReaction = (msgId: string, emoji: string) => {
    if (!activeConversation) return;
    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);

    let updatedTargetMsg: ChatMessage | null = null;

    setChatMessages((prev) => {
      const currentList = getListForConv(prev, canonicalId, rawId);
      const updated = currentList.map((m) => {
        if (m.id === msgId) {
          const nextEmoji = m.reaction === emoji ? undefined : emoji;
          const newMsg = { ...m, reaction: nextEmoji };
          updatedTargetMsg = newMsg;
          return newMsg;
        }
        return m;
      });

      const nextMap = {
        ...prev,
        [rawId]: updated,
        [canonicalId]: updated,
      };
      try {
        if (currentUsername) {
          localStorage.setItem(`dpsbuzz_chat_messages_${currentUsername}_v3`, JSON.stringify(nextMap));
        }
      } catch {}
      return nextMap;
    });

    setActiveReactionMsgId(null);

    // Sync to server and broadcast so classmate sees reaction in 0ms real time
    if (updatedTargetMsg) {
      DataStore.broadcastChatEvent({
        type: 'MESSAGE_REACTION',
        conversationId: canonicalId,
        msgId,
        reaction: (updatedTargetMsg as ChatMessage).reaction,
        senderUsername: currentUsername,
      });

      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: canonicalId,
          senderUsername: currentUsername,
          message: updatedTargetMsg,
        }),
      }).catch((err) => console.warn('Failed to sync reaction:', err));
    }
  };

  const handleMessageClick = (msg: ChatMessage) => {
    const now = Date.now();
    if (lastTapTimeRef.current.id === msg.id && now - lastTapTimeRef.current.time < 350) {
      // Double tap -> instant Heart reaction!
      handleToggleReaction(msg.id, '❤️');
      lastTapTimeRef.current = { id: '', time: 0 };
    } else {
      lastTapTimeRef.current = { id: msg.id, time: now };
      setActiveReactionMsgId((prev) => (prev === msg.id ? null : msg.id));
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaintenanceActive) {
      alert('Chat messaging is disabled during scheduled maintenance.');
      return;
    }
    if (!messageInput.trim() || !activeConversation) return;

    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);
    const sentText = messageInput.trim();

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: sentText,
      sender: 'me',
      senderUsername: currentUsername,
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()),
      isDelivered: false,
      is_read: false,
      isSeen: false,
      ...(isVanishMode ? { is_vanish_mode_message: true, isVanishMode: true } : {}),
    };

    setChatMessages((prev) => {
      const currentList = getListForConv(prev, canonicalId, rawId);
      const updated = [...currentList, newMsg];
      const nextMap = {
        ...prev,
        [rawId]: updated,
        [canonicalId]: updated,
      };
      try {
        if (currentUsername) {
          localStorage.setItem(`dpsbuzz_chat_messages_${currentUsername}_v3`, JSON.stringify(nextMap));
        }
      } catch {}
      return nextMap;
    });

    setConversations((prev) =>
      prev.map((c) =>
        c.id === rawId || c.id === canonicalId
          ? { ...c, lastMessage: `You: ${sentText}`, timeAgo: 'Just now' }
          : c
      )
    );

    setMessageInput('');

    // Instant 0ms broadcast across all tabs and components
    DataStore.broadcastChatEvent({
      type: 'MESSAGE_SENT',
      conversationId: canonicalId,
      message: newMsg,
      senderUsername: currentUsername,
      recipientUsername: activeConversation.username,
    });

    // Dispatch to server endpoint for instant cross-device delivery
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: canonicalId,
        senderUsername: currentUsername,
        message: newMsg,
      }),
    })
      .then((res) => {
        if (res.ok) {
          setChatMessages((prev) => {
            const currentList = getListForConv(prev, canonicalId, rawId);
            const updated = currentList.map((m) =>
              m.id === newMsg.id ? { ...m, isDelivered: true } : m
            );
            return {
              ...prev,
              [rawId]: updated,
              [canonicalId]: updated,
            };
          });
        }
      })
      .catch((err) => console.warn('Failed to sync chat message:', err));
  };

  const handleImageAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid photo to send.');
      return;
    }

    const targetUser = (activeConversation.username || activeConversation.id.replace(/^conv-/, '')).toLowerCase().trim();
    if (!activeConversation.isGroup && targetUser) {
      const check = DataStore.canChatAndShare(currentUsername, targetUser);
      if (!check.allowMedia) {
        alert('Photos and rich media are restricted until the recipient accepts your message request.');
        if (chatMediaInputRef.current) chatMediaInputRef.current.value = '';
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const rawId = activeConversation.id;
      const canonicalId = getCanonicalConvId(activeConversation);
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: '📸 Photo',
        sender: 'me',
        senderUsername: currentUsername,
        time: 'Just now',
        isDelivered: false,
        is_read: false,
        isSeen: false,
        ...(isVanishMode ? { is_vanish_mode_message: true, isVanishMode: true } : {}),
        sharedPost: {
          id: `img-${Date.now()}`,
          username: currentUsername,
          imageUrl: dataUrl,
          caption: 'Shared a photo',
        },
      };

      setChatMessages((prev) => {
        const existing = getListForConv(prev, canonicalId, rawId);
        const next = [...existing, newMsg];
        const nextMap = {
          ...prev,
          [rawId]: next,
          [canonicalId]: next,
        };
        try {
          if (currentUsername) {
            localStorage.setItem(`dpsbuzz_chat_messages_${currentUsername}_v3`, JSON.stringify(nextMap));
          }
          window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
        } catch {}
        return nextMap;
      });

      // Instant 0ms broadcast across all tabs and components
      DataStore.broadcastChatEvent({
        type: 'MESSAGE_SENT',
        conversationId: canonicalId,
        message: newMsg,
        senderUsername: currentUsername,
        recipientUsername: activeConversation.username,
      });

      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: canonicalId,
          senderUsername: currentUsername,
          message: newMsg,
        }),
      })
        .then((res) => {
          if (res.ok) {
            setChatMessages((prev) => {
              const currentList = getListForConv(prev, canonicalId, rawId);
              const updated = currentList.map((m) =>
                m.id === newMsg.id ? { ...m, isDelivered: true } : m
              );
              return {
                ...prev,
                [rawId]: updated,
                [canonicalId]: updated,
              };
            });
          }
        })
        .catch((err) => console.warn('Failed to sync chat message:', err));

      setTimeout(() => scrollToBottom(true), 80);
    };
    reader.readAsDataURL(file);
    if (chatMediaInputRef.current) chatMediaInputRef.current.value = '';
  };

  // ACTIVE CONVERSATION VIEW (Full screen on mobile, NO active now or last seen status)
  if (activeConversation) {
    const canonicalId = getCanonicalConvId(activeConversation);
    const isGroup = activeConversation.isGroup || activeConversation.id.startsWith('conv-group-');

    // Strict Privacy Guard: If direct chat does not involve currentUsername, block viewing!
    if (!isGroup && canonicalId.includes('__')) {
      const participants = canonicalId.split('__').map((p) => p.trim().toLowerCase());
      if (!participants.includes(currentUsername)) {
        setActiveConversation(null);
        return null;
      }
    }

    const messages = getListForConv(chatMessages, canonicalId, activeConversation.id);
    const colors = getAvatarColorPair(activeConversation.username || activeConversation.name);
    const initials = activeConversation.name.slice(0, 2).toUpperCase();

    // Active Chat Wallpaper (Persistent across sessions & per-conversation)
    const activeChatBg: ChatBackgroundOption =
      chatBackgrounds[canonicalId] ||
      chatBackgrounds[activeConversation.id] ||
      chatBackgrounds['global_default'] ||
      GRADIENT_BACKGROUNDS[0];

    const targetUser = (activeConversation.username || activeConversation.id.replace(/^conv-/, '')).toLowerCase().trim();
    const isSelfChat = targetUser === currentUsername;

    return (
      <div className="fixed inset-0 z-50 md:static md:z-auto md:min-h-[85vh] flex flex-col select-none bg-[var(--surface)] text-[var(--text)] font-sf-display font-semibold">
        {/* Chat Header (56px) */}
        <header
          className="h-14 px-3 flex items-center justify-between border-b shrink-0 sticky top-0 z-30"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={handleCloseActiveChat}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer"
              style={{ color: 'var(--text)' }}
              aria-label="Back to inbox"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Avatar 36px (circle for people, 10px rounded for groups) */}
            <div
              onClick={() => {
                if (!activeConversation.isGroup && targetUser) {
                  router.push(`/u/${targetUser}`);
                }
              }}
              title={!activeConversation.isGroup ? `View @${targetUser}'s profile` : undefined}
              className={`w-9 h-9 flex items-center justify-center font-bold text-xs shrink-0 border overflow-hidden ${
                activeConversation.isGroup ? 'rounded-[10px]' : 'rounded-full cursor-pointer hover:opacity-85'
              }`}
              style={{
                backgroundColor: activeConversation.isGroup ? 'var(--primary)' : colors.bg,
                color: activeConversation.isGroup ? 'var(--on-primary)' : colors.text,
                borderColor: 'var(--line)',
              }}
            >
              {activeConversation.isGroup ? (
                activeConversation.groupInitials || '8A'
              ) : activeConversation.avatar ? (
                <img src={activeConversation.avatar} alt={activeConversation.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div
              onClick={() => {
                if (!activeConversation.isGroup && targetUser) {
                  router.push(`/u/${targetUser}`);
                }
              }}
              className={`min-w-0 ${!activeConversation.isGroup ? 'cursor-pointer hover:opacity-85' : ''}`}
            >
              <h2 className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text)' }}>
                {activeConversation.name}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                {activeConversation.isGroup ? 'Class Group' : `@${activeConversation.username} · Class ${activeConversation.studentClass || '8-A'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick 1-tap Wallpaper / Theme selector button */}
            <button
              type="button"
              onClick={() => setIsBgSelectorOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text-muted)] hover:text-pink-500 transition-colors"
              aria-label="Change Chat Background"
              title="Change Chat Background"
            >
              <Palette size={18} />
            </button>

            {/* Vanish Mode Toggle (Instagram Architecture Section 5) */}
            {!activeConversation.isGroup && targetUser && (
              <button
                type="button"
                onClick={handleToggleVanishMode}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isVanishMode
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'hover:bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-purple-400'
                }`}
                aria-label="Toggle Vanish Mode"
                title={isVanishMode ? 'Vanish Mode is ON (tap to turn off)' : 'Turn on Vanish Mode'}
              >
                <Ghost size={18} />
              </button>
            )}

            {!activeConversation.isGroup && targetUser && !isSelfChat && (
              <>
                {/* Button 1: Voice Call */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const now = Date.now();
                    if ((window as any).__dpsbuzz_last_call_click && now - (window as any).__dpsbuzz_last_call_click < 2500) {
                      return;
                    }
                    (window as any).__dpsbuzz_last_call_click = now;
                    window.dispatchEvent(
                      new CustomEvent('dpsbuzz:start_call', {
                        detail: {
                          receiverUsername: targetUser,
                          receiverName: activeConversation.name || targetUser,
                          receiverAvatar: activeConversation.avatar || activeConversation.avatarUrl || null,
                          isVideo: false,
                        },
                      })
                    );
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text-muted)] hover:text-[#007AFF] transition-colors relative z-10"
                  aria-label="Voice Call"
                  title="Voice Call"
                >
                  <Phone size={18} />
                </button>

                {/* Button 2: Video Call */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const now = Date.now();
                    if ((window as any).__dpsbuzz_last_call_click && now - (window as any).__dpsbuzz_last_call_click < 2500) {
                      return;
                    }
                    (window as any).__dpsbuzz_last_call_click = now;
                    window.dispatchEvent(
                      new CustomEvent('dpsbuzz:start_call', {
                        detail: {
                          receiverUsername: targetUser,
                          receiverName: activeConversation.name || targetUser,
                          receiverAvatar: activeConversation.avatar || activeConversation.avatarUrl || null,
                          isVideo: true,
                        },
                      })
                    );
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text-muted)] hover:text-[#007AFF] transition-colors relative z-10"
                  aria-label="Video Call"
                  title="Video Call"
                >
                  <Video size={19} />
                </button>
              </>
            )}

            {/* Button 3: More Options / Chat Settings (Fix: Opens ChatActionsSheet directly in active chat view) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLongPressConv(activeConversation);
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text)] transition-colors relative z-10"
              aria-label="Chat options"
              title="Chat options & wallpaper"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </header>

        {/* Vanish Mode Banner */}
        {isVanishMode && (
          <div className="px-4 py-2 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-b border-purple-500/30 text-white text-xs font-medium flex items-center justify-between shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <Ghost size={14} className="text-purple-300 shrink-0" />
              <span>Vanish Mode is ON • Messages disappear when you close the chat</span>
            </div>
            <button
              type="button"
              onClick={handleToggleVanishMode}
              className="text-[11px] underline font-semibold text-purple-200 hover:text-white cursor-pointer ml-2 shrink-0"
            >
              Turn Off
            </button>
          </div>
        )}

        {/* Messages Stream with dynamic persistent background */}
        <div
          ref={messagesContainerRef}
          className="flex-1 p-4 space-y-3 overflow-y-auto relative transition-all font-sf-display"
          style={
            isVanishMode
              ? {
                  background: 'radial-gradient(ellipse at top, #1e112a 0%, #0c0a09 100%)',
                }
              : activeChatBg && activeChatBg.type === 'image'
              ? {
                  backgroundImage: `url(${activeChatBg.value})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }
              : activeChatBg && activeChatBg.type === 'gradient'
              ? {
                  background: activeChatBg.value,
                }
              : {
                  backgroundColor: 'var(--surface)',
                }
          }
        >
          {/* Subtle dark backdrop overlay on photo wallpapers for optimal text readability */}
          {activeChatBg && activeChatBg.type === 'image' && (
            <div className="absolute inset-0 bg-black/35 pointer-events-none" />
          )}
          {messages.length === 0 ? (
            <div className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
              No messages yet. Say hello to your classmate!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderUsername
                ? msg.senderUsername.toLowerCase() === currentUsername
                : msg.sender === 'me';
              const showReactionBar = activeReactionMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col relative group ${isMe ? 'items-end' : 'items-start'} mb-1.5`}
                >
                  {/* Floating Emoji Reactions Bar */}
                  {showReactionBar && (
                    <div
                      className={`absolute z-30 -top-10 ${
                        isMe ? 'right-0' : 'left-0'
                      } bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/15 shadow-xl rounded-full px-2 py-1 flex items-center gap-1.5 animate-scale-in`}
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleReaction(msg.id, emoji);
                          }}
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-sm hover:scale-125 transition-transform active:scale-95 cursor-pointer ${
                            msg.reaction === emoji ? 'bg-blue-100 dark:bg-blue-900/50 ring-1 ring-blue-500' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}

                      {/* Unsend Protocol (Instagram Architecture Section 5) */}
                      {isMe && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnsendMessage(msg.id);
                          }}
                          className="ml-1 pl-1.5 pr-2 py-0.5 border-l border-zinc-200 dark:border-zinc-700 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Unsend for everyone"
                        >
                          <Trash2 size={12} />
                          <span>Unsend</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Message Bubble Container with Double-tap to heart & click to toggle reactions */}
                  <div
                    onClick={() => handleMessageClick(msg)}
                    className="relative cursor-pointer select-none max-w-[78%]"
                  >
                    <div
                      className={`px-4 py-2.5 rounded-[22px] text-[15px] leading-[1.4] tracking-[-0.015em] font-semibold chat-bubble-text font-sf-display transition-all ${
                        isMe
                          ? 'bg-[#007AFF] text-white rounded-br-[5px] shadow-xs'
                          : 'bg-[#FFFFFF] text-slate-900 border border-black/10 dark:border-white/15 rounded-bl-[5px] shadow-xs'
                      }`}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF UI Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                        fontWeight: 600,
                      }}
                    >
                      {msg.sharedPost && (
                        <div
                          className={`mb-2 p-2.5 rounded-2xl border overflow-hidden flex flex-col gap-2 max-w-xs text-left ${
                            isMe
                              ? 'bg-black/20 border-white/20 text-white'
                              : 'bg-slate-100 border-slate-200 text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <span>📸</span>
                            <span>@{msg.sharedPost.username}&apos;s Post</span>
                          </div>
                          {msg.sharedPost.imageUrl && (
                            <img
                              src={msg.sharedPost.imageUrl}
                              alt="Shared post"
                              className="w-full max-h-48 object-cover rounded-xl border border-black/5"
                            />
                          )}
                          {msg.sharedPost.caption && (
                            <p className="text-xs line-clamp-2 italic leading-relaxed opacity-90">
                              &ldquo;{msg.sharedPost.caption}&rdquo;
                            </p>
                          )}
                          <Link
                            href={`/home#post-${msg.sharedPost.id}`}
                            className={`inline-flex items-center gap-1 text-[11px] font-bold underline ${
                              isMe ? 'text-blue-200 hover:text-white' : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            <span>View Post in Feed</span>
                            <span>→</span>
                          </Link>
                        </div>
                      )}

                      {msg.isCallLog || msg.text.startsWith('📞') || msg.text.startsWith('📹') ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{msg.text}</span>
                          {!activeConversation.isGroup && activeConversation.username && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.dispatchEvent(
                                  new CustomEvent('dpsbuzz:start_call', {
                                    detail: {
                                      receiverUsername: activeConversation.username,
                                      receiverName: activeConversation.name,
                                      receiverAvatar: activeConversation.avatar,
                                      isVideo: msg.text.includes('Video'),
                                    },
                                  })
                                );
                              }}
                              className={`text-[12px] font-bold underline cursor-pointer ml-1.5 ${
                                isMe ? 'text-white/95 hover:text-white' : 'text-blue-600 hover:text-blue-700'
                              }`}
                            >
                              Call back
                            </button>
                          )}
                        </div>
                      ) : msg.text === '❤️' && !msg.sharedPost ? (
                        <span className="text-3xl inline-block animate-heart-pop py-0.5 select-none leading-none">
                          ❤️
                        </span>
                      ) : (() => {
                        const storyMatch = msg.text.match(/^(?:You replied to their story|Replied to their story|Replied to your story|Replied to story):\s*["']?([\s\S]*?)["']?\s*(?:💬)?$/i);
                        if (storyMatch) {
                          const replyContent = storyMatch[1].replace(/^["']|["']$/g, '').trim();
                          return (
                            <div className="flex flex-col gap-1.5 py-0.5 text-left">
                              <div
                                className={`text-[11px] font-semibold tracking-wide flex items-center gap-1.5 select-none pb-1 border-b ${
                                  isMe
                                    ? 'text-white/85 border-white/20'
                                    : 'text-zinc-500 dark:text-zinc-400 border-black/10 dark:border-white/10'
                                }`}
                              >
                                <span className="text-xs">📖</span>
                                <span>{isMe ? 'You replied to their story' : 'Replied to your story'}</span>
                              </div>
                              <div className="text-[14px] leading-relaxed break-words font-medium">
                                &ldquo;{replyContent}&rdquo;
                              </div>
                            </div>
                          );
                        }
                        return <span>{msg.text}</span>;
                      })()}
                    </div>

                    {/* Emoji Reaction Badge on corner of bubble */}
                    {msg.reaction && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleReaction(msg.id, msg.reaction!);
                        }}
                        className={`absolute -bottom-2 ${
                          isMe ? 'right-2' : 'left-2'
                        } bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/15 text-xs px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5 cursor-pointer hover:scale-115 active:scale-95 transition-all select-none animate-scale-in`}
                        title="Reaction (tap to remove)"
                      >
                        <span className="leading-none">{msg.reaction}</span>
                      </button>
                    )}
                  </div>

                  {/* Message Time, Vanish Indicator, and Delivery Checkmarks */}
                  <div className="flex items-center gap-1 px-1 mt-1">
                    {(msg.is_vanish_mode_message || msg.isVanishMode) && (
                      <span title="Disappears when chat is closed" className="text-[10px] text-purple-400 flex items-center select-none">
                        👻
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--text-muted)] tabular-nums font-medium">
                      {msg.time}
                    </span>
                    {isMe && (
                      <span
                        className="inline-flex items-center shrink-0"
                        title={
                          msg.is_read || msg.isSeen || msg.readAt
                            ? 'Read'
                            : msg.isDelivered
                            ? 'Delivered'
                            : 'Sent'
                        }
                      >
                        {msg.is_read || msg.isSeen || msg.readAt ? (
                          <CheckCheck size={13} className="text-[#007AFF] shrink-0" />
                        ) : msg.isDelivered ? (
                          <CheckCheck size={13} className="text-zinc-400 shrink-0" />
                        ) : (
                          <Check size={13} className="text-zinc-400 shrink-0" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Maintenance Notice Banner */}
        {isMaintenanceActive && (
          <div className="px-4 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <span>🔒</span>
            <span>Maintenance mode is active today. Chat messaging is disabled.</span>
          </div>
        )}

        {/* Stranger Sandbox Action Bar (Instagram Architecture Section 4) */}
        {!activeConversation.isGroup &&
        targetUser &&
        DataStore.getInboxTier(currentUsername, targetUser) === 'REQUESTS' ? (
          <div className="p-4 border-t border-[var(--line)] bg-[var(--surface)] space-y-3 shrink-0 relative z-20">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] text-center px-2">
              <Shield size={14} className="text-amber-500 shrink-0" />
              <span>
                <strong>@{targetUser}</strong> wants to send you a message. Accept to reply & follow each other.
              </span>
            </div>
            <div className="flex items-center gap-2 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => handleBlockStranger(targetUser)}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <UserX size={14} />
                <span>Block</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRequest(targetUser)}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-sunken)] border border-[var(--line)] hover:text-[var(--text)] active:scale-95 transition-all cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => handleAcceptRequestFromSandbox(targetUser)}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-white bg-[var(--primary)] hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                Accept & Follow
              </button>
            </div>
          </div>
        ) : (
          /* Input Bar */
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t flex items-center gap-2 bg-[var(--surface)] relative z-20"
            style={{
              borderColor: 'var(--line)',
              paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
            }}
          >
            {/* Hidden file input for photo sharing */}
            <input
              type="file"
              ref={chatMediaInputRef}
              accept="image/*"
              onChange={handleImageAttachment}
              className="hidden"
            />

            {/* Photo attachment button */}
            <button
              type="button"
              onClick={() => {
                if (!activeConversation.isGroup && targetUser) {
                  const check = DataStore.canChatAndShare(currentUsername, targetUser);
                  if (!check.allowMedia) {
                    alert('Photos and rich media are restricted until the recipient accepts your message request.');
                    return;
                  }
                }
                chatMediaInputRef.current?.click();
              }}
              disabled={isMaintenanceActive}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text-muted)] hover:text-[#007AFF] transition-colors shrink-0 disabled:opacity-40"
              aria-label="Attach photo"
              title="Send photo"
            >
              <ImageIcon size={20} />
            </button>

            {/* Emoji drawer button */}
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(true)}
              disabled={isMaintenanceActive}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text-muted)] hover:text-[#007AFF] transition-colors shrink-0 disabled:opacity-40"
              aria-label="Pick emoji"
              title="Emoji picker"
            >
              <Smile size={20} />
            </button>

            <input
              type="text"
              value={messageInput}
              disabled={isMaintenanceActive}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={isMaintenanceActive ? 'Chat is disabled during scheduled maintenance 🔒' : 'Message...'}
              className="flex-1 h-11 px-4 rounded-full bg-[var(--surface-sunken)] text-[14.5px] outline-none border border-[var(--line)] focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] placeholder:text-[var(--text-muted)] disabled:opacity-50 transition-all font-semibold font-sf-display"
              style={{
                color: 'var(--text)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF UI Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                fontWeight: 600,
              }}
            />

            {messageInput.trim() ? (
              <button
                type="submit"
                disabled={isMaintenanceActive}
                className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 bg-[#007AFF] text-white shadow-xs"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isMaintenanceActive}
                onClick={handleSendHeart}
                className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-75 hover:scale-110 text-rose-500 shrink-0 disabled:opacity-40"
                aria-label="Send heart"
              >
                <Heart size={22} className="fill-rose-500" />
              </button>
            )}
          </form>
        )}

        {/* Chat Actions Sheet inside active chat view */}
        <ChatActionsSheet
          conversation={longPressConv}
          isOpen={longPressConv !== null}
          onClose={() => setLongPressConv(null)}
          onMuteToggle={handleMuteToggle}
          onPinToggle={handlePinToggle}
          onChangeBackground={() => {
            setLongPressConv(null);
            setIsBgSelectorOpen(true);
          }}
          onDeleteRequest={(c) => {
            setLongPressConv(null);
            setDeleteConfirmConv(c);
          }}
          onReport={(c) => {
            if (c.username?.toLowerCase() === currentUsername) {
              alert('You cannot report yourself.');
              setLongPressConv(null);
              return;
            }
            alert(`Report submitted for @${c.username}. School moderation will review.`);
            setLongPressConv(null);
          }}
          onBlock={(c) => {
            if (c.username?.toLowerCase() === currentUsername) {
              alert('You cannot block yourself.');
              setLongPressConv(null);
              return;
            }
            alert(`Blocked @${c.username}. They cannot message you.`);
            setLongPressConv(null);
          }}
        />

        {/* Chat Background Selector Modal */}
        <ChatBackgroundSelector
          isOpen={isBgSelectorOpen}
          onClose={() => setIsBgSelectorOpen(false)}
          currentBackground={activeChatBg}
          onSelectBackground={handleSelectChatBg}
          conversationName={activeConversation.name}
        />

        {/* Emoji Picker Drawer */}
        <EmojiPickerDrawer
          isOpen={isEmojiPickerOpen}
          onClose={() => setIsEmojiPickerOpen(false)}
          onSelectEmoji={(emoji) => {
            setMessageInput((prev) => prev + emoji);
          }}
        />
      </div>
    );
  }

  // MAIN CHATS INBOX VIEW
  return (
    <div
      className="min-h-dvh flex flex-col select-none font-sf-display font-semibold"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Maintenance Mode Banner */}
      {isMaintenanceActive && (
        <div className="mx-4 my-2 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <span className="text-base shrink-0">🔒</span>
          <div>
            <p className="font-bold">Chat Messaging Locked for Scheduled Maintenance</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              School maintenance or examinations are active today. You can read your messages, but sending new messages is disabled.
            </p>
          </div>
        </div>
      )}

      {/* Offline Banner */}
      {demoState === 'offline' && (
        <div
          className="px-4 py-2 text-xs font-medium border-b flex items-center gap-2 animate-fade-in"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            borderColor: 'var(--line)',
            color: 'var(--text-muted)',
          }}
        >
          <WifiOff size={14} />
          <span>You&apos;re offline. You can read your cached chats.</span>
        </div>
      )}

      {/* 1. Header (56px): "Chats" (display 800) on left, compose icon on right */}
      <ChatsHeader onComposeClick={() => setIsNewChatOpen(true)} />

      {/* 2. Search Field (48px sunken, pill radius) */}
      <ChatSearch
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
        placeholder="Search chats or classmates"
      />

      {/* 2.5 Classmates Profiles & Status Notes Row with Real-Time Songs & Music Preview */}
      <ChatNotesTray onReplyToNote={handleReplyToNote} />

      {/* 3. Chips: All, Groups, Requests + Curved "+ New Group" Option */}
      <div className="px-4 py-2 border-b flex items-center gap-2 overflow-x-auto no-scrollbar" style={{ borderColor: 'var(--line)' }}>
        <button
          type="button"
          onClick={() => setActiveChip('all')}
          className={`h-9 px-4 rounded-full text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
            activeChip === 'all'
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
              : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
          }`}
          aria-label="All chats"
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setActiveChip('groups')}
          className={`h-9 px-4 rounded-full text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
            activeChip === 'groups'
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
              : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
          }`}
          aria-label="Group chats"
        >
          Groups
        </button>

        <button
          type="button"
          onClick={() => setActiveChip('requests')}
          className={`h-9 px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
            activeChip === 'requests'
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
              : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
          }`}
          aria-label={`Message requests (${computedRequests.length})`}
        >
          <span>Requests</span>
          {computedRequests.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                activeChip === 'requests'
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--primary)] text-[var(--on-primary)]'
              }`}
            >
              {computedRequests.length}
            </span>
          )}
        </button>

        {/* Curved "+ New Group" button */}
        <button
          type="button"
          onClick={() => setIsCreateGroupOpen(true)}
          className="h-9 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 bg-[var(--primary)] text-white hover:opacity-90 shrink-0 ml-auto shadow-xs"
          aria-label="Create group"
        >
          <Plus size={14} />
          <span>New Group</span>
        </button>
      </div>

      {/* 4. Requests List View (when Requests chip is selected) */}
      {activeChip === 'requests' ? (
        <div className="pb-36">
          <RequestsList
            initialRequests={computedRequests}
            onAccept={(req) => handleAcceptRequestFromSandbox(req.username)}
            onIgnore={(id) => {
              const req = computedRequests.find((r) => r.id === id);
              if (req) handleDeleteRequest(req.username);
            }}
            onBlock={(req) => handleBlockStranger(req.username)}
            onSelectRequest={(req) => {
              const conv = conversations.find(
                (c) => (c.username || '').toLowerCase() === req.username.toLowerCase()
              ) || {
                id: req.id.startsWith('conv-') ? req.id : `conv-${req.username}`,
                name: req.name,
                username: req.username,
                studentClass: req.studentClass,
                avatar: req.avatar || req.avatarUrl || null,
                lastMessage: req.messagePreview,
                timeAgo: req.timeAgo,
                inboxTier: 'REQUESTS' as const,
                isUnread: true,
              };
              openConversation(conv);
            }}
          />
        </div>
      ) : (
        /* Conversation Rows & States */
        <div className="flex-1 divide-y" style={{ borderColor: 'var(--line)' }}>
          {/* Prominent Instagram-Style Message Request Alert Strip */}
          {activeChip === 'all' && computedRequests.length > 0 && (
            <div
              onClick={() => setActiveChip('requests')}
              className="mx-3.5 my-2.5 p-3 rounded-2xl bg-gradient-to-r from-orange-500/15 via-pink-500/15 to-purple-500/15 border border-orange-500/30 flex items-center justify-between cursor-pointer hover:opacity-95 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white font-extrabold text-xs shadow-xs shrink-0">
                  {computedRequests.length}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text)] truncate">
                    {computedRequests.length === 1
                      ? `@${computedRequests[0].username} sent you a message request`
                      : `${computedRequests.length} new message requests`}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    Tap to review & accept (auto-follow to chat)
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-white bg-[var(--primary)] px-3 py-1 rounded-full shrink-0 shadow-xs ml-2">
                Review
              </span>
            </div>
          )}

          {demoState === 'loading' ? (
            <ChatsSkeleton count={6} />
          ) : demoState === 'error' ? (
            <div className="p-8 text-center space-y-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: 'var(--surface-sunken)' }}
              >
                <AlertCircle size={24} style={{ color: 'var(--danger)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Couldn&apos;t load your chats. Check your internet and try again.
              </p>
              <button
                type="button"
                onClick={() => setDemoState('normal')}
                className="px-5 py-2 rounded-full text-xs font-bold cursor-pointer transition-transform active:scale-95 shadow-xs"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)' }}
              >
                Retry
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            searchQuery.trim() ? (
              <div className="p-8 text-left space-y-1">
                <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                  Nobody called that. Check the spelling.
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Try searching by first name, username or class section (e.g. 8-A).
                </p>
              </div>
            ) : (
              <EmptyChats
                onNewChatClick={() => setIsNewChatOpen(true)}
              />
            )
          ) : (
            <div className="pb-36">
              {/* Pinned Class Group Chats at the Top */}
              {pinnedList.length > 0 && (
                <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                  {pinnedList.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      conversation={conv}
                      onClick={() => openConversation(conv)}
                      onLongPress={(c) => setLongPressConv(c)}
                      onMuteToggle={handleMuteToggle}
                      onDeleteRequest={(c) => setDeleteConfirmConv(c)}
                    />
                  ))}
                </div>
              )}

              {/* Today Section */}
              {todayList.length > 0 && (
                <div>
                  <div
                    className="px-4 pt-3 pb-1 text-[12px] font-semibold tracking-wider uppercase select-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Today
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                    {todayList.map((conv) => (
                      <ConversationRow
                        key={conv.id}
                        conversation={conv}
                        onClick={() => openConversation(conv)}
                        onLongPress={(c) => setLongPressConv(c)}
                        onMuteToggle={handleMuteToggle}
                        onDeleteRequest={(c) => setDeleteConfirmConv(c)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Earlier Section */}
              {earlierList.length > 0 && (
                <div>
                  <div
                    className="px-4 pt-4 pb-1 text-[12px] font-semibold tracking-wider uppercase select-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Earlier
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                    {earlierList.map((conv) => (
                      <ConversationRow
                        key={conv.id}
                        conversation={conv}
                        onClick={() => openConversation(conv)}
                        onLongPress={(c) => setLongPressConv(c)}
                        onMuteToggle={handleMuteToggle}
                        onDeleteRequest={(c) => setDeleteConfirmConv(c)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* New Chat Sheet (Lists only school students) */}
      <NewChatSheet
        isOpen={isNewChatOpen}
        followingStudents={liveFollowing}
        otherStudents={liveOthers}
        onClose={() => setIsNewChatOpen(false)}
        onSelectStudent={handleStartNewChat}
      />

      {/* Long Press Sheet (Mute, Pin, Report, Block, Wallpaper) */}
      <ChatActionsSheet
        conversation={longPressConv}
        isOpen={longPressConv !== null}
        onClose={() => setLongPressConv(null)}
        onMuteToggle={handleMuteToggle}
        onPinToggle={handlePinToggle}
        onChangeBackground={() => {
          if (longPressConv) {
            setActiveConversation(longPressConv);
            setIsBgSelectorOpen(true);
            setLongPressConv(null);
          }
        }}
        onDeleteRequest={(c) => {
          setLongPressConv(null);
          setDeleteConfirmConv(c);
        }}
        onReport={(c) => {
          if (c.username && c.username.toLowerCase() === currentUsername) {
            alert('You cannot report your own account.');
            setLongPressConv(null);
            return;
          }
          alert(`Report submitted for @${c.username}. Administration will review.`);
          setLongPressConv(null);
        }}
        onBlock={(c) => {
          if (c.username && c.username.toLowerCase() === currentUsername) {
            alert('You cannot block your own account.');
            setLongPressConv(null);
            return;
          }
          setConversations((prev) => prev.filter((item) => item.id !== c.id));
          alert(`Blocked @${c.username}. They can no longer message you.`);
          setLongPressConv(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmConv && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-[20px] p-5 space-y-4 border shadow-2xl animate-fade-in"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <div className="space-y-1.5">
              <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                Delete chat with {deleteConfirmConv.name}?
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                This removes your conversation history from your inbox. You can start a new chat with them at any time.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmConv(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold border cursor-pointer hover:bg-[var(--surface-sunken)] transition-colors"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-full text-xs font-bold text-white cursor-pointer transition-opacity active:scale-95"
                style={{ backgroundColor: 'var(--danger)' }}
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Curved "+ New Group" Modal (28px radius) */}
      {isCreateGroupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsCreateGroupOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-t-[28px] sm:rounded-[28px] border p-5 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-full bg-blue-500/10 text-[var(--primary)]">
                  <Users size={16} />
                </span>
                <h3 className="font-bold text-sm text-[var(--text)]">Create Classmate Group</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Group Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="E.g. Class 8-A Science Squad or Cricket Team"
                className="w-full h-11 px-4 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] outline-none focus:border-[var(--primary)] font-medium"
              />
            </div>

            {/* School Acceptance Policy Banner */}
            <div className="p-3.5 rounded-[20px] bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--text)] leading-relaxed space-y-1">
              <strong className="text-[var(--primary)] block">Invitation Rule:</strong>
              <p className="text-[var(--text-muted)]">
                Invited classmates receive a request. They will only join this group once they accept the invitation.
              </p>
            </div>

            {/* Followed Classmates List to Invite */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Select Classmates ({selectedGroupMembers.length} selected)
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {liveStudents.map((st) => {
                  const isSelected = selectedGroupMembers.includes(st.username);
                  const pair = getAvatarColorPair(st.username);
                  return (
                    <div
                      key={st.username}
                      onClick={() => {
                        setSelectedGroupMembers((prev) =>
                          isSelected ? prev.filter((u) => u !== st.username) : [...prev, st.username]
                        );
                      }}
                      className={`p-2.5 rounded-[18px] border flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30'
                          : 'bg-[var(--surface-sunken)] border-[var(--line)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ backgroundColor: pair.bg, color: pair.text }}
                        >
                          {st.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--text)] truncate">{st.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">@{st.username} · Class {st.studentClass}</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                            : 'border-[var(--line)] bg-[var(--surface)]'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <form onSubmit={handleCreateGroupSubmit}>
              <button
                type="submit"
                disabled={!newGroupName.trim() || selectedGroupMembers.length === 0}
                className="w-full py-3 rounded-full text-xs font-bold text-white bg-[var(--primary)] hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs disabled:opacity-40"
              >
                Send Group Invitations ({selectedGroupMembers.length})
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {groupToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[var(--text)] shadow-lg animate-fade-in pointer-events-none select-none">
          {groupToast}
        </div>
      )}
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<ChatsSkeleton count={6} />}>
      <ChatsContent />
    </Suspense>
  );
}
