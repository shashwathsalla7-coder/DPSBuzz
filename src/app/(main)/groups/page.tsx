'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Send,
  Lock,
  Unlock,
  Users,
  CheckCheck,
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  MoreVertical,
  Video,
  Smile,
  Paperclip,
  Mic,
  Shield,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Megaphone,
  UserPlus,
  Check,
  Mail,
  Award,
  Play,
  Share2,
  Clock,
  WifiOff,
  Camera,
  FileText,
  Image as ImageIcon,
  Flame,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Phone,
  Info,
  Bell,
  BellOff,
  Pin,
  Sparkles,
  ExternalLink,
  UserCheck,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import {
  schoolSystem,
  WhatsAppChannel,
  WhatsAppMessage,
  GroupInvite,
} from '@/lib/schoolFeatures';
import { DataStore, Profile } from '@/lib/dataStore';

// Apple Palette Distinct Accent Colors
const SENDER_COLORS = [
  '#007AFF', // Apple Blue
  '#34C759', // Apple Green
  '#FF9500', // Apple Orange
  '#AF52DE', // Apple Purple
  '#FF2D55', // Apple Pink
  '#5856D6', // Apple Indigo
  '#00C7BE', // Apple Teal
  '#FF3B30', // Apple Red
];

function getSenderColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

interface ReactionItem {
  emoji: string;
  count: number;
  users: string[];
}

interface EnrolledMember {
  id: string;
  username: string;
  name: string;
  role: 'principal' | 'faculty' | 'rep' | 'student';
  roleLabel: string;
  className: string;
  rollNo?: string;
  admissionNo: string;
  house: string;
  isVerified: boolean;
  avatar?: string | null;
  online: boolean;
  spiritPoints: number;
  attendance: string;
}

// Verified Seed Roster for Class 8-G and DPS Classrooms
const BASE_DPS_ROSTER: EnrolledMember[] = [
  {
    id: 'mem-madam',
    username: 'madam_principal',
    name: 'Dr. Pratibha Kohli',
    role: 'principal',
    roleLabel: 'Office of the Principal',
    className: 'Official Staff',
    admissionNo: 'DPS-STAFF-001',
    house: 'Ex-Officio',
    isVerified: true,
    avatar: null,
    online: true,
    spiritPoints: 1250,
    attendance: '100%',
  },
  {
    id: 'mem-anita',
    username: 'teacher_english',
    name: 'Anita Sharma Madam',
    role: 'faculty',
    roleLabel: 'Faculty (English Dept Head)',
    className: 'Staff Faculty',
    admissionNo: 'DPS-FAC-2018',
    house: 'Ganges House',
    isVerified: true,
    avatar: null,
    online: true,
    spiritPoints: 890,
    attendance: '99%',
  },
  {
    id: 'mem-shashwath',
    username: 'shashwath71845',
    name: 'Shashwath Salla',
    role: 'rep',
    roleLabel: 'Class Representative & Admin',
    className: 'Class 8-G',
    rollNo: '24',
    admissionNo: 'DPS-2024-8G24',
    house: 'Yamuna House',
    isVerified: true,
    avatar: null,
    online: true,
    spiritPoints: 720,
    attendance: '98.5%',
  },
  {
    id: 'mem-rishi',
    username: 'rishi_one9',
    name: 'Y Rishikesh Reddy',
    role: 'student',
    roleLabel: 'Verified Student',
    className: 'Class 8-G',
    rollNo: '36',
    admissionNo: 'DPS-2024-8G36',
    house: 'Kaveri House',
    isVerified: true,
    avatar: null,
    online: true,
    spiritPoints: 640,
    attendance: '97.2%',
  },
  {
    id: 'mem-rohan',
    username: 'rohan728',
    name: 'Rohan R',
    role: 'student',
    roleLabel: 'Verified Student',
    className: 'Class 8-G',
    rollNo: '28',
    admissionNo: 'DPS-2024-8G28',
    house: 'Ganges House',
    isVerified: true,
    avatar: null,
    online: true,
    spiritPoints: 510,
    attendance: '96.8%',
  },
  {
    id: 'mem-chandan',
    username: 'chandan',
    name: 'Chandan',
    role: 'student',
    roleLabel: 'Verified Student',
    className: 'Class 8-G',
    rollNo: '12',
    admissionNo: 'DPS-2024-8G12',
    house: 'Narmada House',
    isVerified: true,
    avatar: null,
    online: false,
    spiritPoints: 480,
    attendance: '95.4%',
  },
  {
    id: 'mem-ashwith',
    username: 'ashwith',
    name: 'K. Ashwith',
    role: 'student',
    roleLabel: 'Verified Student',
    className: 'Class 8-G',
    rollNo: '19',
    admissionNo: 'DPS-2024-8G19',
    house: 'Yamuna House',
    isVerified: true,
    avatar: null,
    online: true,
    spiritPoints: 530,
    attendance: '97.0%',
  },
  {
    id: 'mem-sreekrishna',
    username: 'sreekrishna',
    name: 'G. Ananth Sree Krishna',
    role: 'student',
    roleLabel: 'Verified Student',
    className: 'Class 8-G',
    rollNo: '15',
    admissionNo: 'DPS-2024-8G15',
    house: 'Ganges House',
    isVerified: true,
    avatar: null,
    online: false,
    spiritPoints: 490,
    attendance: '96.1%',
  },
  {
    id: 'mem-vignesh',
    username: 'vignesh',
    name: 'Vignesh',
    role: 'student',
    roleLabel: 'Verified Student',
    className: 'Class 8-G',
    rollNo: '41',
    admissionNo: 'DPS-2024-8G41',
    house: 'Kaveri House',
    isVerified: true,
    avatar: null,
    online: true,
    spiritPoints: 420,
    attendance: '94.8%',
  },
  {
    id: 'mem-ishanvi',
    username: 'ishanvi',
    name: 'Ishanvi',
    role: 'student',
    roleLabel: 'Verified Student',
    className: 'Class 8-A',
    rollNo: '18',
    admissionNo: 'DPS-2024-8A18',
    house: 'Yamuna House',
    isVerified: true,
    avatar: null,
    online: true,
    spiritPoints: 560,
    attendance: '98.0%',
  },
  {
    id: 'mem-mokshith',
    username: 'mokshith7b',
    name: 'Neelam Mokshith Ram',
    role: 'student',
    roleLabel: 'Verified Student',
    className: 'Class 7-B',
    rollNo: '22',
    admissionNo: 'DPS-2024-7B22',
    house: 'Narmada House',
    isVerified: true,
    avatar: null,
    online: false,
    spiritPoints: 470,
    attendance: '96.5%',
  },
  {
    id: 'mem-sahana',
    username: 'sahana_3009',
    name: 'S. Sahana',
    role: 'student',
    roleLabel: 'Verified Student',
    className: 'Class 9-A',
    rollNo: '31',
    admissionNo: 'DPS-2024-9A31',
    house: 'Ganges House',
    isVerified: true,
    avatar: null,
    online: true,
    spiritPoints: 610,
    attendance: '97.5%',
  },
];

// ============================================================================
// APPLE MESSAGE BUBBLE COMPONENT (iMessage Styling, Zero Cut-Off, Full Trust)
// ============================================================================
interface MessageBubbleProps {
  msg: WhatsAppMessage;
  isMe: boolean;
  isSameSenderAsPrev: boolean;
  isDark: boolean;
  reactions: ReactionItem[];
  onToggleReaction: (msgId: string, emoji: string) => void;
  onReply: (msg: WhatsAppMessage) => void;
  onOpenProfile: (username: string) => void;
}

const MessageBubbleItem = memo(function MessageBubbleItem({
  msg,
  isMe,
  isSameSenderAsPrev,
  isDark,
  reactions,
  onToggleReaction,
  onReply,
  onOpenProfile,
}: MessageBubbleProps) {
  const [showTapbacks, setShowTapbacks] = useState(false);

  const isPrincipal =
    msg.senderRole === 'admin' ||
    msg.senderUsername.toLowerCase() === 'madam_principal' ||
    msg.senderName.toLowerCase().includes('principal');
  const isFaculty = msg.senderRole === 'teacher' || msg.senderUsername.toLowerCase().includes('teacher');
  const isSystem = msg.senderUsername === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3 px-4">
        <span className="px-3.5 py-1 rounded-full text-[11px] font-medium bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 text-center max-w-md shadow-xs border border-black/5 dark:border-white/5">
          {msg.text}
        </span>
      </div>
    );
  }

  const senderColor = isPrincipal ? '#ea4335' : isFaculty ? '#f59e0b' : getSenderColor(msg.senderName);

  // Quoted text parsing (if message is a reply)
  let quoteAuthor = '';
  let quoteSnippet = '';
  let mainBody = msg.text;

  if (msg.text.startsWith('> Replying to @')) {
    const quoteEnd = msg.text.indexOf('\n\n');
    if (quoteEnd !== -1) {
      const quoteLine = msg.text.slice(0, quoteEnd);
      const match = quoteLine.match(/> Replying to @([^:]+):\s*"([\s\S]+?)"/);
      if (match) {
        quoteAuthor = match[1];
        quoteSnippet = match[2];
        mainBody = msg.text.slice(quoteEnd + 2);
      }
    }
  }

  // Media inspection
  const isVideoPost = msg.mediaType === 'video' || mainBody.includes('Me in my prime');
  const isImagePost = msg.mediaType === 'image' || Boolean(msg.mediaUrl && !isVideoPost);

  return (
    <div
      className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} ${
        isSameSenderAsPrev ? 'mt-1' : 'mt-3.5'
      }`}
    >
      {/* Sender Avatar on Left (Only for Incoming messages on first of cluster) */}
      {!isMe && (
        <div className="w-8 shrink-0">
          {!isSameSenderAsPrev ? (
            <button
              type="button"
              onClick={() => onOpenProfile(msg.senderUsername)}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer relative"
              style={{ backgroundColor: senderColor }}
              title={`View @${msg.senderUsername}'s Verified DPS Profile`}
            >
              {msg.senderName.slice(0, 1).toUpperCase()}
              {isPrincipal ? (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px] ring-2 ring-white dark:ring-zinc-900">
                  ★
                </span>
              ) : isFaculty ? (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] ring-2 ring-white dark:ring-zinc-900">
                  ✓
                </span>
              ) : (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-[8px] ring-2 ring-white dark:ring-zinc-900">
                  ✓
                </span>
              )}
            </button>
          ) : null}
        </div>
      )}

      {/* Bubble Container: Max Width Optimized for Zero Horizontal Cut-Off */}
      <div className="flex flex-col max-w-[86%] sm:max-w-[76%] md:max-w-[70%] group relative">
        {/* Sender Name & Trust Header above bubble (Incoming only) */}
        {!isMe && !isSameSenderAsPrev && (
          <div className="mb-1 ml-1 flex items-center gap-1.5 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => onOpenProfile(msg.senderUsername)}
              className="font-semibold hover:underline cursor-pointer flex items-center gap-1"
              style={{ color: senderColor }}
            >
              <span>{msg.senderName}</span>
              {isPrincipal ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-500/20">
                  <Award size={10} />
                  <span>Principal</span>
                </span>
              ) : isFaculty ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                  <ShieldCheck size={10} />
                  <span>Faculty</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-blue-500/10 text-[#007AFF] dark:text-blue-400 text-[10px] font-semibold border border-blue-500/20">
                  <CheckCircle2 size={10} />
                  <span>Verified</span>
                </span>
              )}
            </button>

            {msg.senderClass && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                • {msg.senderClass}
              </span>
            )}
          </div>
        )}

        {/* Principal Circular Banner */}
        {isPrincipal && !isSameSenderAsPrev && (
          <div className="mb-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 shadow-2xs">
            <Award size={14} className="shrink-0 text-red-500" />
            <span>OFFICIAL DISPATCH • OFFICE OF THE PRINCIPAL</span>
          </div>
        )}

        {/* Apple iMessage Bubble */}
        <div
          onClick={() => setShowTapbacks((prev) => !prev)}
          className={`relative px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap [overflow-wrap:anywhere] word-break:break-word transition-all select-text cursor-pointer ${
            isMe
              ? 'bg-[#007AFF] text-white rounded-[20px] rounded-br-[4px] shadow-[0_1px_2px_rgba(0,122,255,0.2)]'
              : isDark
              ? 'bg-[#2C2C2E] text-zinc-100 rounded-[20px] rounded-bl-[4px] shadow-xs border border-white/[0.06]'
              : 'bg-[#E9E9EB] text-zinc-900 rounded-[20px] rounded-bl-[4px] shadow-xs border border-black/[0.04]'
          }`}
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
          }}
        >
          {/* Quoted Message Card */}
          {quoteAuthor && (
            <div
              className={`mb-2 p-2.5 rounded-[14px] text-xs border-l-[3.5px] text-left break-words [overflow-wrap:anywhere] ${
                isMe
                  ? 'bg-white/15 border-white text-white/95'
                  : 'bg-black/5 dark:bg-white/5 border-[#007AFF] text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="font-semibold text-[11px] flex items-center gap-1 mb-0.5">
                <CheckCircle2 size={11} className="text-[#007AFF]" />
                <span>@{quoteAuthor}</span>
              </div>
              <div className="text-[12px] opacity-90 line-clamp-3 leading-relaxed">
                {quoteSnippet}
              </div>
            </div>
          )}

          {/* Media: Video Card */}
          {isVideoPost && (
            <div className="mb-2 relative rounded-[16px] overflow-hidden bg-black/60 border border-white/10 group/video cursor-pointer">
              <div className="h-48 sm:h-56 w-full bg-linear-to-b from-stone-900 via-zinc-900 to-black flex items-center justify-center relative">
                <div className="w-13 h-13 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white group-hover/video:scale-110 transition-transform shadow-lg border border-white/30">
                  <Play size={24} className="ml-0.5 fill-white" />
                </div>
                <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-[11px] text-white font-medium flex items-center gap-1.5">
                  <Video size={11} />
                  <span>{msg.mediaDuration || '2:20'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Media: Image Card */}
          {isImagePost && msg.mediaUrl && (
            <div className="mb-2 rounded-[16px] overflow-hidden max-h-72 cursor-pointer shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={msg.mediaUrl}
                alt="Class Attachment"
                className="w-full h-auto object-cover rounded-[16px] hover:opacity-95 transition-opacity"
              />
            </div>
          )}

          {/* Message Text Body */}
          <div className="leading-relaxed break-words whitespace-pre-wrap [overflow-wrap:anywhere] word-break:break-word">
            {mainBody}
          </div>

          {/* Metadata Row: Timestamp & Status Checkmarks */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10.5px] select-none ${
              isMe ? 'text-white/70' : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <span>
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
            {isMe && <CheckCheck size={13} className="text-white/90 ml-0.5" />}
          </div>

          {/* Apple Tapback Bubble Reaction Pill */}
          {reactions.length > 0 && (
            <div
              className={`absolute -bottom-2.5 ${
                isMe ? 'right-3' : 'left-3'
              } flex items-center gap-1 bg-white dark:bg-[#3A3A3C] border border-black/10 dark:border-white/15 px-2 py-0.5 rounded-full shadow-md z-10 select-none animate-scale-in`}
            >
              {reactions.map((r, rIdx) => (
                <button
                  key={rIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReaction(msg.id, r.emoji);
                  }}
                  className="flex items-center gap-1 text-[11px] hover:scale-115 active:scale-95 transition-transform"
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && (
                    <span className="font-semibold text-[10px] text-zinc-600 dark:text-zinc-300">
                      {r.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Apple 6-Tapback Bar (Revealed on Hover or Tap) */}
        {showTapbacks && (
          <div
            className={`absolute -top-11 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-2xl border ${
              isMe ? 'right-0' : 'left-0'
            } ${
              isDark
                ? 'bg-[#1C1C1E]/95 border-white/15 text-white'
                : 'bg-white/95 border-black/10 text-zinc-900'
            } animate-fadeIn`}
          >
            {['❤️', '👍', '👎', '😂', '‼️', '❓'].map((em) => (
              <button
                key={em}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleReaction(msg.id, em);
                  setShowTapbacks(false);
                }}
                className="text-base hover:scale-130 active:scale-95 transition-transform cursor-pointer p-0.5"
                title={`React ${em}`}
              >
                {em}
              </button>
            ))}
            <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700 mx-0.5" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReply(msg);
                setShowTapbacks(false);
              }}
              className="text-[11px] font-semibold text-[#007AFF] hover:opacity-80 transition-opacity px-1"
            >
              Reply
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN GROUPS PAGE (Apple iOS iMessage Experience)
// ============================================================================
export default function GroupsPage() {
  const router = useRouter();

  // Theme Detection (Apple Dark / Light)
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const updateTheme = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme');
      if (themeAttr === 'dark') {
        setIsDark(true);
      } else if (themeAttr === 'light') {
        setIsDark(false);
      } else {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('storage', updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', updateTheme);
    };
  }, []);

  // Core State
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [channels, setChannels] = useState<WhatsAppChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('channel-class-8g');
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Group Details Drawer Sheet (Apple iOS Details Drawer)
  const [showGroupDetailsSheet, setShowGroupDetailsSheet] = useState(false);
  const [memberFilterTab, setMemberFilterTab] = useState<'all' | 'faculty' | 'reps' | 'students'>('all');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [drawerActiveTab, setDrawerActiveTab] = useState<'members' | 'media' | 'settings'>('members');

  // Enrolled Roster State (Allows dynamic adding of classmates)
  const [classRoster, setClassRoster] = useState<EnrolledMember[]>(BASE_DPS_ROSTER);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');

  // Verified Profile Card Modal (Tap on any student or faculty to see verified DPS ID)
  const [inspectedMember, setInspectedMember] = useState<EnrolledMember | null>(null);

  // Pinned Classroom Notice Collapsible
  const [isPinnedNoticeDismissed, setIsPinnedNoticeDismissed] = useState(false);

  // Offline and Replying
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<Array<{ msg: WhatsAppMessage; targetChannelId: string }>>([]);
  const [replyingTo, setReplyingTo] = useState<WhatsAppMessage | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Teacher / Admin Mode Switcher
  const [clientViewMode, setClientViewMode] = useState<'teacher' | 'student'>('student');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupGrade, setNewGroupGrade] = useState('Class 8');
  const [newGroupSection, setNewGroupSection] = useState('G');
  const [newGroupIsLocked, setNewGroupIsLocked] = useState(false);

  // Audio / Video Call Simulation Modal
  const [activeCallRoom, setActiveCallRoom] = useState<{ type: 'audio' | 'video'; title: string } | null>(null);

  // Reactions Map: messageId -> ReactionItem[]
  const [reactions, setReactions] = useState<Record<string, ReactionItem[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSyncTimestampRef = useRef<number>(0);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);

  const flushOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    const items = [...offlineQueue];
    setOfflineQueue([]);

    for (const item of items) {
      try {
        await fetch('/api/campus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_whatsapp_message',
            channelId: item.targetChannelId,
            senderUsername: item.msg.senderUsername,
            senderName: item.msg.senderName,
            senderRole: item.msg.senderRole,
            senderClass: item.msg.senderClass,
            text: item.msg.text,
            templateType: 'none',
          }),
        });
      } catch {}
    }
    refreshAllData();
  };

  // Adaptive Polling Engine
  const syncIncrementalMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/campus?action=whatsapp_messages&after=${lastSyncTimestampRef.current}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnes = data.messages.filter((m: WhatsAppMessage) => !existingIds.has(m.id));
            if (newOnes.length === 0) return prev;
            return [...prev, ...newOnes];
          });
          const highestTs = Math.max(...data.messages.map((m: WhatsAppMessage) => m.timestamp));
          if (highestTs > lastSyncTimestampRef.current) {
            lastSyncTimestampRef.current = highestTs;
          }
        }
      }
    } catch {}
  }, []);

  const startAdaptivePolling = useCallback(() => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    const isHidden = typeof document !== 'undefined' && document.hidden;
    const intervalMs = isHidden ? 15000 : 2000;

    pollingTimerRef.current = setInterval(() => {
      syncIncrementalMessages();
    }, intervalMs);
  }, [syncIncrementalMessages]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        syncIncrementalMessages();
        startAdaptivePolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    startAdaptivePolling();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [syncIncrementalMessages, startAdaptivePolling]);

  // Auth & Initial Data Load
  useEffect(() => {
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);

    const isTeacher =
      (user as any)?.role === 'teacher' ||
      user?.role === 'admin' ||
      user?.username?.toLowerCase() === 'shashwath71845' ||
      user?.username?.toLowerCase().includes('teacher') ||
      user?.username?.toLowerCase() === 'madam_principal';
    setClientViewMode(isTeacher ? 'teacher' : 'student');

    refreshAllData();

    const handleUpdate = () => {
      refreshAllData();
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);

    return () => {
      window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
    };
  }, []);

  const refreshAllData = async () => {
    try {
      const res = await fetch('/api/campus', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.whatsappChannels)) {
          setChannels(data.whatsappChannels);
          setSelectedChannelId((prev) => {
            const hasPrev = data.whatsappChannels.some((c: WhatsAppChannel) => c.id === prev);
            if (!hasPrev || prev === 'channel-school-broadcast') {
              const activeClass = data.whatsappChannels.find((c: WhatsAppChannel) => !c.isLocked);
              return activeClass ? activeClass.id : 'channel-class-8g';
            }
            return prev;
          });
        }
        if (Array.isArray(data.whatsappMessages)) {
          setMessages(data.whatsappMessages);
          if (data.whatsappMessages.length > 0) {
            lastSyncTimestampRef.current = Math.max(
              ...data.whatsappMessages.map((m: WhatsAppMessage) => m.timestamp)
            );
          }
        }
        if (Array.isArray(data.groupInvites)) {
          setGroupInvites(data.groupInvites);
        }
      }
    } catch (e) {
      console.warn('Could not sync class groups:', e);
    }
  };

  // Scroll smoothly when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedChannelId]);

  // Visible Channels
  const isTeacherAdmin =
    clientViewMode === 'teacher' &&
    (currentUser?.username === 'shashwath71845' ||
      currentUser?.username === 'madam_principal' ||
      currentUser?.role === 'admin');

  const visibleChannels = useMemo(() => {
    return channels.filter((c) => {
      if (isTeacherAdmin) return true;
      if (c.id === 'channel-school-broadcast' || c.grade === 'All') return true;
      if (c.id.includes('club') || c.section === 'Club') return true;
      const userGrade = String((currentUser as any)?.classGrade || (currentUser as any)?.grade || currentUser?.class || '8')
        .toLowerCase()
        .replace(/[^0-9]/g, '');
      const channelGrade = c.grade.toLowerCase().replace(/[^0-9]/g, '');
      if (userGrade && channelGrade && (userGrade === channelGrade || c.grade.includes(userGrade))) {
        return true;
      }
      return true;
    });
  }, [channels, isTeacherAdmin, currentUser]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return visibleChannels;
    const q = searchQuery.toLowerCase();
    return visibleChannels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.grade.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [visibleChannels, searchQuery]);

  // Active Selected Channel
  const activeChannel = useMemo(() => {
    const found = visibleChannels.find((c) => c.id === selectedChannelId);
    if (found) return found;
    return (
      visibleChannels[0] || {
        id: 'channel-class-8g',
        name: 'Class 8-G Official Classroom 📘',
        grade: 'Class 8',
        section: 'G',
        isLocked: false,
        adminUsernames: ['shashwath71845', 'madam_principal'],
        enrolledUsernames: ['madam_principal', 'teacher_english', 'shashwath71845', 'rishi_one9', 'rohan728'],
        memberCount: 39,
        lastMessage: 'Welcome to Class 8-G Official Classroom',
        lastMessageTime: 'Just now',
      }
    );
  }, [visibleChannels, selectedChannelId]);

  const channelMessages = useMemo(() => {
    return messages.filter((m) => m.channelId === activeChannel.id);
  }, [messages, activeChannel.id]);

  const canSendMessage = clientViewMode === 'teacher' || !activeChannel.isLocked;

  // Header Subtitle
  const channelSubtitle = useMemo(() => {
    if (activeChannel.id === 'channel-school-broadcast') {
      return '5,500 Enrolled Students & Faculty • Official Dispatches';
    }
    const count = classRoster.length >= 39 ? classRoster.length : 39;
    return `${count} Verified Members • Tap for Classroom Info >`;
  }, [activeChannel, classRoster.length]);

  // Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = messageText.trim();
    if (!textToSend || isSending) return;

    if (!canSendMessage) {
      setToastMessage('This channel is locked by Faculty. Switch to an open classroom.');
      return;
    }

    setIsSending(true);

    const senderUsername = currentUser?.username || (clientViewMode === 'teacher' ? 'madam_principal' : 'shashwath71845');
    const senderName = clientViewMode === 'teacher'
      ? 'Principal Madam (Office)'
      : currentUser?.fullName || currentUser?.username || 'Shashwath Salla';
    const senderRole = clientViewMode === 'teacher' ? 'admin' : (currentUser?.role || 'student');
    const senderClass = clientViewMode === 'teacher' ? 'Office of Principal' : 'Class 8-G';

    const optimisticId = `wmsg-opt-${Date.now()}`;
    const quotedText = replyingTo ? `> Replying to @${replyingTo.senderName}: "${replyingTo.text.slice(0, 180)}"\n\n` : '';
    const finalText = quotedText + textToSend;

    const optimisticMsg: WhatsAppMessage = {
      id: optimisticId,
      channelId: activeChannel.id,
      senderUsername,
      senderName,
      senderRole: senderRole as any,
      senderClass,
      text: finalText,
      templateType: 'none',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageText('');
    setReplyingTo(null);

    if (!navigator.onLine) {
      setOfflineQueue((prev) => [...prev, { msg: optimisticMsg, targetChannelId: activeChannel.id }]);
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-username': senderUsername,
          'x-user-role': senderRole,
        },
        body: JSON.stringify({
          action: 'send_whatsapp_message',
          channelId: activeChannel.id,
          senderUsername,
          senderName,
          senderRole,
          senderClass,
          text: finalText,
          templateType: 'none',
          broadcastToAll: clientViewMode === 'teacher' && activeChannel.id === 'channel-school-broadcast',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorText = errorData.error || 'Failed to send message.';
        if (res.status === 403 || errorData.isLocked) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          setToastMessage(errorText);
        } else {
          setOfflineQueue((prev) => [...prev, { msg: optimisticMsg, targetChannelId: activeChannel.id }]);
        }
      } else {
        refreshAllData();
      }
    } catch {
      setOfflineQueue((prev) => [...prev, { msg: optimisticMsg, targetChannelId: activeChannel.id }]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Toggle Reactions
  const handleToggleReaction = useCallback((msgId: string, emoji: string) => {
    const curU = currentUser?.username || 'me';
    setReactions((prev) => {
      const existing = prev[msgId] || [];
      const item = existing.find((r) => r.emoji === emoji);
      if (item) {
        if (item.users.includes(curU)) {
          const updatedUsers = item.users.filter((u) => u !== curU);
          if (updatedUsers.length === 0) {
            return { ...prev, [msgId]: existing.filter((r) => r.emoji !== emoji) };
          }
          return {
            ...prev,
            [msgId]: existing.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count - 1, users: updatedUsers } : r
            ),
          };
        } else {
          return {
            ...prev,
            [msgId]: existing.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, curU] } : r
            ),
          };
        }
      } else {
        return {
          ...prev,
          [msgId]: [...existing, { emoji, count: 1, users: [curU] }],
        };
      }
    });
  }, [currentUser?.username]);

  // Toggle Channel Lock
  const handleToggleLock = async () => {
    if (clientViewMode !== 'teacher') return;
    const nextLock = !activeChannel.isLocked;
    const res = await schoolSystem.toggleChannelLock({
      channelId: activeChannel.id,
      isLocked: nextLock,
      requesterUsername: currentUser?.username || 'madam_principal',
      requesterRole: 'admin',
    });
    if (res.success) {
      setChannels((prev) =>
        prev.map((c) => (c.id === activeChannel.id ? { ...c, isLocked: nextLock } : c))
      );
      setToastMessage(nextLock ? 'Classroom muted for students.' : 'Classroom unlocked for student discussion.');
      refreshAllData();
    }
  };

  // Create New Classroom Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const res = await schoolSystem.createWhatsAppChannel({
      name: newGroupName.trim(),
      grade: newGroupGrade,
      section: newGroupSection,
      isLocked: newGroupIsLocked,
      requesterUsername: currentUser?.username || 'madam_principal',
      requesterRole: 'admin',
    });

    if (res.success && res.channel) {
      setChannels((prev) => [...prev, res.channel!]);
      setSelectedChannelId(res.channel.id);
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setToastMessage(`Created ${res.channel.name}`);
      refreshAllData();
    }
  };

  // Add Classmate to Roster
  const handleAddMemberToClass = (username: string, fullName: string, className: string) => {
    if (classRoster.some((m) => m.username.toLowerCase() === username.toLowerCase())) {
      setToastMessage(`@${username} is already enrolled in this classroom.`);
      return;
    }

    const newMember: EnrolledMember = {
      id: `mem-${Date.now()}`,
      username: username.toLowerCase().trim(),
      name: fullName,
      role: 'student',
      roleLabel: 'Verified Student',
      className: className || 'Class 8-G',
      rollNo: String(classRoster.length + 1),
      admissionNo: `DPS-2024-8G${classRoster.length + 1}`,
      house: 'Yamuna House',
      isVerified: true,
      avatar: null,
      online: true,
      spiritPoints: 400,
      attendance: '98%',
    };

    setClassRoster((prev) => [...prev, newMember]);
    setShowAddMemberModal(false);
    setToastMessage(`Added ${fullName} (@${username}) to ${activeChannel.name}`);
  };

  // Open Profile Sheet
  const handleOpenProfileByUsername = (username: string) => {
    const cleanU = (username || '').toLowerCase().trim();
    const found = classRoster.find((m) => m.username.toLowerCase().trim() === cleanU);
    if (found) {
      setInspectedMember(found);
    } else {
      const prof = DataStore.getProfileByUsername(cleanU);
      setInspectedMember({
        id: `ins-${Date.now()}`,
        username: cleanU,
        name: prof?.fullName || cleanU,
        role: (prof?.role === 'admin' ? 'principal' : (prof?.role as string) === 'teacher' ? 'faculty' : 'student') as any,
        roleLabel: prof?.role === 'admin' ? 'Principal & Admin' : 'Verified Student',
        className: prof?.class ? `Class ${prof.class}` : 'Class 8-G',
        admissionNo: `DPS-2024-${cleanU.slice(0, 6).toUpperCase()}`,
        house: 'Yamuna House',
        isVerified: true,
        avatar: prof?.avatar || null,
        online: true,
        spiritPoints: 450,
        attendance: '98%',
      });
    }
  };

  // Filtered Members for Drawer
  const filteredRoster = useMemo(() => {
    return classRoster.filter((m) => {
      if (memberFilterTab === 'faculty' && m.role !== 'faculty' && m.role !== 'principal') return false;
      if (memberFilterTab === 'reps' && m.role !== 'rep') return false;
      if (memberFilterTab === 'students' && m.role !== 'student' && m.role !== 'rep') return false;
      if (!memberSearchQuery.trim()) return true;
      const q = memberSearchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        m.className.toLowerCase().includes(q)
      );
    });
  }, [classRoster, memberFilterTab, memberSearchQuery]);

  return (
    <div
      className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)] w-full overflow-hidden select-none bg-[#F2F2F7] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      }}
    >
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-zinc-900/90 dark:bg-white/90 text-white dark:text-zinc-900 text-xs font-semibold shadow-2xl backdrop-blur-xl border border-white/20 flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={15} className="text-[#007AFF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-amber-500/90 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 backdrop-blur-md shadow-md">
          <WifiOff size={14} />
          <span>Offline Mode: Outgoing messages will auto-send when connection is restored.</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* LEFT PANEL: Apple Messages Sidebar (Width ~360px-400px)              */}
      {/* ==================================================================== */}
      <aside
        className={`w-full md:w-[360px] lg:w-[400px] flex flex-col border-r border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-[#161618]/70 backdrop-blur-2xl shrink-0 transition-all ${
          isMobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Apple Navigation Header */}
        <div className="h-[64px] px-4 flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center font-bold text-white text-sm shadow-md ring-2 ring-white/50 dark:ring-white/10">
              {currentUser?.fullName?.[0] || 'D'}
            </div>
            <div>
              <div className="text-sm font-semibold flex items-center gap-1 leading-tight">
                <span>{currentUser?.fullName || 'DPS Student'}</span>
                <CheckCircle2 size={13} className="text-[#007AFF] fill-[#007AFF]/20" />
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                {clientViewMode === 'teacher' ? 'Faculty Admin • Office' : 'Class 8-G • Verified Student'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Faculty Mode Switcher */}
            {(currentUser?.role === 'admin' ||
              currentUser?.username === 'shashwath71845' ||
              currentUser?.username?.toLowerCase().includes('teacher')) && (
              <button
                type="button"
                onClick={() => setClientViewMode(clientViewMode === 'teacher' ? 'student' : 'teacher')}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors cursor-pointer"
                title="Switch View Mode"
              >
                {clientViewMode === 'teacher' ? 'Faculty' : 'Student'}
              </button>
            )}

            {clientViewMode === 'teacher' && (
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(true)}
                className="w-8 h-8 rounded-full bg-[#007AFF] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xs cursor-pointer"
                title="Create New Classroom Group"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Apple Spotlight Search Bar */}
        <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
          <div className="flex items-center px-3 py-1.5 rounded-[10px] bg-black/5 dark:bg-white/10 focus-within:ring-2 focus-within:ring-[#007AFF]/40 transition-all">
            <Search size={14} className="text-zinc-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search classrooms and groups"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-none placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-zinc-400 hover:text-zinc-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Classroom List */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04] p-1.5 space-y-0.5">
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No classrooms found
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = channel.id === activeChannel.id;
              const isBroadcast = channel.id === 'channel-school-broadcast';

              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => {
                    setSelectedChannelId(channel.id);
                    setIsMobileChatOpen(true);
                  }}
                  className={`w-full text-left p-3 rounded-[14px] flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#007AFF] text-white shadow-md'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {/* Apple Squircle Classroom Emblem */}
                  <div
                    className={`w-11 h-11 rounded-[14px] flex items-center justify-center font-bold shrink-0 shadow-xs ${
                      isSelected ? 'bg-white/20 text-white' : 'text-white'
                    }`}
                    style={{
                      backgroundColor: isSelected ? undefined : isBroadcast ? '#ea4335' : getSenderColor(channel.name),
                    }}
                  >
                    {isBroadcast ? <Megaphone size={18} /> : <Users size={18} />}
                  </div>

                  {/* Channel Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[13.5px] font-semibold truncate ${isSelected ? 'text-white' : ''}`}>
                        {channel.name}
                      </span>
                      <span
                        className={`text-[10.5px] shrink-0 ml-1.5 ${
                          isSelected ? 'text-white/80' : 'text-zinc-400'
                        }`}
                      >
                        {channel.lastMessageTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                      <p
                        className={`text-xs truncate max-w-[210px] ${
                          isSelected ? 'text-white/85' : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {channel.lastMessage || 'No messages yet'}
                      </p>
                      {channel.isLocked ? (
                        <Lock
                          size={12}
                          className={`shrink-0 ml-1 ${isSelected ? 'text-white/80' : 'text-zinc-400'}`}
                        />
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* RIGHT PANEL: Apple iMessage Chat Area                                */}
      {/* ==================================================================== */}
      <main
        className={`flex-1 flex flex-col relative bg-[#F2F2F7] dark:bg-[#000000] overflow-hidden ${
          isMobileChatOpen ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Apple Frosted Navigation Bar Header */}
        <div className="h-[64px] px-4 flex items-center justify-between z-10 shrink-0 backdrop-blur-2xl bg-white/80 dark:bg-[#161618]/80 border-b border-black/[0.08] dark:border-white/[0.08]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileChatOpen(false)}
              className="p-1 -ml-1 text-[#007AFF] hover:opacity-80 md:hidden shrink-0 cursor-pointer flex items-center gap-0.5 text-sm font-medium"
              aria-label="Back to chat list"
            >
              <ChevronLeft size={20} />
              <span>Chats</span>
            </button>

            {/* Tap group icon or name to open Apple Group Details Sheet */}
            <div
              onClick={() => setShowGroupDetailsSheet(true)}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85 transition-opacity"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-md ring-2 ring-white/50 dark:ring-white/10"
                style={{
                  backgroundColor: activeChannel.id.includes('broadcast') ? '#ea4335' : getSenderColor(activeChannel.name),
                }}
              >
                {activeChannel.id.includes('broadcast') ? <Megaphone size={17} /> : <Users size={17} />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold truncate leading-tight">
                    {activeChannel.name}
                  </h2>
                  <CheckCircle2 size={14} className="text-[#007AFF] fill-[#007AFF]/20 shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">
                  {channelSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {clientViewMode === 'teacher' && (
              <button
                type="button"
                onClick={handleToggleLock}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                  activeChannel.isLocked
                    ? 'border-red-500/30 text-red-600 bg-red-500/10'
                    : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                }`}
                title="Toggle Classroom Mute"
              >
                {activeChannel.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                <span className="hidden sm:inline">{activeChannel.isLocked ? 'Locked' : 'Unlocked'}</span>
              </button>
            )}

            {/* Audio Call */}
            <button
              type="button"
              onClick={() => setActiveCallRoom({ type: 'audio', title: `${activeChannel.name} - Audio Room` })}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#007AFF] flex items-center justify-center transition-colors cursor-pointer"
              title="Start Audio Room"
            >
              <Phone size={16} />
            </button>

            {/* Video Call */}
            <button
              type="button"
              onClick={() => setActiveCallRoom({ type: 'video', title: `${activeChannel.name} - Video Classroom` })}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#007AFF] flex items-center justify-center transition-colors cursor-pointer"
              title="Start Video Classroom"
            >
              <Video size={16} />
            </button>

            {/* Group Info (i) button */}
            <button
              type="button"
              onClick={() => setShowGroupDetailsSheet(true)}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#007AFF] flex items-center justify-center transition-colors cursor-pointer"
              title="Classroom Details & Members"
            >
              <Info size={17} />
            </button>
          </div>
        </div>

        {/* Pinned Classroom Announcement Bar */}
        {!isPinnedNoticeDismissed && (
          <div className="px-4 py-2 bg-amber-500/10 dark:bg-amber-400/10 border-b border-amber-500/20 backdrop-blur-md flex items-center justify-between gap-3 text-xs shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 min-w-0">
              <Pin size={14} className="shrink-0 text-amber-500" />
              <span className="font-semibold shrink-0">Class Notice:</span>
              <span className="truncate">
                Science Project submissions & Practical Notebooks due this Friday by 3:00 PM (Lab 204).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPinnedNoticeDismissed(true)}
              className="text-amber-600 dark:text-amber-400 hover:opacity-70 p-1 cursor-pointer shrink-0"
              title="Dismiss Notice"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Trust & Security Intranet Pill */}
        <div className="flex justify-center pt-2 select-none">
          <div className="px-3.5 py-1 rounded-full text-[10.5px] font-medium bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 border border-black/5 dark:border-white/5 shadow-2xs">
            <ShieldCheck size={12} className="text-[#007AFF]" />
            <span>DPS Intranet Verified Classroom • 100% Enrolled Students & Faculty Only</span>
          </div>
        </div>

        {/* Message Feed Area (Edge-to-Edge Clean Apple Layout) */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-3 space-y-1 relative">
          {/* Messages Feed */}
          {channelMessages.map((msg, idx) => {
            const isMe =
              currentUser?.username &&
              msg.senderUsername.toLowerCase() === currentUser.username.toLowerCase();
            const prevMsg = channelMessages[idx - 1];
            const isSameSenderAsPrev =
              prevMsg &&
              prevMsg.senderUsername.toLowerCase() === msg.senderUsername.toLowerCase() &&
              msg.timestamp - prevMsg.timestamp < 300000;

            const msgReactions = reactions[msg.id] || [];

            return (
              <MessageBubbleItem
                key={msg.id}
                msg={msg}
                isMe={Boolean(isMe)}
                isSameSenderAsPrev={Boolean(isSameSenderAsPrev)}
                isDark={isDark}
                reactions={msgReactions}
                onToggleReaction={handleToggleReaction}
                onReply={(m) => setReplyingTo(m)}
                onOpenProfile={handleOpenProfileByUsername}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Apple Frosted Input Bar */}
        <div className="flex flex-col shrink-0 border-t border-black/[0.08] dark:border-white/[0.08] backdrop-blur-2xl bg-white/80 dark:bg-[#161618]/80 relative">
          {/* Quick Emoji Bar */}
          {showEmojiPicker && (
            <div className="px-4 py-2 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center gap-3 overflow-x-auto">
              {['❤️', '👍', '💀', '😂', '🔥', '🎉', '📚', '👏', '🚀', '✨'].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setMessageText((prev) => prev + em);
                    inputRef.current?.focus();
                  }}
                  className="text-xl hover:scale-125 transition-transform cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Attachment Popup Menu */}
          {showAttachMenu && (
            <div className="absolute bottom-16 left-3 p-2 rounded-2xl shadow-2xl flex flex-col gap-1.5 z-50 border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl min-w-[200px] animate-scale-in">
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  setMessageText((prev) => `${prev} [Class Photo: Science Lab Experiment 📸]`);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <Camera size={16} className="text-[#007AFF]" />
                <span className="font-medium">Photos & Videos</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  setMessageText((prev) => `${prev} [Document: Term 1 Syllabus PDF 📄]`);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <FileText size={16} className="text-[#AF52DE]" />
                <span className="font-medium">Document Notes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  router.push('/ai-diary');
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <Award size={16} className="text-[#FF9500]" />
                <span className="font-medium">Submit Today's Diary</span>
              </button>
            </div>
          )}

          {/* Replying Preview Bar */}
          {replyingTo && (
            <div className="px-4 py-2 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-1 h-8 rounded-full bg-[#007AFF]" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#007AFF]">
                    Replying to {replyingTo.senderName}
                  </div>
                  <div className="text-xs truncate text-zinc-500 dark:text-zinc-400">
                    {replyingTo.text}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Input Row */}
          <div className="min-h-[64px] px-3 md:px-5 py-2.5 flex items-center gap-2">
            {!canSendMessage ? (
              <div className="w-full py-2.5 px-4 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-between text-xs font-medium gap-3">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <Lock size={14} className="text-amber-500 shrink-0" />
                  <span>Principal Dispatches Channel (Read-Only). Switch to your classroom to chat.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChannelId('channel-class-8g')}
                  className="px-3 py-1 rounded-full bg-[#007AFF] text-white font-semibold text-xs shrink-0 cursor-pointer"
                >
                  Open Class 8-G 💬
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                {/* Apple "+" Button */}
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                  title="Attach"
                >
                  <Plus size={18} />
                </button>

                {/* Apple Emoji Button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                  title="Emoji"
                >
                  <Smile size={19} />
                </button>

                {/* Apple Capsule Input Field */}
                <div className="flex-1 flex items-center rounded-full bg-black/5 dark:bg-white/10 px-4 py-2 border border-black/[0.04] dark:border-white/[0.08] focus-within:ring-2 focus-within:ring-[#007AFF]/40 transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="iMessage"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={isSending}
                    className="w-full text-[15px] bg-transparent focus:outline-none placeholder:text-zinc-400"
                  />
                </div>

                {/* Apple Circular Blue Send Button */}
                {messageText.trim() ? (
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-8 h-8 rounded-full bg-[#007AFF] text-white flex items-center justify-center shrink-0 shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    aria-label="Send message"
                  >
                    <Send size={15} className="ml-0.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMessageText('👋 Hi everyone from Class 8-G!');
                      inputRef.current?.focus();
                    }}
                    className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 text-[#007AFF] flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    title="Quick Wave"
                  >
                    <Mic size={16} />
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* APPLE SLIDING GROUP DETAILS SHEET (Drawer / Details Modal)            */}
      {/* ==================================================================== */}
      {showGroupDetailsSheet && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full sm:w-[420px] md:w-[460px] h-full bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border-l border-black/[0.08] dark:border-white/[0.08] shadow-2xl flex flex-col animate-slideLeft">
            {/* Drawer Header with Apple Drag Handle */}
            <div className="pt-3 pb-2 px-4 border-b border-black/[0.08] dark:border-white/[0.08] shrink-0">
              <div className="w-9 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Classroom Details</span>
                <button
                  type="button"
                  onClick={() => setShowGroupDetailsSheet(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Group Hero Card */}
            <div className="p-5 flex flex-col items-center text-center border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <div
                className="w-20 h-20 rounded-[22px] flex items-center justify-center font-bold text-white text-2xl shadow-xl mb-3 ring-4 ring-[#007AFF]/20"
                style={{
                  backgroundColor: getSenderColor(activeChannel.name),
                }}
              >
                <Users size={36} />
              </div>

              <h3 className="text-lg font-bold flex items-center gap-1.5 leading-tight">
                <span>{activeChannel.name}</span>
                <CheckCircle2 size={16} className="text-[#007AFF] fill-[#007AFF]/20" />
              </h3>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Official DPS Academic Classroom • Grade {activeChannel.grade}
              </p>

              {/* Quick Action Pills (Apple iMessage Style) */}
              <div className="grid grid-cols-4 gap-2.5 mt-4 w-full">
                <button
                  type="button"
                  onClick={() => setActiveCallRoom({ type: 'audio', title: `${activeChannel.name} - Audio Room` })}
                  className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors cursor-pointer"
                >
                  <Phone size={18} className="text-[#007AFF]" />
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">Audio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCallRoom({ type: 'video', title: `${activeChannel.name} - Video Classroom` })}
                  className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors cursor-pointer"
                >
                  <Video size={18} className="text-[#007AFF]" />
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(true)}
                  className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors cursor-pointer"
                >
                  <UserPlus size={18} className="text-[#34C759]" />
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">Add</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToastMessage('Classroom notifications set to all alerts')}
                  className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors cursor-pointer"
                >
                  <Bell size={18} className="text-[#FF9500]" />
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">Mute</span>
                </button>
              </div>
            </div>

            {/* Apple Segmented Tabs: Members | Media | Settings */}
            <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <div className="grid grid-cols-3 p-1 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDrawerActiveTab('members')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerActiveTab === 'members'
                      ? 'bg-white dark:bg-[#2C2C2E] text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Members ({classRoster.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerActiveTab('media')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerActiveTab === 'media'
                      ? 'bg-white dark:bg-[#2C2C2E] text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Media & Docs
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerActiveTab('settings')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    drawerActiveTab === 'settings'
                      ? 'bg-white dark:bg-[#2C2C2E] text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {drawerActiveTab === 'members' && (
                <>
                  {/* Member Roster Search & Filter Chips */}
                  <div className="space-y-2">
                    <div className="flex items-center px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10">
                      <Search size={14} className="text-zinc-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search enrolled members"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full text-xs bg-transparent focus:outline-none placeholder:text-zinc-400"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold">
                      {(['all', 'faculty', 'reps', 'students'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setMemberFilterTab(tab)}
                          className={`px-2.5 py-1 rounded-full capitalize transition-colors cursor-pointer ${
                            memberFilterTab === tab
                              ? 'bg-[#007AFF] text-white shadow-xs'
                              : 'bg-black/5 dark:bg-white/10 text-zinc-500 hover:text-zinc-700'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Member List */}
                  <div className="space-y-1.5">
                    {filteredRoster.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => handleOpenProfileByUsername(member.username)}
                        className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                              style={{ backgroundColor: getSenderColor(member.name) }}
                            >
                              {member.name.slice(0, 1).toUpperCase()}
                            </div>
                            {member.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold truncate leading-tight">
                                {member.name}
                              </span>
                              <CheckCircle2 size={12} className="text-[#007AFF] shrink-0" />
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">
                              @{member.username} • {member.className}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              member.role === 'principal'
                                ? 'bg-red-500/10 border-red-500/30 text-red-600'
                                : member.role === 'faculty'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                                : member.role === 'rep'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                                : 'bg-blue-500/10 border-blue-500/30 text-[#007AFF]'
                            }`}
                          >
                            {member.roleLabel.split(' ')[0]}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/chats?user=${member.username}`);
                            }}
                            className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-[#007AFF] hover:text-white transition-colors text-zinc-500 cursor-pointer"
                            title="Direct Message"
                          >
                            <MessageSquare size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {drawerActiveTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Classroom Photos</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&auto=format&fit=crop&q=80',
                      ].map((imgUrl, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden bg-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt="Class media" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Classroom Documents</h4>
                    <div className="space-y-2">
                      {[
                        { title: 'Term 1 Exam Syllabus 2026.pdf', size: '1.4 MB', date: 'Yesterday' },
                        { title: 'Class 8-G Science Project Guidelines.pdf', size: '2.1 MB', date: '3 days ago' },
                        { title: 'Maths Chapter 4 Practice Sheet.pdf', size: '840 KB', date: 'Last week' },
                      ].map((doc, i) => (
                        <div key={i} className="p-3 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText size={18} className="text-[#AF52DE] shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate">{doc.title}</div>
                              <div className="text-[10px] text-zinc-400">{doc.size} • {doc.date}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setToastMessage(`Downloading ${doc.title}`)}
                            className="text-xs font-semibold text-[#007AFF] hover:underline shrink-0 cursor-pointer"
                          >
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {drawerActiveTab === 'settings' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold">Teacher-Only Broadcast Mode</div>
                        <div className="text-[11px] text-zinc-400">Only Faculty can send messages</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleLock}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          activeChannel.isLocked ? 'bg-[#34C759]' : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                            activeChannel.isLocked ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                      <div>
                        <div className="text-xs font-semibold">Daily Diary Reminders</div>
                        <div className="text-[11px] text-zinc-400">Alerts when classmate uploads diary</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setToastMessage('Diary alerts enabled for Class 8-G')}
                        className="w-11 h-6 rounded-full bg-[#34C759] transition-colors relative cursor-pointer"
                      >
                        <span className="block w-5 h-5 rounded-full bg-white shadow-md translate-x-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs">
                    <div className="font-semibold text-[#007AFF] flex items-center gap-1.5 mb-1">
                      <ShieldCheck size={14} />
                      <span>DPS Cyber Safety & Anti-Bullying Monitored</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      All communications within this classroom are protected by DPS Intranet safety standards. Inappropriate content is automatically flagged.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: VERIFIED STUDENT / FACULTY ID CARD SHEET                    */}
      {/* ==================================================================== */}
      {inspectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 flex flex-col animate-scale-in">
            {/* ID Card Top Ribbon */}
            <div className="p-4 bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Delhi Public School ID</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectedMember(null)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* ID Card Body */}
            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-3">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-xl ring-4 ring-[#007AFF]/25"
                  style={{ backgroundColor: getSenderColor(inspectedMember.name) }}
                >
                  {inspectedMember.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 size={14} />
                </div>
              </div>

              <h3 className="text-base font-bold flex items-center gap-1.5 leading-tight">
                <span>{inspectedMember.name}</span>
                <CheckCircle2 size={15} className="text-[#007AFF] fill-[#007AFF]/20" />
              </h3>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                @{inspectedMember.username} • {inspectedMember.roleLabel}
              </p>

              {/* Verified Trust Seal */}
              <div className="mt-3 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/25 flex items-center gap-1.5">
                <ShieldCheck size={13} />
                <span>Officially Enrolled • DPS Verified</span>
              </div>

              {/* Student Credentials Grid */}
              <div className="grid grid-cols-2 gap-2 w-full mt-4 text-left">
                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Class & Roll</div>
                  <div className="text-xs font-bold mt-0.5">{inspectedMember.className} {inspectedMember.rollNo ? `(#${inspectedMember.rollNo})` : ''}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">House</div>
                  <div className="text-xs font-bold mt-0.5">{inspectedMember.house}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Attendance</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{inspectedMember.attendance}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Spirit Points</div>
                  <div className="text-xs font-bold text-[#FF9500] mt-0.5">{inspectedMember.spiritPoints} pts</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full mt-5">
                <button
                  type="button"
                  onClick={() => {
                    const u = inspectedMember.username;
                    setInspectedMember(null);
                    router.push(`/chats?user=${u}`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0066d6] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Send Direct Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: ADD CLASSMATE MODAL                                         */}
      {/* ==================================================================== */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 flex flex-col animate-scale-in">
            <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Add Classmate to Classroom</h3>
                <p className="text-[11px] text-zinc-400">Search officially enrolled DPS students</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10">
                <Search size={14} className="text-zinc-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search student name or roll..."
                  value={addMemberSearch}
                  onChange={(e) => setAddMemberSearch(e.target.value)}
                  className="w-full text-xs bg-transparent focus:outline-none placeholder:text-zinc-400"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {[
                  { name: 'Ishanvi', username: 'ishanvi', class: 'Class 8-A' },
                  { name: 'Neelam Mokshith Ram', username: 'mokshith7b', class: 'Class 7-B' },
                  { name: 'S. Sahana', username: 'sahana_3009', class: 'Class 9-A' },
                  { name: 'K. Ashwith', username: 'ashwith', class: 'Class 8-G' },
                  { name: 'Rohan R', username: 'rohan728', class: 'Class 8-G' },
                  { name: 'Chandan', username: 'chandan', class: 'Class 8-G' },
                ]
                  .filter((st) =>
                    !addMemberSearch.trim() ||
                    st.name.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
                    st.username.toLowerCase().includes(addMemberSearch.toLowerCase())
                  )
                  .map((candidate) => {
                    const alreadyIn = classRoster.some((m) => m.username.toLowerCase() === candidate.username.toLowerCase());
                    return (
                      <div key={candidate.username} className="pt-1.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs"
                            style={{ backgroundColor: getSenderColor(candidate.name) }}
                          >
                            {candidate.name.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{candidate.name}</div>
                            <div className="text-[11px] text-zinc-400 truncate">@{candidate.username} • {candidate.class}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={alreadyIn}
                          onClick={() => handleAddMemberToClass(candidate.username, candidate.name, candidate.class)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                            alreadyIn
                              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                              : 'bg-[#007AFF] text-white hover:bg-[#0066d6]'
                          }`}
                        >
                          {alreadyIn ? 'Enrolled' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: CREATE CLASSROOM GROUP (Teacher / Admin Flow)               */}
      {/* ==================================================================== */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 flex flex-col animate-scale-in">
            <div className="p-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Create New Classroom Group</h3>
                <p className="text-[11px] text-zinc-400">Delhi Public School Official Academic Room</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Classroom Name</label>
                <input
                  type="text"
                  placeholder="e.g. Class 8-G Mathematics Club 📐"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Grade</label>
                  <select
                    value={newGroupGrade}
                    onChange={(e) => setNewGroupGrade(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none"
                  >
                    {['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'All'].map((g) => (
                      <option key={g} value={g} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Section</label>
                  <select
                    value={newGroupSection}
                    onChange={(e) => setNewGroupSection(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none"
                  >
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Club', 'All'].map((s) => (
                      <option key={s} value={s} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="lockGroupCheck"
                  checked={newGroupIsLocked}
                  onChange={(e) => setNewGroupIsLocked(e.target.checked)}
                  className="rounded text-[#007AFF]"
                />
                <label htmlFor="lockGroupCheck" className="text-xs text-zinc-600 dark:text-zinc-400">
                  Broadcast only (Only teachers can message)
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-semibold hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0066d6] text-white text-xs font-semibold transition-colors shadow-md cursor-pointer"
                >
                  Create Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SIMULATED CALL OVERLAY                                               */}
      {/* ==================================================================== */}
      {activeCallRoom && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-between p-6 animate-fadeIn text-white">
          <div className="text-center pt-8">
            <div className="w-24 h-24 rounded-[28px] bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center mx-auto mb-4 shadow-2xl animate-pulse">
              {activeCallRoom.type === 'video' ? <Video size={42} /> : <Phone size={42} />}
            </div>
            <h3 className="text-xl font-bold">{activeCallRoom.title}</h3>
            <p className="text-xs text-emerald-400 mt-1 font-semibold flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Connected • DPS School Intranet Audio/Video Link</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md text-xs text-white/80 max-w-sm text-center">
            🔒 High-fidelity encrypted calling is active. All members of {activeChannel.name} have been invited.
          </div>

          <div className="pb-8 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveCallRoom(null)}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              title="End Call"
            >
              <Phone size={24} className="rotate-135" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
