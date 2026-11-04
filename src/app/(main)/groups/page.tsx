'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  AlertCircle,
  MoreVertical,
  Video,
  Smile,
  Paperclip,
  Mic,
  Shield,
  RefreshCw,
  Megaphone,
  UserPlus,
  Check,
  Mail,
  Award,
} from 'lucide-react';
import {
  schoolSystem,
  WhatsAppChannel,
  WhatsAppMessage,
  GroupInvite,
} from '@/lib/schoolFeatures';
import { DataStore, Profile } from '@/lib/dataStore';

// Distinct WhatsApp group member colors
const SENDER_COLORS = [
  '#53bdeb', // Blue / Cyan
  '#f15c6d', // Red / Coral
  '#25d366', // Green
  '#e542a3', // Pink
  '#ff9f00', // Amber / Orange
  '#9c27b0', // Purple
  '#00bcd4', // Teal
  '#ff5722', // Deep Orange
];

function getSenderColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

export default function GroupsPage() {
  const router = useRouter();

  // --------------------------------------------------------------------------
  // Theme Detection (100% Optimized for Light & Dark Mode)
  // --------------------------------------------------------------------------
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

  const T = useMemo(() => {
    return isDark
      ? {
          headerBg: '#202c33',
          headerBorder: '#222d34',
          headerText: '#e9edef',
          headerSubtext: '#8696a0',
          chatBg: '#0b141a',
          sidebarBg: '#111b21',
          sidebarBorder: '#222d34',
          sidebarHover: '#202c33',
          sidebarActive: '#2a3942',
          incomingBubble: '#202c33',
          incomingText: '#e9edef',
          outgoingBubble: '#005c4b',
          outgoingText: '#e9edef',
          footerBg: '#202c33',
          inputBg: '#2a3942',
          inputText: '#e9edef',
          inputPlaceholder: '#8696a0',
          iconColor: '#8696a0',
          timeColor: '#8696a0',
          dividerColor: '#222d34',
          bubbleShadow: '0 1px 0.5px rgba(11,20,26,0.25)',
        }
      : {
          headerBg: '#f0f2f5',
          headerBorder: '#e9edef',
          headerText: '#111b21',
          headerSubtext: '#667781',
          chatBg: '#efeae2',
          sidebarBg: '#ffffff',
          sidebarBorder: '#e9edef',
          sidebarHover: '#f5f6f6',
          sidebarActive: '#f0f2f5',
          incomingBubble: '#ffffff',
          incomingText: '#111b21',
          outgoingBubble: '#d9fdd3',
          outgoingText: '#111b21',
          footerBg: '#f0f2f5',
          inputBg: '#ffffff',
          inputText: '#111b21',
          inputPlaceholder: '#667781',
          iconColor: '#54656f',
          timeColor: '#667781',
          dividerColor: '#e9edef',
          bubbleShadow: '0 1px 0.5px rgba(11,20,26,0.13)',
        };
  }, [isDark]);

  // --------------------------------------------------------------------------
  // Core State
  // --------------------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [channels, setChannels] = useState<WhatsAppChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('channel-school-broadcast');
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [broadcastToAll, setBroadcastToAll] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Role View: Teacher (Madam) vs Student
  const [clientViewMode, setClientViewMode] = useState<'teacher' | 'student'>('student');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  // Assignment / Invite State (Madam flow)
  const [assignTargetGroup, setAssignTargetGroup] = useState('channel-class-8g');
  const [assignUsername, setAssignUsername] = useState('teacher_english');
  const [assignRole, setAssignRole] = useState<'teacher' | 'student'>('teacher');
  const [assignSubject, setAssignSubject] = useState('English Faculty');
  const [isAssigning, setIsAssigning] = useState(false);

  // New Group State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupGrade, setNewGroupGrade] = useState('Class 8');
  const [newGroupSection, setNewGroupSection] = useState('G');
  const [newGroupIsLocked, setNewGroupIsLocked] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSyncTimestampRef = useRef<number>(0);

  // --------------------------------------------------------------------------
  // Initial Load & Low-Latency 1.2s Simultaneous Sync
  // --------------------------------------------------------------------------
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

    // Fast 1.2s polling for simultaneous chatting
    const syncInterval = setInterval(() => {
      syncIncrementalMessages();
    }, 1200);

    const handleUpdate = () => {
      refreshAllData();
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);

    return () => {
      clearInterval(syncInterval);
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

  const syncIncrementalMessages = async () => {
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
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChannelId]);

  // --------------------------------------------------------------------------
  // Pending Invites for Current User (Madam Assignment Flow)
  // --------------------------------------------------------------------------
  const myPendingInvites = useMemo(() => {
    if (!currentUser?.username) return [];
    const cleanU = currentUser.username.toLowerCase().trim();
    return groupInvites.filter(
      (inv) => inv.inviteeUsername.toLowerCase().trim() === cleanU && inv.status === 'pending'
    );
  }, [groupInvites, currentUser]);

  const handleRespondInvite = async (invite: GroupInvite, response: 'accepted' | 'declined') => {
    if (!currentUser?.username) return;
    const res = await schoolSystem.respondGroupInvite(invite.id, response, currentUser.username);
    if (res.success) {
      if (response === 'accepted') {
        setSelectedChannelId(invite.groupId);
        setIsMobileChatOpen(true);
      }
      refreshAllData();
    } else {
      alert(res.error || 'Failed to update invite.');
    }
  };

  // --------------------------------------------------------------------------
  // Madam / Admin Sends Assignment Request
  // --------------------------------------------------------------------------
  const handleSendAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUsername.trim()) return;

    setIsAssigning(true);
    const targetGroupObj = channels.find((c) => c.id === assignTargetGroup);
    const groupName = targetGroupObj?.name || 'Classroom Group';

    const res = await schoolSystem.createGroupInvite({
      groupId: assignTargetGroup,
      groupName,
      inviteeUsername: assignUsername.trim(),
      inviteeRole: assignRole,
      subject: assignSubject.trim(),
      invitedBy: currentUser?.username || 'madam_principal',
    });

    if (res.success) {
      setShowAssignModal(false);
      refreshAllData();
    } else {
      alert(res.error || 'Failed to send assignment');
    }
    setIsAssigning(false);
  };

  // --------------------------------------------------------------------------
  // Filtered Classrooms: Strict Governance & Personalization
  // --------------------------------------------------------------------------
  const isTeacherView = clientViewMode === 'teacher';

  const myAcceptedGroupIds = useMemo(() => {
    if (!currentUser?.username) return new Set<string>();
    const cleanU = currentUser.username.toLowerCase().trim();
    const accepted = groupInvites
      .filter((inv) => inv.inviteeUsername.toLowerCase().trim() === cleanU && inv.status === 'accepted')
      .map((inv) => inv.groupId);
    return new Set(accepted);
  }, [groupInvites, currentUser]);

  const visibleChannels = useMemo(() => {
    return channels.filter((c) => {
      // 1. Madam / Teachers in Teacher View see all classrooms
      if (isTeacherView) return true;

      // 2. Official Principal Dispatches channel is visible to all
      if (c.id === 'channel-school-broadcast' || c.grade === 'All') return true;

      // 3. User accepted Madam's official assignment
      if (myAcceptedGroupIds.has(c.id)) return true;

      // 4. Enrolled usernames in D1
      if (c.enrolledUsernames && currentUser?.username) {
        if (c.enrolledUsernames.map((u) => u.toLowerCase()).includes(currentUser.username.toLowerCase())) {
          return true;
        }
      }

      // 5. Match student's assigned grade
      const userGrade = String((currentUser as any)?.classGrade || (currentUser as any)?.grade || currentUser?.class || '10')
        .toLowerCase()
        .replace(/[^0-9]/g, '');
      const channelGrade = c.grade.toLowerCase().replace(/[^0-9]/g, '');
      if (userGrade && channelGrade && userGrade === channelGrade) {
        return true;
      }

      return false;
    });
  }, [channels, isTeacherView, myAcceptedGroupIds, currentUser]);

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
        id: 'channel-school-broadcast',
        name: 'DPS Official Principal Dispatches 📢',
        grade: 'All',
        section: 'All',
        isLocked: true,
        adminUsernames: ['shashwath71845', 'madam_principal'],
        memberCount: 5500,
        lastMessage: 'Welcome to DPS Digital Campus',
        lastMessageTime: '08:15 AM',
      }
    );
  }, [visibleChannels, selectedChannelId]);

  const channelMessages = useMemo(() => {
    return messages.filter((m) => m.channelId === activeChannel.id);
  }, [messages, activeChannel.id]);

  const canSendMessage = isTeacherView || !activeChannel.isLocked;

  // Active Channel Subtitle (Participant Names Preview like in the WhatsApp screenshot)
  const channelSubtitle = useMemo(() => {
    if (activeChannel.id === 'channel-school-broadcast') {
      return 'Office of the Principal, Vice Principal, Faculty, Students (5,500)';
    }
    return 'Shashwath, Rohan, Himaksh, Vignesh, Anita (English), Chandan, +91 93476 06076...';
  }, [activeChannel.id]);

  // --------------------------------------------------------------------------
  // Message Dispatch Handler
  // --------------------------------------------------------------------------
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = messageText.trim();
    if (!textToSend || isSending) return;

    if (!canSendMessage) return;

    setIsSending(true);

    const senderUsername = currentUser?.username || (isTeacherView ? 'madam_principal' : 'student');
    const senderName = isTeacherView
      ? 'Principal Madam (Office)'
      : currentUser?.fullName || currentUser?.username || 'Student';
    const senderRole = isTeacherView ? 'admin' : (currentUser?.role || 'student');
    const senderClass = isTeacherView ? 'Office of Principal' : 'DPS Student';

    const optimisticId = `wmsg-opt-${Date.now()}`;
    const optimisticMsg: WhatsAppMessage = {
      id: optimisticId,
      channelId: activeChannel.id,
      senderUsername,
      senderName,
      senderRole: senderRole as any,
      senderClass,
      text: textToSend,
      templateType: 'none',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageText('');

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_whatsapp_message',
          channelId: activeChannel.id,
          senderUsername,
          senderName,
          senderRole,
          senderClass,
          text: textToSend,
          templateType: 'none',
          broadcastToAll: isTeacherView && (broadcastToAll || activeChannel.id === 'channel-school-broadcast'),
        }),
      });

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } else {
        refreshAllData();
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Channel Lock
  const handleToggleLock = async () => {
    if (!isTeacherView) return;
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
      refreshAllData();
    }
  };

  // Create New Group
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
      refreshAllData();
    }
  };

  return (
    <div
      className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)] w-full overflow-hidden select-none"
      style={{
        backgroundColor: T.chatBg,
        color: T.incomingText,
      }}
    >
      {/* ==================================================================== */}
      {/* LEFT PANEL: WhatsApp Channels List (Width ~380px)                    */}
      {/* ==================================================================== */}
      <aside
        className={`w-full md:w-[380px] lg:w-[420px] flex flex-col border-r shrink-0 transition-all ${
          isMobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}
        style={{
          backgroundColor: T.sidebarBg,
          borderColor: T.sidebarBorder,
        }}
      >
        {/* WhatsApp Sidebar Header */}
        <div
          className="h-[60px] px-4 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: T.headerBg,
            borderBottom: `1px solid ${T.headerBorder}`,
          }}
        >
          {/* User Avatar + Mode Switcher */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
              style={{ backgroundColor: '#00a884' }}
            >
              {currentUser?.fullName?.slice(0, 2).toUpperCase() || 'DP'}
            </div>
            <div>
              <div className="text-xs font-semibold leading-tight" style={{ color: T.headerText }}>
                {isTeacherView ? 'Madam Principal' : currentUser?.fullName || 'Student'}
              </div>
              <div className="text-[11px]" style={{ color: T.headerSubtext }}>
                {isTeacherView ? 'Faculty Admin' : 'Class Enrolled'}
              </div>
            </div>
          </div>

          {/* Mode Pill & Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setClientViewMode(isTeacherView ? 'student' : 'teacher')}
              className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-all"
              style={{
                borderColor: T.sidebarBorder,
                backgroundColor: isTeacherView ? '#00a884' : T.inputBg,
                color: isTeacherView ? '#ffffff' : T.headerText,
              }}
              title="Toggle between Madam / Teacher Admin and Student View"
            >
              {isTeacherView ? 'Teacher' : 'Student'}
            </button>

            {isTeacherView && (
              <>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="p-1.5 rounded-full hover:opacity-80 transition-opacity"
                  style={{ color: T.iconColor }}
                  title="Assign Teacher or Student to Class"
                >
                  <UserPlus size={18} />
                </button>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="p-1.5 rounded-full hover:opacity-80 transition-opacity"
                  style={{ color: T.iconColor }}
                  title="Create New Classroom Group"
                >
                  <Plus size={19} />
                </button>
              </>
            )}

            <button
              onClick={() => refreshAllData()}
              className="p-1.5 rounded-full hover:opacity-80 transition-opacity"
              style={{ color: T.iconColor }}
              title="Sync Database"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        {/* Pending Assignment Banner inside Sidebar (if any) */}
        {myPendingInvites.length > 0 && (
          <div
            className="p-3 border-b flex flex-col gap-2"
            style={{
              backgroundColor: isDark ? '#182229' : '#f0f2f5',
              borderColor: T.dividerColor,
            }}
          >
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-[#00a884] shrink-0" />
              <div className="text-xs font-semibold truncate" style={{ color: T.headerText }}>
                Assignment from Principal Madam
              </div>
            </div>
            <div className="text-[11px]" style={{ color: T.headerSubtext }}>
              Join <span className="font-semibold" style={{ color: T.headerText }}>{myPendingInvites[0].groupName}</span> as{' '}
              <span className="font-semibold text-[#00a884]">{myPendingInvites[0].subject || myPendingInvites[0].inviteeRole}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => handleRespondInvite(myPendingInvites[0], 'declined')}
                className="px-3 py-1 rounded-[6px] text-xs font-medium border"
                style={{ borderColor: T.sidebarBorder, color: T.headerSubtext }}
              >
                Decline
              </button>
              <button
                onClick={() => handleRespondInvite(myPendingInvites[0], 'accepted')}
                className="px-3.5 py-1 rounded-[6px] text-xs font-semibold text-white bg-[#00a884] hover:bg-[#008f6f] transition-all flex items-center gap-1"
              >
                <Check size={13} />
                <span>Accept & Enter</span>
              </button>
            </div>
          </div>
        )}

        {/* Search Bar (Exact WhatsApp Web Search) */}
        <div
          className="p-2 border-b shrink-0"
          style={{
            borderColor: T.dividerColor,
            backgroundColor: T.sidebarBg,
          }}
        >
          <div
            className="flex items-center px-3 py-1.5 rounded-[8px]"
            style={{
              backgroundColor: isDark ? '#202c33' : '#f0f2f5',
            }}
          >
            <Search size={15} style={{ color: T.iconColor }} className="mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-none"
              style={{
                color: T.headerText,
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs ml-1" style={{ color: T.iconColor }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Room Items List */}
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: T.dividerColor }}>
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-xs" style={{ color: T.headerSubtext }}>
              No classrooms found
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = channel.id === activeChannel.id;
              const isBroadcast = channel.id === 'channel-school-broadcast';

              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    setSelectedChannelId(channel.id);
                    setIsMobileChatOpen(true);
                  }}
                  className="w-full text-left px-3 py-3 flex items-center gap-3 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isSelected ? T.sidebarActive : 'transparent',
                  }}
                >
                  {/* WhatsApp Circle Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm shadow-2xs"
                    style={{
                      backgroundColor: isBroadcast ? '#ea4335' : getSenderColor(channel.name),
                    }}
                  >
                    {isBroadcast ? <Megaphone size={19} /> : <Users size={19} />}
                  </div>

                  {/* Channel Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate" style={{ color: T.headerText }}>
                        {channel.name}
                      </span>
                      <span className="text-[11px] shrink-0 ml-1" style={{ color: T.headerSubtext }}>
                        {channel.lastMessageTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs truncate max-w-[210px]" style={{ color: T.headerSubtext }}>
                        {channel.lastMessage || 'No messages yet'}
                      </p>
                      {channel.isLocked ? (
                        <Lock size={12} style={{ color: T.headerSubtext }} className="shrink-0 ml-1" />
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
      {/* RIGHT PANEL: WhatsApp Chat Area (No Boxes, Plain Edge-to-Edge)      */}
      {/* ==================================================================== */}
      <main
        className={`flex-1 flex flex-col relative ${
          isMobileChatOpen ? 'flex' : 'hidden md:flex'
        }`}
        style={{
          backgroundColor: T.chatBg,
        }}
      >
        {/* WhatsApp Chat Header (Matches exact screenshot header) */}
        <div
          className="h-[60px] px-4 flex items-center justify-between z-10 shrink-0"
          style={{
            backgroundColor: T.headerBg,
            borderBottom: `1px solid ${T.headerBorder}`,
          }}
        >
          {/* Group Avatar & Names */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileChatOpen(false)}
              className="p-1 -ml-1 text-[var(--text-muted)] hover:opacity-80 md:hidden shrink-0"
              style={{ color: T.iconColor }}
              aria-label="Back to chat list"
            >
              <ChevronLeft size={22} />
            </button>

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-sm"
              style={{
                backgroundColor: activeChannel.id.includes('broadcast') ? '#ea4335' : getSenderColor(activeChannel.name),
              }}
            >
              {activeChannel.id.includes('broadcast') ? <Megaphone size={17} /> : <Users size={17} />}
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate leading-tight" style={{ color: T.headerText }}>
                {activeChannel.name}
              </h2>
              <p className="text-xs truncate leading-tight mt-0.5" style={{ color: T.headerSubtext }}>
                {channelSubtitle}
              </p>
            </div>
          </div>

          {/* Right Header Icons (Matching WhatsApp Web Screenshot) */}
          <div className="flex items-center gap-3 shrink-0">
            {isTeacherView && (
              <button
                onClick={handleToggleLock}
                className="px-2 py-1 rounded-[6px] text-xs font-medium border flex items-center gap-1"
                style={{
                  borderColor: T.sidebarBorder,
                  color: activeChannel.isLocked ? '#f15c6d' : T.headerText,
                  backgroundColor: T.inputBg,
                }}
                title="Toggle Mute Permissions"
              >
                {activeChannel.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                <span className="hidden sm:inline">{activeChannel.isLocked ? 'Locked' : 'Unlocked'}</span>
              </button>
            )}

            <button
              className="p-1.5 rounded-full hover:opacity-80 transition-opacity"
              style={{ color: T.iconColor }}
              title="Video Call"
            >
              <Video size={19} />
            </button>

            <button
              className="p-1.5 rounded-full hover:opacity-80 transition-opacity"
              style={{ color: T.iconColor }}
              title="Search in Chat"
            >
              <Search size={19} />
            </button>

            <button
              className="p-1.5 rounded-full hover:opacity-80 transition-opacity"
              style={{ color: T.iconColor }}
              title="Menu"
            >
              <MoreVertical size={19} />
            </button>
          </div>
        </div>

        {/* WhatsApp Chat Wallpaper Doodle Area (Edge-to-Edge Plain Chat Feed) */}
        <div
          className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-1 relative"
          style={{
            backgroundColor: T.chatBg,
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.015) 0%, rgba(0, 0, 0, 0.02) 100%)',
          }}
        >
          {/* WhatsApp Date Separator Pill */}
          <div className="flex justify-center my-3">
            <span
              className="px-3 py-1 rounded-[7.5px] text-xs font-medium shadow-2xs uppercase tracking-wider"
              style={{
                backgroundColor: isDark ? '#182229' : '#ffffff',
                color: T.timeColor,
                boxShadow: T.bubbleShadow,
              }}
            >
              Today
            </span>
          </div>

          {/* Messages Feed */}
          {channelMessages.map((msg, idx) => {
            const isMe =
              currentUser?.username &&
              msg.senderUsername.toLowerCase() === currentUser.username.toLowerCase();
            const isPrincipal =
              msg.senderRole === 'admin' ||
              msg.senderUsername.toLowerCase() === 'madam_principal' ||
              msg.senderName.toLowerCase().includes('principal');
            const isSystem = msg.senderUsername === 'system';

            // Check if consecutive message from same sender (like in WhatsApp screenshot)
            const prevMsg = channelMessages[idx - 1];
            const isSameSenderAsPrev =
              prevMsg &&
              prevMsg.senderUsername.toLowerCase() === msg.senderUsername.toLowerCase() &&
              msg.timestamp - prevMsg.timestamp < 300000;

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span
                    className="px-3 py-1 rounded-[7.5px] text-[11px] text-center max-w-md"
                    style={{
                      backgroundColor: isDark ? '#182229' : '#ffffff',
                      color: T.timeColor,
                      boxShadow: T.bubbleShadow,
                    }}
                  >
                    {msg.text}
                  </span>
                </div>
              );
            }

            const senderColor = isPrincipal ? '#ea4335' : getSenderColor(msg.senderName);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${
                  isSameSenderAsPrev ? 'mt-0.5' : 'mt-2.5'
                }`}
              >
                {/* Contact Avatar on Left (only on first message of group) */}
                {!isMe && (
                  <div className="w-7 shrink-0">
                    {!isSameSenderAsPrev ? (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[11px] shadow-xs"
                        style={{ backgroundColor: senderColor }}
                      >
                        {msg.senderName.slice(0, 1).toUpperCase()}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* WhatsApp Chat Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[70%] md:max-w-[65%] px-3 py-1.5 text-sm transition-all ${
                    isMe
                      ? `rounded-[8px] ${!isSameSenderAsPrev ? 'rounded-tr-none' : ''}`
                      : `rounded-[8px] ${!isSameSenderAsPrev ? 'rounded-tl-none' : ''}`
                  }`}
                  style={{
                    backgroundColor: isMe ? T.outgoingBubble : T.incomingBubble,
                    color: isMe ? T.outgoingText : T.incomingText,
                    boxShadow: T.bubbleShadow,
                  }}
                >
                  {/* Sender Name & Role Header (Shown only on first message of sequence) */}
                  {!isMe && !isSameSenderAsPrev && (
                    <div className="mb-0.5 flex items-center justify-between gap-3 text-xs font-semibold">
                      <span style={{ color: senderColor }} className="truncate">
                        {msg.senderName}
                        {msg.senderClass && (
                          <span className="font-normal opacity-70 ml-1 text-[11px]" style={{ color: T.timeColor }}>
                            • {msg.senderClass}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Principal Madam Dispatch Banner */}
                  {isPrincipal && !isSameSenderAsPrev && (
                    <div className="mb-1 text-[10px] font-bold text-[#ea4335] uppercase tracking-wider flex items-center gap-1">
                      <Award size={12} />
                      <span>OFFICE OF THE PRINCIPAL CIRCULAR</span>
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Timestamp & Double Blue Checkmarks */}
                  <div className="flex items-center justify-end gap-1 mt-0.5 float-right ml-2 text-[11px]">
                    <span style={{ color: T.timeColor }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                    {isMe && <CheckCheck size={14} className="text-[#53bdeb] ml-0.5" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* WhatsApp Footer Action Input Bar (Matches screenshot layout) */}
        <div
          className="h-[62px] px-3 md:px-4 flex items-center gap-2 shrink-0"
          style={{
            backgroundColor: T.footerBg,
          }}
        >
          {!canSendMessage ? (
            <div
              className="w-full py-2 px-4 rounded-[8px] text-center text-xs font-medium"
              style={{
                backgroundColor: T.inputBg,
                color: T.headerSubtext,
              }}
            >
              🔒 Read-Only: Only Admins and Faculty can send messages in this classroom.
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
              {/* Attachment Icon */}
              <button
                type="button"
                className="p-1.5 rounded-full hover:opacity-80 transition-opacity shrink-0"
                style={{ color: T.iconColor }}
                title="Attach"
              >
                <Paperclip size={20} />
              </button>

              {/* Emoji Icon */}
              <button
                type="button"
                className="p-1.5 rounded-full hover:opacity-80 transition-opacity shrink-0"
                style={{ color: T.iconColor }}
                title="Emoji"
              >
                <Smile size={20} />
              </button>

              {/* WhatsApp Type a Message Box */}
              <div
                className="flex-1 flex items-center rounded-[8px] px-3 py-2"
                style={{
                  backgroundColor: T.inputBg,
                }}
              >
                <input
                  type="text"
                  placeholder="Type a message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isSending}
                  className="w-full text-sm bg-transparent focus:outline-none"
                  style={{
                    color: T.inputText,
                  }}
                />
              </div>

              {/* Send Airplane or Microphone Icon */}
              {messageText.trim() ? (
                <button
                  type="submit"
                  disabled={isSending}
                  className="p-2 rounded-full text-white transition-all shrink-0"
                  style={{ backgroundColor: '#00a884' }}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="p-2 rounded-full hover:opacity-80 transition-opacity shrink-0"
                  style={{ color: T.iconColor }}
                  title="Voice Message"
                >
                  <Mic size={20} />
                </button>
              )}
            </form>
          )}
        </div>
      </main>

      {/* ==================================================================== */}
      {/* MODAL 1: MADAM ASSIGNS FACULTY OR STUDENT TO A CLASSROOM            */}
      {/* ==================================================================== */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="rounded-[12px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            style={{
              backgroundColor: isDark ? '#202c33' : '#ffffff',
              color: T.headerText,
            }}
          >
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: T.dividerColor }}
            >
              <div>
                <h3 className="text-sm font-semibold">Assign Faculty / Student</h3>
                <p className="text-[11px]" style={{ color: T.headerSubtext }}>
                  Sends an official invitation from Principal Madam
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80"
                style={{ color: T.iconColor }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendAssignment} className="p-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium block mb-1">Target Classroom</label>
                <select
                  value={assignTargetGroup}
                  onChange={(e) => setAssignTargetGroup(e.target.value)}
                  className="w-full p-2 text-xs rounded-[8px] focus:outline-none border"
                  style={{
                    backgroundColor: T.inputBg,
                    borderColor: T.dividerColor,
                    color: T.headerText,
                  }}
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Recipient Username</label>
                <input
                  type="text"
                  placeholder="e.g. teacher_english or rohan728"
                  value={assignUsername}
                  onChange={(e) => setAssignUsername(e.target.value)}
                  required
                  className="w-full p-2 text-xs rounded-[8px] focus:outline-none border"
                  style={{
                    backgroundColor: T.inputBg,
                    borderColor: T.dividerColor,
                    color: T.headerText,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: T.headerSubtext }}>
                    Role Type
                  </label>
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value as any)}
                    className="w-full p-2 text-xs rounded-[8px] focus:outline-none border"
                    style={{
                      backgroundColor: T.inputBg,
                      borderColor: T.dividerColor,
                      color: T.headerText,
                    }}
                  >
                    <option value="teacher">Faculty / Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: T.headerSubtext }}>
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. English Faculty"
                    value={assignSubject}
                    onChange={(e) => setAssignSubject(e.target.value)}
                    className="w-full p-2 text-xs rounded-[8px] focus:outline-none border"
                    style={{
                      backgroundColor: T.inputBg,
                      borderColor: T.dividerColor,
                      color: T.headerText,
                    }}
                  />
                </div>
              </div>

              <div
                className="p-3 rounded-[8px] text-[11px] leading-relaxed"
                style={{
                  backgroundColor: isDark ? '#111b21' : '#f0f2f5',
                  color: T.headerSubtext,
                }}
              >
                The teacher or student will receive an official assignment banner from Principal Madam. Upon clicking "Accept", they gain immediate access into the classroom.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-[6px] border"
                  style={{ borderColor: T.dividerColor, color: T.headerText }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !assignUsername.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-[6px] text-white bg-[#00a884] hover:bg-[#008f6f] transition-all disabled:opacity-50"
                >
                  {isAssigning ? 'Sending...' : 'Send Assignment Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: CREATE NEW CLASSROOM                                        */}
      {/* ==================================================================== */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="rounded-[12px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            style={{
              backgroundColor: isDark ? '#202c33' : '#ffffff',
              color: T.headerText,
            }}
          >
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: T.dividerColor }}
            >
              <h3 className="text-sm font-semibold">Create Classroom</h3>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80"
                style={{ color: T.iconColor }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium block mb-1">Classroom Name</label>
                <input
                  type="text"
                  placeholder="e.g. Class 8-G Official Classroom"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  className="w-full p-2 text-xs rounded-[8px] focus:outline-none border"
                  style={{
                    backgroundColor: T.inputBg,
                    borderColor: T.dividerColor,
                    color: T.headerText,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: T.headerSubtext }}>
                    Grade
                  </label>
                  <select
                    value={newGroupGrade}
                    onChange={(e) => setNewGroupGrade(e.target.value)}
                    className="w-full p-2 text-xs rounded-[8px] focus:outline-none border"
                    style={{
                      backgroundColor: T.inputBg,
                      borderColor: T.dividerColor,
                      color: T.headerText,
                    }}
                  >
                    {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'All'].map(
                      (g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: T.headerSubtext }}>
                    Section
                  </label>
                  <input
                    type="text"
                    value={newGroupSection}
                    onChange={(e) => setNewGroupSection(e.target.value)}
                    placeholder="e.g. G"
                    className="w-full p-2 text-xs rounded-[8px] focus:outline-none border"
                    style={{
                      backgroundColor: T.inputBg,
                      borderColor: T.dividerColor,
                      color: T.headerText,
                    }}
                  />
                </div>
              </div>

              <div
                className="flex items-center justify-between p-3 rounded-[8px]"
                style={{
                  backgroundColor: isDark ? '#111b21' : '#f0f2f5',
                }}
              >
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <Lock size={12} />
                    <span>Mute student posting permissions</span>
                  </div>
                  <div className="text-[10px]" style={{ color: T.headerSubtext }}>
                    Only faculty and Principal Madam can send messages
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newGroupIsLocked}
                  onChange={(e) => setNewGroupIsLocked(e.target.checked)}
                  className="w-4 h-4 accent-[#00a884] cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-[6px] border"
                  style={{ borderColor: T.dividerColor, color: T.headerText }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-[6px] text-white bg-[#00a884] hover:bg-[#008f6f] transition-all disabled:opacity-50"
                >
                  Create Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
