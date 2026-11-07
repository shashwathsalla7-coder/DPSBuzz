'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Video,
  ChevronDown,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  CheckCheck,
  Play,
  Share2,
  X,
  MessageSquare,
  Users,
  Pin,
  Camera,
  FileText,
  Award,
  ChevronLeft,
  Minus,
  Square,
  Phone,
  ArrowLeft,
  Circle,
  Star,
  Trash2,
  Volume2,
  Lock,
  Clock,
  Sparkles,
  Edit2,
  MessageSquarePlus,
  PhoneCall,
  Menu,
  ShieldCheck,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Link2,
  Compass,
  Image as ImageIcon,
  Headphones,
  KeyRound,
} from 'lucide-react';

import {
  MessageItem,
  ChatRoom,
  ContactItem,
  StatusItem,
  SidebarTab,
  RightPanel,
} from './components/types';

import {
  CAMPUS_DOODLE_DARK,
  DEMO_CONTACTS,
  DEMO_STATUSES,
  DEMO_CALLS,
  DEMO_COMMUNITIES,
} from './components/constants';

import { SidebarRail } from './components/SidebarRail';
import { MobileBottomNav } from './components/MobileBottomNav';
import { StatusView } from './components/StatusView';
import { CallsView } from './components/CallsView';
import { CommunitiesView } from './components/CommunitiesView';
import { SettingsView } from './components/SettingsView';
import { GroupInfoPanel } from './components/GroupInfoPanel';
import { MediaGalleryPanel } from './components/MediaGalleryPanel';
import { StarredMessagesPanel } from './components/StarredMessagesPanel';
import { NewChatModal } from './components/NewChatModal';
import { ActiveCallOverlay } from './components/ActiveCallOverlay';
import { StatusViewerModal } from './components/StatusViewerModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { VoiceAudioPlayer } from './components/VoiceAudioPlayer';
import { VoiceRecorderBar } from './components/VoiceRecorderBar';
import { PhotoAttachmentModal } from './components/PhotoAttachmentModal';
import { TeacherNoticeModal } from './components/TeacherNoticeModal';
import { PinnedNoticeBanner } from './components/PinnedNoticeBanner';
import { GroupInviteLinkModal } from './components/GroupInviteLinkModal';

import { DataStore, Profile } from '@/lib/dataStore';
import { SchoolFeatures, CampusWireChannel, CampusWireMessage } from '@/lib/schoolFeatures';

// Default Baseline Class Rooms
const BASELINE_CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'channel-class-8g',
    name: 'Class 8-G Official Classroom',
    subtitle: 'Anita Sharma (Faculty) • 39 enrolled students',
    grade: 'Class 8',
    section: 'G',
    avatarColor: '#00a884',
    initials: '8G',
    lastMessage: 'Anita Sharma: English Homework uploaded for Chapter 4.',
    lastTime: '7:40 pm',
    isGroup: true,
    isLocked: true,
    unreadCount: 2,
    isPinned: true,
    description: 'Official academic classroom for DPS Class 8-G. Faculty announcements, fair-copy reminders & datesheets.',
    createdBy: 'Anita Sharma',
    createdAt: '2026-04-01',
    mediaCount: 64,
    members: DEMO_CONTACTS,
    pinnedMessage: {
      id: 'msg-8g-1',
      senderName: 'Anita Sharma (Faculty)',
      text: 'Dear Class 8-G, please complete reading Chapter 4 The Summit Within before tomorrow.',
    },
  },
  {
    id: 'channel-school-broadcast',
    name: 'DPS Official Principal Dispatches',
    subtitle: 'Office of the Principal • 5,500 Students & Faculty',
    avatarColor: '#ea4335',
    initials: 'DP',
    lastMessage: 'Half-Yearly examination instructions & datesheet published.',
    lastTime: '10:00 am',
    isGroup: true,
    isLocked: true,
    isSchoolBroadcast: true,
    unreadCount: 1,
    isPinned: true,
    description: 'Campus-wide announcements from Principal Office. Read-only channel for all 91 classes.',
    mediaCount: 18,
    members: DEMO_CONTACTS.slice(0, 5),
    pinnedMessage: {
      id: 'wmsg-1001',
      senderName: 'Principal Madam (Office)',
      text: 'OFFICIAL CIRCULAR: Half-Yearly practical examinations commence next Monday.',
    },
  },
  {
    id: 'chat-together-forever',
    name: 'Together Forever 🎓',
    subtitle: 'Himaksh, Rishikesh, Rohan, Sri, Shashwath...',
    avatarColor: '#53bdeb',
    initials: 'TF',
    lastMessage: 'Rohan: i remembered',
    lastTime: '8:21 pm',
    isPinned: false,
    isGroup: true,
    unreadCount: 0,
    description: 'The official Together Forever student squad for DPS 2026. Academic updates, cricket banter and campus laughs.',
    createdBy: 'Himaksh',
    createdAt: '2026-06-12',
    mediaCount: 38,
    members: DEMO_CONTACTS.slice(0, 7),
  },
  {
    id: 'channel-class-10a',
    name: 'Class 10-A Titans',
    subtitle: 'Mr. Sharma (Math Faculty) • 44 enrolled students',
    grade: 'Class 10',
    section: 'A',
    avatarColor: '#7c5ce0',
    initials: '10A',
    lastMessage: 'Mr. Sharma: Quadratic equations practice exercises assigned.',
    lastTime: '10:00 am',
    isGroup: true,
    isLocked: false,
    unreadCount: 0,
    description: 'Class 10-A Board Examination Preparation & Daily Homework Circle.',
    members: DEMO_CONTACTS,
  },
  {
    id: 'channel-nursery-a',
    name: 'Nursery-A Little Blossoms',
    subtitle: 'Sunita Madam • Junior Parent-Teacher Circle',
    grade: 'Nursery',
    section: 'A',
    avatarColor: '#ff9f00',
    initials: 'NA',
    lastMessage: 'Sunita Madam: Clay modeling activity photo uploaded.',
    lastTime: '11:15 am',
    isGroup: true,
    isLocked: true,
    targetAudience: 'parents',
    description: 'Private parent-teacher circle for Nursery-A. Daily activities, craft photos, and teacher notes.',
    members: DEMO_CONTACTS.slice(0, 4),
  },
  {
    id: 'chat-himaksh-direct',
    name: 'Himaksh',
    subtitle: 'online',
    avatarColor: '#53bdeb',
    initials: 'HM',
    lastMessage: 'Are we doing robotics prep after school?',
    lastTime: '6:45 pm',
    isGroup: false,
    unreadCount: 1,
  },
  {
    id: 'channel-science-club',
    name: 'DPS Ramanujan Science Club',
    subtitle: 'Faculty & Class 8-10 Members (68 Members)',
    avatarColor: '#00bcd4',
    initials: 'SC',
    lastMessage: 'Robotics workshop registrations open tomorrow.',
    lastTime: '4:15 pm',
    isGroup: true,
    description: 'Ramanujan innovation hub for robotics, AI and science fairs.',
    createdBy: 'Vikas Sir',
    createdAt: '2026-05-10',
    mediaCount: 19,
    members: DEMO_CONTACTS,
  },
];

// Baseline Messages per Room
const BASELINE_MESSAGES_MAP: Record<string, MessageItem[]> = {
  'channel-class-8g': [
    {
      id: 'msg-8g-1',
      senderName: 'Anita Sharma (Faculty)',
      senderRole: 'teacher',
      senderColor: '#e542a3',
      subtitle: 'English Faculty • Verified',
      text: 'Dear Class 8-G, please complete reading Chapter 4 The Summit Within before tomorrow.',
      time: '7:30 pm',
      isStarred: true,
      isPinned: true,
    },
    {
      id: 'msg-8g-2',
      senderName: 'Shashwath',
      senderRole: 'student',
      senderColor: '#53bdeb',
      text: 'Madam, should we also write the word meanings in our fair copy?',
      time: '7:38 pm',
      isMe: true,
    },
    {
      id: 'msg-8g-3',
      senderName: 'Anita Sharma (Faculty)',
      senderRole: 'teacher',
      senderColor: '#e542a3',
      subtitle: 'English Faculty • Verified',
      text: 'Yes Shashwath, only the 6 vocabulary highlights from page 58.',
      time: '7:40 pm',
    },
    {
      id: 'msg-8g-4',
      senderName: 'System',
      senderRole: 'admin',
      text: '🔒 Channel locked by faculty. Only teachers and admins can post announcements.',
      time: '7:45 pm',
      templateType: 'system',
    },
  ],
  'channel-school-broadcast': [
    {
      id: 'wmsg-1001',
      senderName: 'Principal Madam (Office)',
      senderRole: 'admin',
      senderColor: '#ea4335',
      subtitle: 'Head of School • Official',
      text: '📢 OFFICIAL CIRCULAR: Half-Yearly practical examinations commence next Monday. Students must report in formal school uniform with verified admit cards.',
      time: '9:00 am',
      isStarred: true,
      isPinned: true,
      templateType: 'exam',
    },
    {
      id: 'wmsg-1002',
      senderName: 'Principal Madam (Office)',
      senderRole: 'admin',
      senderColor: '#ea4335',
      subtitle: 'Head of School • Official',
      text: '🚌 TRANSPORT ADVISORY: School buses will depart 15 minutes after dispersal on Friday due to Annual Sports Day rehearsal.',
      time: '10:00 am',
      templateType: 'none',
    },
  ],
  'chat-together-forever': [
    {
      id: 'msg-video-1',
      senderName: 'Himaksh',
      senderColor: '#53bdeb',
      text: 'Me in my prime',
      time: '7:04 pm',
      isVideo: true,
      videoDuration: '2:20',
      videoCaption: 'Me in my prime',
    },
    {
      id: 'msg-rohan-1',
      senderName: 'Rohan',
      senderColor: '#53bdeb',
      subtitle: 'Jaddu bhai forever',
      text: 'I will submit the assignment by tomorrow morning.',
      time: '7:09 pm',
    },
    {
      id: 'msg-ak-1',
      senderName: 'Ak 47',
      senderColor: '#ffffff',
      text: 'Cricket team practice starts at 4:30 PM.',
      time: '7:12 pm',
    },
    {
      id: 'msg-rishi-1',
      senderName: 'Rishikesh',
      senderColor: '#f15c6d',
      text: "Rohan, Himaksh, Shashwath, Krishna don't forget to bring chocolates!",
      time: '7:53 pm',
    },
    {
      id: 'msg-rohan-2',
      senderName: 'Rohan',
      senderColor: '#53bdeb',
      text: 'i remembered',
      time: '8:21 pm',
    },
  ],
  'chat-himaksh-direct': [
    {
      id: 'msg-hm-1',
      senderName: 'Himaksh',
      senderColor: '#53bdeb',
      text: 'Bro did you check the Python code for the rover project?',
      time: '6:30 pm',
    },
    {
      id: 'msg-hm-2',
      senderName: 'You',
      text: 'Yes! Added the obstacle sensor logic. Works cleanly.',
      time: '6:40 pm',
      isMe: true,
    },
    {
      id: 'msg-hm-3',
      senderName: 'Himaksh',
      senderColor: '#53bdeb',
      text: 'Are we doing robotics prep after school?',
      time: '6:45 pm',
    },
  ],
};

export default function CampusWireDesktopPage() {
  // --------------------------------------------------------------------------
  // 1. User & Authentication State
  // --------------------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [userName, setUserName] = useState('Shashwath');
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'admin' | 'parent'>('student');

  // Role helper flags
  const isAdmin = useMemo(() => {
    const un = (currentUser?.username || userName).toLowerCase().trim();
    return un === 'shashwath71845' || un === 'madam_principal' || currentUser?.role === 'admin';
  }, [currentUser, userName]);

  const isTeacher = useMemo(() => {
    const un = (currentUser?.username || userName).toLowerCase().trim();
    return isAdmin || un.startsWith('teacher_') || un.includes('madam') || un.includes('sir') || currentUser?.role === 'teacher';
  }, [currentUser, userName, isAdmin]);

  const isParent = useMemo(() => {
    const un = (currentUser?.username || userName).toLowerCase().trim();
    return un.startsWith('parent_') || (currentUser?.role as string) === 'parent';
  }, [currentUser, userName]);

  // --------------------------------------------------------------------------
  // 2. Navigation & View State
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<SidebarTab>('chats');
  const [rightPanel, setRightPanel] = useState<RightPanel>('none');
  const [activeChatId, setActiveChatId] = useState<string>('channel-class-8g');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<MessageItem | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'classrooms' | 'groups' | 'parents'>('all');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [doodleWallpaperEnabled, setDoodleWallpaperEnabled] = useState(true);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showMobileOverflowMenu, setShowMobileOverflowMenu] = useState(false);

  // Modals & Interactive Overlays
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [selectedImageToPreview, setSelectedImageToPreview] = useState<string | null>(null);
  const [isTeacherNoticeModalOpen, setIsTeacherNoticeModalOpen] = useState(false);
  const [teacherNoticeDefaultType, setTeacherNoticeDefaultType] = useState<'homework' | 'attendance' | 'exam' | 'transport'>('homework');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<{ contactName: string; type: 'voice' | 'video' } | null>(null);
  const [viewingStatus, setViewingStatus] = useState<StatusItem | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedVideoModal, setSelectedVideoModal] = useState<{ title: string; duration: string } | null>(null);
  const [selectedImageLightbox, setSelectedImageLightbox] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteCodeFromUrl, setInviteCodeFromUrl] = useState<string | null>(null);
  const [inviteModalData, setInviteModalData] = useState<any | null>(null);
  const [invitePasswordInput, setInvitePasswordInput] = useState('');
  const [inviteJoiningLoading, setInviteJoiningLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [userAbout, setUserAbout] = useState('DPS Buzz Student • Ready to excel 🎓');

  // DOM References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // 3. Chat Rooms & Messages Map State (Cloudflare D1 & Local Storage Synchronized)
  // --------------------------------------------------------------------------
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(BASELINE_CHAT_ROOMS);
  const [messagesMap, setMessagesMap] = useState<Record<string, MessageItem[]>>(BASELINE_MESSAGES_MAP);

  // Initialize User from DataStore & localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const u = DataStore.getCurrentUser();
      if (u && u.username && u.username !== 'guest') {
        setCurrentUser(u);
        setUserName(u.fullName || u.username);
        if (u.role === 'admin' || u.username === 'shashwath71845' || u.username === 'madam_principal') {
          setUserRole('admin');
        } else if (u.role === 'teacher' || u.username.startsWith('teacher_')) {
          setUserRole('teacher');
        } else if ((u.role as string) === 'parent' || u.username.startsWith('parent_')) {
          setUserRole('parent');
        } else {
          setUserRole('student');
        }
      }
    } catch {
      // Fallback
    }

    // Load cached rooms and messages from localStorage
    try {
      const cachedRooms = localStorage.getItem('dpsbuzz_campus_wire_rooms');
      if (cachedRooms) {
        const parsed = JSON.parse(cachedRooms);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatRooms(parsed);
        }
      }
      const cachedMsgs = localStorage.getItem('dpsbuzz_campus_wire_messages_map');
      if (cachedMsgs) {
        const parsed = JSON.parse(cachedMsgs);
        if (parsed && typeof parsed === 'object') {
          setMessagesMap(parsed);
        }
      }
    } catch {
      // Ignore parse error
    }

    // Fetch live channels & messages from Cloudflare D1 Backend
    const fetchCloudflareData = async () => {
      try {
        const [channelsRes, messagesRes] = await Promise.all([
          fetch('/api/campus?action=campus_wire_channels'),
          fetch('/api/campus?action=campus_wire_messages'),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          if (Array.isArray(cData.channels) && cData.channels.length > 0) {
            setChatRooms((prev) => {
              const d1Channels: ChatRoom[] = cData.channels.map((ch: any) => ({
                id: ch.id,
                name: ch.name,
                subtitle: `${ch.grade || 'Official'} ${ch.section ? `• Section ${ch.section}` : ''} • ${ch.memberCount || 40} members`,
                grade: ch.grade,
                section: ch.section,
                avatarColor: ch.id.includes('8g') ? '#00a884' : ch.id.includes('nursery') ? '#ff9f00' : '#7c5ce0',
                initials: ch.grade ? ch.grade.replace(/[^0-9]/g, '') || ch.name.slice(0, 2).toUpperCase() : 'DP',
                lastMessage: ch.lastMessage || 'Channel created',
                lastTime: ch.lastMessageTime || 'Just now',
                isGroup: true,
                isLocked: Boolean(ch.isLocked),
                isPinned: ch.id === 'channel-class-8g' || ch.id === 'channel-school-broadcast',
                members: DEMO_CONTACTS,
              }));

              // Merge keeping any custom non-channel groups like Together Forever
              const merged = [...d1Channels];
              prev.forEach((p) => {
                if (!merged.some((m) => m.id === p.id)) {
                  merged.push(p);
                }
              });
              try {
                localStorage.setItem('dpsbuzz_campus_wire_rooms', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }

        if (messagesRes.ok) {
          const mData = await messagesRes.json();
          const rawMsgs = mData.wireMessages || mData.messages || mData.campus_wireMessages || [];
          if (Array.isArray(rawMsgs) && rawMsgs.length > 0) {
            setMessagesMap((prev) => {
              const updated = { ...prev };
              const curU = (currentUser?.username || userName || '').toLowerCase().trim();
              const curN = (userName || currentUser?.fullName || '').toLowerCase().trim();

              rawMsgs.forEach((raw: any) => {
                const cId = raw.channelId || 'channel-class-8g';
                const sUser = (raw.senderUsername || '').toLowerCase().trim();
                const sName = (raw.senderName || '').toLowerCase().trim();
                const isMine = Boolean(
                  (curU !== '' && sUser === curU) ||
                  (curU !== '' && sName === curU) ||
                  (curN !== '' && sName === curN && sUser !== 'system' && sUser !== 'madam_principal')
                );

                const item: MessageItem = {
                  id: raw.id,
                  senderName: raw.senderName || raw.senderUsername || 'DPS Member',
                  senderUsername: raw.senderUsername,
                  senderRole: raw.senderRole,
                  senderColor: raw.senderRole === 'teacher' ? '#e542a3' : raw.senderRole === 'admin' ? '#ea4335' : '#53bdeb',
                  text: raw.text,
                  time: raw.createdAt ? new Date(raw.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Now',
                  timestamp: raw.timestamp,
                  templateType: raw.templateType || 'none',
                  isMe: isMine,
                };
                if (!updated[cId]) {
                  updated[cId] = [item];
                } else if (!updated[cId].some((m) => m.id === item.id)) {
                  updated[cId] = [...updated[cId], item];
                }
              });
              try {
                localStorage.setItem('dpsbuzz_campus_wire_messages_map', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        }
      } catch (err) {
        console.warn('Campus Wire D1 initial fetch note:', err);
      }
    };

    fetchCloudflareData();

    // Check URL parameters for invite links and active room
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const inv = urlParams.get('invite');
      if (inv) {
        setInviteCodeFromUrl(inv);
        fetch(`/api/campus?action=get_invite_link_details&code=${encodeURIComponent(inv)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.invite) {
              setInviteModalData(d.invite);
            }
          })
          .catch(() => {});
      }
      const room = urlParams.get('activeRoom');
      if (room) {
        setActiveChatId(room);
        setIsMobileChatOpen(true);
      }
    }
  }, []);

  // --------------------------------------------------------------------------
  // Real-Time Incremental Message Polling (Cloudflare D1 Synchronizer)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!activeChatId) return;

    const pollInterval = setInterval(async () => {
      try {
        const curList = messagesMap[activeChatId] || [];
        const highestTs = curList.length > 0 ? Math.max(...curList.map((m) => m.timestamp || 0)) : 0;

        const res = await fetch(
          `/api/campus?action=wire_messages&channelId=${encodeURIComponent(activeChatId)}&after=${highestTs}`
        );
        if (res.ok) {
          const d = await res.json();
          const incoming = d.wireMessages || d.messages || [];
          if (incoming.length > 0) {
            const curU = (currentUser?.username || userName || '').toLowerCase().trim();
            const curN = (userName || currentUser?.fullName || '').toLowerCase().trim();

            setMessagesMap((prev) => {
              const existing = prev[activeChatId] || [];
              const existingIds = new Set(existing.map((m) => m.id));
              const newItems: MessageItem[] = [];

              for (const raw of incoming) {
                if (!existingIds.has(raw.id)) {
                  const sUser = (raw.senderUsername || '').toLowerCase().trim();
                  const sName = (raw.senderName || '').toLowerCase().trim();
                  const isMine = Boolean(
                    (curU !== '' && sUser === curU) ||
                    (curU !== '' && sName === curU) ||
                    (curN !== '' && sName === curN && sUser !== 'system' && sUser !== 'madam_principal')
                  );

                  newItems.push({
                    id: raw.id,
                    senderName: raw.senderName || raw.senderUsername || 'DPS Member',
                    senderUsername: raw.senderUsername,
                    senderRole: raw.senderRole,
                    senderColor: raw.senderRole === 'teacher' ? '#e542a3' : raw.senderRole === 'admin' ? '#ea4335' : '#53bdeb',
                    text: raw.text,
                    time: raw.createdAt
                      ? new Date(raw.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                      : 'Now',
                    timestamp: raw.timestamp,
                    templateType: raw.templateType || 'none',
                    isMe: isMine,
                  });
                }
              }

              if (newItems.length > 0) {
                const updated = {
                  ...prev,
                  [activeChatId]: [...existing, ...newItems],
                };
                try {
                  localStorage.setItem('dpsbuzz_campus_wire_messages_map', JSON.stringify(updated));
                } catch {}
                return updated;
              }
              return prev;
            });
          }
        }
      } catch {
        // Polling notice
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [activeChatId, currentUser, userName, messagesMap]);

  const activeMessages = messagesMap[activeChatId] || [];
  const activeRoom = chatRooms.find((r) => r.id === activeChatId) || chatRooms[0];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeChatId]);

  // --------------------------------------------------------------------------
  // 4. Message Dispatch Handlers (Text, Voice, Photos, Reactions)
  // --------------------------------------------------------------------------
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = messageText.trim();
    if (!cleanText) return;

    // Check lock permission: if room is locked and user is neither teacher nor admin
    if (activeRoom.isLocked && !isTeacher && !isAdmin) {
      alert('This classroom channel is locked by faculty. Only teachers and school administration can send announcements.');
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

    const effectiveUsername = currentUser?.username || userName.toLowerCase().replace(/\s+/g, '_') || 'student';
    const effectiveName = currentUser?.fullName || userName || 'DPS Student';

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderName: effectiveName,
      senderUsername: effectiveUsername,
      senderRole: userRole,
      senderColor: isTeacher ? '#e542a3' : isAdmin ? '#ea4335' : '#53bdeb',
      text: cleanText,
      time: timeStr,
      timestamp: Date.now(),
      isMe: true,
      quotedAuthor: replyingTo ? replyingTo.senderName : undefined,
      quotedText: replyingTo ? replyingTo.text : undefined,
    };

    // Optimistic UI Append
    setMessagesMap((prev) => {
      const updated = {
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), newMsg],
      };
      try {
        localStorage.setItem('dpsbuzz_campus_wire_messages_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setChatRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === activeChatId
          ? { ...r, lastMessage: `You: ${cleanText}`, lastTime: timeStr }
          : r
      );
      try {
        localStorage.setItem('dpsbuzz_campus_wire_rooms', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setMessageText('');
    setReplyingTo(null);
    inputRef.current?.focus();

    // Persist to Cloudflare D1 Backend
    try {
      await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_wire_message',
          channelId: activeChatId,
          senderUsername: effectiveUsername,
          senderName: effectiveName,
          senderRole: userRole,
          senderClass: activeRoom.grade || 'Class 8-G',
          text: cleanText,
          templateType: 'none',
        }),
      });
    } catch (err) {
      console.warn('D1 backend sync note:', err);
    }
  };

  // Real Voice Note Dispatch
  const handleSendVoiceNote = (audioUrl: string, durationStr: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    const effectiveUsername = currentUser?.username || userName.toLowerCase().replace(/\s+/g, '_') || 'student';
    const effectiveName = currentUser?.fullName || userName || 'DPS Student';

    const newMsg: MessageItem = {
      id: `msg-voice-${Date.now()}`,
      senderName: effectiveName,
      senderUsername: effectiveUsername,
      senderRole: userRole,
      senderColor: isTeacher ? '#e542a3' : isAdmin ? '#ea4335' : '#53bdeb',
      text: `🎤 Academic Voice Note (${durationStr})`,
      time: timeStr,
      timestamp: Date.now(),
      isMe: true,
      isVoiceNote: true,
      voiceDuration: durationStr,
      audioUrl: audioUrl || undefined,
    };

    setMessagesMap((prev) => {
      const updated = {
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), newMsg],
      };
      try {
        localStorage.setItem('dpsbuzz_campus_wire_messages_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setChatRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === activeChatId
          ? { ...r, lastMessage: `You: 🎤 Voice note (${durationStr})`, lastTime: timeStr }
          : r
      );
      try {
        localStorage.setItem('dpsbuzz_campus_wire_rooms', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setIsRecordingVoice(false);

    try {
      fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_wire_message',
          channelId: activeChatId,
          senderUsername: effectiveUsername,
          senderName: effectiveName,
          senderRole: userRole,
          senderClass: activeRoom.grade || 'Class 8-G',
          text: `🎤 Academic Voice Note (${durationStr})`,
        }),
      });
    } catch {}
  };

  // Photo File Selected Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageToPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowAttachMenu(false);
  };

  // Send Photo Attachment
  const handleSendPhotoAttachment = (caption: string) => {
    if (!selectedImageToPreview) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    const effectiveUsername = currentUser?.username || userName.toLowerCase().replace(/\s+/g, '_') || 'student';
    const effectiveName = currentUser?.fullName || userName || 'DPS Student';

    const newMsg: MessageItem = {
      id: `msg-img-${Date.now()}`,
      senderName: effectiveName,
      senderUsername: effectiveUsername,
      senderRole: userRole,
      senderColor: isTeacher ? '#e542a3' : isAdmin ? '#ea4335' : '#53bdeb',
      text: caption || '📷 Photo Attachment',
      time: timeStr,
      timestamp: Date.now(),
      isMe: true,
      isImage: true,
      imageUrl: selectedImageToPreview,
    };

    setMessagesMap((prev) => {
      const updated = {
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), newMsg],
      };
      try {
        localStorage.setItem('dpsbuzz_campus_wire_messages_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setChatRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === activeChatId
          ? { ...r, lastMessage: `You: 📷 ${caption || 'Photo'}`, lastTime: timeStr }
          : r
      );
      try {
        localStorage.setItem('dpsbuzz_campus_wire_rooms', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_wire_message',
          channelId: activeChatId,
          senderUsername: effectiveUsername,
          senderName: effectiveName,
          senderRole: userRole,
          senderClass: activeRoom.grade || 'Class 8-G',
          text: caption || '📷 Official Circular Attachment',
          imageUrl: selectedImageToPreview,
        }),
      });
    } catch {}

    setSelectedImageToPreview(null);
  };

  // Teacher Official Dispatch Publish
  const handleTeacherDispatch = async (data: {
    text: string;
    templateType: 'homework' | 'attendance' | 'exam' | 'none';
    broadcastToAll: boolean;
  }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

    const newMsg: MessageItem = {
      id: `msg-dispatch-${Date.now()}`,
      senderName: `${userName} (Faculty)`,
      senderUsername: currentUser?.username || 'teacher_faculty',
      senderRole: 'teacher',
      senderColor: '#e542a3',
      subtitle: 'Verified Faculty',
      text: data.text,
      time: timeStr,
      timestamp: Date.now(),
      isMe: true,
      isStarred: true,
      isPinned: true,
      templateType: data.templateType,
    };

    // Update active chat pinned notice and message thread
    setMessagesMap((prev) => {
      const updated = {
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), newMsg],
      };
      try {
        localStorage.setItem('dpsbuzz_campus_wire_messages_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setChatRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === activeChatId || (data.broadcastToAll && r.isGroup)
          ? {
              ...r,
              lastMessage: `Faculty: ${data.text.slice(0, 70)}...`,
              lastTime: timeStr,
              pinnedMessage: {
                id: newMsg.id,
                senderName: newMsg.senderName,
                text: data.text.slice(0, 90),
              },
            }
          : r
      );
      try {
        localStorage.setItem('dpsbuzz_campus_wire_rooms', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setIsTeacherNoticeModalOpen(false);

    // Persist via Cloudflare D1
    try {
      await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_wire_message',
          channelId: activeChatId,
          senderUsername: currentUser?.username || 'teacher_faculty',
          senderName: `${currentUser?.fullName || userName} (Faculty)`,
          senderRole: 'teacher',
          senderClass: activeRoom.grade || 'Faculty',
          text: data.text,
          templateType: data.templateType,
          broadcastToAll: data.broadcastToAll,
        }),
      });
    } catch (err) {
      console.warn('Notice sync note:', err);
    }
  };

  // Toggle 1-Click Broadcast Lock
  const handleToggleChannelLock = async (locked: boolean) => {
    if (!isTeacher && !isAdmin) {
      alert('Only teachers and school administrators can lock or unlock classroom channels.');
      return;
    }

    // Optimistic UI update
    setChatRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === activeChatId ? { ...r, isLocked: locked } : r
      );
      try {
        localStorage.setItem('dpsbuzz_campus_wire_rooms', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Insert System Announcement into the Thread
    const systemNotice: MessageItem = {
      id: `sys-${Date.now()}`,
      senderName: 'System Notice',
      senderRole: 'admin',
      text: locked
        ? '🔒 Channel locked by faculty. Only teachers and admins can post announcements.'
        : '🔓 Channel unlocked by faculty. All enrolled students can now send messages and ask questions.',
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
      timestamp: Date.now(),
      templateType: 'system',
    };

    setMessagesMap((prev) => {
      const updated = {
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), systemNotice],
      };
      try {
        localStorage.setItem('dpsbuzz_campus_wire_messages_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Call Cloudflare D1 Backend
    try {
      await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_channel_lock',
          channelId: activeChatId,
          isLocked: locked,
          requesterUsername: currentUser?.username || 'shashwath71845',
          requesterRole: userRole,
        }),
      });
    } catch (err) {
      console.warn('Lock sync error:', err);
    }
  };

  // Pin / Unpin Announcement
  const handlePinMessage = (msg: MessageItem) => {
    setChatRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === activeChatId
          ? {
              ...r,
              pinnedMessage: {
                id: msg.id,
                senderName: msg.senderName,
                text: msg.text.slice(0, 100),
              },
            }
          : r
      );
      try {
        localStorage.setItem('dpsbuzz_campus_wire_rooms', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSelectedMessageId(null);
  };

  const handleUnpinMessage = () => {
    setChatRooms((prev) => {
      const updated = prev.map((r) =>
        r.id === activeChatId ? { ...r, pinnedMessage: undefined } : r
      );
      try {
        localStorage.setItem('dpsbuzz_campus_wire_rooms', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Reaction Handler
  const handleToggleReaction = useCallback((msgId: string, emoji: string) => {
    setMessagesMap((prev) => {
      const roomMsgs = prev[activeChatId] || [];
      const updated = {
        ...prev,
        [activeChatId]: roomMsgs.map((m) => {
          if (m.id !== msgId) return m;
          const currentReactions = m.reactions || [];
          const match = currentReactions.find((r) => r.emoji === emoji);
          if (match) {
            const hasUser = match.users.includes('me');
            if (hasUser) {
              const updatedUsers = match.users.filter((u) => u !== 'me');
              if (updatedUsers.length === 0) {
                return { ...m, reactions: currentReactions.filter((r) => r.emoji !== emoji) };
              }
              return {
                ...m,
                reactions: currentReactions.map((r) =>
                  r.emoji === emoji ? { ...r, count: r.count - 1, users: updatedUsers } : r
                ),
              };
            } else {
              return {
                ...m,
                reactions: currentReactions.map((r) =>
                  r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, 'me'] } : r
                ),
              };
            }
          } else {
            return {
              ...m,
              reactions: [...currentReactions, { emoji, count: 1, users: ['me'] }],
            };
          }
        }),
      };
      try {
        localStorage.setItem('dpsbuzz_campus_wire_messages_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [activeChatId]);

  // Star message handler
  const handleToggleStar = (msgId: string) => {
    setMessagesMap((prev) => {
      const updated = {
        ...prev,
        [activeChatId]: (prev[activeChatId] || []).map((m) =>
          m.id === msgId ? { ...m, isStarred: !m.isStarred } : m
        ),
      };
      try {
        localStorage.setItem('dpsbuzz_campus_wire_messages_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Delete message handler
  const handleDeleteMessage = (msgId: string) => {
    setMessagesMap((prev) => {
      const updated = {
        ...prev,
        [activeChatId]: (prev[activeChatId] || []).filter((m) => m.id !== msgId),
      };
      try {
        localStorage.setItem('dpsbuzz_campus_wire_messages_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSelectedMessageId(null);
  };

  // --------------------------------------------------------------------------
  // 5. Filtered Rooms & Categorized Lists
  // --------------------------------------------------------------------------
  const filteredRooms = useMemo(() => {
    return chatRooms.filter((r) => {
      if (activeFilter === 'unread' && !(r.unreadCount && r.unreadCount > 0)) return false;
      if (activeFilter === 'classrooms' && !r.grade) return false;
      if (activeFilter === 'groups' && (!r.isGroup || r.grade)) return false;
      if (activeFilter === 'parents') {
        const isParentTarget = r.targetAudience === 'parents' || r.id.includes('nursery') || r.isSchoolBroadcast;
        if (!isParentTarget) return false;
      }
      if (!searchQuery.trim()) return true;
      return (
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.grade && r.grade.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [chatRooms, searchQuery, activeFilter]);

  // Starred messages across all channels
  const allStarredMessages = useMemo(() => {
    const list: Array<{ chatName: string; message: MessageItem }> = [];
    Object.entries(messagesMap).forEach(([roomId, msgs]) => {
      const room = chatRooms.find((r) => r.id === roomId);
      const name = room ? room.name : 'Class Chat';
      msgs.forEach((m) => {
        if (m.isStarred) {
          list.push({ chatName: name, message: m });
        }
      });
    });
    return list;
  }, [messagesMap, chatRooms]);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden select-none bg-[#0b141a] text-[#e9edef]"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Hidden File Picker for Real Photo / Attachment Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ==================================================================== */}
      {/* 1. TOP BAR: RESPONSIVE (APPLE HIG TRANSLUCENT NAVIGATION)            */}
      {/* ==================================================================== */}
      {/* Desktop macOS / Windows Glass Topbar */}
      <div className="hidden md:flex h-9 w-full items-center justify-between px-3 shrink-0 border-b border-[#222d34] bg-[#111b21]/95 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="flex items-center gap-1.5 text-xs text-[#8696a0] hover:text-white transition-colors"
            title="Return to DPS Buzz Main Portal"
          >
            <ArrowLeft size={13} />
            <span className="font-medium text-[11px]">Back to DPS Buzz</span>
          </Link>
          <span className="text-[#8696a0] text-xs">|</span>
          <span className="text-xs font-semibold text-[#e9edef] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
            DPS Buzz Campus Wire Core
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-[#8696a0]">
            91 Classes Active
          </span>
        </div>

        {/* Current User Role Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#8696a0]">
            <span>Active as:</span>
            <span className="font-semibold text-white flex items-center gap-1">
              {userName}
              {isAdmin ? (
                <span className="text-[10px] px-1.5 rounded bg-[#ea4335]/20 text-[#ea4335] font-bold">Admin</span>
              ) : isTeacher ? (
                <span className="text-[10px] px-1.5 rounded bg-[#00a884]/20 text-[#00a884] font-bold">Faculty</span>
              ) : isParent ? (
                <span className="text-[10px] px-1.5 rounded bg-[#ff9f00]/20 text-[#ff9f00] font-bold">Parent</span>
              ) : (
                <span className="text-[10px] px-1.5 rounded bg-[#53bdeb]/20 text-[#53bdeb] font-bold">Student</span>
              )}
            </span>
          </div>

          <div className="flex items-center">
            <button className="w-8 h-7 flex items-center justify-center text-[#8696a0] hover:bg-[#202c33] transition-colors cursor-pointer rounded">
              <Minus size={12} />
            </button>
            <button className="w-8 h-7 flex items-center justify-center text-[#8696a0] hover:bg-[#202c33] transition-colors cursor-pointer rounded">
              <Square size={10} />
            </button>
            <Link
              href="/home"
              className="w-8 h-7 flex items-center justify-center text-[#8696a0] hover:bg-[#ea4335] hover:text-white transition-colors cursor-pointer rounded"
              title="Close"
            >
              <X size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Top App Bar (Only when chat is not open) */}
      {!isMobileChatOpen && (
        <header className="md:hidden h-14 px-4 flex items-center justify-between border-b border-[#222d34] bg-[#111b21] shrink-0 z-30">
          <div className="flex items-center gap-2">
            <Link
              href="/home"
              className="p-1 -ml-1 text-[#8696a0] hover:text-white"
              title="Back to DPS Buzz"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-[#e9edef]">Campus Wire</span>
              {isTeacher ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00a884]/20 text-[#00a884] font-bold">Faculty</span>
              ) : isParent ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff9f00]/20 text-[#ff9f00] font-bold">Parent</span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1 text-[#8696a0] relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-full hover:text-white cursor-pointer active:scale-95"
              title="Camera / Photo"
            >
              <Camera size={20} />
            </button>
            <button
              onClick={() => {
                const searchEl = document.getElementById('chat-search-input');
                searchEl?.focus();
              }}
              className="p-2.5 rounded-full hover:text-white cursor-pointer active:scale-95"
              title="Search"
            >
              <Search size={20} />
            </button>
            <button
              onClick={() => setShowMobileOverflowMenu(!showMobileOverflowMenu)}
              className="p-2.5 rounded-full hover:text-white cursor-pointer active:scale-95"
              title="Menu"
            >
              <MoreVertical size={20} />
            </button>

            {/* Mobile 3-Dot Overflow Menu Dropdown */}
            {showMobileOverflowMenu && (
              <div
                className="absolute right-0 top-12 w-52 py-2 rounded-xl bg-[#202c33] border border-[#222d34] shadow-2xl z-50 animate-fadeIn"
                onClick={() => setShowMobileOverflowMenu(false)}
              >
                {isTeacher && (
                  <button
                    onClick={() => {
                      setTeacherNoticeDefaultType('homework');
                      setIsTeacherNoticeModalOpen(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#00a884] hover:bg-[#2a3942] cursor-pointer flex items-center gap-2"
                  >
                    <Megaphone size={14} />
                    <span>Publish Faculty Notice</span>
                  </button>
                )}
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="w-full px-4 py-2.5 text-left text-xs text-[#e9edef] hover:bg-[#2a3942] cursor-pointer"
                >
                  New Classroom / Group
                </button>
                <button
                  onClick={() => setRightPanel('starred')}
                  className="w-full px-4 py-2.5 text-left text-xs text-[#e9edef] hover:bg-[#2a3942] cursor-pointer"
                >
                  Starred circulars
                </button>
                <button
                  onClick={() => setRightPanel('settings')}
                  className="w-full px-4 py-2.5 text-left text-xs text-[#e9edef] hover:bg-[#2a3942] cursor-pointer"
                >
                  Settings
                </button>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-full px-4 py-2.5 text-left text-xs text-[#e9edef] hover:bg-[#2a3942] cursor-pointer"
                >
                  Profile & Status
                </button>
                <div className="h-px bg-[#222d34] my-1" />
                <Link
                  href="/home"
                  className="block w-full px-4 py-2.5 text-left text-xs text-[#00a884] hover:bg-[#2a3942]"
                >
                  Exit to DPS Buzz Home
                </Link>
              </div>
            )}
          </div>
        </header>
      )}

      {/* ==================================================================== */}
      {/* 2. MAIN CONTAINER                                                    */}
      {/* ==================================================================== */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SLIM LEFT RAIL (Desktop Only) */}
        <SidebarRail
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (rightPanel === 'settings') setRightPanel('none');
          }}
          onOpenSettings={() => setRightPanel('settings')}
          onOpenStarred={() => setRightPanel('starred')}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          unreadCount={3}
          missedCallsCount={0}
          hasUnreadStatus={true}
        />

        {/* SECONDARY SIDEBAR / MAIN TAB VIEW */}
        <aside
          className={`w-full md:w-[360px] lg:w-[410px] flex flex-col shrink-0 relative ${
            isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* TAB 1: CHATS LIST */}
          {activeTab === 'chats' && (
            <div className="flex flex-col h-full bg-[#111b21] border-r border-[#222d34]">
              {/* Desktop Header */}
              <div className="hidden md:flex h-[60px] px-4 items-center justify-between bg-[#202c33] border-b border-[#222d34] shrink-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-[#e9edef]">Chats</h1>
                  <span className="text-[11px] font-medium text-[#8696a0] bg-[#2a3942] px-2 py-0.5 rounded-full">
                    {filteredRooms.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#8696a0]">
                  {isTeacher && (
                    <button
                      onClick={() => {
                        setTeacherNoticeDefaultType('homework');
                        setIsTeacherNoticeModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#00a884]/20 hover:bg-[#00a884]/30 text-[#00a884] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Quick Faculty Notice"
                    >
                      <Megaphone size={13} />
                      <span>Notice</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="p-1.5 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors cursor-pointer"
                    title="New Chat / Group"
                  >
                    <MessageSquare size={19} />
                  </button>
                  <button
                    onClick={() => setRightPanel('settings')}
                    className="p-1.5 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors cursor-pointer"
                    title="Menu"
                  >
                    <MoreVertical size={19} />
                  </button>
                </div>
              </div>

              {/* Search Box & Apple HIG Segmented Controls */}
              <div className="p-2 border-b border-[#222d34] flex flex-col gap-2 bg-[#111b21]">
                <div className="flex items-center px-3 py-2 rounded-xl bg-[#202c33]">
                  <Search size={16} className="text-[#8696a0] mr-3 shrink-0" />
                  <input
                    id="chat-search-input"
                    type="text"
                    placeholder="Search 91 classrooms, notices or peers"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs text-[#e9edef] bg-transparent focus:outline-none placeholder-[#8696a0]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-[#8696a0] hover:text-white cursor-pointer p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Pills with Apple HIG Segmented Switch */}
                <div className="flex items-center gap-1.5 px-1 py-0.5 overflow-x-auto no-scrollbar">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'unread', label: 'Unread' },
                    { key: 'classrooms', label: 'Classes (91)' },
                    { key: 'groups', label: 'Study Groups' },
                    { key: 'parents', label: 'Parents Feed' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveFilter(tab.key as any)}
                      className={`px-3 py-1.2 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 active:scale-95 ${
                        activeFilter === tab.key
                          ? 'bg-[#00a884] text-[#111b21] font-bold shadow-xs'
                          : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parent Mode Callout Banner */}
              {activeFilter === 'parents' && (
                <div className="p-3 bg-[#182229] border-b border-[#222d34] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#ff9f00]" />
                    <span className="text-[#e9edef] font-medium">Official Parent Direct Line</span>
                  </div>
                  <button
                    onClick={() => {
                      const anitaRoom = chatRooms.find((r) => r.id === 'channel-class-8g');
                      if (anitaRoom) {
                        setActiveChatId(anitaRoom.id);
                        setIsMobileChatOpen(true);
                      }
                    }}
                    className="text-[11px] font-semibold text-[#00a884] hover:underline cursor-pointer"
                  >
                    Contact Faculty
                  </button>
                </div>
              )}

              {/* Chat Rooms List Items */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/40">
                {filteredRooms.map((room) => {
                  const isActive = room.id === activeChatId;
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        setActiveChatId(room.id);
                        setIsMobileChatOpen(true);
                        setSelectedMessageId(null);
                      }}
                      className={`w-full text-left px-4 py-3.5 flex items-center gap-3.5 transition-colors cursor-pointer active:bg-[#202c33] ${
                        isActive ? 'md:bg-[#2a3942] bg-[#202c33]' : 'hover:bg-[#202c33]'
                      }`}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm shadow-xs ring-1 ring-white/10 relative"
                        style={{ backgroundColor: room.avatarColor }}
                      >
                        {room.initials}
                        {room.isLocked && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#111b21] flex items-center justify-center text-[#00a884] border border-[#222d34]">
                            <Lock size={9} />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold truncate text-[#e9edef] flex items-center gap-1.5">
                            {room.name}
                            {room.isSchoolBroadcast && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ea4335]/20 text-[#ea4335] font-bold">
                                Official
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-[#8696a0] shrink-0 ml-1">
                            {room.lastTime}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs truncate max-w-[210px] text-[#8696a0]">
                            {room.lastMessage}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            {room.isPinned && <Pin size={12} className="text-[#8696a0]" />}
                            {room.unreadCount && room.unreadCount > 0 ? (
                              <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#00a884] text-[#111b21] font-bold text-[10px] flex items-center justify-center">
                                {room.unreadCount}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Floating Action Button (FAB) for New Chat */}
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="md:hidden absolute bottom-5 right-5 w-14 h-14 rounded-full bg-[#00a884] text-[#111b21] shadow-2xl flex items-center justify-center cursor-pointer active:scale-90 transition-transform z-30"
                title="New Chat"
              >
                <MessageSquarePlus size={24} />
              </button>
            </div>
          )}

          {/* TAB 2: STATUS / UPDATES */}
          {activeTab === 'status' && (
            <div className="relative h-full flex flex-col">
              <StatusView
                onSelectStatus={(st) => setViewingStatus(st)}
                onCreateStatus={() => {}}
              />
              {/* Mobile FAB for Status */}
              <div className="md:hidden absolute bottom-5 right-5 flex flex-col gap-3 z-30">
                <button
                  onClick={() => {
                    const mySt = DEMO_STATUSES[0];
                    setViewingStatus(mySt);
                  }}
                  className="w-10 h-10 rounded-full bg-[#202c33] text-white shadow-lg flex items-center justify-center cursor-pointer active:scale-90 transition-transform mx-auto"
                  title="Pencil / Text Status"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-full bg-[#00a884] text-[#111b21] shadow-2xl flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  title="Camera Status"
                >
                  <Camera size={24} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CALLS */}
          {activeTab === 'calls' && (
            <div className="relative h-full flex flex-col">
              <CallsView
                onStartCall={(contactName, type) => {
                  setActiveCall({ contactName, type });
                }}
              />
              {/* Mobile FAB for Call */}
              <button
                onClick={() => setActiveCall({ contactName: 'Himaksh', type: 'voice' })}
                className="md:hidden absolute bottom-5 right-5 w-14 h-14 rounded-full bg-[#00a884] text-[#111b21] shadow-2xl flex items-center justify-center cursor-pointer active:scale-90 transition-transform z-30"
                title="New Call"
              >
                <PhoneCall size={24} />
              </button>
            </div>
          )}

          {/* TAB 4: COMMUNITIES */}
          {activeTab === 'communities' && (
            <CommunitiesView
              onSelectGroup={(grpName) => {
                const found = chatRooms.find((r) => r.name.toLowerCase().includes(grpName.toLowerCase()));
                if (found) {
                  setActiveChatId(found.id);
                  setActiveTab('chats');
                  setIsMobileChatOpen(true);
                } else {
                  const newRoom: ChatRoom = {
                    id: `chat-${Date.now()}`,
                    name: grpName,
                    subtitle: 'DPS Community Group',
                    avatarColor: '#00a884',
                    initials: grpName.slice(0, 2).toUpperCase(),
                    lastMessage: 'Welcome to ' + grpName,
                    lastTime: 'Now',
                    isGroup: true,
                  };
                  setChatRooms([newRoom, ...chatRooms]);
                  setActiveChatId(newRoom.id);
                  setActiveTab('chats');
                  setIsMobileChatOpen(true);
                }
              }}
            />
          )}

          {/* Mobile Bottom Navigation (Visible when Chat is Closed) */}
          <MobileBottomNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (rightPanel === 'settings') setRightPanel('none');
            }}
            unreadCount={3}
            missedCallsCount={0}
            hasUnreadStatus={true}
          />
        </aside>

        {/* ================================================================== */}
        {/* RIGHT MAIN PANEL: Active Chat Canvas                               */}
        {/* ================================================================== */}
        <main
          className={`flex-1 flex flex-col relative w-full h-full ${
            isMobileChatOpen ? 'flex' : 'hidden md:flex'
          }`}
          style={{ backgroundColor: '#0b141a' }}
        >
          {/* Campus Wire Header (Apple HIG Frosted Bar) */}
          <div className="h-[60px] px-2 sm:px-4 flex items-center justify-between z-10 shrink-0 border-b border-[#222d34] bg-[#202c33]/95 backdrop-blur-xl">
            {/* Group Identity & Member Subtitle */}
            <div
              onClick={() => setRightPanel(rightPanel === 'group-info' ? 'none' : 'group-info')}
              className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer hover:opacity-90 transition-opacity flex-1"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileChatOpen(false);
                }}
                className="p-2 -ml-1 text-[#8696a0] hover:text-white md:hidden shrink-0 cursor-pointer active:scale-95 min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Back to Chats"
              >
                <ChevronLeft size={24} />
              </button>

              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm shadow-xs relative"
                style={{ backgroundColor: activeRoom.avatarColor }}
              >
                {activeRoom.initials}
                {activeRoom.isLocked && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#111b21] flex items-center justify-center text-[#00a884] border border-[#222d34]">
                    <Lock size={8} />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold truncate leading-tight text-[#e9edef] flex items-center gap-1.5">
                  {activeRoom.name}
                  {activeRoom.isLocked && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00a884]/20 text-[#00a884] font-semibold">
                      Broadcast Only
                    </span>
                  )}
                </h2>
                <p className="text-xs truncate leading-tight mt-0.5 text-[#8696a0]">
                  {activeRoom.subtitle}
                </p>
              </div>
            </div>

            {/* Right Action Icons (Teacher Lock Toggle & Calling) */}
            <div className="flex items-center gap-1 sm:gap-2 text-[#8696a0] shrink-0">
              {/* Teacher 1-Click Lock Toggle Button in Header */}
              {(isTeacher || isAdmin) && activeRoom.isGroup && (
                <button
                  type="button"
                  onClick={() => handleToggleChannelLock(!activeRoom.isLocked)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeRoom.isLocked
                      ? 'bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884]/30'
                      : 'bg-[#2a3942] text-[#8696a0] hover:text-white'
                  }`}
                  title={activeRoom.isLocked ? 'Unlock Channel (Allow Student Messages)' : 'Lock Channel (Broadcast Only)'}
                >
                  <Lock size={13} />
                  <span className="hidden sm:inline">
                    {activeRoom.isLocked ? 'Locked' : 'Open'}
                  </span>
                </button>
              )}

              {/* Faculty Notice Shortcut */}
              {(isTeacher || isAdmin) && (
                <button
                  type="button"
                  onClick={() => {
                    setTeacherNoticeDefaultType('homework');
                    setIsTeacherNoticeModalOpen(true);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:text-white hover:bg-[#2a3942] transition-colors cursor-pointer active:scale-90"
                  title="Publish Notice / Homework"
                >
                  <Megaphone size={18} className="text-[#00a884]" />
                </button>
              )}

              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:text-white hover:bg-[#2a3942] text-[#38bdf8] transition-colors cursor-pointer active:scale-90"
                title="Group Invite Link (Generate, Password, Admin Rights)"
              >
                <Link2 size={18} />
              </button>

              <button
                onClick={() => setActiveCall({ contactName: activeRoom.name, type: 'video' })}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:text-white hover:bg-[#2a3942] transition-colors cursor-pointer active:scale-90"
                title="Video Call"
              >
                <Video size={18} />
              </button>

              <button
                onClick={() => setActiveCall({ contactName: activeRoom.name, type: 'voice' })}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:text-white hover:bg-[#2a3942] transition-colors cursor-pointer active:scale-90"
                title="Voice Call"
              >
                <Phone size={17} />
              </button>

              <button
                onClick={() => setRightPanel('media-gallery')}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:text-white hover:bg-[#2a3942] transition-colors cursor-pointer active:scale-90"
                title="Media and Docs"
              >
                <Search size={18} />
              </button>

              <button
                onClick={() => setRightPanel(rightPanel === 'group-info' ? 'none' : 'group-info')}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:text-white hover:bg-[#2a3942] transition-colors cursor-pointer active:scale-90"
                title="Chat info"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          {/* Pinned Circular / Notice Banner */}
          {activeRoom.pinnedMessage && (
            <PinnedNoticeBanner
              pinnedNotice={activeRoom.pinnedMessage}
              canUnpin={isTeacher || isAdmin}
              onJumpToMessage={(id) => {
                const el = document.getElementById(id);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setSelectedMessageId(id);
              }}
              onUnpin={handleUnpinMessage}
            />
          )}

          {/* Tiled Campus Wire Doodle Wallpaper Area */}
          <div
            onClick={() => setSelectedMessageId(null)}
            className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-10 py-4 space-y-1 relative"
            style={{
              backgroundColor: '#0b141a',
              backgroundImage: doodleWallpaperEnabled ? `url("${CAMPUS_DOODLE_DARK}")` : 'none',
              backgroundRepeat: 'repeat',
              backgroundSize: '440px 440px',
            }}
          >
            {/* Campus Wire Date Separator Pill */}
            <div className="flex justify-center my-3">
              <span className="px-3 py-1 rounded-[7.5px] text-xs font-medium uppercase tracking-wider bg-[#182229] text-[#8696a0] shadow-2xs">
                Today
              </span>
            </div>

            {/* Message Feed */}
            {activeMessages.map((msg, idx) => {
              const prev = activeMessages[idx - 1];
              const myUsername = (currentUser?.username || userName || '').toLowerCase().trim();
              const myName = (userName || currentUser?.fullName || '').toLowerCase().trim();
              const msgUser = (msg.senderUsername || '').toLowerCase().trim();
              const msgSenderName = (msg.senderName || '').toLowerCase().trim();

              const isMe =
                msg.isMe === true ||
                (myUsername !== '' && msgUser === myUsername) ||
                (myUsername !== '' && msgSenderName === myUsername) ||
                (myName !== '' && msgSenderName === myName && msgUser !== 'system' && msgUser !== 'madam_principal');

              const isSameAsPrev = prev && prev.senderName === msg.senderName;
              const isSelected = selectedMessageId === msg.id;

              // System Announcement Pill
              if (msg.templateType === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="px-4 py-1.5 rounded-xl bg-[#182229]/90 border border-white/10 text-xs text-[#e9edef] max-w-md text-center shadow-xs">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  id={msg.id}
                  className={`flex items-start gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${
                    isSameAsPrev ? 'mt-0.5' : 'mt-2.5'
                  }`}
                >
                  {/* Left Avatar for First Message of Cluster */}
                  {!isMe && (
                    <div className="w-7 shrink-0">
                      {!isSameAsPrev ? (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[11px] shadow-xs"
                          style={{ backgroundColor: msg.senderColor || '#53bdeb' }}
                        >
                          {msg.senderName.slice(0, 1).toUpperCase()}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className="flex flex-col max-w-[88%] sm:max-w-[70%] md:max-w-[62%] group relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMessageId(isSelected ? null : msg.id);
                      }}
                      className={`px-3 py-1.5 text-sm transition-all relative rounded-2xl cursor-pointer ${
                        isMe ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-xs' : 'bg-[#202c33] text-[#e9edef] rounded-tl-xs border border-white/5'
                      } ${isSelected ? 'ring-2 ring-[#00a884]' : ''}`}
                      style={{ boxShadow: '0 1px 0.5px rgba(11,20,26,0.25)' }}
                    >
                      {/* Sender Name & Role Badges Header */}
                      {!isMe && !isSameAsPrev && (
                        <div className="mb-1 flex items-center gap-1.5 leading-tight">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: msg.senderColor || '#53bdeb' }}
                          >
                            {msg.senderName}
                          </span>
                          {msg.senderRole === 'teacher' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00a884]/20 text-[#00a884] font-bold">
                              Faculty
                            </span>
                          )}
                          {msg.senderRole === 'admin' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ea4335]/20 text-[#ea4335] font-bold">
                              Principal Office
                            </span>
                          )}
                        </div>
                      )}

                      {/* Quoted Message Preview */}
                      {msg.quotedAuthor && (
                        <div className="mb-1.5 p-1.5 rounded-lg text-xs border-l-[3.5px] border-[#53bdeb] bg-[#182229]">
                          <div className="font-semibold text-[11px] text-[#53bdeb]">
                            {msg.quotedAuthor}
                          </div>
                          <div className="text-[11px] truncate text-[#8696a0]">
                            {msg.quotedText}
                          </div>
                        </div>
                      )}

                      {/* Photo Image Card */}
                      {msg.imageUrl && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageLightbox(msg.imageUrl || null);
                          }}
                          className="mb-2 relative rounded-xl overflow-hidden bg-black/40 border border-white/10 group/img cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.imageUrl}
                            alt="Attached file"
                            className="max-h-64 w-full object-cover rounded-xl group-hover/img:scale-102 transition-transform duration-200"
                          />
                        </div>
                      )}

                      {/* Video Media Card (Interactive Playback) */}
                      {msg.isVideo && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVideoModal({
                              title: msg.videoCaption || 'Prime Campus Highlight',
                              duration: msg.videoDuration || '2:20',
                            });
                          }}
                          className="mb-2 relative rounded-xl overflow-hidden bg-black/50 border border-white/10 group/vid cursor-pointer active:scale-98 transition-transform"
                        >
                          <div className="h-44 sm:h-56 w-full bg-gradient-to-b from-stone-800 to-stone-900 flex items-center justify-center relative">
                            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white group-hover/vid:scale-110 transition-transform">
                              <Play size={22} className="ml-0.5 fill-white" />
                            </div>
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-medium flex items-center gap-1">
                              <Video size={10} />
                              <span>{msg.videoDuration || '2:20'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Voice Note Audio Player */}
                      {msg.isVoiceNote && (
                        <VoiceAudioPlayer
                          audioUrl={msg.audioUrl}
                          duration={msg.voiceDuration || '0:08'}
                          isMe={isMe}
                        />
                      )}

                      {/* Message Text Body */}
                      <div className="whitespace-pre-wrap break-words leading-relaxed text-[13.5px]">
                        {msg.text}
                      </div>

                      {/* Timestamp, Star & Blue Checks */}
                      <div className="flex items-center justify-end gap-1 mt-0.5 float-right ml-2 text-[11px] text-[#8696a0]">
                        {msg.isStarred && (
                          <Star size={11} className="text-[#8696a0] fill-[#8696a0]" />
                        )}
                        <span>{msg.time}</span>
                        {isMe && <CheckCheck size={14} className="text-[#53bdeb] ml-0.5" />}
                      </div>

                      {/* Touch & Hover Action Bar (Visible on Hover OR on Tap/Touch) */}
                      <div
                        className={`absolute top-1 ${
                          isSelected ? 'flex' : 'hidden group-hover:flex'
                        } items-center gap-1 px-2 py-1 rounded-xl shadow-xl z-20 bg-[#202c33] border border-[#222d34] ${
                          isMe ? '-left-32 sm:-left-36' : '-right-32 sm:-right-36'
                        } animate-fadeIn`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleToggleReaction(msg.id, '👍')}
                          className="text-sm hover:scale-125 transition-transform cursor-pointer p-0.5"
                          title="React 👍"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleToggleReaction(msg.id, '❤️')}
                          className="text-sm hover:scale-125 transition-transform cursor-pointer p-0.5"
                          title="React ❤️"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={() => handleToggleStar(msg.id)}
                          className="p-1 hover:text-[#00a884] text-[#8696a0] cursor-pointer"
                          title={msg.isStarred ? 'Unstar' : 'Star message'}
                        >
                          <Star size={13} className={msg.isStarred ? 'fill-[#00a884] text-[#00a884]' : ''} />
                        </button>
                        {(isTeacher || isAdmin) && (
                          <button
                            onClick={() => handlePinMessage(msg)}
                            className="p-1 hover:text-[#00a884] text-[#8696a0] cursor-pointer"
                            title="Pin as Circular"
                          >
                            <Pin size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setReplyingTo(msg);
                            setSelectedMessageId(null);
                            inputRef.current?.focus();
                          }}
                          className="text-[11px] font-medium text-[#8696a0] hover:text-white px-1 cursor-pointer"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 hover:text-[#ea4335] text-[#8696a0] cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Reaction Badges */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {msg.reactions.map((r, rIdx) => (
                          <button
                            key={rIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReaction(msg.id, r.emoji);
                            }}
                            className="px-2 py-0.5 rounded-full text-[11px] border border-[#222d34] bg-[#202c33] text-[#e9edef] flex items-center gap-1 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                          >
                            <span>{r.emoji}</span>
                            <span className="font-semibold text-[10px] text-[#8696a0]">
                              {r.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ================================================================ */}
          {/* FOOTER INPUT BAR / BROADCAST LOCK BANNER / VOICE RECORDER        */}
          {/* ================================================================ */}
          {isRecordingVoice ? (
            <VoiceRecorderBar
              onCancel={() => setIsRecordingVoice(false)}
              onSendVoiceNote={handleSendVoiceNote}
            />
          ) : activeRoom.isLocked && !isTeacher && !isAdmin ? (
            /* Student Lock Banner: Apple Frosted Pill */
            <div className="h-[62px] px-4 flex items-center justify-center bg-[#182229] border-t border-[#222d34]">
              <div className="flex items-center gap-2 text-xs text-[#8696a0] bg-[#202c33] px-4 py-2 rounded-2xl border border-white/5">
                <Lock size={15} className="text-[#00a884] shrink-0" />
                <span>Only teachers and school administration can send messages in this channel.</span>
              </div>
            </div>
          ) : (
            /* Normal Input Bar */
            <div className="flex flex-col shrink-0 border-t border-[#222d34] bg-[#202c33] relative">
              {/* Attachment Drawer Popover */}
              {showAttachMenu && (
                <div className="absolute bottom-16 left-3 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 z-50 border border-[#222d34] bg-[#202c33] min-w-[220px] animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs hover:bg-[#2a3942] transition-colors cursor-pointer text-left text-[#e9edef] active:scale-95"
                  >
                    <Camera size={18} className="text-[#53bdeb]" />
                    <span>Photos & Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      setMessageText((prev) => `${prev} [Document: Class Homework PDF]`);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs hover:bg-[#2a3942] transition-colors cursor-pointer text-left text-[#e9edef] active:scale-95"
                  >
                    <FileText size={18} className="text-[#9c27b0]" />
                    <span>Document / Circular</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      setMessageText((prev) => `${prev} [Student Diary Submission]`);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs hover:bg-[#2a3942] transition-colors cursor-pointer text-left text-[#e9edef] active:scale-95"
                  >
                    <Award size={18} className="text-[#ff9f00]" />
                    <span>Class Diary Photo</span>
                  </button>
                </div>
              )}

              {/* Quick Emoji Tray */}
              {showEmojiTray && (
                <div className="px-3 py-2 border-b border-[#222d34] flex items-center gap-3 bg-[#111b21] overflow-x-auto no-scrollbar">
                  {['😀', '😂', '💀', '❤️', '👍', '🔥', '🎉', '📚', '👏', '🚀', '🙏', '💯'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setMessageText((prev) => prev + em);
                        inputRef.current?.focus();
                      }}
                      className="w-9 h-9 flex items-center justify-center text-xl hover:scale-125 active:scale-95 transition-transform cursor-pointer shrink-0"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {/* Quoted Message Preview Bar */}
              {replyingTo && (
                <div className="px-4 py-2 border-b border-[#222d34] flex items-center justify-between bg-[#182229]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-8 rounded-full bg-[#53bdeb]" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#53bdeb]">
                        Replying to {replyingTo.senderName}
                      </div>
                      <div className="text-xs truncate text-[#8696a0]">
                        {replyingTo.text}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1.5 rounded-full text-[#8696a0] hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="h-[62px] px-2 sm:px-4 flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-[#8696a0] hover:text-white transition-colors cursor-pointer shrink-0 active:scale-95"
                  title="Attach File or Photo"
                >
                  <Paperclip size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmojiTray(!showEmojiTray)}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-[#8696a0] hover:text-white transition-colors cursor-pointer shrink-0 active:scale-95"
                  title="Emoji"
                >
                  <Smile size={20} />
                </button>

                <div className="flex-1 flex items-center rounded-2xl px-3 py-2 bg-[#2a3942]">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={
                      activeRoom.isLocked && (isTeacher || isAdmin)
                        ? 'Type announcement as verified faculty...'
                        : 'Type a message'
                    }
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full text-sm text-[#e9edef] bg-transparent focus:outline-none placeholder-[#8696a0]"
                  />
                </div>

                {messageText.trim() ? (
                  <button
                    type="submit"
                    className="w-11 h-11 rounded-full text-white bg-[#00a884] hover:bg-[#008f6f] transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center shadow-md"
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRecordingVoice(true)}
                    className="w-11 h-11 rounded-full text-[#8696a0] hover:text-white hover:bg-[#2a3942] transition-colors cursor-pointer shrink-0 flex items-center justify-center active:scale-95"
                    title="Record Voice Note"
                  >
                    <Mic size={20} />
                  </button>
                )}
              </form>
            </div>
          )}
        </main>

        {/* ================================================================== */}
        {/* RIGHT DRAWER: FULL-SCREEN RESPONSIVE SHEETS                        */}
        {/* ================================================================== */}
        {rightPanel === 'group-info' && (
          <GroupInfoPanel
            chat={activeRoom}
            isTeacher={isTeacher}
            isAdmin={isAdmin}
            onClose={() => setRightPanel('none')}
            onOpenMediaGallery={() => setRightPanel('media-gallery')}
            onStartCall={(type) => setActiveCall({ contactName: activeRoom.name, type })}
            onAddMember={() => setIsInviteModalOpen(true)}
            onOpenInviteModal={() => setIsInviteModalOpen(true)}
            onToggleLock={handleToggleChannelLock}
            onQuickDispatch={(type) => {
              setTeacherNoticeDefaultType(type);
              setIsTeacherNoticeModalOpen(true);
            }}
          />
        )}

        {rightPanel === 'media-gallery' && (
          <MediaGalleryPanel
            chatName={activeRoom.name}
            onClose={() => setRightPanel('none')}
          />
        )}

        {rightPanel === 'starred' && (
          <StarredMessagesPanel
            starredMessages={allStarredMessages}
            onClose={() => setRightPanel('none')}
            onUnstar={(id) => handleToggleStar(id)}
            onJumpToChat={(cName) => {
              const r = chatRooms.find((cr) => cr.name === cName);
              if (r) {
                setActiveChatId(r.id);
                setIsMobileChatOpen(true);
              }
              setRightPanel('none');
            }}
          />
        )}

        {rightPanel === 'settings' && (
          <div className="fixed inset-0 z-40 md:relative md:inset-auto w-full md:w-[360px] lg:w-[400px] h-full flex flex-col shrink-0 animate-slideLeft">
            <SettingsView
              onClose={() => setRightPanel('none')}
              currentDoodleEnabled={doodleWallpaperEnabled}
              onToggleDoodle={(en) => setDoodleWallpaperEnabled(en)}
            />
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODALS & OVERLAYS                                                    */}
      {/* ==================================================================== */}
      {/* Photo Attachment Preview & Send Modal */}
      {selectedImageToPreview && (
        <PhotoAttachmentModal
          imageSrc={selectedImageToPreview}
          onClose={() => setSelectedImageToPreview(null)}
          onSend={handleSendPhotoAttachment}
        />
      )}

      {/* Teacher Official Notice Dispatch Modal */}
      {isTeacherNoticeModalOpen && (
        <TeacherNoticeModal
          channelName={activeRoom.name}
          defaultType={teacherNoticeDefaultType}
          onClose={() => setIsTeacherNoticeModalOpen(false)}
          onDispatch={handleTeacherDispatch}
        />
      )}

      {/* Group Invite Link Generation & Sharing Modal */}
      {isInviteModalOpen && (
        <GroupInviteLinkModal
          chat={activeRoom}
          currentUserUsername={currentUser?.username || userName}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}

      {/* Invite Link Join Dialog (Prompt from URL ?invite=CODE) */}
      {inviteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-[#161f2e] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#fbbf24] uppercase tracking-wider flex items-center gap-1.5">
                <Link2 size={14} />
                Classroom Invitation
              </span>
              <button
                onClick={() => setInviteModalData(null)}
                className="text-[#94a3b8] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-center space-y-2 py-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#4f46e5] flex items-center justify-center font-bold text-white text-xl shadow-lg border border-white/10">
                {inviteModalData.grade ? inviteModalData.grade.replace(/[^0-9]/g, '') : 'DP'}
              </div>
              <h3 className="text-base font-bold text-white">{inviteModalData.channelName}</h3>
              <p className="text-xs text-[#94a3b8]">{inviteModalData.memberCount || 40} members enrolled</p>
              <div className="pt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  inviteModalData.roleGranted === 'admin'
                    ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30'
                    : 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30'
                }`}>
                  {inviteModalData.roleGranted === 'admin' ? 'Classroom Admin Invitation ⭐️' : 'Student Member Invitation'}
                </span>
              </div>
            </div>

            {inviteError && (
              <div className="p-3 rounded-lg bg-[#f87171]/15 border border-[#f87171]/30 text-xs text-[#f87171] flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            {inviteModalData.hasPassword && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#94a3b8] flex items-center gap-1">
                  <KeyRound size={12} className="text-[#fbbf24]" />
                  Enter Passcode for this Link:
                </label>
                <input
                  type="password"
                  placeholder="Passcode..."
                  value={invitePasswordInput}
                  onChange={(e) => setInvitePasswordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-white/10 text-xs text-white outline-none focus:border-[#fbbf24]"
                />
              </div>
            )}

            <button
              onClick={async () => {
                setInviteJoiningLoading(true);
                setInviteError(null);
                try {
                  const res = await fetch('/api/campus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'join_via_invite_link',
                      inviteCode: inviteCodeFromUrl,
                      username: currentUser?.username || userName || 'student',
                      fullName: currentUser?.fullName || userName || 'Student',
                      password: invitePasswordInput.trim(),
                    }),
                  });
                  const d = await res.json();
                  if (d.success) {
                    if (d.pendingApproval) {
                      alert(d.message || 'Join request submitted! Group admins will review your request.');
                    } else {
                      alert(`Enrolled successfully in ${inviteModalData.channelName}!`);
                      setActiveChatId(inviteModalData.channelId);
                      setIsMobileChatOpen(true);
                    }
                    setInviteModalData(null);
                  } else {
                    setInviteError(d.error || 'Failed to join group.');
                  }
                } catch {
                  setInviteError('Network error joining group.');
                } finally {
                  setInviteJoiningLoading(false);
                }
              }}
              disabled={inviteJoiningLoading}
              className="w-full py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              {inviteJoiningLoading ? 'Enrolling...' : inviteModalData.requireApproval ? 'Submit Join Request' : 'Join Classroom Group'}
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox */}
      {selectedImageLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImageLightbox(null)}
        >
          <button
            onClick={() => setSelectedImageLightbox(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImageLightbox}
            alt="Enlarged circular attachment"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* New Chat & New Group Modal */}
      {isNewChatModalOpen && (
        <NewChatModal
          onClose={() => setIsNewChatModalOpen(false)}
          onSelectContact={(c) => {
            const existing = chatRooms.find((r) => r.name === c.name);
            if (existing) {
              setActiveChatId(existing.id);
              setIsMobileChatOpen(true);
            } else {
              const newRoom: ChatRoom = {
                id: `chat-${Date.now()}`,
                name: c.name,
                subtitle: c.about || 'Available',
                avatarColor: c.avatarColor,
                initials: c.initials,
                lastMessage: 'Tap to start conversation',
                lastTime: 'Now',
                isGroup: false,
              };
              setChatRooms([newRoom, ...chatRooms]);
              setActiveChatId(newRoom.id);
              setIsMobileChatOpen(true);
            }
            setIsNewChatModalOpen(false);
          }}
          onCreateNewGroup={(groupName: string, selectedMembers: ContactItem[]) => {
            const newGroup: ChatRoom = {
              id: `group-${Date.now()}`,
              name: groupName,
              subtitle: selectedMembers.map((m) => m.name).join(', '),
              avatarColor: '#00a884',
              initials: groupName.slice(0, 2).toUpperCase(),
              lastMessage: 'Group created',
              lastTime: 'Now',
              isGroup: true,
              members: selectedMembers,
            };
            setChatRooms([newGroup, ...chatRooms]);
            setActiveChatId(newGroup.id);
            setIsMobileChatOpen(true);
            setIsNewChatModalOpen(false);
          }}
        />
      )}

      {/* Simulated Active Voice / Video Call Overlay */}
      {activeCall && (
        <ActiveCallOverlay
          contactName={activeCall.contactName}
          callType={activeCall.type}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {/* Story Viewer Modal */}
      {viewingStatus && (
        <StatusViewerModal
          status={viewingStatus}
          onClose={() => setViewingStatus(null)}
          onReply={(replyText) => {
            setMessageText(`Replying to story: ${replyText}`);
            setViewingStatus(null);
            inputRef.current?.focus();
          }}
        />
      )}

      {/* Video Player Modal */}
      {selectedVideoModal && (
        <VideoPlayerModal
          title={selectedVideoModal.title}
          duration={selectedVideoModal.duration}
          onClose={() => setSelectedVideoModal(null)}
        />
      )}

      {/* User Profile Editor Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
          <div className="w-full max-w-sm bg-[#111b21] rounded-2xl border border-[#222d34] flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#222d34]">
              <h3 className="text-base font-semibold text-[#e9edef]">Profile & Status</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-[#8696a0] hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center my-6">
              <div className="w-24 h-24 rounded-full bg-[#00a884] text-white font-bold text-3xl flex items-center justify-center shadow-lg relative ring-4 ring-[#00a884]/20">
                {userName.slice(0, 2).toUpperCase()}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#202c33] text-white flex items-center justify-center shadow-md cursor-pointer border border-[#222d34]"
                  title="Change avatar"
                >
                  <Camera size={14} />
                </button>
              </div>
              <span className="text-xs font-semibold text-[#00a884] mt-2 capitalize">
                {userRole} Account
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#8696a0] font-medium block mb-1">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#202c33] text-sm text-[#e9edef] border border-[#222d34] outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#8696a0] font-medium block mb-1">About / Status</label>
                <input
                  type="text"
                  value={userAbout}
                  onChange={(e) => setUserAbout(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#202c33] text-sm text-[#e9edef] border border-[#222d34] outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
