'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
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
  Maximize2,
  Volume2,
  Phone,
  ArrowLeft,
  Circle,
  Filter,
} from 'lucide-react';

// ============================================================================
// AUTHENTIC WHATSAPP DOODLE WALLPAPER (Tiled SVG Data URI)
// ============================================================================
const WHATSAPP_DOODLE_DARK = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='440' height='440' viewBox='0 0 440 440' fill='none' stroke='%23ffffff' stroke-opacity='0.055' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'><path d='M35 25 h38 a10 10 0 0 1 10 10 v18 a10 10 0 0 1 -10 10 h-22 l-14 10 v-10 h-2 a10 10 0 0 1 -10 -10 v-18 a10 10 0 0 1 10 -10 z'/><circle cx='54' cy='44' r='2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='64' cy='44' r='2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='74' cy='44' r='2' fill='%23ffffff' fill-opacity='0.055'/><path d='M150 32 h30 v26 a14 14 0 0 1 -14 14 h-2 a14 14 0 0 1 -14 -14 v-26 z'/><path d='M180 38 h8 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 h-8'/><path d='M158 24 c0 -5 4 -5 4 -10'/><path d='M168 24 c0 -5 4 -5 4 -10'/><rect x='260' y='28' width='52' height='32' rx='12'/><path d='M272 38 v12 M266 44 h12'/><circle cx='298' cy='40' r='2.5' fill='%23ffffff' fill-opacity='0.055'/><circle cx='304' cy='48' r='2.5' fill='%23ffffff' fill-opacity='0.055'/><path d='M370 50 a22 22 0 0 1 44 0 v14'/><rect x='365' y='56' width='9' height='16' rx='3'/><rect x='410' y='56' width='9' height='16' rx='3'/><circle cx='60' cy='155' r='18'/><polygon points='60,145 68,151 65,160 55,160 52,151'/><line x1='60' y1='145' x2='60' y2='137'/><line x1='68' y1='151' x2='76' y2='148'/><line x1='65' y1='160' x2='71' y2='168'/><line x1='55' y1='160' x2='49' y2='168'/><line x1='52' y1='151' x2='44' y2='148'/><path d='M155 135 l32 10 l-20 32 z'/><path d='M155 135 a36 36 0 0 1 32 10'/><circle cx='165' cy='150' r='2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='170' cy='164' r='2' fill='%23ffffff' fill-opacity='0.055'/><rect x='260' y='140' width='42' height='30' rx='5'/><path d='M272 140 l3 -5 h12 l3 5'/><circle cx='281' cy='155' r='8'/><circle cx='294' cy='146' r='1.5' fill='%23ffffff' fill-opacity='0.055'/><circle cx='368' cy='160' r='12'/><circle cx='404' cy='160' r='12'/><path d='M368 160 l16 -18 h12 l7 18 M384 142 l-9 -14 h12 M396 142 l-12 18'/><path d='M42 250 l44 -18 l-22 40 l-7 -13 l-15 -9 z'/><path d='M86 232 l-29 27'/><path d='M150 260 a12 12 0 0 1 20 -8 a16 16 0 0 1 26 5 a10 10 0 0 1 4 18 h-48 a7 7 0 0 1 -2 -15 z'/><polygon points='172,274 166,283 173,283 169,291 180,281 173,281' fill='%23ffffff' fill-opacity='0.055'/><circle cx='272' cy='255' r='16'/><path d='M272 245 v10 l7 5'/><path d='M258 240 l-5 -5 M286 240 l5 -5'/><path d='M365 242 a16 16 0 0 1 26 16 c-3 4 -4 7 -4 12 h-18 c0 -5 -1 -8 -4 -12 a16 16 0 0 1 0 -16 z'/><line x1='374' y1='275' x2='382' y2='275'/><circle cx='50' cy='365' r='4' fill='%23ffffff' fill-opacity='0.055'/><circle cx='68' cy='358' r='4' fill='%23ffffff' fill-opacity='0.055'/><path d='M54 365 v-20 l18 -7 v20 M54 345 l18 -7'/><path d='M165 340 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z' fill='%23ffffff' fill-opacity='0.055'/><circle cx='192' cy='348' r='1.5' fill='%23ffffff' fill-opacity='0.055'/><path d='M250 375 c0 -14 10 -24 19 -30 c9 5 19 16 19 30 h-38 z'/><circle cx='269' cy='360' r='3.5'/><path d='M250 375 l-8 7 v-10 l8 -7 M288 375 l8 7 v-10 l-8 -7'/><path d='M352 348 a6 6 0 0 0 -9 9 l9 9 l9 -9 a6 6 0 0 0 -9 -9 z'/><circle cx='388' cy='360' r='12'/><circle cx='384' cy='356' r='1.2' fill='%23ffffff' fill-opacity='0.055'/><circle cx='392' cy='356' r='1.2' fill='%23ffffff' fill-opacity='0.055'/><path d='M384 364 a5 5 0 0 0 8 0'/><polygon points='105,32 126,22 147,32 126,42'/><path d='M113 37 v8 c0 5 13 8 13 8 s13 -3 13 -8 v-8'/><path d='M205 95 h44 M205 95 a10 8 0 0 0 20 0 a10 8 0 0 0 -20 0 M227 95 a10 8 0 0 0 20 0 a10 8 0 0 0 -20 0'/><path d='M305 92 h20 v8 a10 10 0 0 1 -20 0 z M315 100 v10 M308 110 h14'/><path d='M98 195 l18 -18 l5 5 l-18 18 l-5 2 z'/><path d='M205 200 v17 M212 200 v17 M201 205 h17 M201 212 h17'/></svg>`;

interface MessageItem {
  id: string;
  senderName: string;
  senderColor?: string;
  subtitle?: string;
  text: string;
  time: string;
  isMe?: boolean;
  isVideo?: boolean;
  videoDuration?: string;
  videoCaption?: string;
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
  quotedAuthor?: string;
  quotedText?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  subtitle: string;
  avatarColor: string;
  initials: string;
  lastMessage: string;
  lastTime: string;
  unreadCount?: number;
  isPinned?: boolean;
}

export default function WhatsAppDesktopPage() {
  const [activeChatId, setActiveChatId] = useState<string>('chat-together-forever');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<MessageItem | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Chat Rooms List (With user's reference group "Together Forever" at top)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    {
      id: 'chat-together-forever',
      name: 'Together Forever',
      subtitle: 'Himaksh, Rishikesh, Rohan, Sri, +91 93476 06076, +91 63004 76366...',
      avatarColor: '#53bdeb',
      initials: 'TF',
      lastMessage: 'Rohan: i remembered',
      lastTime: '8:21 pm',
      isPinned: true,
      unreadCount: 0,
    },
    {
      id: 'chat-class-8g',
      name: 'Class 8-G Official Classroom 📘',
      subtitle: 'Anita Madam (Faculty), Shashwath, Rishi + 36 enrolled students',
      avatarColor: '#25d366',
      initials: '8G',
      lastMessage: 'Anita Madam: Homework reminder for English Chapter 4 is uploaded.',
      lastTime: '7:40 pm',
      unreadCount: 2,
    },
    {
      id: 'chat-science-club',
      name: 'DPS Ramanujan Science Club 🔬',
      subtitle: 'Faculty & Class 8-10 Members (68 Members)',
      avatarColor: '#ff9f00',
      initials: 'SC',
      lastMessage: 'Robotics workshop registrations open tomorrow.',
      lastTime: '4:15 pm',
    },
    {
      id: 'chat-school-broadcast',
      name: 'DPS Official Principal Dispatches 📢',
      subtitle: 'Office of the Principal • 5,500 Students & Faculty',
      avatarColor: '#ea4335',
      initials: '📢',
      lastMessage: 'Half-Yearly examination instructions published.',
      lastTime: 'Yesterday',
    },
  ]);

  // Messages in "Together Forever" (Pixel-accurate replication from user's screenshot)
  const [messagesMap, setMessagesMap] = useState<Record<string, MessageItem[]>>({
    'chat-together-forever': [
      {
        id: 'msg-video-1',
        senderName: 'Himaksh',
        senderColor: '#53bdeb',
        text: 'Me in my prime💀💀😂',
        time: '7:04 pm',
        isVideo: true,
        videoDuration: '2:20',
        videoCaption: 'Me in my prime💀💀😂',
        reactions: [{ emoji: '😂', count: 5, users: ['rohan', 'rishi', 'me'] }],
      },
      {
        id: 'msg-rohan-1',
        senderName: 'Rohan',
        senderColor: '#53bdeb',
        subtitle: 'Jaddu bhai forever',
        text: 'Kamboj !!',
        time: '7:09 pm',
      },
      {
        id: 'msg-ak-1',
        senderName: 'Ak 47',
        senderColor: '#ffffff',
        text: 'I think pbks will get hardik and mi will get Paaji and Vinod kumar',
        time: '7:12 pm',
      },
      {
        id: 'msg-ak-2',
        senderName: 'Ak 47',
        senderColor: '#ffffff',
        text: 'shreyas and hardik💀',
        time: '7:15 pm',
      },
      {
        id: 'msg-rishi-1',
        senderName: 'Rishikesh 6f Shashwath Friend',
        senderColor: '#f15c6d',
        text: "Rohan, Himaksh, Shashwath, Krishna don't forget to bring.",
        time: '7:53 pm',
      },
      {
        id: 'msg-rishi-2',
        senderName: 'Rishikesh 6f Shashwath Friend',
        senderColor: '#f15c6d',
        text: 'Chocolates',
        time: '7:53 pm',
      },
      {
        id: 'msg-rohan-2',
        senderName: 'Rohan',
        senderColor: '#53bdeb',
        subtitle: 'Jaddu bhai forever',
        text: 'i remembered',
        time: '8:21 pm',
      },
    ],
    'chat-class-8g': [
      {
        id: 'msg-8g-1',
        senderName: 'Anita Madam (Faculty)',
        senderColor: '#e542a3',
        subtitle: 'English Faculty',
        text: 'Dear Class 8-G, please complete reading Chapter 4 The Summit Within before tomorrow.',
        time: '7:30 pm',
      },
      {
        id: 'msg-8g-2',
        senderName: 'Shashwath',
        senderColor: '#53bdeb',
        text: 'Madam, should we also write the word meanings in our fair copy?',
        time: '7:38 pm',
        isMe: true,
      },
      {
        id: 'msg-8g-3',
        senderName: 'Anita Madam (Faculty)',
        senderColor: '#e542a3',
        subtitle: 'English Faculty',
        text: 'Yes Shashwath, only the 6 vocabulary highlights from page 58.',
        time: '7:40 pm',
      },
    ],
  });

  const activeMessages = messagesMap[activeChatId] || [];
  const activeRoom = chatRooms.find((r) => r.id === activeChatId) || chatRooms[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeChatId]);

  // Send Message Dispatcher
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = messageText.trim();
    if (!cleanText) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      senderName: 'You',
      text: cleanText,
      time: timeStr,
      isMe: true,
      quotedAuthor: replyingTo ? replyingTo.senderName : undefined,
      quotedText: replyingTo ? replyingTo.text : undefined,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg],
    }));

    setChatRooms((prev) =>
      prev.map((r) =>
        r.id === activeChatId
          ? { ...r, lastMessage: `You: ${cleanText}`, lastTime: timeStr }
          : r
      )
    );

    setMessageText('');
    setReplyingTo(null);
    inputRef.current?.focus();
  };

  // Toggle Reaction Handler
  const handleToggleReaction = useCallback((msgId: string, emoji: string) => {
    setMessagesMap((prev) => {
      const roomMsgs = prev[activeChatId] || [];
      return {
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
    });
  }, [activeChatId]);

  // Filtered Chats
  const filteredRooms = useMemo(() => {
    return chatRooms.filter((r) => {
      if (activeFilter === 'unread' && !(r.unreadCount && r.unreadCount > 0)) return false;
      if (activeFilter === 'groups' && !r.name.toLowerCase().includes('class') && !r.name.includes('Together')) return false;
      if (!searchQuery.trim()) return true;
      return (
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [chatRooms, searchQuery, activeFilter]);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden select-none"
      style={{
        backgroundColor: '#0b141a',
        color: '#e9edef',
        fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* ==================================================================== */}
      {/* WINDOW TITLE BAR (Windows WhatsApp Desktop App Aesthetic)            */}
      {/* ==================================================================== */}
      <div
        className="h-8 w-full flex items-center justify-between px-3 shrink-0 border-b border-[#222d34]"
        style={{ backgroundColor: '#111b21' }}
      >
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="flex items-center gap-1.5 text-xs text-[#8696a0] hover:text-white transition-colors"
            title="Return to DPS Buzz Main App"
          >
            <ArrowLeft size={13} />
            <span className="font-medium text-[11px]">Back to DPS Buzz</span>
          </Link>
          <span className="text-[#8696a0] text-xs">|</span>
          <span className="text-xs font-semibold text-[#e9edef] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
            WhatsApp Desktop
          </span>
        </div>

        {/* Windows Window Control Buttons */}
        <div className="flex items-center">
          <button className="w-10 h-8 flex items-center justify-center text-[#8696a0] hover:bg-[#202c33] transition-colors cursor-pointer">
            <Minus size={13} />
          </button>
          <button className="w-10 h-8 flex items-center justify-center text-[#8696a0] hover:bg-[#202c33] transition-colors cursor-pointer">
            <Square size={11} />
          </button>
          <Link
            href="/home"
            className="w-11 h-8 flex items-center justify-center text-[#8696a0] hover:bg-[#e81123] hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X size={14} />
          </Link>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* DESKTOP TWO-COLUMN LAYOUT                                            */}
      {/* ==================================================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ================================================================== */}
        {/* LEFT PANEL: Chat List & Navigation (~380px)                        */}
        {/* ================================================================== */}
        <aside
          className={`w-full md:w-[380px] lg:w-[420px] flex flex-col border-r border-[#222d34] shrink-0 ${
            isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
          style={{ backgroundColor: '#111b21' }}
        >
          {/* Sidebar Top Header */}
          <div
            className="h-[60px] px-4 flex items-center justify-between shrink-0 border-b border-[#222d34]"
            style={{ backgroundColor: '#202c33' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center font-bold text-white text-sm shadow-xs">
                S
              </div>
              <span className="text-sm font-semibold text-[#e9edef]">Chats</span>
            </div>

            <div className="flex items-center gap-4 text-[#8696a0]">
              <button className="hover:text-white transition-colors cursor-pointer" title="Communities">
                <Users size={19} />
              </button>
              <button className="hover:text-white transition-colors cursor-pointer" title="Status">
                <Circle size={18} />
              </button>
              <button className="hover:text-white transition-colors cursor-pointer" title="New Chat">
                <MessageSquare size={19} />
              </button>
              <button className="hover:text-white transition-colors cursor-pointer" title="Menu">
                <MoreVertical size={19} />
              </button>
            </div>
          </div>

          {/* Search Box & Filter Chips */}
          <div className="p-2 border-b border-[#222d34] flex flex-col gap-2">
            <div className="flex items-center px-3 py-1.5 rounded-[8px] bg-[#202c33]">
              <Search size={15} className="text-[#8696a0] mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-[#e9edef] bg-transparent focus:outline-none placeholder-[#8696a0]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-[#8696a0] hover:text-white cursor-pointer">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Pills: All / Unread / Groups */}
            <div className="flex items-center gap-1.5 px-1">
              {(['all', 'unread', 'groups'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
                    activeFilter === tab
                      ? 'bg-[#00a884] text-[#111b21] font-semibold'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Chat List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/40">
            {filteredRooms.map((room) => {
              const isActive = room.id === activeChatId;
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    setActiveChatId(room.id);
                    setIsMobileChatOpen(true);
                  }}
                  className={`w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors cursor-pointer ${
                    isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm shadow-xs"
                    style={{ backgroundColor: room.avatarColor }}
                  >
                    {room.initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate text-[#e9edef]">
                        {room.name}
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
                          <span className="w-4 h-4 rounded-full bg-[#00a884] text-[#111b21] font-bold text-[10px] flex items-center justify-center">
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
        </aside>

        {/* ================================================================== */}
        {/* RIGHT PANEL: WhatsApp Chat Area                                    */}
        {/* ================================================================== */}
        <main
          className={`flex-1 flex flex-col relative ${
            isMobileChatOpen ? 'flex' : 'hidden md:flex'
          }`}
          style={{ backgroundColor: '#0b141a' }}
        >
          {/* WhatsApp Header (Matching User's Reference Screenshot) */}
          <div
            className="h-[60px] px-4 flex items-center justify-between z-10 shrink-0 border-b border-[#222d34]"
            style={{ backgroundColor: '#202c33' }}
          >
            {/* Group Identity & Member Subtitle */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileChatOpen(false)}
                className="p-1 -ml-1 text-[#8696a0] hover:text-white md:hidden shrink-0 cursor-pointer"
              >
                <ChevronLeft size={22} />
              </button>

              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm shadow-xs"
                style={{ backgroundColor: activeRoom.avatarColor }}
              >
                {activeRoom.initials}
              </div>

              <div className="min-w-0 cursor-pointer">
                <h2 className="text-sm font-semibold truncate leading-tight text-[#e9edef]">
                  {activeRoom.name}
                </h2>
                <p className="text-xs truncate leading-tight mt-0.5 text-[#8696a0]">
                  {activeRoom.subtitle}
                </p>
              </div>
            </div>

            {/* Right Action Icons (Video with dropdown, Search, Menu) */}
            <div className="flex items-center gap-3 text-[#8696a0]">
              <div className="flex items-center gap-0.5 cursor-pointer hover:text-white p-1 rounded transition-colors">
                <Video size={19} />
                <ChevronDown size={13} />
              </div>

              <button className="p-1.5 rounded-full hover:text-white transition-colors cursor-pointer" title="Search in chat">
                <Search size={19} />
              </button>

              <button className="p-1.5 rounded-full hover:text-white transition-colors cursor-pointer" title="Menu">
                <MoreVertical size={19} />
              </button>
            </div>
          </div>

          {/* Tiled WhatsApp Doodle Wallpaper Area */}
          <div
            className="flex-1 overflow-y-auto px-4 md:px-10 py-4 space-y-1 relative"
            style={{
              backgroundColor: '#0b141a',
              backgroundImage: `url("${WHATSAPP_DOODLE_DARK}")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '440px 440px',
            }}
          >
            {/* WhatsApp Date Separator Pill */}
            <div className="flex justify-center my-3">
              <span className="px-3 py-1 rounded-[7.5px] text-xs font-medium uppercase tracking-wider bg-[#182229] text-[#8696a0] shadow-2xs">
                Today
              </span>
            </div>

            {/* Message Feed */}
            {activeMessages.map((msg, idx) => {
              const prev = activeMessages[idx - 1];
              const isSameAsPrev = prev && prev.senderName === msg.senderName;
              const isMe = msg.isMe;

              return (
                <div
                  key={msg.id}
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

                  {/* Message Bubble */}
                  <div className="flex flex-col max-w-[85%] sm:max-w-[70%] md:max-w-[62%] group relative">
                    <div
                      className={`px-3 py-1.5 text-sm transition-all relative rounded-[8px] ${
                        isMe ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#202c33] text-[#e9edef]'
                      } ${!isSameAsPrev && (isMe ? 'rounded-tr-none' : 'rounded-tl-none')}`}
                      style={{ boxShadow: '0 1px 0.5px rgba(11,20,26,0.25)' }}
                    >
                      {/* Sender Name & Subtitle Header */}
                      {!isMe && !isSameAsPrev && (
                        <div className="mb-0.5 flex flex-col leading-tight">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: msg.senderColor || '#53bdeb' }}
                          >
                            {msg.senderName}
                          </span>
                          {msg.subtitle && (
                            <span className="text-[11px] text-[#8696a0] font-normal">
                              {msg.subtitle}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Quoted Message Preview */}
                      {msg.quotedAuthor && (
                        <div className="mb-1.5 p-1.5 rounded-[6px] text-xs border-l-[3.5px] border-[#53bdeb] bg-[#182229]">
                          <div className="font-semibold text-[11px] text-[#53bdeb]">
                            {msg.quotedAuthor}
                          </div>
                          <div className="text-[11px] truncate text-[#8696a0]">
                            {msg.quotedText}
                          </div>
                        </div>
                      )}

                      {/* Video Media Card (Matching Screenshot: 2:20 Play Overlay + Caption) */}
                      {msg.isVideo && (
                        <div className="mb-2 relative rounded-[6px] overflow-hidden bg-black/50 border border-white/10 group/vid cursor-pointer">
                          <div className="h-44 sm:h-56 w-full bg-linear-to-b from-stone-800 to-stone-900 flex items-center justify-center relative">
                            {/* Play Overlay */}
                            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white group-hover/vid:scale-110 transition-transform">
                              <Play size={22} className="ml-0.5 fill-white" />
                            </div>
                            {/* Duration Badge */}
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-medium flex items-center gap-1">
                              <Video size={10} />
                              <span>{msg.videoDuration || '2:20'}</span>
                            </div>
                            {/* Forward Button */}
                            <button
                              type="button"
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                              title="Forward Video"
                            >
                              <Share2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Message Text Body */}
                      <div className="whitespace-pre-wrap break-words leading-relaxed text-[13.5px]">
                        {msg.text}
                      </div>

                      {/* Timestamp & Double Blue Checks */}
                      <div className="flex items-center justify-end gap-1 mt-0.5 float-right ml-2 text-[11px] text-[#8696a0]">
                        <span>{msg.time}</span>
                        {isMe && <CheckCheck size={14} className="text-[#53bdeb] ml-0.5" />}
                      </div>

                      {/* Hover Actions: Reply & React */}
                      <div
                        className={`absolute top-1 hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 rounded-md shadow-md z-10 bg-[#202c33] border border-[#222d34] ${
                          isMe ? '-left-16' : '-right-16'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleReaction(msg.id, '😂')}
                          className="text-xs hover:scale-125 transition-transform cursor-pointer"
                          title="React with Laugh"
                        >
                          😂
                        </button>
                        <button
                          onClick={() => handleToggleReaction(msg.id, '👍')}
                          className="text-xs hover:scale-125 transition-transform cursor-pointer"
                          title="React with Thumbs Up"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="text-[11px] font-medium text-[#8696a0] hover:text-white px-1 cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    </div>

                    {/* Reaction Badges (Matching Screenshot: "😂 5") */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {msg.reactions.map((r, rIdx) => (
                          <button
                            key={rIdx}
                            onClick={() => handleToggleReaction(msg.id, r.emoji)}
                            className="px-1.5 py-0.5 rounded-full text-[11px] border border-[#222d34] bg-[#202c33] text-[#e9edef] flex items-center gap-1 shadow-xs cursor-pointer hover:scale-105 transition-transform"
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

          {/* Footer Input Bar */}
          <div className="flex flex-col shrink-0 border-t border-[#222d34] bg-[#202c33] relative">
            {/* Attachment Drawer Popover */}
            {showAttachMenu && (
              <div className="absolute bottom-16 left-3 p-2 rounded-xl shadow-2xl flex flex-col gap-1.5 z-50 border border-[#222d34] bg-[#202c33] min-w-[190px] animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    setMessageText((prev) => `${prev} [Video: Campus Prime 2026 🎬]`);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[#2a3942] transition-colors cursor-pointer text-left text-[#e9edef]"
                >
                  <Camera size={16} className="text-[#53bdeb]" />
                  <span>Photos & Videos</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    setMessageText((prev) => `${prev} [Document: Class Homework PDF 📄]`);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[#2a3942] transition-colors cursor-pointer text-left text-[#e9edef]"
                >
                  <FileText size={16} className="text-[#9c27b0]" />
                  <span>Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    setMessageText((prev) => `${prev} [Diary Submission 📸]`);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-[#2a3942] transition-colors cursor-pointer text-left text-[#e9edef]"
                >
                  <Award size={16} className="text-[#ff9f00]" />
                  <span>Class Diary Photo</span>
                </button>
              </div>
            )}

            {/* Quick Emoji Tray */}
            {showEmojiTray && (
              <div className="px-4 py-2 border-b border-[#222d34] flex items-center gap-3 bg-[#111b21] overflow-x-auto">
                {['😀', '😂', '💀', '❤️', '👍', '🔥', '🎉', '📚', '👏', '🚀'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setMessageText((prev) => prev + em);
                      inputRef.current?.focus();
                    }}
                    className="text-lg hover:scale-125 transition-transform cursor-pointer"
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
                  className="p-1 rounded-full text-[#8696a0] hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="h-[62px] px-3 md:px-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="p-1.5 rounded-full text-[#8696a0] hover:text-white transition-colors cursor-pointer shrink-0"
                title="Attach"
              >
                <Paperclip size={20} />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiTray(!showEmojiTray)}
                className="p-1.5 rounded-full text-[#8696a0] hover:text-white transition-colors cursor-pointer shrink-0"
                title="Emoji"
              >
                <Smile size={20} />
              </button>

              <div className="flex-1 flex items-center rounded-[8px] px-3 py-2 bg-[#2a3942]">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full text-sm text-[#e9edef] bg-transparent focus:outline-none placeholder-[#8696a0]"
                />
              </div>

              {messageText.trim() ? (
                <button
                  type="submit"
                  className="p-2 rounded-full text-white bg-[#00a884] hover:bg-[#008f6f] transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMessageText('👋 Hey from WhatsApp Desktop!');
                    inputRef.current?.focus();
                  }}
                  className="p-2 rounded-full text-[#8696a0] hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Voice Note"
                >
                  <Mic size={20} />
                </button>
              )}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
