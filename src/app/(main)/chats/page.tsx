'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import { getAvatarColorPair } from '@/config/tokens';
import { DataStore, DUMMY_TEST_USERNAMES, ChatNote } from '@/lib/dataStore';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  senderUsername?: string;
  time: string;
}

const INITIAL_CONVERSATIONS: ConversationItem[] = [];

const INITIAL_REQUESTS: MessageRequestItem[] = [];

type ChipTab = 'all' | 'groups' | 'requests';

function ChatsContent() {
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

  useEffect(() => {
    const handleUpdate = () => {
      setIsMaintenanceActive(!isAdminUser && DataStore.isMaintenanceActive());
      if (typeof window !== 'undefined') {
        try {
          const savedMsgs = localStorage.getItem('dpsbuzz_chat_messages_v1');
          if (savedMsgs) setChatMessages(JSON.parse(savedMsgs));
          const savedConvs = localStorage.getItem('dpsbuzz_chat_conversations_v2');
          if (savedConvs) {
            const parsed = JSON.parse(savedConvs);
            setConversations(parsed.filter((c: ConversationItem) => !c.username || !DUMMY_TEST_USERNAMES.has(c.username.toLowerCase())));
          }
        } catch {}
      }
    };
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [isAdminUser]);

  const [activeChip, setActiveChip] = useState<ChipTab>(
    viewParam === 'requests' ? 'requests' : viewParam === 'groups' ? 'groups' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dpsbuzz_chat_conversations_v2');
        if (saved) {
          const parsed: ConversationItem[] = JSON.parse(saved);
          return parsed.filter((c) => !c.username || !DUMMY_TEST_USERNAMES.has(c.username.toLowerCase()));
        }
      } catch {}
    }
    return INITIAL_CONVERSATIONS;
  });
  const [requests, setRequests] = useState<MessageRequestItem[]>(INITIAL_REQUESTS);
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
        const saved = localStorage.getItem('dpsbuzz_chat_messages_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  // Automatically persist conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dpsbuzz_chat_conversations_v2', JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  // Automatically persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dpsbuzz_chat_messages_v1', JSON.stringify(chatMessages));
    } catch {}
  }, [chatMessages]);

  // Live real-time polling (1.5s) when a conversation is actively open
  useEffect(() => {
    if (!activeConversation) return;
    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);

    const pollMessages = async () => {
      try {
        const res = await fetch(`/api/chats?conversationId=${encodeURIComponent(canonicalId)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          setChatMessages((prev) => {
            const currentList = prev[rawId] || prev[canonicalId] || [];
            const existingIds = new Set(currentList.map((m) => m.id));
            const newOnes = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
            if (newOnes.length > 0) {
              const merged = [...currentList, ...newOnes];
              return {
                ...prev,
                [rawId]: merged,
                [canonicalId]: merged,
              };
            }
            return prev;
          });
        }
      } catch {}
    };

    pollMessages();
    const interval = setInterval(pollMessages, 1500);
    return () => clearInterval(interval);
  }, [activeConversation, currentUsername]);

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

  // Student directory from DataStore for New Chat Sheet
  const [liveStudents, setLiveStudents] = useState<StudentContact[]>([]);
  useEffect(() => {
    try {
      const all = DataStore.getProfiles();
      const current = DataStore.getCurrentUser();
      const formatted: StudentContact[] = all
        .filter(
          (s) =>
            s &&
            s.username &&
            s.username.toLowerCase() !== current.username.toLowerCase() &&
            s.username.toLowerCase() !== 'admin' &&
            s.role !== 'admin' &&
            !DUMMY_TEST_USERNAMES.has(s.username.toLowerCase())
        )
        .map((s) => ({
          id: s.id,
          name: s.fullName,
          username: s.username,
          studentClass: `${s.class}-${s.section}`,
          avatarUrl: s.avatar,
          isFollowing: s.class === current.class,
        }));
      setLiveStudents(formatted);
    } catch {
      setLiveStudents([]);
    }
  }, []);

  const liveFollowing = useMemo(() => liveStudents.filter((s) => s.isFollowing), [liveStudents]);
  const liveOthers = useMemo(() => liveStudents.filter((s) => !s.isFollowing), [liveStudents]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (demoState === 'empty') return [];

    let list = [...conversations];

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
  }, [conversations, activeChip, searchQuery, demoState]);

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

  const handleStartNewChat = (student: StudentContact) => {
    setIsNewChatOpen(false);
    const existing = conversations.find((c) => c.username === student.username);
    if (existing) {
      setActiveConversation(existing);
    } else {
      const newConv: ConversationItem = {
        id: `conv-${student.username}`,
        name: student.name,
        username: student.username,
        studentClass: student.studentClass,
        lastMessage: 'Started new conversation',
        timeAgo: 'Just now',
        isUnread: false,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);
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
        const currentList = prev[rawId] || prev[canonicalId] || [];
        const updated = [...currentList, newMsg];
        const nextMap = {
          ...prev,
          [rawId]: updated,
          [canonicalId]: updated,
        };
        try {
          localStorage.setItem('dpsbuzz_chat_messages_v1', JSON.stringify(nextMap));
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

      // Dispatch to server endpoint for instant cross-device delivery
      fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: canonicalId,
          recipientUsername: note.username,
          message: newMsg,
        }),
      }).catch(() => {});
    }

    setActiveConversation(targetConv);
  };

  const handleAcceptRequest = (req: MessageRequestItem) => {
    const newConv: ConversationItem = {
      id: `conv-${req.username}`,
      name: req.name,
      username: req.username,
      studentClass: req.studentClass,
      lastMessage: req.messagePreview,
      timeAgo: req.timeAgo,
      isUnread: true,
    };
    setConversations((prev) => [newConv, ...prev]);
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
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
    };

    setChatMessages((prev) => {
      const currentList = prev[rawId] || prev[canonicalId] || [];
      const updated = [...currentList, newMsg];
      const nextMap = {
        ...prev,
        [rawId]: updated,
        [canonicalId]: updated,
      };
      try {
        localStorage.setItem('dpsbuzz_chat_messages_v1', JSON.stringify(nextMap));
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

    // Dispatch to server endpoint for instant cross-device delivery
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: canonicalId,
        message: newMsg,
      }),
    }).catch((err) => console.warn('Failed to sync chat message:', err));
  };

  // ACTIVE CONVERSATION VIEW (Full screen on mobile, NO active now or last seen status)
  if (activeConversation) {
    const canonicalId = getCanonicalConvId(activeConversation);
    const messages = chatMessages[canonicalId] || chatMessages[activeConversation.id] || [];
    const colors = getAvatarColorPair(activeConversation.username || activeConversation.name);
    const initials = activeConversation.name.slice(0, 2).toUpperCase();

    return (
      <div className="fixed inset-0 z-50 md:static md:z-auto md:min-h-[85vh] flex flex-col select-none bg-[var(--surface)] text-[var(--text)]">
        {/* Chat Header (56px) - NO active now / last seen anywhere */}
        <header
          className="h-14 px-3 flex items-center justify-between border-b shrink-0 sticky top-0 z-30"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setActiveConversation(null)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer"
              style={{ color: 'var(--text)' }}
              aria-label="Back to inbox"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Avatar 36px (circle for people, 10px rounded for groups) */}
            <div
              className={`w-9 h-9 flex items-center justify-center font-bold text-xs shrink-0 border overflow-hidden ${
                activeConversation.isGroup ? 'rounded-[10px]' : 'rounded-full'
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

            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text)' }}>
                {activeConversation.name}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                {activeConversation.isGroup ? 'Class Group' : `@${activeConversation.username} · Class ${activeConversation.studentClass || '8-A'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLongPressConv(activeConversation)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              aria-label="Chat options"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </header>

        {/* Messages Stream */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
              No messages yet. Say hello to your classmate!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderUsername
                ? msg.senderUsername.toLowerCase() === currentUsername
                : msg.sender === 'me';
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-[18px] text-sm leading-relaxed ${
                      isMe
                        ? 'bg-[var(--primary)] text-[var(--on-primary)] rounded-br-xs'
                        : 'bg-[var(--surface-sunken)] text-[var(--text)] rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1 tabular-nums">
                    {msg.time}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Maintenance Notice Banner */}
        {isMaintenanceActive && (
          <div className="px-4 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <span>🔒</span>
            <span>Maintenance mode is active today. Chat messaging is disabled.</span>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t flex items-center gap-2 bg-[var(--surface)]"
          style={{
            borderColor: 'var(--line)',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
          }}
        >
          <input
            type="text"
            value={messageInput}
            disabled={isMaintenanceActive}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={isMaintenanceActive ? 'Chat is disabled during scheduled maintenance 🔒' : 'Message...'}
            className="flex-1 h-11 px-4 rounded-full bg-[var(--surface-sunken)] text-sm outline-none border border-[var(--line)] placeholder:text-[var(--text-muted)] disabled:opacity-50"
            style={{ color: 'var(--text)' }}
          />
          <button
            type="submit"
            disabled={isMaintenanceActive || !messageInput.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--on-primary)',
            }}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    );
  }

  // MAIN CHATS INBOX VIEW
  return (
    <div
      className="min-h-dvh flex flex-col select-none"
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
          aria-label={`Message requests (${requests.length})`}
        >
          <span>Requests</span>
          {requests.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                activeChip === 'requests'
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--primary)] text-[var(--on-primary)]'
              }`}
            >
              {requests.length}
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
            initialRequests={requests}
            onAccept={handleAcceptRequest}
            onIgnore={(id) => setRequests((prev) => prev.filter((r) => r.id !== id))}
            onBlock={(req) => {
              if (req.username && req.username.toLowerCase() === currentUsername) {
                alert('You cannot block your own account.');
                return;
              }
              setRequests((prev) => prev.filter((r) => r.id !== req.id));
            }}
          />
        </div>
      ) : (
        /* Conversation Rows & States */
        <div className="flex-1 divide-y" style={{ borderColor: 'var(--line)' }}>
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
                      onClick={() => setActiveConversation(conv)}
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
                        onClick={() => setActiveConversation(conv)}
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
                        onClick={() => setActiveConversation(conv)}
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

      {/* Long Press Sheet (Mute, Pin, Report, Block) */}
      <ChatActionsSheet
        conversation={longPressConv}
        isOpen={longPressConv !== null}
        onClose={() => setLongPressConv(null)}
        onMuteToggle={handleMuteToggle}
        onPinToggle={handlePinToggle}
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
