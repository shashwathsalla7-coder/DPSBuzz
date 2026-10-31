'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense, useCallback, startTransition } from 'react';
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
  UserPlus,
  Search,
  Clock,
  Sparkles,
  Gamepad2,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { ForwardMessageModal } from '@/components/chats/ForwardMessageModal';
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
import {
  CricketGameModal,
  CricketGameDrawer,
  CricketGameInviteCard,
  CricketLeaderboardModal,
  type CricketGameInviteData,
  Connect4GameModal,
  Connect4GameInviteCard,
  type Connect4InviteData,
  type Connect4Difficulty,
  SoloGame2048Modal,
} from '@/components/games';
import { getAvatarColorPair } from '@/config/tokens';
import { chatConfig } from '@/config/theme';
import { DataStore, DUMMY_TEST_USERNAMES, ChatNote, type GroupJoinRequest } from '@/lib/dataStore';
import { showBackgroundNotification } from '@/lib/pushNotifications';
import { v4 as uuidv4 } from 'uuid';
import { useChatMessages } from '@/hooks/useChatMessages';

interface ChatMessage {
  id: string;
  client_id?: string | null;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  error_reason?: string;
  text: string;
  sender: 'me' | 'them';
  senderUsername?: string;
  senderName?: string;
  time: string;
  reaction?: string;
  isCallLog?: boolean;
  gameInvite?: CricketGameInviteData;
  connect4Invite?: Connect4InviteData;
  sharedPost?: {
    id: string;
    username: string;
    imageUrl?: string | null;
    caption?: string;
  };
  message_type?: string;
  post_id?: string | null;
  post_preview?: any;
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
  timestamp?: number;
  isChatPhoto?: boolean;
  photoExpiresAt?: number;
  isPhotoExpired?: boolean;
}

/**
 * Compresses an image client-side to max dimensions and 75% JPEG quality.
 * Shrinks photos from 5MB+ down to ~40-60KB without visible quality loss.
 */
function compressImageForChat(file: File, maxDim = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return resolve('');
      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(result);
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Formats a message timestamp into a clean 12-hour time in the user's exact local timezone (e.g. "9:25 PM")
 */
function formatChatMessageTime(msg?: { time?: string; createdAt?: string; timestamp?: number }): string {
  if (!msg) return 'Just now';
  const raw = msg.createdAt ? new Date(msg.createdAt).getTime() : (msg.timestamp || 0);
  if (raw > 0) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    }
  }
  if (msg.time && msg.time !== 'Recently' && msg.time !== 'Just now') {
    return msg.time;
  }
  return 'Just now';
}

/**
 * Formats a conversation row's last activity timestamp for the inbox:
 * - < 1 min: "Just now"
 * - < 60 min: "5m", "35m"
 * - Today: "9:25 PM"
 * - Yesterday: "Yesterday"
 * - Older: "2d", "5d", "Oct 25"
 */
function formatConversationTimeAgo(timestamp?: number, fallbackStr?: string): string {
  if (!timestamp || timestamp <= 0) {
    if (fallbackStr && fallbackStr !== 'Recently' && fallbackStr !== '2h') {
      return fallbackStr;
    }
    return 'Just now';
  }
  const now = Date.now();
  const diffMs = now - timestamp;
  if (diffMs < 0) return 'Just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;

  const date = new Date(timestamp);
  const nowDate = new Date(now);

  const isToday =
    date.getDate() === nowDate.getDate() &&
    date.getMonth() === nowDate.getMonth() &&
    date.getFullYear() === nowDate.getFullYear();

  if (isToday) {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  const yesterday = new Date(now - 86400000);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

const INITIAL_CONVERSATIONS: ConversationItem[] = [];

const INITIAL_REQUESTS: MessageRequestItem[] = [];

type ChipTab = 'all' | 'groups' | 'requests';

interface ActiveChatHeaderProps {
  conversation: ConversationItem;
  targetUser: string;
  isSelfChat: boolean;
  isVanishMode: boolean;
  effectiveActiveAvatar: string | null;
  colors: { bg: string; text: string };
  initials: string;
  typingText?: string;
  onClose: () => void;
  onOpenGroupInfo: () => void;
  onViewProfile: (username: string) => void;
  onAddGroupMembers: () => void;
  onOpenBgSelector: () => void;
  onToggleVanishMode: () => void;
  onOpenOptions: (conv: ConversationItem) => void;
}

/**
 * Memoized Active Chat Header Component
 * Guarantees zero flickering and zero DOM re-mounting when incoming messages stream in.
 */
const ActiveChatHeader = React.memo(({
  conversation,
  targetUser,
  isSelfChat,
  isVanishMode,
  effectiveActiveAvatar,
  colors,
  initials,
  typingText,
  onClose,
  onOpenGroupInfo,
  onViewProfile,
  onAddGroupMembers,
  onOpenBgSelector,
  onToggleVanishMode,
  onOpenOptions,
}: ActiveChatHeaderProps) => {
  const isGroup = Boolean(conversation.isGroup);

  const handleAvatarOrNameClick = () => {
    if (isGroup) {
      onOpenGroupInfo();
    } else if (targetUser) {
      onViewProfile(targetUser);
    }
  };

  const handleStartCall = (isVideo: boolean) => {
    const now = Date.now();
    if ((window as any).__dpsbuzz_last_call_click && now - (window as any).__dpsbuzz_last_call_click < 2500) {
      return;
    }
    (window as any).__dpsbuzz_last_call_click = now;
    window.dispatchEvent(
      new CustomEvent('dpsbuzz:start_call', {
        detail: {
          receiverUsername: targetUser,
          receiverName: conversation.name || targetUser,
          receiverAvatar: effectiveActiveAvatar || conversation.avatar || conversation.avatarUrl || null,
          isVideo,
        },
      })
    );
  };

  return (
    <header
      className="h-14 px-3 flex items-center justify-between border-b shrink-0 sticky top-0 z-30"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer"
          style={{ color: 'var(--text)' }}
          aria-label="Back to inbox"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Avatar 36px (circle for people, 10px rounded for groups) */}
        <div
          onClick={handleAvatarOrNameClick}
          title={isGroup ? `View group details & members` : `View @${targetUser}'s profile`}
          className={`w-9 h-9 flex items-center justify-center font-bold text-xs shrink-0 border overflow-hidden cursor-pointer hover:opacity-85 ${
            isGroup ? 'rounded-[10px]' : 'rounded-full'
          }`}
          style={{
            backgroundColor: isGroup ? 'var(--primary)' : colors.bg,
            color: isGroup ? 'var(--on-primary)' : colors.text,
            borderColor: 'var(--line)',
          }}
        >
          {isGroup ? (
            conversation.groupInitials || '8A'
          ) : effectiveActiveAvatar ? (
            <img src={effectiveActiveAvatar} alt={conversation.name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div
          onClick={handleAvatarOrNameClick}
          className="min-w-0 cursor-pointer hover:opacity-85"
        >
          <h2 className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text)' }}>
            {isGroup
              ? conversation.name
              : (() => {
                  const liveProf = targetUser ? DataStore.getProfileByUsername(targetUser) : null;
                  return liveProf?.fullName || conversation.name || `@${targetUser}`;
                })()}
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] truncate">
            {typingText ? (
              <span className="text-[#22C55E] font-medium animate-pulse">
                {typingText}
              </span>
            ) : isGroup ? (() => {
              const activeGroupId = conversation.id.replace(/^conv-/, '');
              const rawMembers = DataStore.getGroupMembers(activeGroupId);
              const count = Math.max(1, rawMembers.length || 1);
              return (
                <span className="flex items-center gap-1 text-[var(--primary)] font-medium">
                  <span>{count} member{count !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>Tap to view members</span>
                </span>
              );
            })() : (() => {
              const liveProf = targetUser ? DataStore.getProfileByUsername(targetUser) : null;
              const rawClass = liveProf?.class || conversation.studentClass || conversation.class || '8-A';
              const cleanClass = rawClass.toString().replace(/^class\s*/i, '').trim();
              const section = liveProf?.section ? `-${liveProf.section}` : '';
              const finalClass = cleanClass ? `Class ${cleanClass}${section && !cleanClass.includes('-') ? section : ''}` : 'DPS Student';
              return `@${targetUser} · ${finalClass}`;
            })()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* If it's a group: ADD FRIENDS (+) Button right in the chat header! */}
        {isGroup && (
          <button
            type="button"
            onClick={onAddGroupMembers}
            className="h-8 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all bg-[var(--primary)] text-white hover:opacity-90 active:scale-95 shadow-xs"
            aria-label="Add members to group"
            title="Add friends to group"
          >
            <UserPlus size={14} strokeWidth={2.5} />
            <span className="text-[11px]">Add</span>
          </button>
        )}

        {/* Quick 1-tap Wallpaper / Theme selector button */}
        <button
          type="button"
          onClick={onOpenBgSelector}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text-muted)] hover:text-pink-500 transition-colors"
          aria-label="Change Chat Background"
          title="Change Chat Background"
        >
          <Palette size={18} />
        </button>

        {/* Vanish Mode Toggle */}
        {!isGroup && targetUser && (
          <button
            type="button"
            onClick={onToggleVanishMode}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isVanishMode
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'hover:bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-cyan-400'
            }`}
            aria-label="Toggle Vanish Mode"
            title={isVanishMode ? 'Vanish Mode is ON (tap to turn off)' : 'Turn on Vanish Mode'}
          >
            <Ghost size={18} />
          </button>
        )}

        {!isGroup && targetUser && !isSelfChat && (
          <>
            {/* Button 1: Voice Call */}
            <button
              type="button"
              onClick={() => handleStartCall(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text-muted)] hover:text-[#007AFF] transition-colors relative z-10"
              aria-label="Voice Call"
              title="Voice Call"
            >
              <Phone size={18} />
            </button>

            {/* Button 2: Video Call */}
            <button
              type="button"
              onClick={() => handleStartCall(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text-muted)] hover:text-[#007AFF] transition-colors relative z-10"
              aria-label="Video Call"
              title="Video Call"
            >
              <Video size={19} />
            </button>
          </>
        )}

        {/* Button 3: More Options / Chat Settings */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenOptions(conversation);
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text)] transition-colors relative z-10"
          aria-label="Chat options"
          title="Chat options & wallpaper"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>
    </header>
  );
});

ActiveChatHeader.displayName = 'ActiveChatHeader';

function ChatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stateParam = searchParams.get('state');
  const viewParam = searchParams.get('view') || searchParams.get('tab');
  const userParam = searchParams.get('user');
  const convParam = searchParams.get('conv');
  const groupParam = searchParams.get('group');

  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const currentUsername = useMemo(() => {
    return (currentUser?.username || '').toLowerCase().trim();
  }, [currentUser]);
  const isAdminUser = currentUser?.role === 'admin' || currentUsername === 'shashwath71845';
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);

  const getCanonicalConvId = (conv: ConversationItem): string => {
    const isGroup = Boolean(
      conv.isGroup ||
      conv.type === 'group' ||
      conv.id.startsWith('conv-group-') ||
      conv.id.startsWith('group-') ||
      conv.id.includes('class-') ||
      conv.id.includes('house-') ||
      conv.id.includes('club-')
    );
    if (isGroup) {
      return conv.id;
    }
    const target = (conv.username || conv.id.replace(/^conv-/, '')).toLowerCase().trim();
    if (target && currentUsername && target !== currentUsername) {
      return [currentUsername, target].sort().join('__');
    }
    return conv.id;
  };

  const getOpponentUsernameFromConv = (conv: ConversationItem | null): string => {
    if (!conv) return '';
    if (conv.username && !conv.username.includes('__')) {
      return conv.username.toLowerCase().trim();
    }
    const raw = conv.id.replace(/^conv-/, '').trim();
    if (raw.includes('__')) {
      const cleanMe = (currentUsername || '').toLowerCase().trim();
      const parts = raw.split('__').map((p) => p.toLowerCase().trim());
      const other = parts.find((p) => p !== cleanMe);
      return other || parts[0];
    }
    return raw.toLowerCase().trim();
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

    const sortFn = (a: ChatMessage, b: ChatMessage) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : (a.timestamp || 0);
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : (b.timestamp || 0);
      return ta - tb;
    };

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
      return Array.from(map.values()).sort(sortFn);
    }
    if (hasC) return [...cList!].sort(sortFn);
    if (hasR) return [...rList!].sort(sortFn);
    return [];
  };

  const refreshLiveStudents = () => {
    const doFormat = (profilesList: any[]) => {
      try {
        const current = DataStore.getCurrentUser();
        const isShashwath = current.username?.toLowerCase() === 'shashwath71845';

        const formatted: StudentContact[] = profilesList
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
              name: s.fullName || s.username,
              username: s.username,
              studentClass: isShash ? 'School Admin' : `${s.class || '8'}-${s.section || 'A'}`,
              avatarUrl: s.avatar,
              isFollowing: isShashwath || isShash || s.class === current.class || DataStore.isFollowing(current.username, s.username),
            };
          });

        if (!isShashwath) {
          formatted.sort((a, b) => {
            if (a.username.toLowerCase() === 'shashwath71845') return -1;
            if (b.username.toLowerCase() === 'shashwath71845') return 1;
            return 0;
          });
        }

        const seenUsernames = new Set<string>();
        const deduplicated: StudentContact[] = [];
        for (const s of formatted) {
          const clean = s.username.toLowerCase().trim();
          if (!seenUsernames.has(clean)) {
            seenUsernames.add(clean);
            deduplicated.push(s);
          }
        }

        setLiveStudents(deduplicated);
      } catch {
        setLiveStudents([]);
      }
    };

    doFormat(DataStore.getProfiles());

    // Pull registered students from server/DB so new users appear in New Chat Sheet
    fetch('/api/search')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.profiles)) {
          const current = DataStore.getProfiles();
          const pMap = new Map<string, any>();
          for (const p of current) {
            if (p && p.username) pMap.set(p.username.toLowerCase(), p);
          }
          let changed = false;
          for (const sp of data.profiles) {
            if (!sp || !sp.username) continue;
            const u = sp.username.toLowerCase();
            if (!pMap.has(u)) {
              pMap.set(u, sp);
              changed = true;
            }
          }
          if (changed) {
            const merged = Array.from(pMap.values());
            DataStore.saveProfiles(merged);
            doFormat(merged);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const freshUser = DataStore.getCurrentUser();
      setCurrentUser(freshUser);
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
                    const healedMsg: ChatMessage = {
                      ...(msgMap.get(m.id) || {}),
                      ...m,
                      status: 'sent',
                      isDelivered: true,
                    };
                    msgMap.set(m.id, healedMsg);
                  }
                  next[k] = Array.from(msgMap.values());
                }
                return next;
              });
            }

            const userConvKey = `dpsbuzz_chat_conversations_${currentUsername}_v3`;
            if (event.type === 'storage' && (event as StorageEvent).key === userConvKey) {
              const savedConvs = localStorage.getItem(userConvKey);
              if (savedConvs) {
                const parsed = JSON.parse(savedConvs);
                if (Array.isArray(parsed)) {
                  setConversations(parsed.filter((c: ConversationItem) => !c.username || !DUMMY_TEST_USERNAMES.has(c.username.toLowerCase())));
                }
              }
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
  const [conversations, setConversations] = useState<ConversationItem[]>(INITIAL_CONVERSATIONS);

  // Hydrate client state from localStorage / DataStore once mounted (prevents SSR hydration mismatch)
  useEffect(() => {
    setIsMounted(true);
    const u = DataStore.getCurrentUser();
    setCurrentUser(u);
    const uname = (u?.username || '').toLowerCase().trim();
    const isAdmin = u?.role === 'admin' || uname === 'shashwath71845';
    setIsMaintenanceActive(!isAdmin && DataStore.isMaintenanceActive());

    if (uname && uname !== 'guest') {
      try {
        const userConvKey = `dpsbuzz_chat_conversations_${uname}_v3`;
        const savedConv = localStorage.getItem(userConvKey);
        if (savedConv) {
          const parsed: ConversationItem[] = JSON.parse(savedConv);
          setConversations(
            parsed
              .filter((c) => !c.username || !DUMMY_TEST_USERNAMES.has(c.username.toLowerCase()))
              .map((c) => ({
                ...c,
                isMuted: DataStore.isConversationMuted(c.id) || Boolean(c.isMuted),
              }))
          );
        }
        const userMsgKey = `dpsbuzz_chat_messages_${uname}_v3`;
        const savedMsg = localStorage.getItem(userMsgKey);
        if (savedMsg) {
          const rawParsed: Record<string, ChatMessage[]> = JSON.parse(savedMsg);
          const healedMap: Record<string, ChatMessage[]> = {};
          for (const [k, v] of Object.entries(rawParsed)) {
            if (Array.isArray(v)) {
              healedMap[k] = v.map((m) => ({
                ...m,
                status: 'sent',
                isDelivered: true,
              }));
            }
          }
          setChatMessages(healedMap);
        }
        const bgKey = `dpsbuzz_chat_backgrounds_${uname}_v2`;
        const savedBg = localStorage.getItem(bgKey);
        if (savedBg) {
          setChatBackgrounds(JSON.parse(savedBg));
        }

        // Auto-discover incoming conversations & post shares from server / Supabase
        fetch(`/api/chats?username=${encodeURIComponent(uname)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.chatMessages && typeof data.chatMessages === 'object') {
              const profiles = DataStore.getProfiles();
              const pMap = new Map<string, any>(profiles.map((p) => [p.username.toLowerCase(), p]));
              setConversations((prev) => {
                const convMap = new Map<string, ConversationItem>();
                for (const c of prev) {
                  convMap.set(c.id, c);
                }
                for (const [key, msgs] of Object.entries(data.chatMessages as Record<string, any[]>)) {
                  if (!Array.isArray(msgs) || msgs.length === 0) continue;
                  const isGroup = key.startsWith('conv-group-') || key.startsWith('group-');
                  let otherUser = '';
                  if (!isGroup && key.includes('__')) {
                    const parts = key.split('__').map((p) => p.trim().toLowerCase());
                    otherUser = parts.find((p) => p !== uname) || parts[0];
                  }
                  const convId = isGroup ? key : `conv-${otherUser}`;
                  const lastMsg = msgs[msgs.length - 1];
                  const sender = (lastMsg?.senderUsername || '').toLowerCase();
                  const isMe = sender === uname || lastMsg?.sender === 'me';
                  const msgText = lastMsg?.text || (lastMsg?.sharedPost ? 'Shared a post 📸' : 'New message');
                  const lastPreview = isMe ? `You: ${msgText}` : msgText;
                  const otherProf = otherUser ? pMap.get(otherUser) : null;

                  if (convMap.has(convId)) {
                    const existing = convMap.get(convId)!;
                    convMap.set(convId, {
                      ...existing,
                      lastMessage: lastPreview,
                      timeAgo: lastMsg?.time || 'Recently',
                    });
                  } else if (convMap.has(key)) {
                    const existing = convMap.get(key)!;
                    convMap.set(key, {
                      ...existing,
                      lastMessage: lastPreview,
                      timeAgo: lastMsg?.time || 'Recently',
                    });
                  } else if (!isGroup && otherUser) {
                    convMap.set(convId, {
                      id: convId,
                      name: otherProf ? otherProf.fullName : `@${otherUser}`,
                      username: otherUser,
                      avatar: otherProf?.avatar || null,
                      studentClass: otherProf?.class ? `Class ${otherProf.class}-${otherProf.section || 'A'}` : 'Student',
                      isGroup: false,
                      type: 'direct',
                      lastMessage: lastPreview,
                      timeAgo: lastMsg?.time || 'Recently',
                      inboxTier: 'PRIMARY',
                      isUnread: false,
                    });
                  }
                }
                const updatedList = Array.from(convMap.values()).filter((c) => !c.username || !DUMMY_TEST_USERNAMES.has(c.username.toLowerCase()));
                try {
                  localStorage.setItem(userConvKey, JSON.stringify(updatedList));
                } catch {}
                return updatedList;
              });

              // Also merge chatMessages into state so clicking the conversation loads immediately
              setChatMessages((prev) => {
                const next = { ...prev };
                for (const [k, v] of Object.entries(data.chatMessages as Record<string, any[]>)) {
                  if (Array.isArray(v) && v.length > 0) {
                    const existingList = next[k] || [];
                    const idSet = new Set(existingList.map((m) => m.client_id || m.id));
                    const toAdd = v.filter((m) => !idSet.has(m.client_id || m.id));
                    if (toAdd.length > 0) {
                      const mergedList = [...existingList, ...toAdd];
                      next[k] = mergedList;
                      // Also mirror under conv-otherUser for instant 0ms access
                      if (k.includes('__')) {
                        const parts = k.split('__').map((p) => p.trim().toLowerCase());
                        const other = parts.find((p) => p !== uname) || parts[0];
                        if (other) {
                          next[`conv-${other}`] = mergedList;
                        }
                      }
                    }
                  }
                }
                try {
                  localStorage.setItem(userMsgKey, JSON.stringify(next));
                } catch {}
                return next;
              });
            }
          })
          .catch(() => {});
      } catch {}
    }
  }, []);
  const [requestsState, setRequestsState] = useState<MessageRequestItem[]>(INITIAL_REQUESTS);
  const [isVanishMode, setIsVanishMode] = useState(false);
  // Vanish Mode Pull-Up / Swipe-Up Gesture State (Instagram Style)
  const [vanishPullDistance, setVanishPullDistance] = useState(0);
  const [isVanishPulling, setIsVanishPulling] = useState(false);
  const vanishTouchStartYRef = useRef<number | null>(null);
  const vanishIsDraggingRef = useRef<boolean>(false);
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
  const activeCanonicalConvId = activeConversation ? getCanonicalConvId(activeConversation) : '';
  const {
    messages: realtimeSupabaseMessages,
    sendMessage: sendSupabaseRealtimeMessage,
    retryMessage: retrySupabaseMessage,
    isLoadingHistory: isRealtimeLoadingHistory,
    sendTypingStatus,
    sendReceipt,
    typingUsers,
    isOffline,
  } = useChatMessages(activeCanonicalConvId, currentUsername);

  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [selectedMessageInfo, setSelectedMessageInfo] = useState<ChatMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentUsername) {
      setReadReceiptsEnabled(DataStore.getReadReceiptsEnabled(currentUsername));
    }
  }, [currentUsername]);

  // Cancel typing when tab or phone goes into background
  useEffect(() => {
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        sendTypingStatus(false);
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    return () => window.removeEventListener('visibilitychange', handleVisibility);
  }, [sendTypingStatus]);

  const activeTypingList = useMemo(() => {
    return Object.values(typingUsers).filter(
      (t) => t.username.toLowerCase() !== currentUsername
    );
  }, [typingUsers, currentUsername]);

  const activeTypingText = useMemo(() => {
    if (!activeTypingList || activeTypingList.length === 0) return '';
    if (activeConversation?.isGroup) {
      if (activeTypingList.length === 1) {
        return `${activeTypingList[0].name || activeTypingList[0].username} is typing...`;
      }
      return `${activeTypingList.length} people are typing...`;
    }
    return 'typing...';
  }, [activeTypingList, activeConversation?.isGroup]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [createGroupSearchQuery, setCreateGroupSearchQuery] = useState('');
  const [groupToast, setGroupToast] = useState<string | null>(null);
  const [longPressConv, setLongPressConv] = useState<ConversationItem | null>(null);
  const [deleteConfirmConv, setDeleteConfirmConv] = useState<ConversationItem | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [selectedFullPhoto, setSelectedFullPhoto] = useState<string | null>(null);
  const lastTapTimeRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  // Group Member Management & Group Invitations State
  const [isAddGroupMembersOpen, setIsAddGroupMembersOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [groupMemberSearchQuery, setGroupMemberSearchQuery] = useState('');
  const [myGroupInvites, setMyGroupInvites] = useState<GroupJoinRequest[]>([]);
  const [groupSyncTick, setGroupSyncTick] = useState(0);

  // Chat Wallpaper / Background & Emoji Drawer State
  const [isBgSelectorOpen, setIsBgSelectorOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [chatBackgrounds, setChatBackgrounds] = useState<Record<string, ChatBackgroundOption>>({});
  const chatMediaInputRef = useRef<HTMLInputElement | null>(null);

  // Multiplayer Games State (Cricket + Connect 4)
  const [isGameDrawerOpen, setIsGameDrawerOpen] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [activeConnect4GameId, setActiveConnect4GameId] = useState<string | null>(null);
  const [isConnect4ModalOpen, setIsConnect4ModalOpen] = useState(false);
  const [isSolo2048ModalOpen, setIsSolo2048ModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [leaderboardDefaultTab, setLeaderboardDefaultTab] = useState<'leaderboard' | 'history' | 'rules'>('leaderboard');

  // Auto-reconnect to any active game session for current user on mount/refresh
  useEffect(() => {
    if (!currentUsername || currentUsername === 'guest') return;
    // Auto reconnect Cricket
    fetch(`/api/games/cricket?action=active&username=${encodeURIComponent(currentUsername)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.session?.gameId) {
          setActiveGameId(data.session.gameId);
        }
      })
      .catch(() => {});

    // Auto reconnect Connect 4
    fetch(`/api/games/connect4?action=active&username=${encodeURIComponent(currentUsername)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.session?.gameId) {
          setActiveConnect4GameId(data.session.gameId);
        }
      })
      .catch(() => {});
  }, [currentUsername]);

  // Load persisted chat backgrounds from localStorage & Prune 10-day expired chat photos
  useEffect(() => {
    try {
      if (currentUsername && currentUsername !== 'guest') {
        DataStore.pruneExpiredChatPhotos(currentUsername, 10);
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

    const group = DataStore.createGroup({
      name: newGroupName.trim(),
      description: `Student study group created by @${currentUsername}`,
      category: 'Study Group',
      members: selectedGroupMembers,
    });

    const convId = `conv-${group.id}`;
    const initials = newGroupName.slice(0, 2).toUpperCase() || 'GP';

    const newGroupConv: ConversationItem = {
      id: convId,
      name: newGroupName.trim(),
      username: newGroupName.toLowerCase().replace(/\s+/g, '_'),
      isGroup: true,
      type: 'group',
      groupInitials: initials,
      lastMessage: selectedGroupMembers.length > 0
        ? `Group created · ${selectedGroupMembers.length} invitation${selectedGroupMembers.length > 1 ? 's' : ''} sent`
        : 'Group created',
      timeAgo: 'Just now',
      isUnread: false,
      studentClass: currentUser?.class ? `Class ${currentUser.class}-${currentUser.section || 'A'}` : 'Study Group',
    };

    setConversations((prev) => [newGroupConv, ...prev.filter((c) => c.id !== convId)]);
    setActiveChip('groups');
    setIsCreateGroupOpen(false);
    setNewGroupName('');
    setSelectedGroupMembers([]);
    setCreateGroupSearchQuery('');
    showGroupToast(`Group "${newGroupConv.name}" created! Invitations sent.`);
  };

  // Sync pending group invites on mount and on storage/content updates
  useEffect(() => {
    const syncInvites = () => {
      if (currentUsername) {
        setMyGroupInvites(DataStore.getGroupInvitesForUser(currentUsername));
      }
    };
    syncInvites();
    window.addEventListener('dpsbuzz:content_updated', syncInvites);
    return () => window.removeEventListener('dpsbuzz:content_updated', syncInvites);
  }, [currentUsername, groupSyncTick]);

  const handleInviteFriendToGroup = (targetUsername: string) => {
    if (!activeConversation || !activeConversation.isGroup) return;
    const activeGroupId = activeConversation.id.replace(/^conv-/, '');

    DataStore.sendGroupInvite(activeGroupId, targetUsername, currentUsername);

    // Post an authentic system message into the active group chat
    const sysMsg: ChatMessage = {
      id: `msg-inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: `@${currentUsername} invited @${targetUsername} to join the group 📬`,
      sender: 'them',
      senderUsername: 'system',
      time: 'Just now',
      createdAt: new Date().toISOString(),
      isSeen: true,
    };

    setChatMessages((prev) => {
      const list = prev[activeConversation.id] || [];
      return { ...prev, [activeConversation.id]: [...list, sysMsg] };
    });

    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: activeConversation.id,
        senderUsername: currentUsername,
        message: sysMsg,
      }),
    }).catch(() => {});

    showGroupToast(`Invitation sent to @${targetUsername}! They'll be added when they accept.`);
    setGroupSyncTick((t) => t + 1);
  };

  const handleAcceptGroupInvite = (invite: GroupJoinRequest) => {
    const res = DataStore.acceptGroupInvite(invite.id, currentUsername);
    if (res.success) {
      showGroupToast(`Joined "${invite.groupName}"! 🎉 Group chat added.`);
      setMyGroupInvites(DataStore.getGroupInvitesForUser(currentUsername));
      setGroupSyncTick((t) => t + 1);
      const convId = `conv-${invite.groupId}`;
      const initials = invite.groupName.slice(0, 2).toUpperCase() || 'GP';
      const newGroupConv: ConversationItem = {
        id: convId,
        name: invite.groupName,
        username: invite.groupName.toLowerCase().replace(/\s+/g, '_'),
        isGroup: true,
        type: 'group',
        groupInitials: initials,
        lastMessage: `@${currentUsername} joined the group! 🎉`,
        timeAgo: 'Just now',
        isUnread: false,
        studentClass: currentUser?.class ? `Class ${currentUser.class}-${currentUser.section || 'A'}` : 'Study Group',
      };
      setConversations((prev) => [newGroupConv, ...prev.filter((c) => c.id !== convId)]);
      openConversation(newGroupConv);
    }
  };

  const handleDeclineGroupInvite = (invite: GroupJoinRequest) => {
    const res = DataStore.declineGroupInvite(invite.id);
    if (res.success) {
      showGroupToast(`Declined invitation to join "${invite.groupName}".`);
      setMyGroupInvites(DataStore.getGroupInvitesForUser(currentUsername));
      setGroupSyncTick((t) => t + 1);
      const convId = `conv-${invite.groupId}`;
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversation?.id === convId) {
        setActiveConversation(null);
      }
      setChatMessages((prev) => {
        const copy = { ...prev };
        delete copy[convId];
        return copy;
      });
    }
  };

  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});

  // Automatically persist conversations to localStorage (scoped to current user)
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUsername) return;
    if (!conversations || conversations.length === 0) return;
    try {
      localStorage.setItem(`dpsbuzz_chat_conversations_${currentUsername}_v3`, JSON.stringify(conversations));
    } catch {}
  }, [conversations, currentUsername]);

  // Automatically persist messages to localStorage (scoped to current user)
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUsername) return;
    if (!chatMessages || Object.keys(chatMessages).length === 0) return;
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
        const isGroupConv = activeConversation.isGroup || activeConversation.id.startsWith('conv-group-') || activeConversation.id.includes('group');
        const queryUrl = `/api/chats?conversationId=${encodeURIComponent(canonicalId)}&username=${encodeURIComponent(currentUsername)}${isGroupConv ? '&isGroup=true' : ''}`;
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
            const now = Date.now();
            const DAY_MS = 24 * 60 * 60 * 1000;

            // Non-destructive preservation: keep ALL local messages unless explicitly tombstoned/unsent or expired vanish (>24h)
            const preservedLocal = currentList.filter((m) => {
              if (!m || !m.id || tombstonedIds.has(m.id)) return false;
              if (m.is_vanish_mode_message || m.isVanishMode) {
                const ts = m.createdAt ? new Date(m.createdAt).getTime() : (m.timestamp || 0);
                if (ts && now - ts > DAY_MS) return false;
              }
              return true;
            });

            const msgMap = new Map<string, ChatMessage>();
            for (const m of preservedLocal) {
              msgMap.set(m.id, m);
            }

            for (const rawMsg of serverMsgs) {
              if (tombstonedIds.has(rawMsg.id)) continue;
              if (rawMsg.is_vanish_mode_message || rawMsg.isVanishMode) {
                const ts = rawMsg.createdAt ? new Date(rawMsg.createdAt).getTime() : (rawMsg.timestamp || 0);
                if (ts && now - ts > DAY_MS) continue;
              }
              const sMsg: ChatMessage = { ...rawMsg, isDelivered: true };
              const sender = (sMsg.senderUsername || '').toLowerCase().trim();
              if (sender && sender !== currentUsername && !sMsg.is_read && !sMsg.isSeen && !sMsg.readAt) {
                hasUnreadFromOther = true;
              }
              const localMsg = msgMap.get(sMsg.id);
              if (localMsg) {
                msgMap.set(sMsg.id, { ...localMsg, ...sMsg, isDelivered: true });
              } else {
                msgMap.set(sMsg.id, sMsg);
              }
            }

            const merged = Array.from(msgMap.values()).sort((a, b) => {
              const ta = a.createdAt ? new Date(a.createdAt).getTime() : (a.timestamp || 0);
              const tb = b.createdAt ? new Date(b.createdAt).getTime() : (b.timestamp || 0);
              return ta - tb;
            });
            let changed = false;

            // Deep check: only trigger re-render if messages actually changed
            if (merged.length !== currentList.length) {
              changed = true;
            } else {
              for (let i = 0; i < merged.length; i++) {
                const m1 = merged[i];
                const m2 = currentList[i];
                if (
                  m1.id !== m2.id ||
                  m1.text !== m2.text ||
                  m1.reaction !== m2.reaction ||
                  Boolean(m1.is_read) !== Boolean(m2.is_read) ||
                  Boolean(m1.isSeen) !== Boolean(m2.isSeen) ||
                  Boolean(m1.isDelivered) !== Boolean(m2.isDelivered) ||
                  m1.sharedPost?.imageUrl !== m2.sharedPost?.imageUrl
                ) {
                  changed = true;
                  break;
                }
              }
            }

            if (changed) {
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
    // Gentle 30s background sync fallback (instant updates are delivered 0ms via Supabase Realtime + BroadcastChannel)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      pollMessages();
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pollMessages();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeConversation, currentUsername]);

  // Real-Time 0ms Instant Message Receiver (BroadcastChannel + CustomEvent)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRealtimeChatEvent = (eventData: any) => {
      if (!eventData || !eventData.type) return;
      const { type, conversationId, message, msgId, reaction, isVanishMode: nextVanish, senderUsername } = eventData;

      const isGroup = conversationId && conversationId.startsWith('conv-group-');
      let isAuthorized = false;
      if (isGroup) {
        const groupId = conversationId.replace(/^conv-/, '');
        const groupMembers = DataStore.getGroupMembers(groupId).map((m: any) =>
          typeof m === 'string' ? m.toLowerCase().trim() : (m.username || '').toLowerCase().trim()
        );
        isAuthorized = groupMembers.includes(currentUsername) || currentUsername === 'shashwath71845';
      } else if (conversationId && conversationId.includes('__')) {
        const participants = conversationId.split('__').map((p: string) => p.trim().toLowerCase());
        isAuthorized = participants.includes(currentUsername) || currentUsername === 'shashwath71845';
      }

      if (!isAuthorized) return;

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
          const isMuted = DataStore.isConversationMuted(conversationId);
          // Trigger system notification if user is in background or viewing a different conversation (and not muted)
          const isDocHidden = typeof document !== 'undefined' && document.hidden;
          if (!isMuted && (!isCurrentlyViewingThis || isDocHidden)) {
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
        const now = Date.now();
        const DAY_MS = 24 * 60 * 60 * 1000;
        setChatMessages((prev) => {
          const currentList = getListForConv(prev, conversationId, matchingRawId);
          const remaining = currentList.filter((m) => {
            if (m.is_vanish_mode_message || m.isVanishMode) {
              const ts = m.createdAt ? new Date(m.createdAt).getTime() : (m.timestamp || 0);
              if (ts && now - ts > DAY_MS) return false;
            }
            return true;
          });
          return {
            ...prev,
            [conversationId]: remaining,
            ...(matchingRawId ? { [matchingRawId]: remaining } : {}),
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
    if (!activeConversation || !currentUsername) return;
    if (activeConversation.inboxTier === 'REQUESTS') return;

    const canonicalId = getCanonicalConvId(activeConversation);
    DataStore.markMessagesAsRead(canonicalId, currentUsername);

    // If read receipts enabled and document visible, broadcast 'read' receipt and sync to DB
    if (readReceiptsEnabled && typeof document !== 'undefined' && document.visibilityState === 'visible') {
      const timer = setTimeout(() => {
        sendReceipt('read');
        fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: canonicalId,
            readerUsername: currentUsername,
            action: 'mark_read',
          }),
        }).catch(() => {});
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [activeConversation, currentUsername, readReceiptsEnabled, sendReceipt]);

  // When returning from background/tab switch, mark any new incoming messages read if chat is still open
  useEffect(() => {
    const handleVisibilityReceipt = () => {
      if (document.visibilityState === 'visible' && activeConversation && currentUsername && readReceiptsEnabled) {
        const canonicalId = getCanonicalConvId(activeConversation);
        sendReceipt('read');
        fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: canonicalId,
            readerUsername: currentUsername,
            action: 'mark_read',
          }),
        }).catch(() => {});
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityReceipt);
    return () => window.removeEventListener('visibilitychange', handleVisibilityReceipt);
  }, [activeConversation, currentUsername, readReceiptsEnabled, sendReceipt]);

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

    if (viewParam === 'requests') {
      setActiveChip('requests');
    } else if (viewParam === 'groups') {
      setActiveChip('groups');
    } else if (viewParam === 'games' || viewParam === 'cricket') {
      setIsGameDrawerOpen(true);
    } else if (viewParam === 'leaderboard') {
      setLeaderboardDefaultTab('leaderboard');
      setIsLeaderboardModalOpen(true);
    }

    if (searchParams.get('game') === '2048' || searchParams.get('solo') === '2048') {
      setIsSolo2048ModalOpen(true);
    } else {
      const activeGid = searchParams.get('gameId');
      if (activeGid) {
        if (searchParams.get('game') === 'connect4') {
          setActiveConnect4GameId(activeGid);
          setIsConnect4ModalOpen(true);
        } else {
          setActiveGameId(activeGid);
          setIsGameModalOpen(true);
        }
      }
      const c4Gid = searchParams.get('connect4GameId');
      if (c4Gid) {
        setActiveConnect4GameId(c4Gid);
        setIsConnect4ModalOpen(true);
      }
    }
  }, [stateParam, viewParam, searchParams]);

  // Automatically open direct chat when navigated from a user's profile with ?user=...
  const handledUserParamRef = useRef<string | null>(null);
  useEffect(() => {
    if (!userParam) {
      handledUserParamRef.current = null;
      return;
    }
    const targetUser = userParam.toLowerCase().trim();
    if (!targetUser || (currentUsername && targetUser === currentUsername)) return;
    if (handledUserParamRef.current === targetUser) return;
    handledUserParamRef.current = targetUser;

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
        } catch {}
        return updated;
      } else {
        const newConv: ConversationItem = {
          id: `conv-${targetUser}`,
          name: displayName,
          username: targetUser,
          studentClass: displayClass,
          lastMessage: 'Started new conversation',
          timeAgo: 'Just now',
          lastMessageTimestamp: Date.now(),
          isUnread: false,
          unreadCount: 0,
        };
        setActiveConversation(newConv);
        const updated = [newConv, ...prev];
        try {
          if (currentUsername) {
            localStorage.setItem(`dpsbuzz_chat_conversations_${currentUsername}_v3`, JSON.stringify(updated));
          }
        } catch {}
        return updated;
      }
    });
  }, [userParam, currentUsername]);

  // Automatically open group chat when navigated with ?conv=conv-group-... or ?group=...
  const handledConvParamRef = useRef<string | null>(null);
  useEffect(() => {
    const targetConvId = convParam || (groupParam ? `conv-${groupParam}` : null);
    if (!targetConvId) {
      handledConvParamRef.current = null;
      return;
    }
    if (handledConvParamRef.current === targetConvId) return;
    handledConvParamRef.current = targetConvId;

    const groupId = targetConvId.replace(/^conv-/, '');
    const group = DataStore.getGroups().find((g) => g.id === groupId);

    setConversations((prev) => {
      const existing = prev.find((c) => c.id === targetConvId);
      if (existing) {
        openConversation(existing);
        return prev;
      }
      if (group) {
        const initials = group.name.slice(0, 2).toUpperCase() || 'GP';
        const groupConv: ConversationItem = {
          id: targetConvId,
          name: group.name,
          username: group.name.toLowerCase().replace(/\s+/g, '_'),
          isGroup: true,
          groupInitials: initials,
          lastMessage: 'Group chat',
          timeAgo: 'Just now',
          lastMessageTimestamp: Date.now(),
          isUnread: false,
          unreadCount: 0,
        };
        openConversation(groupConv);
        return [groupConv, ...prev.filter((c) => c.id !== targetConvId)];
      }
      return prev;
    });
  }, [convParam, groupParam]);

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
                    const now = Date.now();
                    const DAY_MS = 24 * 60 * 60 * 1000;

                    const preserved = current.filter((m) => {
                      if (!m || !m.id || syncTombstoned.has(m.id)) return false;
                      if (m.is_vanish_mode_message || m.isVanishMode) {
                        const ts = m.createdAt ? new Date(m.createdAt).getTime() : (m.timestamp || 0);
                        if (ts && now - ts > DAY_MS) return false;
                      }
                      return true;
                    });

                    const msgMap = new Map<string, ChatMessage>(preserved.map((m: any) => [m.id, m]));
                    let listChanged = false;

                    for (const sMsg of serverCleanList) {
                      if (syncTombstoned.has(sMsg.id)) continue;
                      if (sMsg.is_vanish_mode_message || sMsg.isVanishMode) {
                        const ts = sMsg.createdAt ? new Date(sMsg.createdAt).getTime() : (sMsg.timestamp || 0);
                        if (ts && now - ts > DAY_MS) continue;
                      }
                      const local = msgMap.get(sMsg.id);
                      if (!local) {
                        msgMap.set(sMsg.id, { ...sMsg, isDelivered: true });
                        listChanged = true;
                      } else if (
                        Boolean(local.is_read) !== Boolean(sMsg.is_read) ||
                        Boolean(local.isSeen) !== Boolean(sMsg.isSeen) ||
                        Boolean(local.isDelivered) !== Boolean(sMsg.isDelivered) ||
                        local.reaction !== sMsg.reaction
                      ) {
                        msgMap.set(sMsg.id, { ...local, ...sMsg, isDelivered: true });
                        listChanged = true;
                      }
                    }
                    if (listChanged || msgMap.size !== current.length) {
                      const updatedList = Array.from(msgMap.values()).sort((a, b) => {
                        const ta = a.createdAt ? new Date(a.createdAt).getTime() : (a.timestamp || 0);
                        const tb = b.createdAt ? new Date(b.createdAt).getTime() : (b.timestamp || 0);
                        return ta - tb;
                      });
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
    // Gentle 30s fallback poll when tab is visible
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchLatestSync();
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
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
        } else if (
          key.startsWith('conv-group-') ||
          key.startsWith('group-') ||
          key.includes('class-') ||
          key.includes('house-') ||
          key.includes('club-')
        ) {
          isGroupConv = true;
        }

        if (isGroupConv) {
          const groupId = key.replace(/^conv-/, '');
          if (groupId.startsWith('group-') || key.startsWith('conv-group-')) {
            const isMember = DataStore.isGroupMember(groupId, currentUsername);
            const isInvited = Boolean(DataStore.hasPendingGroupInvite(groupId, currentUsername));
            if (!isAdminUser && !isMember && !isInvited) {
              const convIdx = updated.findIndex((c) => c.id === key);
              if (convIdx >= 0) {
                updated.splice(convIdx, 1);
                changed = true;
              }
              continue;
            }
          }

          const lastTs = lastMsg.createdAt ? new Date(lastMsg.createdAt).getTime() : (lastMsg.timestamp || 0);
          const convIdx = updated.findIndex((c) => c.id === key);
          if (convIdx >= 0) {
            const existing = updated[convIdx];
            if (
              existing.lastMessage !== lastMsg.text ||
              existing.timeAgo !== (lastMsg.time || 'Just now') ||
              existing.lastMessageTimestamp !== lastTs
            ) {
              updated[convIdx] = {
                ...existing,
                lastMessage: lastMsg.text,
                timeAgo: lastMsg.time || 'Just now',
                lastMessageTimestamp: lastTs,
              };
              changed = true;
            }
          } else {
            const group = DataStore.getGroups().find((g) => g.id === groupId);
            const groupName = group?.name || (key.includes('8a') ? 'Class 8-A Group' : 'Group Chat');
            const initials = groupName.slice(0, 2).toUpperCase() || 'GP';
            updated.push({
              id: key,
              name: groupName,
              username: groupName.toLowerCase().replace(/\s+/g, '_'),
              studentClass: group?.class ? `Class ${group.class}-${group.section || 'A'}` : 'Class Group',
              isGroup: true,
              type: 'group',
              groupInitials: initials,
              lastMessage: lastMsg.text,
              timeAgo: lastMsg.time || 'Just now',
              lastMessageTimestamp: lastTs,
              isUnread: false,
              unreadCount: 0,
            });
            changed = true;
          }
        } else if (targetUser && targetUser !== currentUsername) {
          const isMe = lastMsg.senderUsername
            ? lastMsg.senderUsername.toLowerCase() === currentUsername
            : lastMsg.sender === 'me';

          let msgPreview = isMe ? `You: ${lastMsg.text}` : lastMsg.text;
          if (lastMsg.sharedPost) {
            const hasCustomText = lastMsg.text && !lastMsg.text.startsWith('Shared @') && lastMsg.text !== 'Shared a post 📸';
            if (hasCustomText) {
              msgPreview = isMe ? `You: ${lastMsg.text}` : `${lastMsg.senderName || targetUser}: ${lastMsg.text}`;
            } else {
              msgPreview = isMe ? 'You shared a post 📸' : `${lastMsg.senderName || targetUser} shared a post 📸`;
            }
          }
          const storyMatch = lastMsg.text.match(/^(?:You replied to their story|Replied to their story|Replied to your story|Replied to story):\s*["']?([\s\S]*?)["']?\s*(?:💬)?$/i);
          if (storyMatch) {
            const rawContent = storyMatch[1].replace(/^["']|["']$/g, '').trim();
            msgPreview = isMe
              ? `You replied to their story: "${rawContent}" 💬`
              : `Replied to your story: "${rawContent}" 💬`;
          }

          const lastTs = lastMsg.createdAt ? new Date(lastMsg.createdAt).getTime() : (lastMsg.timestamp || 0);
          const convIdx = updated.findIndex((c) => (c.username || '').toLowerCase() === targetUser);

          if (convIdx >= 0) {
            const existing = updated[convIdx];
            if (
              existing.lastMessage !== msgPreview ||
              existing.timeAgo !== (lastMsg.time || 'Just now') ||
              existing.lastMessageTimestamp !== lastTs
            ) {
              updated[convIdx] = {
                ...existing,
                lastMessage: msgPreview,
                timeAgo: lastMsg.time || 'Just now',
                lastMessageTimestamp: lastTs,
                isUnread: activeConversation?.username?.toLowerCase() === targetUser ? false : (!isMe || existing.isUnread),
              };
              changed = true;
            }
          } else {
            const prof = allProfiles.find((p) => (p.username || '').toLowerCase() === targetUser);
            updated.push({
              id: `conv-${targetUser}`,
              name: prof ? prof.fullName : targetUser,
              username: targetUser,
              studentClass: prof ? `Class ${prof.class}-${prof.section || 'A'}` : 'Student',
              avatar: prof?.avatar || null,
              lastMessage: msgPreview,
              timeAgo: lastMsg.time || 'Just now',
              lastMessageTimestamp: lastTs,
              isUnread: !isMe,
            });
            changed = true;
          }
        }
      }

      if (changed) {
        const seen = new Set<string>();
        const deduped: ConversationItem[] = [];
        for (const c of updated) {
          if (!c || !c.id) continue;
          if (!seen.has(c.id)) {
            seen.add(c.id);
            deduped.push(c);
          }
        }
        return deduped;
      }
      return prev;
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
      const isGroup = Boolean(
        c.isGroup ||
        c.type === 'group' ||
        c.id.startsWith('conv-group-') ||
        c.id.startsWith('group-') ||
        c.id.includes('class-') ||
        c.id.includes('house-') ||
        c.id.includes('club-')
      );
      if (isGroup) {
        if (isAdminUser) return true;
        const groupId = c.id.replace(/^conv-/, '');
        if (groupId.startsWith('group-') || c.id.startsWith('conv-group-')) {
          const isMember = DataStore.isGroupMember(groupId, currentUsername);
          const isInvited = Boolean(DataStore.hasPendingGroupInvite(groupId, currentUsername));
          return isMember || isInvited;
        }
        return true;
      }
      const target = (c.username || c.id.replace(/^conv-/, '')).toLowerCase().trim();
      if (!target || target === currentUsername) return false;
      if (DataStore.isBlocked(currentUsername, target)) return false;

      // Message Requests Filtering: In requests chip, show requests only. In all/primary, show all school chats.
      if (activeChip === 'requests') {
        const tier = c.inboxTier || DataStore.getInboxTier(currentUsername, target);
        if (tier !== 'REQUESTS') {
          return false;
        }
      }

      return true;
    });

    if (activeChip === 'groups') {
      list = list.filter((c) =>
        c.isGroup ||
        c.type === 'group' ||
        c.id.startsWith('conv-group-') ||
        c.id.startsWith('group-') ||
        c.id.includes('class-') ||
        c.id.includes('house-') ||
        c.id.includes('club-')
      );
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

    // Helper to get true latest activity timestamp for any conversation
    const getConvLastTimestamp = (c: ConversationItem): number => {
      const canonicalId = getCanonicalConvId(c);
      const msgs = getListForConv(chatMessages, canonicalId, c.id);
      let latestFromMsgs = 0;
      if (msgs && msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        latestFromMsgs = last.timestamp || (last.createdAt ? new Date(last.createdAt).getTime() : 0);
      }
      return Math.max(c.lastMessageTimestamp || 0, latestFromMsgs, (c as any).timestamp || 0);
    };

    // Enrich conversation items with accurate live preview & local formatted time
    const enrichedList = list.map((c) => {
      const ts = getConvLastTimestamp(c);
      const canonicalId = getCanonicalConvId(c);
      const msgs = getListForConv(chatMessages, canonicalId, c.id);
      let latestPreview = c.lastMessage;
      let isUnread = Boolean(c.isUnread);
      if (msgs && msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        const isMe = (last.senderUsername || '').toLowerCase() === currentUsername || last.sender === 'me';
        const txt = last.text || (last.sharedPost ? 'Shared a post 📸' : (last.isChatPhoto ? 'Sent a photo 📸' : 'New message'));
        latestPreview = isMe ? `You: ${txt}` : txt;
        if (!isMe && !last.is_read && !last.isSeen && !last.readAt) {
          isUnread = true;
        }
      }
      return {
        ...c,
        lastMessage: latestPreview || c.lastMessage || 'Say hi to your classmate',
        lastMessageTimestamp: ts,
        timeAgo: formatConversationTimeAgo(ts, c.timeAgo),
        isUnread,
      };
    });

    // Deterministic sorting:
    // 1. Pinned conversations always first
    // 2. LATEST message timestamp FIRST (newest conversation is top of inbox)
    // 3. Alphabetical fallback by name
    enrichedList.sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      const timeA = a.lastMessageTimestamp || 0;
      const timeB = b.lastMessageTimestamp || 0;
      if (timeA !== timeB) {
        return timeB - timeA; // Latest is FIRST!
      }
      return a.name.localeCompare(b.name);
    });

    return enrichedList;
  }, [conversations, chatMessages, activeChip, searchQuery, demoState, currentUsername]);

  // Separate pinned, today, earlier
  const { pinnedList, todayList, earlierList } = useMemo(() => {
    const pinned: ConversationItem[] = [];
    const today: ConversationItem[] = [];
    const earlier: ConversationItem[] = [];
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    filteredConversations.forEach((conv) => {
      if (conv.isPinned) {
        pinned.push(conv);
      } else {
        const ts = conv.lastMessageTimestamp || 0;
        if (ts > 0) {
          if (now - ts < ONE_DAY_MS) {
            today.push(conv);
          } else {
            earlier.push(conv);
          }
        } else {
          // If no timestamp yet, place in today so it's immediately accessible
          today.push(conv);
        }
      }
    });

    return { pinnedList: pinned, todayList: today, earlierList: earlier };
  }, [filteredConversations]);

  const handleMuteToggle = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextMuted = !c.isMuted;
          DataStore.setConversationMuted(id, nextMuted);
          return { ...c, isMuted: nextMuted };
        }
        return c;
      })
    );
  }, []);

  const handlePinToggle = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  }, []);

  const handleDeleteConfirm = () => {
    if (!deleteConfirmConv) return;
    setConversations((prev) => prev.filter((c) => c.id !== deleteConfirmConv.id));
    setDeleteConfirmConv(null);
  };

  const openConversation = useCallback((conv: ConversationItem) => {
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
      } catch {}
      return updated;
    });
  }, [currentUsername]);

  const handleOpenConversation = useCallback((conv?: ConversationItem) => {
    if (conv) openConversation(conv);
  }, [openConversation]);

  const handleLongPress = useCallback((c: ConversationItem) => {
    setLongPressConv(c);
  }, []);

  const handleRequestDeleteConfirm = useCallback((c: ConversationItem) => {
    setDeleteConfirmConv(c);
  }, []);

  const handleOpenGroupInfo = useCallback(() => {
    setIsGroupInfoOpen(true);
  }, []);

  const handleViewProfile = useCallback((user: string) => {
    router.push(`/u/${user}`);
  }, [router]);

  const handleAddGroupMembers = useCallback(() => {
    setIsAddGroupMembersOpen(true);
  }, []);

  const handleOpenBgSelector = useCallback(() => {
    setIsBgSelectorOpen(true);
  }, []);

  const handleOpenOptions = useCallback((conv: ConversationItem) => {
    setLongPressConv(conv);
  }, []);

  const handleStartNewChat = (student: StudentContact) => {
    setIsNewChatOpen(false);
    const existing = conversations.find((c) => c.username?.toLowerCase() === student.username?.toLowerCase());
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
      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id && c.username?.toLowerCase() !== student.username?.toLowerCase())]);
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

      const now = Date.now();
      const newMsg: ChatMessage = {
        id: `msg-${now}-${Math.random().toString(36).substring(2, 6)}`,
        text: formattedText,
        sender: 'me',
        senderUsername: currentUsername,
        time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(now)),
        createdAt: new Date(now).toISOString(),
        timestamp: now,
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
    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);
    const targetUser = (activeConversation.username || activeConversation.id.replace(/^conv-/, '')).toLowerCase().trim();
    const nextVal = !isVanishMode;
    setIsVanishMode(nextVal);
    DataStore.setVanishMode(canonicalId, nextVal);

    // Broadcast in-chat handshake system message so both users know vanish mode changed
    const now = Date.now();
    const senderDisplay = currentUsername ? `@${currentUsername}` : 'You';
    const systemNoticeText = nextVal
      ? `${senderDisplay} turned on vanish mode. Seen messages disappear when the chat is closed.`
      : `${senderDisplay} turned off vanish mode.`;

    const systemMsg: ChatMessage = {
      id: `vanish-sys-${now}-${uuidv4()}`,
      client_id: `vanish-sys-${now}`,
      status: 'sent',
      text: systemNoticeText,
      sender: 'them',
      senderUsername: 'system',
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(now)),
      createdAt: new Date(now).toISOString(),
      timestamp: now,
      isDelivered: true,
      is_read: true,
      isSeen: true,
    };

    setChatMessages((prev) => {
      const currentList = getListForConv(prev, canonicalId, rawId);
      const updated = [...currentList, systemMsg];
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

    if (targetUser) {
      try {
        const targetMsgKey = `dpsbuzz_chat_messages_${targetUser}_v3`;
        const recipientMsgs = JSON.parse(localStorage.getItem(targetMsgKey) || '{}');
        const rConvId = `conv-${currentUsername}`;
        const rList = recipientMsgs[canonicalId] || recipientMsgs[rConvId] || [];
        const nextRList = [...rList, systemMsg];
        recipientMsgs[canonicalId] = nextRList;
        recipientMsgs[rConvId] = nextRList;
        localStorage.setItem(targetMsgKey, JSON.stringify(recipientMsgs));
      } catch {}
    }

    DataStore.broadcastChatEvent({
      type: 'MESSAGE_SENT',
      conversationId: canonicalId,
      message: systemMsg,
      senderUsername: currentUsername,
      recipientUsername: targetUser,
    });

    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: canonicalId,
        senderUsername: currentUsername,
        message: systemMsg,
      }),
    }).catch(() => {});
  };

  // Vanish Mode Pull-Up Touch & Drag Handlers (Instagram Style)
  const handleVanishTouchStart = (clientY: number) => {
    if (!activeConversation || activeConversation.isGroup) return;
    vanishTouchStartYRef.current = clientY;
    vanishIsDraggingRef.current = true;
    setIsVanishPulling(true);
  };

  const handleVanishTouchMove = (clientY: number) => {
    if (!vanishIsDraggingRef.current || vanishTouchStartYRef.current === null) return;
    const deltaY = vanishTouchStartYRef.current - clientY;
    if (deltaY > 0) {
      const clamped = Math.min(deltaY * 0.9, 90);
      setVanishPullDistance(clamped);
    } else {
      setVanishPullDistance(0);
    }
  };

  const handleVanishTouchEnd = () => {
    if (!vanishIsDraggingRef.current) return;
    vanishIsDraggingRef.current = false;
    setIsVanishPulling(false);
    vanishTouchStartYRef.current = null;

    if (vanishPullDistance >= 45) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(40); } catch {}
      }
      handleToggleVanishMode();
    }
    setVanishPullDistance(0);
  };

  // Messages container touch drag when scrolled to bottom
  const handleMessagesTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = messagesContainerRef.current;
    if (!el || !activeConversation || activeConversation.isGroup) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 20;
    if (isAtBottom) {
      vanishTouchStartYRef.current = e.touches[0].clientY;
      vanishIsDraggingRef.current = true;
    }
  };

  const handleMessagesTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!vanishIsDraggingRef.current || vanishTouchStartYRef.current === null) return;
    const deltaY = vanishTouchStartYRef.current - e.touches[0].clientY;
    if (deltaY > 5) {
      setIsVanishPulling(true);
      const clamped = Math.min(deltaY * 0.85, 90);
      setVanishPullDistance(clamped);
    }
  };

  // Global mousemove/mouseup listener for smooth drag on desktop
  useEffect(() => {
    if (!isVanishPulling) return;
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!vanishIsDraggingRef.current || vanishTouchStartYRef.current === null) return;
      const deltaY = vanishTouchStartYRef.current - e.clientY;
      if (deltaY > 0) {
        setVanishPullDistance(Math.min(deltaY * 0.9, 90));
      } else {
        setVanishPullDistance(0);
      }
    };
    const handleWindowMouseUp = () => {
      handleVanishTouchEnd();
    };
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isVanishPulling, vanishPullDistance]);

  const handleCloseActiveChat = useCallback(() => {
    setActiveConversation(null);
    setIsGameDrawerOpen(false);
  }, []);

  const handleComposeClick = useCallback(() => {
    setIsNewChatOpen(true);
  }, []);

  const handleCreateGroupClick = useCallback(() => {
    setIsCreateGroupOpen(true);
  }, []);

  const handleOpenGamesClick = useCallback(() => {
    setIsGameDrawerOpen(true);
  }, []);

  const handleSelectChip = useCallback((chip: 'all' | 'groups' | 'requests') => {
    setActiveChip(chip);
  }, []);

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
  const prevLastMsgIdRef = useRef<string>('');

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

  // 1. Initial scroll when opening or switching active conversation: scroll instantly without animation
  const activeConvId = activeConversation?.id || null;
  useEffect(() => {
    if (activeConvId) {
      const rawId = activeConvId;
      const canonicalId = activeConversation ? getCanonicalConvId(activeConversation) : activeConvId;
      const initialMsgs = chatMessages[rawId] || chatMessages[canonicalId] || [];
      prevMsgCountRef.current = initialMsgs.length;
      prevLastMsgIdRef.current = initialMsgs[initialMsgs.length - 1]?.id || '';

      const timer = setTimeout(() => scrollToBottom(false), 40);
      return () => clearTimeout(timer);
    } else {
      prevMsgCountRef.current = 0;
      prevLastMsgIdRef.current = '';
    }
  }, [activeConvId]);

  // 2. Auto-scroll ONLY when message count in current active conversation increases or a new message arrives
  const currentActiveConvMsgs = useMemo(() => {
    if (!activeConversation) return [];
    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);
    return chatMessages[rawId] || chatMessages[canonicalId] || [];
  }, [chatMessages, activeConversation]);

  const activeMsgCount = currentActiveConvMsgs.length;
  const lastActiveMsg = currentActiveConvMsgs[activeMsgCount - 1];
  const lastActiveMsgId = lastActiveMsg?.id || '';
  const lastActiveMsgSender = lastActiveMsg?.sender;
  const lastActiveMsgSenderUsername = lastActiveMsg?.senderUsername;

  useEffect(() => {
    if (!activeConvId || activeMsgCount === 0) return;

    // Check if a genuinely new message arrived
    if (activeMsgCount > prevMsgCountRef.current || (lastActiveMsgId && lastActiveMsgId !== prevLastMsgIdRef.current)) {
      const isSentByMe =
        lastActiveMsgSender === 'me' ||
        (lastActiveMsgSenderUsername && lastActiveMsgSenderUsername.toLowerCase() === currentUsername);

      if (isSentByMe || isNearBottom()) {
        scrollToBottom(true);
      }
    }

    prevMsgCountRef.current = activeMsgCount;
    prevLastMsgIdRef.current = lastActiveMsgId;
  }, [activeMsgCount, lastActiveMsgId, activeConvId, currentUsername]);

  const handleSendHeart = () => {
    if (isMaintenanceActive) {
      alert('Chat messaging is disabled during scheduled maintenance.');
      return;
    }
    if (!activeConversation) return;

    const now = Date.now();
    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);
    const targetUser = (activeConversation.username || activeConversation.id.replace(/^conv-/, '')).toLowerCase().trim();

    const newMsg: ChatMessage = {
      id: `msg-${now}-${Math.random().toString(36).substring(2, 6)}`,
      text: '❤️',
      sender: 'me',
      senderUsername: currentUsername,
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(now)),
      createdAt: new Date(now).toISOString(),
      timestamp: now,
      status: 'sent',
      isDelivered: true,
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

    // Update recipient local storage for single-browser multi-account testing
    if (!activeConversation.isGroup && targetUser) {
      try {
        const targetConvKey = `dpsbuzz_chat_conversations_${targetUser}_v3`;
        const targetMsgKey = `dpsbuzz_chat_messages_${targetUser}_v3`;
        const recipientConv = JSON.parse(localStorage.getItem(targetConvKey) || '[]');
        const recipientMsgs = JSON.parse(localStorage.getItem(targetMsgKey) || '{}');
        const rConvId = `conv-${currentUsername}`;
        const rList = recipientMsgs[canonicalId] || recipientMsgs[rConvId] || [];
        const rMsg: ChatMessage = { ...newMsg, sender: 'them' };
        if (!rList.some((m: any) => m.id === rMsg.id)) {
          const nextRList = [...rList, rMsg];
          recipientMsgs[canonicalId] = nextRList;
          recipientMsgs[rConvId] = nextRList;
          localStorage.setItem(targetMsgKey, JSON.stringify(recipientMsgs));
        }
        const rExistingIdx = recipientConv.findIndex(
          (c: any) => (c.username || '').toLowerCase() === currentUsername || c.id === rConvId || c.id === canonicalId
        );
        if (rExistingIdx >= 0) {
          recipientConv[rExistingIdx] = {
            ...recipientConv[rExistingIdx],
            lastMessage: '❤️',
            timeAgo: 'Just now',
            isUnread: true,
            unreadCount: (recipientConv[rExistingIdx].unreadCount || 0) + 1,
          };
          const [item] = recipientConv.splice(rExistingIdx, 1);
          recipientConv.unshift(item);
        }
        localStorage.setItem(targetConvKey, JSON.stringify(recipientConv));
      } catch {}
    }

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
    sendTypingStatus(false);
    if (isMaintenanceActive) {
      alert('Chat messaging is disabled during scheduled maintenance.');
      return;
    }
    if (!messageInput.trim() || !activeConversation) return;

    const now = Date.now();
    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);
    const targetUser = (activeConversation.username || activeConversation.id.replace(/^conv-/, '')).toLowerCase().trim();
    const sentText = messageInput.trim();
    const ephemeralTrackingId = uuidv4();

    // Auto-accept request when sending a reply so messaging flows seamlessly
    if (targetUser && DataStore.getInboxTier(currentUsername, targetUser) === 'REQUESTS') {
      DataStore.acceptMessageRequest(currentUsername, targetUser);
    }

    const newMsg: ChatMessage = {
      id: ephemeralTrackingId,
      client_id: ephemeralTrackingId,
      status: 'sent',
      text: sentText,
      sender: 'me',
      senderUsername: currentUsername,
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(now)),
      createdAt: new Date(now).toISOString(),
      timestamp: now,
      isDelivered: true,
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
    scrollToBottom(true);
    setTimeout(() => scrollToBottom(true), 60);
    setTimeout(() => scrollToBottom(true), 180);



    // Instant 0ms broadcast across all tabs and components
    DataStore.broadcastChatEvent({
      type: 'MESSAGE_SENT',
      conversationId: canonicalId,
      message: newMsg,
      senderUsername: currentUsername,
      recipientUsername: activeConversation.username,
    });

    // Dispatch to Supabase Realtime layer with client_id handshake
    sendSupabaseRealtimeMessage(sentText, ephemeralTrackingId);

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
              m.id === newMsg.id ? { ...m, isDelivered: true, status: 'sent' as const } : m
            );
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
        }
      })
      .catch((err) => console.warn('Failed to sync chat message:', err));
  };

  const handleSendGameChallenge = async (
    targetUserOverride?: { username: string; fullName?: string; avatar?: string | null; class?: string; section?: string }
  ) => {
    let targetUsername = targetUserOverride?.username;
    let targetName = targetUserOverride?.fullName;
    let targetAvatar = targetUserOverride?.avatar;

    if (!targetUsername) {
      if (!activeConversation || activeConversation.isGroup) {
        alert('Guess the Cricketer is a 1-on-1 multiplayer duel. Please open a direct chat with a classmate or select a player from the arena.');
        return;
      }
      targetUsername = getOpponentUsernameFromConv(activeConversation);
      targetName = activeConversation.name || targetUsername;
      targetAvatar = activeConversation.avatar || null;
    }

    if (!targetUsername) return;

    const cleanTarget = targetUsername.toLowerCase().trim();
    const cleanCurrent = (currentUsername || '').toLowerCase().trim();
    const canonicalId = [cleanCurrent, cleanTarget].sort().join('__');
    const rawId = activeConversation?.id || `conv-${cleanTarget}`;

    // Ensure conversation exists in state
    if (!activeConversation || (activeConversation.username || '').toLowerCase() !== cleanTarget) {
      const existing = conversations.find(
        (c) => (c.username || '').toLowerCase() === cleanTarget || c.id === `conv-${cleanTarget}`
      );
      if (existing) {
        setActiveConversation(existing);
      } else {
        const newConv: ConversationItem = {
          id: `conv-${cleanTarget}`,
          name: targetName || targetUsername,
          username: cleanTarget,
          avatar: targetAvatar || null,
          studentClass: targetUserOverride?.class ? `Class ${targetUserOverride.class}` : 'Student',
          lastMessage: `Challenged @${cleanTarget} to Guess the Cricketer! 🏏`,
          timeAgo: 'Just now',
          inboxTier: 'PRIMARY',
          isUnread: false,
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversation(newConv);
      }
    }

    try {
      const res = await fetch('/api/games/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          inviter: {
            username: currentUsername,
            fullName: currentUser?.fullName || currentUsername,
            avatar: currentUser?.avatar || null,
          },
          opponent: {
            username: cleanTarget,
            fullName: targetName || cleanTarget,
            avatar: targetAvatar || null,
          },
          chatId: canonicalId,
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        const gameId = data.session.gameId;
        const invitePayload: CricketGameInviteData = {
          gameId,
          gameType: 'cricket',
          inviterUsername: currentUsername,
          inviterName: currentUser?.fullName || currentUsername,
          opponentUsername: cleanTarget,
          opponentName: targetName || cleanTarget,
          status: 'waiting_invite',
        };

        const inviteText = `🎮 [CRICKET_GAME]:${JSON.stringify(invitePayload)}`;
        const now = Date.now();
        const ephemeralTrackingId = uuidv4();

        const newMsg: ChatMessage = {
          id: ephemeralTrackingId,
          client_id: ephemeralTrackingId,
          status: 'sent',
          text: inviteText,
          sender: 'me',
          senderUsername: currentUsername,
          gameInvite: invitePayload,
          time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(now)),
          createdAt: new Date(now).toISOString(),
          timestamp: now,
          isDelivered: true,
          is_read: false,
          isSeen: false,
        };

        setChatMessages((prev) => {
          const currentList = getListForConv(prev, canonicalId, rawId);
          const updated = [...currentList, newMsg];
          const nextMap = { ...prev, [rawId]: updated, [canonicalId]: updated };
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
              ? { ...c, lastMessage: `You challenged @${cleanTarget} to Guess the Cricketer! 🏏`, timeAgo: 'Just now' }
              : c
          )
        );

        // Instant broadcast
        DataStore.broadcastChatEvent({
          type: 'MESSAGE_SENT',
          conversationId: canonicalId,
          message: newMsg,
          senderUsername: currentUsername,
          recipientUsername: cleanTarget,
        });

        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel('dpsbuzz_cricket_realtime');
            bc.postMessage({ type: 'invite', gameId, inviter: currentUsername, opponent: cleanTarget });
            bc.close();
          }
        } catch {}

        // Supabase Realtime dispatch
        sendSupabaseRealtimeMessage(inviteText, ephemeralTrackingId);

        // Server API dispatch
        fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: canonicalId,
            senderUsername: currentUsername,
            message: newMsg,
          }),
        }).catch(() => {});

        setActiveGameId(gameId);
        setIsGameModalOpen(true);
      } else {
        alert(data.error || 'Failed to send challenge');
      }
    } catch {
      alert('Error initiating cricket challenge');
    }
  };

  const handleAcceptGame = async (gameId: string) => {
    // Apple-style optimistic open with 0ms perceived latency:
    setActiveGameId(gameId);
    setIsGameModalOpen(true);
    setChatMessages((prev) => {
      const next: Record<string, typeof prev[string]> = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].map((m) => {
          const isMatch = (m.gameInvite && m.gameInvite.gameId === gameId) || (m.text && m.text.includes(gameId));
          if (isMatch) {
            let invite = m.gameInvite;
            if (!invite && m.text?.startsWith('🎮 [CRICKET_GAME]:')) {
              try { invite = JSON.parse(m.text.replace('🎮 [CRICKET_GAME]:', '')); } catch {}
            }
            const updatedInvite = { ...(invite || {}), gameId, status: 'selecting' as const };
            return {
              ...m,
              gameInvite: updatedInvite as CricketGameInviteData,
              text: `🎮 [CRICKET_GAME]:${JSON.stringify(updatedInvite)}`,
            };
          }
          return m;
        });
      }
      return next;
    });

    try {
      const res = await fetch('/api/games/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          gameId,
          username: currentUsername,
        }),
      });
      const data = await res.json();
      if (data.success) {
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel('dpsbuzz_cricket_realtime');
            bc.postMessage({ type: 'update', gameId });
            bc.close();
          }
          window.dispatchEvent(new CustomEvent('dpsbuzz_cricket_update', { detail: { gameId } }));
        } catch {}
      } else {
        alert(data.error || 'Failed to accept game');
      }
    } catch {
      alert('Error accepting cricket match');
    }
  };

  const handleDeclineGame = async (gameId: string) => {
    // Apple-style optimistic decline in 0ms:
    setChatMessages((prev) => {
      const next: Record<string, typeof prev[string]> = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].map((m) => {
          const isMatch = (m.gameInvite && m.gameInvite.gameId === gameId) || (m.text && m.text.includes(gameId));
          if (isMatch) {
            let invite = m.gameInvite;
            if (!invite && m.text?.startsWith('🎮 [CRICKET_GAME]:')) {
              try { invite = JSON.parse(m.text.replace('🎮 [CRICKET_GAME]:', '')); } catch {}
            }
            const updatedInvite = { ...(invite || {}), gameId, status: 'declined' as const };
            return {
              ...m,
              gameInvite: updatedInvite as CricketGameInviteData,
              text: `🎮 [CRICKET_GAME]:${JSON.stringify(updatedInvite)}`,
            };
          }
          return m;
        });
      }
      return next;
    });

    try {
      await fetch('/api/games/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline',
          gameId,
          username: currentUsername,
        }),
      });
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('dpsbuzz_cricket_realtime');
          bc.postMessage({ type: 'update', gameId });
          bc.close();
        }
        window.dispatchEvent(new CustomEvent('dpsbuzz_cricket_update', { detail: { gameId } }));
      } catch {}
    } catch {}
  };

  const handleSendConnect4Challenge = async (
    isBot: boolean = false,
    targetUserOverride?: { username: string; fullName?: string; avatar?: string | null; class?: string; section?: string },
    difficulty: Connect4Difficulty = 'hard'
  ) => {
    let targetUsername = isBot ? 'buzzbot' : targetUserOverride?.username;
    let targetName = isBot ? 'BuzzBot 🤖' : targetUserOverride?.fullName;
    let targetAvatar = isBot ? null : targetUserOverride?.avatar;

    if (!isBot && !targetUsername) {
      if (!activeConversation || activeConversation.isGroup) {
        alert('Connect 4 is a 1-on-1 multiplayer duel. Please open a direct chat with a classmate, select a player from the arena, or play vs BuzzBot.');
        return;
      }
      targetUsername = getOpponentUsernameFromConv(activeConversation);
      targetName = activeConversation.name || targetUsername;
      targetAvatar = activeConversation.avatar || null;
    }

    if (!targetUsername) return;

    const cleanTarget = targetUsername.toLowerCase().trim();
    const cleanCurrent = (currentUsername || '').toLowerCase().trim();
    const canonicalId = isBot ? `conv-bot-${cleanCurrent}` : [cleanCurrent, cleanTarget].sort().join('__');
    const rawId = activeConversation?.id || (isBot ? `conv-bot-${cleanCurrent}` : `conv-${cleanTarget}`);

    // Ensure conversation exists in state if not bot
    if (!isBot) {
      if (!activeConversation || (activeConversation.username || '').toLowerCase() !== cleanTarget) {
        const existing = conversations.find(
          (c) => (c.username || '').toLowerCase() === cleanTarget || c.id === `conv-${cleanTarget}`
        );
        if (existing) {
          setActiveConversation(existing);
        } else {
          const newConv: ConversationItem = {
            id: `conv-${cleanTarget}`,
            name: targetName || targetUsername,
            username: cleanTarget,
            avatar: targetAvatar || null,
            studentClass: targetUserOverride?.class ? `Class ${targetUserOverride.class}` : 'Student',
            lastMessage: `Challenged @${cleanTarget} to Connect 4! 🔴🟡`,
            timeAgo: 'Just now',
            inboxTier: 'PRIMARY',
            isUnread: false,
          };
          setConversations((prev) => [newConv, ...prev]);
          setActiveConversation(newConv);
        }
      }
    }

    try {
      const res = await fetch('/api/games/connect4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          difficulty,
          inviter: {
            username: currentUsername,
            fullName: currentUser?.fullName || currentUsername,
            avatar: currentUser?.avatar || null,
          },
          opponent: {
            username: cleanTarget,
            fullName: isBot ? 'BuzzBot 🤖' : targetName || cleanTarget,
            avatar: isBot ? null : targetAvatar || null,
            isBot,
            difficulty,
          },
          chatId: canonicalId,
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        const gameId = data.session.gameId;
        const invitePayload: Connect4InviteData = {
          gameId,
          gameType: 'connect4',
          inviterUsername: currentUsername,
          inviterName: currentUser?.fullName || currentUsername,
          opponentUsername: cleanTarget,
          opponentName: isBot ? 'BuzzBot 🤖' : targetName || cleanTarget,
          status: isBot ? 'in_progress' : 'waiting_invite',
          botDifficulty: isBot ? difficulty : undefined,
        };

        if (!isBot) {
          const inviteText = `🔴 [CONNECT4_GAME]:${JSON.stringify(invitePayload)}`;
          const now = Date.now();
          const ephemeralTrackingId = uuidv4();

          const newMsg: ChatMessage = {
            id: ephemeralTrackingId,
            client_id: ephemeralTrackingId,
            status: 'sent',
            text: inviteText,
            sender: 'me',
            senderUsername: currentUsername,
            connect4Invite: invitePayload,
            time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(now)),
            createdAt: new Date(now).toISOString(),
            timestamp: now,
            isDelivered: true,
            is_read: false,
            isSeen: false,
          };

          setChatMessages((prev) => {
            const currentList = getListForConv(prev, canonicalId, rawId);
            const updated = [...currentList, newMsg];
            const nextMap = { ...prev, [rawId]: updated, [canonicalId]: updated };
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
                ? { ...c, lastMessage: `You challenged @${cleanTarget} to Connect 4! 🔴🟡`, timeAgo: 'Just now' }
                : c
            )
          );

          DataStore.broadcastChatEvent({
            type: 'MESSAGE_SENT',
            conversationId: canonicalId,
            message: newMsg,
            senderUsername: currentUsername,
            recipientUsername: cleanTarget,
          });

          try {
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
              const bc = new BroadcastChannel('dpsbuzz_connect4_realtime');
              bc.postMessage({ type: 'invite', gameId, inviter: currentUsername, opponent: cleanTarget });
              bc.close();
            }
          } catch {}

          sendSupabaseRealtimeMessage(inviteText, ephemeralTrackingId);

          fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId: canonicalId,
              senderUsername: currentUsername,
              message: newMsg,
            }),
          }).catch(() => {});
        }

        setActiveConnect4GameId(gameId);
        setIsConnect4ModalOpen(true);
      } else {
        alert(data.error || 'Failed to send Connect 4 challenge');
      }
    } catch {
      alert('Error initiating Connect 4 challenge');
    }
  };

  const handleAcceptConnect4Game = async (gameId: string) => {
    setActiveConnect4GameId(gameId);
    setIsConnect4ModalOpen(true);
    setChatMessages((prev) => {
      const next: Record<string, typeof prev[string]> = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].map((m) => {
          const isMatch = (m.connect4Invite && m.connect4Invite.gameId === gameId) || (m.text && m.text.includes(gameId));
          if (isMatch) {
            let invite = m.connect4Invite;
            if (!invite && m.text?.startsWith('🔴 [CONNECT4_GAME]:')) {
              try { invite = JSON.parse(m.text.replace('🔴 [CONNECT4_GAME]:', '')); } catch {}
            }
            const updatedInvite = { ...(invite || {}), gameId, status: 'in_progress' as const };
            return {
              ...m,
              connect4Invite: updatedInvite as Connect4InviteData,
              text: `🔴 [CONNECT4_GAME]:${JSON.stringify(updatedInvite)}`,
            };
          }
          return m;
        });
      }
      return next;
    });

    try {
      const res = await fetch('/api/games/connect4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          gameId,
          username: currentUsername,
        }),
      });
      const data = await res.json();
      if (data.success) {
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel('dpsbuzz_connect4_realtime');
            bc.postMessage({ type: 'update', gameId });
            bc.close();
          }
        } catch {}
      }
    } catch {}
  };

  const handleDeclineConnect4Game = async (gameId: string) => {
    setChatMessages((prev) => {
      const next: Record<string, typeof prev[string]> = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].map((m) => {
          const isMatch = (m.connect4Invite && m.connect4Invite.gameId === gameId) || (m.text && m.text.includes(gameId));
          if (isMatch) {
            let invite = m.connect4Invite;
            if (!invite && m.text?.startsWith('🔴 [CONNECT4_GAME]:')) {
              try { invite = JSON.parse(m.text.replace('🔴 [CONNECT4_GAME]:', '')); } catch {}
            }
            const updatedInvite = { ...(invite || {}), gameId, status: 'declined' as const };
            return {
              ...m,
              connect4Invite: updatedInvite as Connect4InviteData,
              text: `🔴 [CONNECT4_GAME]:${JSON.stringify(updatedInvite)}`,
            };
          }
          return m;
        });
      }
      return next;
    });

    try {
      await fetch('/api/games/connect4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline',
          gameId,
          username: currentUsername,
        }),
      });
    } catch {}
  };

  const handleImageAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid photo to send.');
      return;
    }

    const targetUser = (activeConversation.username || activeConversation.id.replace(/^conv-/, '')).toLowerCase().trim();
    if (!activeConversation.isGroup && targetUser) {
      const isBlocked = DataStore.isBlocked(targetUser, currentUsername);
      if (isBlocked) {
        alert('Unable to message this user.');
        if (chatMediaInputRef.current) chatMediaInputRef.current.value = '';
        return;
      }
    }

    // High performance client compression: resizes large photos to max 1000px, JPEG 75% (~40-60KB)
    const compressedDataUrl = await compressImageForChat(file, 1000, 0.75);
    if (!compressedDataUrl) {
      alert('Could not process photo. Please try a different image.');
      if (chatMediaInputRef.current) chatMediaInputRef.current.value = '';
      return;
    }

    // Attempt clean upload to server storage
    let finalImageUrl = compressedDataUrl;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'chats');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.url) {
          finalImageUrl = uploadData.url;
        }
      }
    } catch {
      // Gracefully continue with client compressed data URL
    }

    const now = Date.now();
    const rawId = activeConversation.id;
    const canonicalId = getCanonicalConvId(activeConversation);
    const newMsg: ChatMessage = {
      id: `msg-${now}-${Math.random().toString(36).substring(2, 6)}`,
      text: '📸 Photo',
      sender: 'me',
      senderUsername: currentUsername,
      time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(now)),
      createdAt: new Date(now).toISOString(),
      timestamp: now,
      status: 'sent',
      isDelivered: true,
      is_read: false,
      isSeen: false,
      isChatPhoto: true,
      photoExpiresAt: now + 10 * 24 * 60 * 60 * 1000,
      ...(isVanishMode ? { is_vanish_mode_message: true, isVanishMode: true } : {}),
      sharedPost: {
        id: `chat-photo-${now}`,
        username: currentUsername,
        imageUrl: finalImageUrl,
        caption: 'Chat photo',
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

    setConversations((prev) =>
      prev.map((c) =>
        c.id === rawId || c.id === canonicalId
          ? { ...c, lastMessage: `You: 📸 Photo`, timeAgo: 'Just now' }
          : c
      )
    );

    // Update recipient local storage for single-browser multi-account testing
    if (!activeConversation.isGroup && targetUser) {
      try {
        const targetConvKey = `dpsbuzz_chat_conversations_${targetUser}_v3`;
        const targetMsgKey = `dpsbuzz_chat_messages_${targetUser}_v3`;
        const recipientConv = JSON.parse(localStorage.getItem(targetConvKey) || '[]');
        const recipientMsgs = JSON.parse(localStorage.getItem(targetMsgKey) || '{}');
        const rConvId = `conv-${currentUsername}`;
        const rExistingIdx = recipientConv.findIndex(
          (c: any) => (c.username || '').toLowerCase() === currentUsername || c.id === rConvId || c.id === canonicalId
        );
        const meProfile = DataStore.getProfileByUsername(currentUsername);
        const senderName = meProfile ? meProfile.fullName : currentUsername;
        if (rExistingIdx >= 0) {
          recipientConv[rExistingIdx].lastMessage = `${senderName}: 📸 Photo`;
          recipientConv[rExistingIdx].timeAgo = 'Just now';
          recipientConv[rExistingIdx].isUnread = true;
          recipientConv[rExistingIdx].unreadCount = (recipientConv[rExistingIdx].unreadCount || 0) + 1;
        } else {
          recipientConv.unshift({
            id: rConvId,
            name: senderName,
            username: currentUsername,
            avatar: meProfile?.avatar || null,
            studentClass: meProfile?.class ? `${meProfile.class}-${meProfile.section || ''}` : 'Student',
            lastMessage: `${senderName}: 📸 Photo`,
            timeAgo: 'Just now',
            isUnread: true,
            unreadCount: 1,
          });
        }
        const recipientMsg = { ...newMsg, sender: 'other' as const };
        recipientMsgs[rConvId] = [...(recipientMsgs[rConvId] || []), recipientMsg];
        recipientMsgs[canonicalId] = [...(recipientMsgs[canonicalId] || []), recipientMsg];
        localStorage.setItem(targetConvKey, JSON.stringify(recipientConv));
        localStorage.setItem(targetMsgKey, JSON.stringify(recipientMsgs));
      } catch {}
    }

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
      .catch((err) => console.warn('Failed to sync chat photo:', err));

    setTimeout(() => scrollToBottom(true), 80);
    if (chatMediaInputRef.current) chatMediaInputRef.current.value = '';
  };

  useEffect(() => {
    if (activeConversation) {
      const isGroup = Boolean(
        activeConversation.isGroup ||
        activeConversation.type === 'group' ||
        activeConversation.id.startsWith('conv-group-') ||
        activeConversation.id.startsWith('group-') ||
        activeConversation.id.includes('class-') ||
        activeConversation.id.includes('house-') ||
        activeConversation.id.includes('club-')
      );
      const canonicalId = getCanonicalConvId(activeConversation);
      if (!isGroup && canonicalId.includes('__') && currentUsername) {
        const participants = canonicalId.split('__').map((p) => p.trim().toLowerCase());
        if (!participants.includes(currentUsername)) {
          setActiveConversation(null);
        }
      }
    }
  }, [activeConversation, currentUsername]);

  // ACTIVE CONVERSATION VIEW (Full screen on mobile, NO active now or last seen status)
  if (activeConversation) {
    const canonicalId = getCanonicalConvId(activeConversation);
    const isGroup = Boolean(
      activeConversation.isGroup ||
      activeConversation.type === 'group' ||
      activeConversation.id.startsWith('conv-group-') ||
      activeConversation.id.startsWith('group-') ||
      activeConversation.id.includes('class-') ||
      activeConversation.id.includes('house-') ||
      activeConversation.id.includes('club-')
    );

    // Strict Privacy Guard: If direct chat does not involve currentUsername, show access notice
    if (!isGroup && canonicalId.includes('__') && currentUsername) {
      const participants = canonicalId.split('__').map((p) => p.trim().toLowerCase());
      if (!participants.includes(currentUsername)) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center select-none bg-[var(--surface)]">
            <p className="text-sm text-[var(--text-muted)]">You do not have access to this conversation.</p>
            <button
              type="button"
              onClick={() => setActiveConversation(null)}
              className="mt-4 px-4 py-2 rounded-xl bg-[var(--surface-sunken)] text-sm font-semibold cursor-pointer text-[var(--text)]"
            >
              Back to Chats
            </button>
          </div>
        );
      }
    }

    const localMessages = getListForConv(chatMessages, canonicalId, activeConversation.id);

    // Reconcile and deduplicate with Supabase Realtime channel stream using client_id handshake
    const messages = (() => {
      if (!realtimeSupabaseMessages || realtimeSupabaseMessages.length === 0) {
        return localMessages;
      }
      const map = new Map<string, ChatMessage>();
      // 1. Seed with local state
      for (const m of localMessages) {
        const key = m.client_id || m.id;
        map.set(key, m);
      }
      // 2. Reconcile Supabase Realtime updates
      for (const rm of realtimeSupabaseMessages) {
        // STRICT PRIVACY ISOLATION: Never include a message from a different chat!
        if (rm.chat_id && rm.chat_id !== canonicalId && rm.chat_id !== activeConversation.id) {
          continue;
        }
        const isMe = rm.sender_id ? rm.sender_id.toLowerCase() === currentUsername : false;
        const formattedTime = rm.created_at
          ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(rm.created_at))
          : 'Now';

        // Match by client_id handshake or database record id
        const matchKey = (rm.client_id && map.has(rm.client_id))
          ? rm.client_id
          : (map.has(rm.id) ? rm.id : null);

        if (matchKey) {
          const existing = map.get(matchKey)!;
          const isRead = Boolean(rm.read_at || rm.is_read || existing.is_read || existing.isSeen || existing.readAt);
          const isDelivered = Boolean(rm.delivered_at || rm.isDelivered || isRead || rm.status === 'delivered' || rm.status === 'read');
          // Anti-Downgrade Guard: Never allow optimistic 'sending' to overwrite an already-sent message!
          const finalStatus = isRead
            ? 'read'
            : isDelivered
            ? 'delivered'
            : rm.status === 'error'
            ? 'error'
            : (existing.status === 'sent' || rm.status === 'sent')
            ? 'sent'
            : (rm.status || existing.status || 'sent');
          const mergedPreview = existing.sharedPost || (rm as any).post_preview || (rm as any).sharedPost || null;
          map.set(matchKey, {
            ...existing,
            id: rm.id,
            client_id: rm.client_id || existing.client_id,
            status: finalStatus,
            error_reason: rm.error_reason || existing.error_reason,
            isDelivered,
            is_read: isRead,
            isSeen: isRead,
            sharedPost: mergedPreview || undefined,
            message_type: (rm as any).message_type || existing.message_type,
            post_id: (rm as any).post_id || existing.post_id || mergedPreview?.id,
            post_preview: mergedPreview || existing.post_preview,
            isChatPhoto: existing.isChatPhoto || Boolean(mergedPreview?.id?.startsWith('chat-photo-') || mergedPreview?.caption === 'Chat photo'),
          });
        } else {
          const isRead = Boolean(rm.read_at || rm.is_read);
          const isDelivered = Boolean(rm.delivered_at || rm.isDelivered || isRead || rm.status === 'delivered' || rm.status === 'read');
          const previewObj = (rm as any).post_preview || (rm as any).sharedPost || ((rm as any).post_id ? { id: (rm as any).post_id, username: '', caption: '' } : undefined);
          const isChatPhoto = Boolean(previewObj?.id?.startsWith('chat-photo-') || previewObj?.caption === 'Chat photo' || previewObj?.caption === 'Shared a photo');
          const newMsgFromDb: ChatMessage = {
            id: rm.id,
            client_id: rm.client_id,
            text: rm.text,
            sender: isMe ? 'me' : 'them',
            senderUsername: rm.sender_id,
            time: formattedTime,
            createdAt: rm.created_at,
            status: isRead ? 'read' : isDelivered ? 'delivered' : (rm.status || 'sent'),
            error_reason: rm.error_reason,
            isDelivered,
            is_read: isRead,
            isSeen: isRead,
            sharedPost: previewObj,
            message_type: (rm as any).message_type || (previewObj ? 'post_share' : 'text'),
            post_id: (rm as any).post_id || previewObj?.id,
            post_preview: previewObj,
            isChatPhoto,
          };
          map.set(rm.client_id || rm.id, newMsgFromDb);
        }
      }
      return Array.from(map.values()).sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : (a.timestamp || 0);
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : (b.timestamp || 0);
        return ta - tb;
      });
    })();
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
    const activeUserProf = !activeConversation.isGroup && targetUser ? DataStore.getProfileByUsername(targetUser) : null;
    const effectiveActiveAvatar = activeUserProf?.avatar || activeConversation.avatar || null;

    return (
      <div className="fixed inset-0 z-50 h-dvh h-[100dvh] max-h-[100dvh] md:static md:z-auto md:h-[calc(100dvh-4.5rem)] md:max-h-[calc(100dvh-4.5rem)] flex flex-col overflow-hidden select-none bg-[var(--surface)] text-[var(--text)] font-sf-display font-semibold">
        {/* Memoized Active Chat Header (Zero re-render flickers on streaming messages) */}
        <ActiveChatHeader
          conversation={activeConversation}
          targetUser={targetUser}
          isSelfChat={isSelfChat}
          isVanishMode={isVanishMode}
          effectiveActiveAvatar={effectiveActiveAvatar}
          colors={colors}
          initials={initials}
          typingText={activeTypingText}
          onClose={handleCloseActiveChat}
          onOpenGroupInfo={handleOpenGroupInfo}
          onViewProfile={handleViewProfile}
          onAddGroupMembers={handleAddGroupMembers}
          onOpenBgSelector={handleOpenBgSelector}
          onToggleVanishMode={handleToggleVanishMode}
          onOpenOptions={handleOpenOptions}
        />

        {/* Offline Status Warning Banner */}
        {isOffline && (
          <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 select-none shrink-0">
            <span>📡</span>
            <span>No internet connection. Messages will send automatically when connected.</span>
          </div>
        )}

        {/* Messages Stream with dynamic persistent background */}
        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto relative font-sf-display overscroll-contain"
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
            messages.map((msg, idx) => {
              if (msg.senderUsername === 'system') {
                return (
                  <div key={`${msg.id || 'sys'}-${idx}`} className="w-full flex items-center justify-center my-2 select-none">
                    <span className="px-3.5 py-1 rounded-full text-[11px] font-medium bg-black/5 dark:bg-white/10 text-[var(--text-muted)] text-center max-w-[85%] leading-relaxed border border-black/5 dark:border-white/5 shadow-xs">
                      {msg.text}
                    </span>
                  </div>
                );
              }
              const isMe = msg.senderUsername
                ? msg.senderUsername.toLowerCase() === currentUsername
                : msg.sender === 'me';
              const showReactionBar = activeReactionMsgId === msg.id;

              return (
                <div
                  key={`${msg.id || 'msg'}-${idx}`}
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

                      {/* Forward / Share Message Action */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForwardingMessage(msg);
                          setActiveReactionMsgId(null);
                        }}
                        className="ml-1 pl-2 pr-2.5 py-0.5 border-l border-zinc-200 dark:border-zinc-700 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Share / Forward message"
                      >
                        <Share2 size={12} strokeWidth={2.4} />
                        <span>Share</span>
                      </button>

                      {/* Unsend Protocol (Instagram Architecture Section 5) */}
                      {isMe && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMessageInfo(msg);
                              setActiveReactionMsgId(null);
                            }}
                            className="ml-1 pl-1.5 pr-2 py-0.5 border-l border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Message Info (Delivery & Read receipts)"
                          >
                            <span>ℹ️ Info</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnsendMessage(msg.id);
                            }}
                            className="pl-1.5 pr-2 py-0.5 border-l border-zinc-200 dark:border-zinc-700 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Unsend for everyone"
                          >
                            <Trash2 size={12} />
                            <span>Unsend</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Multiplayer Game Invite Cards (Cricket or Connect 4) or Standard Message Bubble */}
                  {(() => {
                    let inviteData: CricketGameInviteData | null = msg.gameInvite || null;
                    if (!inviteData && msg.text?.startsWith('🎮 [CRICKET_GAME]:')) {
                      try {
                        inviteData = JSON.parse(msg.text.replace('🎮 [CRICKET_GAME]:', ''));
                      } catch {
                        inviteData = null;
                      }
                    }

                    if (inviteData) {
                      return (
                        <CricketGameInviteCard
                          invite={inviteData}
                          isMe={isMe}
                          currentUsername={currentUsername}
                          onAccept={handleAcceptGame}
                          onDecline={handleDeclineGame}
                          onOpenGame={(gid) => {
                            setActiveGameId(gid);
                            setIsGameModalOpen(true);
                          }}
                        />
                      );
                    }

                    let c4InviteData: Connect4InviteData | null = msg.connect4Invite || null;
                    if (!c4InviteData && msg.text?.startsWith('🔴 [CONNECT4_GAME]:')) {
                      try {
                        c4InviteData = JSON.parse(msg.text.replace('🔴 [CONNECT4_GAME]:', ''));
                      } catch {
                        c4InviteData = null;
                      }
                    }

                    if (c4InviteData) {
                      return (
                        <Connect4GameInviteCard
                          invite={c4InviteData}
                          isMe={isMe}
                          currentUsername={currentUsername}
                          onAccept={handleAcceptConnect4Game}
                          onDecline={handleDeclineConnect4Game}
                          onOpenGame={(gid) => {
                            setActiveConnect4GameId(gid);
                            setIsConnect4ModalOpen(true);
                          }}
                        />
                      );
                    }

                    const isVanishSystemMsg =
                      msg.senderUsername === 'system' ||
                      msg.text?.includes('turned on vanish mode') ||
                      msg.text?.includes('turned off vanish mode');

                    if (isVanishSystemMsg) {
                      return (
                        <div key={msg.id} className="w-full flex justify-center my-3 select-none">
                          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/25 text-cyan-600 dark:text-cyan-300 text-xs font-semibold backdrop-blur-xs text-center max-w-sm shadow-xs">
                            <Ghost size={14} className="shrink-0 text-cyan-400" />
                            <span>{msg.text}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        onClick={() => handleMessageClick(msg)}
                        className="relative cursor-pointer select-none max-w-[78%]"
                      >
                        {activeConversation.isGroup && !isMe && (() => {
                          const sUser = (msg.senderUsername || '').toLowerCase().trim();
                          const sProf = sUser ? DataStore.getProfileByUsername(sUser) : null;
                          const sName = sProf?.fullName || msg.senderName || sUser || 'Classmate';
                          const sPair = sUser ? getAvatarColorPair(sUser) : { bg: '#e0e7ff', text: '#3730a3' };
                          const sAvatar = sProf?.avatar || null;

                          return (
                            <div className="flex items-center gap-1.5 mb-1 ml-1 text-xs">
                              <div
                                className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center font-bold text-[9px] shrink-0"
                                style={{ backgroundColor: sPair.bg, color: sPair.text }}
                              >
                                {sAvatar ? (
                                  <img src={sAvatar} alt={sName} className="w-full h-full object-cover" />
                                ) : (
                                  sName.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <span className="font-bold text-[11px] text-[var(--primary)] truncate">
                                {sName}
                              </span>
                              {sUser && (
                                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                  @{sUser}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                    <div
                      className={`px-4 py-2.5 rounded-[var(--r-bubble,14px)] text-[15px] leading-[1.4] tracking-[-0.015em] font-semibold chat-bubble-text font-sf-display ${
                        isMe
                          ? isVanishMode || msg.is_vanish_mode_message || msg.isVanishMode
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-[5px] shadow-xs ring-1 ring-cyan-400/30'
                            : 'bg-[#007AFF] text-white rounded-br-[5px] shadow-xs'
                          : isVanishMode || msg.is_vanish_mode_message || msg.isVanishMode
                            ? 'bg-[#0B1526] text-cyan-100 border border-cyan-500/30 rounded-bl-[5px] shadow-xs'
                            : 'bg-[#FFFFFF] text-slate-900 border border-black/10 dark:border-white/15 rounded-bl-[5px] shadow-xs'
                      }`}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF UI Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                        fontWeight: 600,
                      }}
                    >
                      {(() => {
                        let shared = msg.sharedPost || msg.post_preview || null;
                        if (!shared && msg.post_id) {
                          const p = DataStore.getPostById(msg.post_id);
                          if (p) {
                            shared = {
                              id: p.id,
                              username: p.username,
                              fullName: p.fullName || p.username,
                              avatar: p.avatar || null,
                              imageUrl: p.imageUrl || (p.images && p.images[0]) || null,
                              videoUrl: p.videoUrl || null,
                              isVideo: Boolean(p.isVideo || p.videoUrl),
                              caption: p.caption || '',
                            };
                          }
                        }
                        if (!shared && msg.message_type === 'post_share' && msg.mediaUrl) {
                          shared = {
                            id: msg.post_id || 'post-shared',
                            username: 'DPS Buzz',
                            imageUrl: msg.mediaUrl,
                            caption: msg.text || '',
                          };
                        }
                        if (!shared) return null;

                        const isChatPhoto =
                          msg.isChatPhoto ||
                          (shared.id && (shared.id.startsWith('chat-photo-') || shared.id.startsWith('img-'))) ||
                          shared.caption === 'Chat photo' ||
                          shared.caption === 'Shared a photo';

                        const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
                        const msgTime =
                          msg.timestamp ||
                          (msg.createdAt ? new Date(msg.createdAt).getTime() : null) ||
                          (msg.id && msg.id.startsWith('msg-') ? parseInt(msg.id.split('-')[1]) : null);
                        const isExpired =
                          isChatPhoto &&
                          (msg.isPhotoExpired || !shared.imageUrl || (msgTime && Date.now() - msgTime > TEN_DAYS_MS));

                        if (isChatPhoto) {
                          if (isExpired) {
                            return (
                              <div
                                className={`mb-2 p-3 rounded-2xl border flex items-center gap-2.5 max-w-xs text-left ${
                                  isMe
                                    ? 'bg-black/30 border-white/15 text-white/80'
                                    : 'bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                                }`}
                              >
                                <span className="text-base select-none">⌛</span>
                                <div className="flex flex-col text-xs leading-tight">
                                  <span className="font-semibold">Photo expired</span>
                                  <span className="text-[10px] opacity-75">Chat photos are removed after 10 days</span>
                                </div>
                              </div>
                            );
                          }

                          // Active chat photo
                          const daysLeft = msgTime
                            ? Math.max(1, Math.ceil((msgTime + TEN_DAYS_MS - Date.now()) / (24 * 60 * 60 * 1000)))
                            : 10;

                          return (
                            <div className="mb-2 relative group overflow-hidden rounded-2xl max-w-xs">
                              {shared.imageUrl && (
                                <img
                                  src={shared.imageUrl}
                                  alt="Chat photo"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFullPhoto(shared.imageUrl || null);
                                  }}
                                  className="w-full max-h-64 object-cover rounded-2xl border border-black/10 dark:border-white/10 cursor-pointer hover:opacity-95 transition-opacity"
                                />
                              )}
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-medium text-white flex items-center gap-1 select-none pointer-events-none">
                                <span>⌛</span>
                                <span>{daysLeft}d left</span>
                              </div>
                            </div>
                          );
                        }

                        // Regular shared feed post (photo or video! permanent, never expires!)
                        const isVideo = Boolean(
                          shared.isVideo ||
                          shared.videoUrl ||
                          (shared.imageUrl && (shared.imageUrl.endsWith('.mp4') || shared.imageUrl.includes('/video/upload/')))
                        );
                        const mediaSrc = shared.videoUrl || shared.imageUrl;

                        return (
                          <div
                            className={`mb-2 p-3 rounded-2xl border overflow-hidden flex flex-col gap-2 max-w-xs text-left shadow-xs transition-transform active:scale-[0.99] ${
                              isMe
                                ? 'bg-black/30 border-white/20 text-white'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 text-xs font-bold">
                              <span className="flex items-center gap-1.5 truncate">
                                <span>{isVideo ? '🎥' : '📸'}</span>
                                <span className="truncate">@{shared.username}&apos;s {isVideo ? 'Video' : 'Post'}</span>
                              </span>
                              {isVideo && (
                                <span className="text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  Video
                                </span>
                              )}
                            </div>

                            {isVideo && mediaSrc ? (
                              <div className="relative w-full rounded-xl overflow-hidden bg-black/40 border border-black/10 aspect-video flex items-center justify-center group">
                                <video
                                  src={mediaSrc}
                                  className="w-full h-full object-cover rounded-xl"
                                  controls
                                  playsInline
                                  preload="metadata"
                                />
                              </div>
                            ) : mediaSrc ? (
                              <img
                                src={mediaSrc}
                                alt="Shared post"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFullPhoto(mediaSrc);
                                }}
                                className="w-full max-h-52 object-cover rounded-xl border border-black/5 cursor-pointer hover:opacity-95 transition-opacity"
                              />
                            ) : null}

                            {shared.caption && (
                              <p className="text-xs line-clamp-2 italic leading-relaxed opacity-90">
                                &ldquo;{shared.caption}&rdquo;
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1">
                              <Link
                                href={`/home#post-${shared.id}`}
                                className={`inline-flex items-center gap-1 text-[11px] font-bold underline transition-colors ${
                                  isMe ? 'text-blue-200 hover:text-white' : 'text-blue-600 hover:text-blue-700 dark:text-blue-400'
                                }`}
                              >
                                <span>View Post in Feed</span>
                                <span>→</span>
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setForwardingMessage(msg);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 transition-colors cursor-pointer"
                                title="Share / Forward this post"
                              >
                                <Share2 size={11} strokeWidth={2.2} />
                                <span>Share</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}

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
                                      receiverAvatar: effectiveActiveAvatar || activeConversation.avatar,
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
                        const hasSharedContent = Boolean(msg.sharedPost || msg.post_preview || msg.post_id || msg.message_type === 'post_share');
                        if (hasSharedContent) {
                          const isAutoGenerated =
                            !msg.text ||
                            msg.text.startsWith('Shared @') ||
                            msg.text === 'Shared a post 📸' ||
                            msg.text === 'Shared a video 🎥' ||
                            msg.text.trim() === '';
                          if (isAutoGenerated) return null;
                          return <span className="block pt-1 font-normal leading-relaxed">{msg.text}</span>;
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
                );
              })()}

                  {/* Message Time, Vanish Indicator, and Delivery Checkmarks */}
                  <div className="flex items-center gap-1 px-1 mt-1">
                    {(msg.is_vanish_mode_message || msg.isVanishMode) && (
                      <span title="Disappears when chat is closed" className="text-[10px] text-cyan-400 flex items-center select-none">
                        👻
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--text-muted)] tabular-nums font-medium">
                      {formatChatMessageTime(msg)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForwardingMessage(msg);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-zinc-400 hover:text-blue-400 cursor-pointer"
                      title="Share / Forward this message"
                      aria-label="Share message"
                    >
                      <Share2 size={11} />
                    </button>
                    {isMe && (
                      <span
                        className="inline-flex items-center shrink-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessageInfo(msg);
                        }}
                        title={
                          msg.status === 'error'
                            ? 'Failed to send - Tap to retry'
                            : msg.status === 'sending' || msg.isSending
                            ? 'Sending...'
                            : msg.status === 'read' || msg.is_read || msg.isSeen || msg.readAt
                            ? (readReceiptsEnabled ? 'Read (2 green ticks)' : 'Read (receipts off)')
                            : msg.status === 'delivered' || msg.isDelivered
                            ? 'Delivered (2 grey ticks)'
                            : 'Sent to server (1 grey tick)'
                        }
                      >
                        {msg.status === 'error' ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                retrySupabaseMessage(msg.id);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-400 cursor-pointer active:scale-95 transition-all"
                              title={msg.error_reason ? `Failed: ${msg.error_reason} — Tap to retry` : 'Failed to send — Tap to retry'}
                            >
                              <AlertCircle size={12} className="shrink-0" />
                              <span>Retry</span>
                            </button>
                            {msg.error_reason && (
                              <span className="text-[9px] text-rose-400/90 font-medium max-w-[120px] truncate" title={msg.error_reason}>
                                {msg.error_reason}
                              </span>
                            )}
                          </div>
                        ) : msg.status === 'sending' || msg.isSending ? (
                          <Clock size={12} className="text-zinc-400 shrink-0 animate-pulse" />
                        ) : msg.status === 'read' || msg.is_read || msg.isSeen || msg.readAt ? (
                          readReceiptsEnabled ? (
                            <CheckCheck size={13} style={{ color: chatConfig.tickColors.read }} className="shrink-0" />
                          ) : (
                            <CheckCheck size={13} className="text-zinc-400 shrink-0" />
                          )
                        ) : msg.status === 'delivered' || msg.isDelivered ? (
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

        {/* Swipe-Up Gesture Bar (Only shown while actively pulling) */}
        {!activeConversation.isGroup && isVanishPulling && vanishPullDistance > 10 && (
          <div
            onMouseDown={(e) => {
              if (e.button === 0) handleVanishTouchStart(e.clientY);
            }}
            onTouchStart={(e) => handleVanishTouchStart(e.touches[0].clientY)}
            onTouchMove={(e) => handleVanishTouchMove(e.touches[0].clientY)}
            onTouchEnd={handleVanishTouchEnd}
            className="w-full flex items-center justify-center select-none transition-all relative z-25 py-2 px-4 bg-black/40 backdrop-blur-md border-t border-cyan-500/20 text-cyan-300"
            style={{
              transform: `translateY(-${Math.min(vanishPullDistance * 0.4, 20)}px)`,
              touchAction: 'none',
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium">
              <div
                className="w-2.5 h-2.5 rounded-full bg-cyan-400 transition-transform duration-100"
                style={{
                  transform: `scale(${1 + Math.min(vanishPullDistance / 50, 0.6)})`,
                  opacity: Math.min(vanishPullDistance / 40, 1),
                }}
              />
              <span>
                {vanishPullDistance >= 45
                  ? 'Release to toggle'
                  : 'Swipe up'}
              </span>
            </div>
          </div>
        )}

        {/* Stranger Sandbox Action Bar (Only shown when there are incoming messages from them that haven't been accepted yet) */}
        {!activeConversation.isGroup &&
          targetUser &&
          DataStore.getInboxTier(currentUsername, targetUser) === 'REQUESTS' &&
          messages.some((m) => (m.senderUsername || '').toLowerCase() === targetUser) &&
          !messages.some((m) => (m.senderUsername || '').toLowerCase() === currentUsername) && (
            <div className="p-3 border-t border-[var(--line)] bg-[var(--surface)] space-y-2.5 shrink-0 relative z-20">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] text-center px-2">
                <Shield size={14} className="text-amber-500 shrink-0" />
                <span>
                  <strong>@{targetUser}</strong> sent you a message request.
                </span>
              </div>
              <div className="flex items-center gap-2 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => handleBlockStranger(targetUser)}
                  className="flex-1 py-2 rounded-full text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <UserX size={13} />
                  <span>Block</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRequest(targetUser)}
                  className="flex-1 py-2 rounded-full text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-sunken)] border border-[var(--line)] hover:text-[var(--text)] active:scale-95 transition-all cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => handleAcceptRequestFromSandbox(targetUser)}
                  className="flex-1 py-2 rounded-full text-xs font-bold text-white bg-[var(--primary)] hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  Accept & Follow
                </button>
              </div>
            </div>
          )}

        {/* ALWAYS VISIBLE & FUNCTIONAL Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className={`p-3 border-t flex items-center gap-2 shrink-0 relative z-20 transition-colors ${
            isVanishMode ? 'bg-[#0B1320] border-cyan-500/30' : 'bg-[var(--surface)] border-[var(--line)]'
          }`}
          style={{
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
                const isBlocked = DataStore.isBlocked(targetUser, currentUsername);
                if (isBlocked) {
                  alert('Unable to message this user.');
                  return;
                }
              }
              chatMediaInputRef.current?.click();
            }}
            disabled={isMaintenanceActive}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer transition-colors shrink-0 disabled:opacity-40 ${
              isVanishMode ? 'text-cyan-400 hover:text-cyan-200' : 'text-[var(--text-muted)] hover:text-[#007AFF]'
            }`}
            aria-label="Attach photo"
            title="Send photo"
          >
            <ImageIcon size={19} />
          </button>

          {/* Emoji drawer button */}
          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen(true)}
            disabled={isMaintenanceActive}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer transition-colors shrink-0 disabled:opacity-40 ${
              isVanishMode ? 'text-cyan-400 hover:text-cyan-200' : 'text-[var(--text-muted)] hover:text-[#007AFF]'
            }`}
            aria-label="Pick emoji"
            title="Emoji picker"
          >
            <Smile size={19} />
          </button>

          {/* Guess the Cricketer Games button */}
          {!activeConversation.isGroup && (
            <button
              type="button"
              onClick={() => setIsGameDrawerOpen(true)}
              disabled={isMaintenanceActive}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-[var(--surface-sunken)] cursor-pointer transition-colors shrink-0 disabled:opacity-40 ${
                isVanishMode ? 'text-cyan-400 hover:text-cyan-200' : 'text-[var(--text-muted)] hover:text-cyan-400'
              }`}
              aria-label="Play Games"
              title="Guess the Cricketer & Games 🎮"
            >
              <Gamepad2 size={19} />
            </button>
          )}

          <input
            type="text"
            value={messageInput}
            disabled={isMaintenanceActive}
            onChange={(e) => {
              const val = e.target.value;
              setMessageInput(val);
              if (val.trim()) {
                sendTypingStatus(true, currentUser?.fullName || currentUser?.name || currentUsername);
              } else {
                sendTypingStatus(false);
              }
            }}
            onBlur={() => {
              sendTypingStatus(false);
            }}
            placeholder={
              isMaintenanceActive
                ? 'Chat is disabled during scheduled maintenance 🔒'
                : isVanishMode
                ? 'Message (disappears in 24h)...'
                : 'Message...'
            }
            className={`flex-1 h-10 sm:h-11 px-3.5 sm:px-4 rounded-full text-[14px] sm:text-[14.5px] outline-none border focus:ring-1 disabled:opacity-50 transition-all font-semibold font-sf-display ${
              isVanishMode
                ? 'bg-[#0F1E33] text-cyan-100 placeholder:text-cyan-400/50 border-cyan-500/40 focus:border-cyan-400 focus:ring-cyan-400'
                : 'bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)] focus:border-[#007AFF] focus:ring-[#007AFF] placeholder:text-[var(--text-muted)]'
            }`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF UI Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              fontWeight: 600,
            }}
          />

          {/* Quick Heart icon button when input is empty */}
          {!messageInput.trim() && (
            <button
              type="button"
              disabled={isMaintenanceActive}
              onClick={handleSendHeart}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-75 hover:scale-110 text-rose-500 shrink-0 disabled:opacity-40"
              aria-label="Send heart"
              title="Send heart ❤️"
            >
              <Heart size={20} className="fill-rose-500" />
            </button>
          )}

          {/* ALWAYS VISIBLE Send Button */}
          <button
            type="submit"
            disabled={isMaintenanceActive || !messageInput.trim()}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all active:scale-95 shrink-0 text-white shadow-xs ${
              messageInput.trim()
                ? isVanishMode
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-cyan-900/40 cursor-pointer opacity-100'
                  : 'bg-[#007AFF] hover:bg-blue-600 cursor-pointer opacity-100'
                : 'bg-zinc-700/40 text-zinc-400 opacity-40 cursor-not-allowed'
            }`}
            aria-label="Send message"
            title="Send message"
          >
            <Send size={18} className="translate-x-0.5" />
          </button>
        </form>

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
          onOpenGames={() => {
            setLongPressConv(null);
            setIsGameDrawerOpen(true);
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
            fetch('/api/reports', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'message',
                targetUser: c.username,
                reporterUsername: currentUsername,
                reporterReason: 'Inappropriate or abusive chat behavior',
                contentSnippet: c.lastMessage || `Conversation with @${c.username}`,
                urgency: 'high',
              }),
            }).catch(() => {});
            alert(`Report submitted for @${c.username}. School moderation will review.`);
            setLongPressConv(null);
          }}
          onBlock={(c) => {
            if (c.username?.toLowerCase() === currentUsername) {
              alert('You cannot block yourself.');
              setLongPressConv(null);
              return;
            }
            if (currentUsername && c.username) {
              DataStore.blockUser(currentUsername, c.username);
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

        {/* Modal 1: Add Friends to Group Modal */}
        {activeConversation.isGroup && isAddGroupMembersOpen && (() => {
          const activeGroupId = activeConversation.id.replace(/^conv-/, '');
          const currentMembers = DataStore.getGroupMembers(activeGroupId);
          const pendingInvites = DataStore.getGroupPendingInvites(activeGroupId);
          const memberUsernames = new Set(currentMembers.map((m) => m.toLowerCase().trim()));
          const pendingUsernames = new Set(pendingInvites.map((r) => r.username.toLowerCase().trim()));

          const filteredCandidates = liveStudents.filter((st) => {
            if (st.username.toLowerCase() === currentUsername) return false;
            if (!groupMemberSearchQuery.trim()) return true;
            const q = groupMemberSearchQuery.toLowerCase();
            return (
              st.name.toLowerCase().includes(q) ||
              st.username.toLowerCase().includes(q) ||
              st.studentClass.toLowerCase().includes(q)
            );
          });

          return (
            <div
              className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
              onClick={() => {
                setIsAddGroupMembersOpen(false);
                setGroupMemberSearchQuery('');
              }}
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

                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500">
                      <UserPlus size={18} />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text)]">Add Friends</h3>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Invite classmates to {activeConversation.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddGroupMembersOpen(false);
                      setGroupMemberSearchQuery('');
                    }}
                    className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search classmates by name or @username..."
                    value={groupMemberSearchQuery}
                    onChange={(e) => setGroupMemberSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-full text-xs outline-none border transition-colors focus:border-[var(--primary)]"
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      borderColor: 'var(--line)',
                      color: 'var(--text)',
                    }}
                  />
                </div>

                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Invitations will be sent. When your classmate accepts (&ldquo;Yes, I want to join&rdquo;), they will be added automatically.
                </p>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {filteredCandidates.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                      No classmates found matching &ldquo;{groupMemberSearchQuery}&rdquo;
                    </div>
                  ) : (
                    filteredCandidates.map((st) => {
                      const isMember = memberUsernames.has(st.username.toLowerCase());
                      const isInvited = pendingUsernames.has(st.username.toLowerCase());
                      const liveProf = DataStore.getProfileByUsername(st.username);
                      const effectiveAvatar = liveProf?.avatar || st.avatarUrl || null;
                      const pair = getAvatarColorPair(st.username);

                      return (
                        <div
                          key={st.username}
                          className="p-2.5 rounded-[18px] border flex items-center justify-between transition-colors bg-[var(--surface-sunken)] border-[var(--line)]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden"
                              style={{ backgroundColor: pair.bg, color: pair.text }}
                            >
                              {effectiveAvatar ? (
                                <img src={effectiveAvatar} alt={st.name} className="w-full h-full object-cover" />
                              ) : (
                                st.name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[var(--text)] truncate">{st.name}</p>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">
                                @{st.username} · {st.studentClass}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isMember ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                                ✓ Member
                              </span>
                            ) : isInvited ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center gap-1">
                                <Clock size={11} /> Invited
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleInviteFriendToGroup(st.username)}
                                className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[var(--primary)] hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <Plus size={13} strokeWidth={2.5} />
                                <span>Invite</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal 2: Group Info & Members Sheet */}
        {activeConversation.isGroup && isGroupInfoOpen && (() => {
          const activeGroupId = activeConversation.id.replace(/^conv-/, '');
          const rawMembers = DataStore.getGroupMembers(activeGroupId);
          let currentMembers = Array.from(
            new Set(
              (Array.isArray(rawMembers) ? rawMembers : [])
                .map((m: any) => {
                  if (!m) return '';
                  if (typeof m === 'string') return m.toLowerCase().trim();
                  if (typeof m === 'object' && m.username) return String(m.username).toLowerCase().trim();
                  return String(m).toLowerCase().trim();
                })
                .filter(Boolean)
            )
          );

          if (currentMembers.length === 0) {
            const allProfs = DataStore.getProfiles();
            const groupObj = DataStore.getGroups().find((g) => g.id === activeGroupId);
            const targetClass = groupObj?.class || activeConversation.studentClass?.replace(/[^0-9]/g, '') || '8';
            const classStudents = allProfs
              .filter((p) => p && p.username && (p.class === targetClass || p.username.toLowerCase() === 'shashwath71845'))
              .map((p) => p.username.toLowerCase().trim());
            if (classStudents.length > 0) {
              currentMembers = Array.from(new Set(classStudents));
            }
          }

          const pendingInvites = (DataStore.getGroupPendingInvites(activeGroupId) || []).filter((r: any) => r && r.username);
          const groupObj = DataStore.getGroups().find((g) => g.id === activeGroupId);

          return (
            <div
              className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
              onClick={() => setIsGroupInfoOpen(false)}
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

                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-[14px] flex items-center justify-center font-bold text-base text-white shrink-0 shadow-md"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {activeConversation.groupInitials || activeConversation.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text)]">{activeConversation.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {currentMembers.length} enrolled member{currentMembers.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGroupInfoOpen(false)}
                    className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Add Friends CTA button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsGroupInfoOpen(false);
                    setIsAddGroupMembersOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-full text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <UserPlus size={15} />
                  <span>+ Add Friends to Group</span>
                </button>

                {/* Members list */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    <span>Enrolled Members ({currentMembers.length})</span>
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                    {currentMembers.map((m) => {
                      const prof = DataStore.getProfileByUsername(m);
                      const effectiveAvatar = prof?.avatar || null;
                      const fullName = prof?.fullName || m;
                      const pair = getAvatarColorPair(m);
                      const isMe = m.toLowerCase() === currentUsername;
                      const isCreator = groupObj?.members?.[0]?.toLowerCase() === m.toLowerCase();

                      return (
                        <div
                          key={m}
                          className="p-2.5 rounded-[16px] border flex items-center justify-between bg-[var(--surface-sunken)] border-[var(--line)]"
                        >
                          <div
                            onClick={() => {
                              setIsGroupInfoOpen(false);
                              if (!isMe) router.push(`/u/${m}`);
                            }}
                            className="flex items-center gap-2.5 min-w-0 flex-1 mr-2 cursor-pointer hover:opacity-85 transition-opacity"
                            title={`View @${m}'s profile`}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden"
                              style={{ backgroundColor: pair.bg, color: pair.text }}
                            >
                              {effectiveAvatar ? (
                                <img src={effectiveAvatar} alt={fullName} className="w-full h-full object-cover" />
                              ) : (
                                fullName.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[var(--text)] truncate">
                                {fullName} {isMe && <span className="text-[10px] text-[var(--primary)] font-semibold">(You)</span>}
                              </p>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">
                                @{m} {prof?.class && `· Class ${prof.class}-${prof.section || 'A'}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-[var(--text-muted)]">
                              {isCreator ? 'Admin' : 'Member'}
                            </span>
                            {!isMe && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsGroupInfoOpen(false);
                                  const directConv: ConversationItem = {
                                    id: `conv-${m}`,
                                    name: fullName,
                                    username: m,
                                    studentClass: prof?.class ? `Class ${prof.class}-${prof.section || 'A'}` : 'Student',
                                    avatar: effectiveAvatar,
                                    lastMessage: 'Started chat',
                                    timeAgo: 'Just now',
                                    isUnread: false,
                                    unreadCount: 0,
                                  };
                                  openConversation(directConv);
                                }}
                                className="p-1.5 rounded-full hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                                title={`Message @${m}`}
                                aria-label={`Message @${m}`}
                              >
                                <MessageCircle size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pending Invites (if any) */}
                {pendingInvites.length > 0 && (
                  <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      <span>Pending Invitations ({pendingInvites.length})</span>
                      <span className="text-[10px] text-amber-500 font-semibold lowercase">waiting for response</span>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {pendingInvites.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-2 rounded-[14px] border flex items-center justify-between bg-[var(--surface-sunken)]/60 border-[var(--line)]"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--text)] truncate">@{inv.username}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Invited by @{inv.invitedBy}</p>
                          </div>
                          <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                            <Clock size={10} /> Pending
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Message Info Modal: WhatsApp-style Delivery & Read Receipts Inspection */}
        {selectedMessageInfo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setSelectedMessageInfo(null)}
          >
            <div
              className="relative w-full max-w-sm rounded-[24px] border p-5 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
                color: 'var(--text)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">Message Info</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMessageInfo(null)}
                  className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Message Preview */}
              <div
                className="p-3 rounded-[16px] text-xs font-medium border"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                }}
              >
                <p className="line-clamp-3 text-[var(--text)] font-sf-display">{selectedMessageInfo.text}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5">{selectedMessageInfo.time}</p>
              </div>

              {/* Delivery & Read Receipts */}
              <div className="space-y-3 pt-1">
                {/* Read Status */}
                <div className="flex items-start gap-3 p-2.5 rounded-[16px] bg-[var(--surface-sunken)]/40 border border-[var(--line)]">
                  <div className="p-1.5 rounded-full bg-emerald-500/10 text-[#22C55E] shrink-0 mt-0.5">
                    <CheckCheck size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--text)]">Read</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {selectedMessageInfo.status === 'read' || selectedMessageInfo.is_read || selectedMessageInfo.isSeen || selectedMessageInfo.readAt ? (
                        readReceiptsEnabled ? (
                          <span className="text-[#22C55E] font-medium">Read by recipient</span>
                        ) : (
                          <span>Read (receipts turned off in settings)</span>
                        )
                      ) : (
                        <span>Not read yet</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Delivered Status */}
                <div className="flex items-start gap-3 p-2.5 rounded-[16px] bg-[var(--surface-sunken)]/40 border border-[var(--line)]">
                  <div className="p-1.5 rounded-full bg-zinc-500/10 text-zinc-400 shrink-0 mt-0.5">
                    <CheckCheck size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--text)]">Delivered</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {selectedMessageInfo.isDelivered || selectedMessageInfo.status === 'delivered' || selectedMessageInfo.status === 'read' ? (
                        <span className="text-zinc-300">Delivered to recipient device</span>
                      ) : (
                        <span>Pending delivery</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Sent Status */}
                <div className="flex items-start gap-3 p-2.5 rounded-[16px] bg-[var(--surface-sunken)]/40 border border-[var(--line)]">
                  <div className="p-1.5 rounded-full bg-zinc-500/10 text-zinc-400 shrink-0 mt-0.5">
                    <Check size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--text)]">Sent</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {selectedMessageInfo.status === 'sending' ? (
                        <span className="text-amber-400 font-medium animate-pulse">Sending to server...</span>
                      ) : selectedMessageInfo.status === 'error' ? (
                        <span className="text-rose-500 font-medium">Failed to send</span>
                      ) : (
                        <span className="text-zinc-300">Saved to server</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedMessageInfo(null)}
                className="w-full py-2.5 rounded-full text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90 active:scale-98 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Multiplayer Games: Game Challenge Drawer (inside active chat view) */}
        <CricketGameDrawer
          isOpen={isGameDrawerOpen}
          onClose={() => setIsGameDrawerOpen(false)}
          opponentUsername={getOpponentUsernameFromConv(activeConversation)}
          opponentName={activeConversation?.name || getOpponentUsernameFromConv(activeConversation)}
          onSendChallenge={handleSendGameChallenge}
          onSendConnect4Challenge={handleSendConnect4Challenge}
          onOpenSoloGame={() => setIsSolo2048ModalOpen(true)}
          onOpenLeaderboard={(tab) => {
            setLeaderboardDefaultTab(tab || 'leaderboard');
            setIsLeaderboardModalOpen(true);
          }}
        />

        {/* Guess the Cricketer: Match Arena Modal (inside active chat view) */}
        <CricketGameModal
          isOpen={isGameModalOpen}
          gameId={activeGameId}
          currentUsername={currentUsername}
          onClose={() => setIsGameModalOpen(false)}
          onOpenLeaderboard={(tab) => {
            setLeaderboardDefaultTab(tab || 'leaderboard');
            setIsLeaderboardModalOpen(true);
          }}
        />

        {/* Connect 4: Match Arena Modal (inside active chat view) */}
        <Connect4GameModal
          isOpen={isConnect4ModalOpen}
          gameId={activeConnect4GameId}
          currentUsername={currentUsername}
          onClose={() => setIsConnect4ModalOpen(false)}
          onOpenLeaderboard={() => {
            setIsConnect4ModalOpen(false);
            setLeaderboardDefaultTab('leaderboard');
            setIsLeaderboardModalOpen(true);
          }}
        />

        {/* Solo 2048 Arcade Modal (inside active chat view) */}
        <SoloGame2048Modal
          isOpen={isSolo2048ModalOpen}
          onClose={() => setIsSolo2048ModalOpen(false)}
          currentUsername={currentUsername}
          onOpenLeaderboard={() => {
            setIsSolo2048ModalOpen(false);
            setLeaderboardDefaultTab('leaderboard');
            setIsLeaderboardModalOpen(true);
          }}
        />

        {/* Guess the Cricketer: Leaderboard, Match History & Rules Modal (inside active chat view) */}
        <CricketLeaderboardModal
          isOpen={isLeaderboardModalOpen}
          onClose={() => setIsLeaderboardModalOpen(false)}
          initialTab={leaderboardDefaultTab}
          currentUsername={currentUsername}
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
      <ChatsHeader
        onComposeClick={handleComposeClick}
        onCreateGroupClick={handleCreateGroupClick}
        onOpenGames={handleOpenGamesClick}
      />

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
          onClick={() => handleSelectChip('all')}
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
          onClick={() => handleSelectChip('groups')}
          className={`h-9 px-4 rounded-full text-xs font-semibold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
            activeChip === 'groups'
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
              : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
          }`}
          aria-label="Group chats"
        >
          <span>Groups</span>
          {isMounted && myGroupInvites.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                activeChip === 'groups'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {myGroupInvites.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSelectChip('requests')}
          className={`h-9 px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
            activeChip === 'requests'
              ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
              : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
          }`}
          aria-label={`Message requests (${isMounted ? computedRequests.length : 0})`}
        >
          <span>Requests</span>
          {isMounted && computedRequests.length > 0 && (
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

      {/* Pending Group Invitations Banner (Visible on All and Groups tabs) */}
      {isMounted && myGroupInvites.length > 0 && activeChip !== 'requests' && (
        <div className="mx-4 my-2.5 p-3.5 rounded-[22px] bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📬</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Group Invitation{myGroupInvites.length > 1 ? 's' : ''} for You ({myGroupInvites.length})
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">Action required</span>
          </div>
          <div className="space-y-2">
            {myGroupInvites.map((inv) => (
              <div
                key={inv.id}
                className="p-3 rounded-[16px] border flex items-center justify-between gap-3 shadow-xs"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    {inv.groupName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[var(--text)] truncate">{inv.groupName}</h4>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      Invited by <span className="font-semibold text-[var(--primary)]">@{inv.invitedBy}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAcceptGroupInvite(inv)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Check size={12} strokeWidth={2.5} />
                    <span>Yes, Join</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeclineGroupInvite(inv)}
                    className="px-2.5 py-1.5 rounded-full text-xs font-semibold text-red-500 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer border border-red-500/30 flex items-center gap-1"
                  >
                    <X size={12} strokeWidth={2.5} />
                    <span>No, Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {/* Prominent Instagram-Style Message Request Alert Strip */}
          {isMounted && activeChip === 'all' && computedRequests.length > 0 && (
            <div
              onClick={() => setActiveChip('requests')}
              className="mx-3.5 my-2.5 p-3 rounded-2xl bg-gradient-to-r from-blue-500/15 via-cyan-500/15 to-blue-600/15 border border-blue-500/30 flex items-center justify-between cursor-pointer hover:opacity-95 transition-all shadow-xs"
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

          {!isMounted || demoState === 'loading' ? (
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
                      onClick={handleOpenConversation}
                      onLongPress={handleLongPress}
                      onMuteToggle={handleMuteToggle}
                      onDeleteRequest={handleRequestDeleteConfirm}
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
                        onClick={handleOpenConversation}
                        onLongPress={handleLongPress}
                        onMuteToggle={handleMuteToggle}
                        onDeleteRequest={handleRequestDeleteConfirm}
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
                        onClick={handleOpenConversation}
                        onLongPress={handleLongPress}
                        onMuteToggle={handleMuteToggle}
                        onDeleteRequest={handleRequestDeleteConfirm}
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
        onOpenGames={() => {
          if (longPressConv) {
            setActiveConversation(longPressConv);
            setLongPressConv(null);
            setIsGameDrawerOpen(true);
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
                {selectedGroupMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedGroupMembers([])}
                    className="text-[11px] text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Classmate Search Input */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Filter classmates by name or @username..."
                  value={createGroupSearchQuery}
                  onChange={(e) => setCreateGroupSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 rounded-full text-xs outline-none border transition-colors focus:border-[var(--primary)]"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {liveStudents
                  .filter((st) => {
                    if (!createGroupSearchQuery.trim()) return true;
                    const q = createGroupSearchQuery.toLowerCase();
                    return (
                      st.name.toLowerCase().includes(q) ||
                      st.username.toLowerCase().includes(q) ||
                      st.studentClass.toLowerCase().includes(q)
                    );
                  })
                  .map((st) => {
                  const isSelected = selectedGroupMembers.includes(st.username);
                  const pair = getAvatarColorPair(st.username);
                  const liveProf = DataStore.getProfileByUsername(st.username);
                  const effectiveAvatar = liveProf?.avatar || st.avatarUrl || null;
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
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden"
                          style={{ backgroundColor: pair.bg, color: pair.text }}
                        >
                          {effectiveAvatar ? (
                            <img src={effectiveAvatar} alt={st.name} className="w-full h-full object-cover" />
                          ) : (
                            st.name.slice(0, 2).toUpperCase()
                          )}
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

      {/* Full Screen Photo Viewer Modal */}
      {selectedFullPhoto && (
        <div
          onClick={() => setSelectedFullPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-pointer select-none"
        >
          <button
            type="button"
            onClick={() => setSelectedFullPhoto(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
            aria-label="Close photo"
          >
            <X size={20} />
          </button>
          <img
            src={selectedFullPhoto}
            alt="Full size chat photo"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl cursor-default"
          />
        </div>
      )}

      {/* Toast Notification */}
      {groupToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[var(--text)] shadow-lg animate-fade-in pointer-events-none select-none">
          {groupToast}
        </div>
      )}

      {/* Multiplayer Games: Game Challenge Drawer */}
      <CricketGameDrawer
        isOpen={isGameDrawerOpen}
        onClose={() => setIsGameDrawerOpen(false)}
        opponentUsername={getOpponentUsernameFromConv(activeConversation as ConversationItem | null)}
        opponentName={(activeConversation as ConversationItem | null)?.name || getOpponentUsernameFromConv(activeConversation as ConversationItem | null)}
        onSendChallenge={handleSendGameChallenge}
        onSendConnect4Challenge={handleSendConnect4Challenge}
        onOpenSoloGame={() => setIsSolo2048ModalOpen(true)}
        onOpenLeaderboard={(tab) => {
          setLeaderboardDefaultTab(tab || 'leaderboard');
          setIsLeaderboardModalOpen(true);
        }}
      />

      {/* Guess the Cricketer: Match Arena Modal */}
      <CricketGameModal
        isOpen={isGameModalOpen}
        gameId={activeGameId}
        currentUsername={currentUsername}
        onClose={() => setIsGameModalOpen(false)}
        onOpenLeaderboard={(tab) => {
          setLeaderboardDefaultTab(tab || 'leaderboard');
          setIsLeaderboardModalOpen(true);
        }}
      />

      {/* Connect 4: Match Arena Modal */}
      <Connect4GameModal
        isOpen={isConnect4ModalOpen}
        gameId={activeConnect4GameId}
        currentUsername={currentUsername}
        onClose={() => setIsConnect4ModalOpen(false)}
        onOpenLeaderboard={() => {
          setIsConnect4ModalOpen(false);
          setLeaderboardDefaultTab('leaderboard');
          setIsLeaderboardModalOpen(true);
        }}
      />

      {/* Solo 2048 Arcade Modal */}
      <SoloGame2048Modal
        isOpen={isSolo2048ModalOpen}
        onClose={() => setIsSolo2048ModalOpen(false)}
        currentUsername={currentUsername}
        onOpenLeaderboard={() => {
          setIsSolo2048ModalOpen(false);
          setLeaderboardDefaultTab('leaderboard');
          setIsLeaderboardModalOpen(true);
        }}
      />

      {/* Guess the Cricketer: Leaderboard, Match History & Rules Modal */}
      <CricketLeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        initialTab={leaderboardDefaultTab}
        currentUsername={currentUsername}
      />
      {/* Forward / Share Message Modal */}
      {forwardingMessage && (
        <ForwardMessageModal
          isOpen={Boolean(forwardingMessage)}
          message={forwardingMessage}
          onClose={() => setForwardingMessage(null)}
          currentUsername={currentUsername}
          onForwardSuccess={() => {
            // Forward feedback is directly shown inside modal
          }}
        />
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
