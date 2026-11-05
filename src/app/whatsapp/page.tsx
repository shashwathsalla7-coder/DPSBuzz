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
  WHATSAPP_DOODLE_DARK,
  DEMO_CONTACTS,
  DEMO_STATUSES,
} from './components/constants';

import { SidebarRail } from './components/SidebarRail';
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

export default function WhatsAppDesktopPage() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<SidebarTab>('chats');
  const [rightPanel, setRightPanel] = useState<RightPanel>('none');
  const [activeChatId, setActiveChatId] = useState<string>('chat-together-forever');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<MessageItem | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [doodleWallpaperEnabled, setDoodleWallpaperEnabled] = useState(true);

  // Modals & Overlays
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<{ contactName: string; type: 'voice' | 'video' } | null>(null);
  const [viewingStatus, setViewingStatus] = useState<StatusItem | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userAbout, setUserAbout] = useState('Hey there! I am using DPS Buzz WhatsApp');
  const [userName, setUserName] = useState('Shashwath');

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Chat Rooms List
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
      isGroup: true,
      unreadCount: 0,
      description: 'The official Together Forever squad for DPS 2026. Academic updates, cricket banter and campus laughs.',
      createdBy: 'Himaksh',
      createdAt: '2026-06-12',
      mediaCount: 38,
      members: DEMO_CONTACTS.slice(0, 7).map((c, i) => ({
        ...c,
        isAdmin: i === 0 || i === 2,
      })),
    },
    {
      id: 'chat-class-8g',
      name: 'Class 8-G Official Classroom 📘',
      subtitle: 'Anita Madam (Faculty), Shashwath, Rishi + 36 enrolled students',
      avatarColor: '#25d366',
      initials: '8G',
      lastMessage: 'Anita Madam: Homework reminder for English Chapter 4 is uploaded.',
      lastTime: '7:40 pm',
      isGroup: true,
      unreadCount: 2,
      description: 'Official academic noticeboard for DPS Class 8-G. Faculty announcements, fair-copy reminders & datesheets.',
      createdBy: 'Anita Madam',
      createdAt: '2026-04-01',
      mediaCount: 64,
      members: DEMO_CONTACTS,
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
      id: 'chat-science-club',
      name: 'DPS Ramanujan Science Club 🔬',
      subtitle: 'Faculty & Class 8-10 Members (68 Members)',
      avatarColor: '#ff9f00',
      initials: 'SC',
      lastMessage: 'Robotics workshop registrations open tomorrow.',
      lastTime: '4:15 pm',
      isGroup: true,
      description: 'Ramanujan innovation hub for robotics, AI and science fairs.',
      createdBy: 'Vikas Sir',
      createdAt: '2026-05-10',
      mediaCount: 19,
    },
    {
      id: 'chat-school-broadcast',
      name: 'DPS Official Principal Dispatches 📢',
      subtitle: 'Office of the Principal • 5,500 Students & Faculty',
      avatarColor: '#ea4335',
      initials: '📢',
      lastMessage: 'Half-Yearly examination instructions published.',
      lastTime: 'Yesterday',
      isGroup: true,
      isLocked: true,
      description: 'Campus-wide announcements from Principal Office. Read-only channel.',
      mediaCount: 12,
    },
  ]);

  // Messages Map per room
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
        isStarred: true,
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
  });

  const activeMessages = messagesMap[activeChatId] || [];
  const activeRoom = chatRooms.find((r) => r.id === activeChatId) || chatRooms[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeChatId]);

  // Dispatch message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = messageText.trim();
    if (!cleanText) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      senderName: userName,
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

  // Star message handler
  const handleToggleStar = (msgId: string) => {
    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: (prev[activeChatId] || []).map((m) =>
        m.id === msgId ? { ...m, isStarred: !m.isStarred } : m
      ),
    }));
  };

  // Delete message handler
  const handleDeleteMessage = (msgId: string) => {
    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: (prev[activeChatId] || []).filter((m) => m.id !== msgId),
    }));
  };

  // Filtered Chats
  const filteredRooms = useMemo(() => {
    return chatRooms.filter((r) => {
      if (activeFilter === 'unread' && !(r.unreadCount && r.unreadCount > 0)) return false;
      if (activeFilter === 'groups' && !r.isGroup) return false;
      if (!searchQuery.trim()) return true;
      return (
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [chatRooms, searchQuery, activeFilter]);

  // All Starred Messages across all chats
  const allStarredMessages = useMemo(() => {
    const list: Array<{ chatName: string; message: MessageItem }> = [];
    Object.entries(messagesMap).forEach(([roomId, msgs]) => {
      const room = chatRooms.find((r) => r.id === roomId);
      const name = room ? room.name : 'Chat';
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
      {/* MAIN CONTAINER: LEFT ICON RAIL + SIDEBAR PANEL + CHAT CANVAS + DRAWER */}
      {/* ==================================================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ================================================================== */}
        {/* SLIM LEFT RAIL (WhatsApp Windows App Native Icon Bar)              */}
        {/* ================================================================== */}
        <SidebarRail
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (rightPanel === 'settings') setRightPanel('none');
          }}
          onOpenSettings={() => setRightPanel('settings')}
          onOpenStarred={() => setRightPanel('starred')}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          unreadCount={2}
          missedCallsCount={1}
          hasUnreadStatus={true}
        />

        {/* ================================================================== */}
        {/* SECONDARY SIDEBAR (Switched based on active rail tab)              */}
        {/* ================================================================== */}
        <aside
          className={`w-full md:w-[360px] lg:w-[400px] flex flex-col shrink-0 ${
            isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* TAB 1: CHATS LIST */}
          {activeTab === 'chats' && (
            <div className="flex flex-col h-full bg-[#111b21] border-r border-[#222d34]">
              {/* Sidebar Header */}
              <div className="h-[60px] px-4 flex items-center justify-between bg-[#202c33] border-b border-[#222d34] shrink-0">
                <h1 className="text-lg font-semibold text-[#e9edef]">Chats</h1>
                <div className="flex items-center gap-3 text-[#8696a0]">
                  <button
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="p-1.5 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors cursor-pointer"
                    title="New Chat"
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

              {/* Search Box & Filter Chips */}
              <div className="p-2 border-b border-[#222d34] flex flex-col gap-2 bg-[#111b21]">
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
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-[#8696a0] hover:text-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
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
            </div>
          )}

          {/* TAB 2: STATUS */}
          {activeTab === 'status' && (
            <StatusView
              onSelectStatus={(st) => setViewingStatus(st)}
              onCreateStatus={(text, color) => {
                // Status created
              }}
            />
          )}

          {/* TAB 3: CALLS */}
          {activeTab === 'calls' && (
            <CallsView
              onStartCall={(contactName, type) => {
                setActiveCall({ contactName, type });
              }}
            />
          )}

          {/* TAB 4: COMMUNITIES */}
          {activeTab === 'communities' && (
            <CommunitiesView
              onSelectGroup={(grpName) => {
                // If exists switch, else create room
                const found = chatRooms.find((r) => r.name.includes(grpName));
                if (found) {
                  setActiveChatId(found.id);
                  setActiveTab('chats');
                } else {
                  const newRoom: ChatRoom = {
                    id: `chat-${Date.now()}`,
                    name: grpName,
                    subtitle: 'DPS Community Group',
                    avatarColor: '#25d366',
                    initials: grpName.slice(0, 2).toUpperCase(),
                    lastMessage: 'Welcome to ' + grpName,
                    lastTime: 'Now',
                    isGroup: true,
                  };
                  setChatRooms([newRoom, ...chatRooms]);
                  setActiveChatId(newRoom.id);
                  setActiveTab('chats');
                }
              }}
            />
          )}
        </aside>

        {/* ================================================================== */}
        {/* RIGHT MAIN PANEL: Active Chat Canvas                               */}
        {/* ================================================================== */}
        <main
          className={`flex-1 flex flex-col relative ${
            isMobileChatOpen ? 'flex' : 'hidden md:flex'
          }`}
          style={{ backgroundColor: '#0b141a' }}
        >
          {/* WhatsApp Header */}
          <div
            className="h-[60px] px-4 flex items-center justify-between z-10 shrink-0 border-b border-[#222d34]"
            style={{ backgroundColor: '#202c33' }}
          >
            {/* Group Identity & Member Subtitle */}
            <div
              onClick={() => setRightPanel(rightPanel === 'group-info' ? 'none' : 'group-info')}
              className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileChatOpen(false);
                }}
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

              <div className="min-w-0">
                <h2 className="text-sm font-semibold truncate leading-tight text-[#e9edef]">
                  {activeRoom.name}
                </h2>
                <p className="text-xs truncate leading-tight mt-0.5 text-[#8696a0]">
                  {activeRoom.subtitle}
                </p>
              </div>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-3 text-[#8696a0]">
              <button
                onClick={() => setActiveCall({ contactName: activeRoom.name, type: 'video' })}
                className="flex items-center gap-0.5 cursor-pointer hover:text-white p-1 rounded transition-colors"
                title="Video Call"
              >
                <Video size={19} />
              </button>

              <button
                onClick={() => setActiveCall({ contactName: activeRoom.name, type: 'voice' })}
                className="p-1.5 rounded-full hover:text-white transition-colors cursor-pointer"
                title="Voice Call"
              >
                <Phone size={18} />
              </button>

              <button
                onClick={() => setRightPanel('media-gallery')}
                className="p-1.5 rounded-full hover:text-white transition-colors cursor-pointer"
                title="Media and Docs"
              >
                <Search size={19} />
              </button>

              <button
                onClick={() => setRightPanel(rightPanel === 'group-info' ? 'none' : 'group-info')}
                className="p-1.5 rounded-full hover:text-white transition-colors cursor-pointer"
                title="Chat info"
              >
                <MoreVertical size={19} />
              </button>
            </div>
          </div>

          {/* Tiled WhatsApp Doodle Wallpaper Area */}
          <div
            className="flex-1 overflow-y-auto px-4 md:px-10 py-4 space-y-1 relative"
            style={{
              backgroundColor: '#0b141a',
              backgroundImage: doodleWallpaperEnabled ? `url("${WHATSAPP_DOODLE_DARK}")` : 'none',
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

                      {/* Video Media Card */}
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
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
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

                      {/* Timestamp, Star & Blue Checks */}
                      <div className="flex items-center justify-end gap-1 mt-0.5 float-right ml-2 text-[11px] text-[#8696a0]">
                        {msg.isStarred && (
                          <Star size={11} className="text-[#8696a0] fill-[#8696a0]" />
                        )}
                        <span>{msg.time}</span>
                        {isMe && <CheckCheck size={14} className="text-[#53bdeb] ml-0.5" />}
                      </div>

                      {/* Hover Actions Bar */}
                      <div
                        className={`absolute top-1 hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 rounded-md shadow-md z-10 bg-[#202c33] border border-[#222d34] ${
                          isMe ? '-left-28' : '-right-28'
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
                          onClick={() => handleToggleStar(msg.id)}
                          className="p-1 hover:text-[#00a884] text-[#8696a0] cursor-pointer"
                          title={msg.isStarred ? 'Unstar' : 'Star message'}
                        >
                          <Star size={12} className={msg.isStarred ? 'fill-[#00a884] text-[#00a884]' : ''} />
                        </button>
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="text-[11px] font-medium text-[#8696a0] hover:text-white px-1 cursor-pointer"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 hover:text-[#ea4335] text-[#8696a0] cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Reaction Badges */}
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
                    setMessageText('👋 Audio note recorded: [0:04]');
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

        {/* ================================================================== */}
        {/* RIGHT DRAWER: Group Info / Media / Starred / Settings               */}
        {/* ================================================================== */}
        {rightPanel === 'group-info' && (
          <GroupInfoPanel
            chat={activeRoom}
            onClose={() => setRightPanel('none')}
            onOpenMediaGallery={() => setRightPanel('media-gallery')}
            onStartCall={(type) => setActiveCall({ contactName: activeRoom.name, type })}
            onAddMember={() => setIsNewChatModalOpen(true)}
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
              if (r) setActiveChatId(r.id);
              setRightPanel('none');
            }}
          />
        )}

        {rightPanel === 'settings' && (
          <div className="w-[360px] lg:w-[400px] h-full flex flex-col shrink-0 animate-slideLeft">
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
      {/* New Chat & New Group Modal */}
      {isNewChatModalOpen && (
        <NewChatModal
          onClose={() => setIsNewChatModalOpen(false)}
          onSelectContact={(c) => {
            const existing = chatRooms.find((r) => r.name === c.name);
            if (existing) {
              setActiveChatId(existing.id);
            } else {
              const newRoom: ChatRoom = {
                id: `chat-${Date.now()}`,
                name: c.name,
                subtitle: c.about || 'online',
                avatarColor: c.avatarColor,
                initials: c.initials,
                lastMessage: 'Tap here to chat',
                lastTime: 'Now',
                isGroup: false,
              };
              setChatRooms([newRoom, ...chatRooms]);
              setActiveChatId(newRoom.id);
            }
          }}
          onCreateNewGroup={(gName, selected) => {
            const newRoom: ChatRoom = {
              id: `chat-${Date.now()}`,
              name: gName,
              subtitle: selected.map((s) => s.name).join(', '),
              avatarColor: '#25d366',
              initials: gName.slice(0, 2).toUpperCase(),
              lastMessage: 'Group created',
              lastTime: 'Now',
              isGroup: true,
              members: selected,
            };
            setChatRooms([newRoom, ...chatRooms]);
            setActiveChatId(newRoom.id);
          }}
        />
      )}

      {/* Active Call Overlay */}
      {activeCall && (
        <ActiveCallOverlay
          contactName={activeCall.contactName}
          callType={activeCall.type}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {/* Full-screen Status Story Viewer */}
      {viewingStatus && (
        <StatusViewerModal
          status={viewingStatus}
          onClose={() => setViewingStatus(null)}
          onReply={(reply) => {
            // Send reply directly into active chat or new chat
            setMessageText(`[Replying to ${viewingStatus.contactName}'s status]: ${reply}`);
          }}
        />
      )}

      {/* User Profile Editor Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#111b21] rounded-2xl border border-[#222d34] p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#00a884] text-white font-bold text-3xl flex items-center justify-center shadow-lg mb-4 ring-4 ring-[#00a884]/20">
              S
            </div>

            <div className="w-full text-left space-y-3">
              <div>
                <label className="text-[11px] uppercase font-semibold text-[#00a884]">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#202c33] text-sm text-[#e9edef] outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-semibold text-[#00a884]">
                  About
                </label>
                <input
                  type="text"
                  value={userAbout}
                  onChange={(e) => setUserAbout(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#202c33] text-sm text-[#e9edef] outline-none mt-1"
                />
              </div>
            </div>

            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl font-semibold bg-[#00a884] text-[#111b21] hover:bg-[#008f6f] transition-colors cursor-pointer text-sm"
            >
              Save Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
