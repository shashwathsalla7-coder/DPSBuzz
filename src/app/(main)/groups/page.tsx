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
  Terminal,
  AlertCircle,
  Clock,
  BookOpen,
  Award,
  Shield,
  RefreshCw,
  Bell,
  GraduationCap,
  Megaphone,
  UserCheck,
  Check,
  UserPlus,
  MessageCircle,
  Mail,
  ArrowRight,
} from 'lucide-react';
import {
  schoolSystem,
  WhatsAppChannel,
  WhatsAppMessage,
  RosterStudent,
  GroupInvite,
} from '@/lib/schoolFeatures';
import { DataStore, Profile } from '@/lib/dataStore';

export default function GroupsPage() {
  const router = useRouter();

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
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [broadcastToAll, setBroadcastToAll] = useState(false);

  // Responsive mobile navigation
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // --------------------------------------------------------------------------
  // Role & View Hierarchy: Teacher View (Madam) vs Student View
  // --------------------------------------------------------------------------
  const [clientViewMode, setClientViewMode] = useState<'teacher' | 'student'>('student');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);

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

  // Roster Ingestion State
  const [rawRosterInput, setRawRosterInput] = useState('');
  const [rosterTargetRoom, setRosterTargetRoom] = useState('channel-class-10a');
  const [isIngestingRoster, setIsIngestingRoster] = useState(false);
  const [operationsLogs, setOperationsLogs] = useState<string[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<RosterStudent[]>([]);

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
  // Pending Invites for Current User (Teacher or Student)
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
    setStatusNotice(response === 'accepted' ? 'Accepting assignment...' : 'Declining invite...');

    const res = await schoolSystem.respondGroupInvite(invite.id, response, currentUser.username);
    if (res.success) {
      if (response === 'accepted') {
        setStatusNotice(`Joined ${invite.groupName}! Access granted.`);
        setSelectedChannelId(invite.groupId);
        setIsMobileChatOpen(true);
      } else {
        setStatusNotice(`Declined invite for ${invite.groupName}.`);
      }
      setTimeout(() => setStatusNotice(null), 3500);
      refreshAllData();
    } else {
      alert(res.error || 'Failed to update invite.');
    }
  };

  // --------------------------------------------------------------------------
  // Madam / Admin Creates Formal Assignment Request
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
      setStatusNotice(`Official assignment sent to @${assignUsername}! They will join upon accepting.`);
      setTimeout(() => setStatusNotice(null), 4000);
      setShowAssignModal(false);
      refreshAllData();
    } else {
      alert(res.error || 'Failed to send assignment');
    }
    setIsAssigning(false);
  };

  // --------------------------------------------------------------------------
  // Filtered Classrooms: Strict Governance & Clean Personalization
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
      // 1. Principal Madam and Teachers in Teacher View can view all classrooms
      if (isTeacherView) return true;

      // 2. Official Principal Dispatches channel is visible to all
      if (c.id === 'channel-school-broadcast' || c.grade === 'All') return true;

      // 3. User has explicitly accepted an official assignment from Madam
      if (myAcceptedGroupIds.has(c.id)) return true;

      // 4. User is recorded in enrolled_usernames in D1
      if (c.enrolledUsernames && currentUser?.username) {
        if (c.enrolledUsernames.map((u) => u.toLowerCase()).includes(currentUser.username.toLowerCase())) {
          return true;
        }
      }

      // 5. Match student's assigned grade
      const userGrade = String((currentUser as any)?.classGrade || (currentUser as any)?.grade || currentUser?.class || '10').toLowerCase().replace(/[^0-9]/g, '');
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

  // Selected Channel
  const activeChannel = useMemo(() => {
    const found = visibleChannels.find((c) => c.id === selectedChannelId);
    if (found) return found;
    return visibleChannels[0] || {
      id: 'channel-school-broadcast',
      name: 'DPS Official Principal Dispatches 📢',
      grade: 'All',
      section: 'All',
      isLocked: true,
      adminUsernames: ['shashwath71845', 'madam_principal'],
      memberCount: 5500,
      lastMessage: 'Welcome to DPS Digital Campus',
      lastMessageTime: '08:15 AM',
    };
  }, [visibleChannels, selectedChannelId]);

  const channelMessages = useMemo(() => {
    return messages.filter((m) => m.channelId === activeChannel.id);
  }, [messages, activeChannel.id]);

  const canSendMessage = isTeacherView || !activeChannel.isLocked;

  // --------------------------------------------------------------------------
  // Message Dispatch Handler (Plain UI & Multi-Channel Broadcast)
  // --------------------------------------------------------------------------
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || messageText).trim();
    if (!textToSend || isSending) return;

    if (!canSendMessage) {
      setStatusNotice('Read-only: Channel is locked by Madam & Faculty.');
      setTimeout(() => setStatusNotice(null), 3000);
      return;
    }

    setIsSending(true);
    setStatusNotice(null);

    const senderUsername = currentUser?.username || (isTeacherView ? 'madam_principal' : 'student');
    const senderName = isTeacherView
      ? 'Principal Madam (Office)'
      : currentUser?.fullName || currentUser?.username || 'Student';
    const senderRole = isTeacherView ? 'admin' : (currentUser?.role || 'student');
    const senderClass = isTeacherView ? 'Office of Principal' : 'Enrolled Student';

    // Optimistic render (0ms feedback)
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

      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setStatusNotice(data.error || 'Failed to send message.');
        setTimeout(() => setStatusNotice(null), 3500);
      } else {
        refreshAllData();
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setStatusNotice(err.message || 'Network error.');
    } finally {
      setIsSending(false);
    }
  };

  // --------------------------------------------------------------------------
  // Toggle Channel Lock
  // --------------------------------------------------------------------------
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
    } else {
      alert(res.error || 'Failed to update channel lock.');
    }
  };

  // --------------------------------------------------------------------------
  // Create New Group
  // --------------------------------------------------------------------------
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
      setStatusNotice(`Classroom ${newGroupName} created.`);
      setTimeout(() => setStatusNotice(null), 3000);
      refreshAllData();
    } else {
      alert(res.error || 'Failed to create group');
    }
  };

  // --------------------------------------------------------------------------
  // Roster Ingestion
  // --------------------------------------------------------------------------
  const handleRunRosterIngestion = async () => {
    if (!rawRosterInput.trim()) return;
    setIsIngestingRoster(true);
    setOperationsLogs(['[PARSING REQUEST] Extracting student records...']);

    const res = await schoolSystem.ingestStudentRoster({
      rawRosterText: rawRosterInput,
      targetChannelId: rosterTargetRoom,
    });

    if (res.logs) setOperationsLogs(res.logs);
    if (res.students) setEnrolledStudents(res.students);
    if (res.success) {
      refreshAllData();
    } else {
      alert(res.error || 'Roster ingestion failed.');
    }
    setIsIngestingRoster(false);
  };

  const prefillSampleRoster = () => {
    setRawRosterInput(
`Student Name,Class,Parent Key,Enrollment ID
Aarav Sharma,Class 8-G,PRK-901824,DPS-2024-1044
Diya Patel,Class 8-G,PRK-901825,DPS-2024-1045
Kavya Reddy,Class 8-G,PRK-892110,DPS-2024-0982`
    );
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)] max-w-6xl mx-auto overflow-hidden border-x font-sans"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--line)',
        color: 'var(--text)',
      }}
    >
      {/* ==================================================================== */}
      {/* CLEAN 54px HEADER (Matches Chats UI & Design Tokens)                 */}
      {/* ==================================================================== */}
      <header
        className="flex items-center justify-between px-4 h-14 border-b shrink-0"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors md:hidden"
            aria-label="Back to home"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1
              className="text-sm font-semibold tracking-[-0.01em] leading-tight flex items-center gap-2"
              style={{ fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif" }}
            >
              <span>Class Rooms</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[var(--line)] text-[var(--text-muted)] bg-[var(--surface-sunken)]">
                D1 Database
              </span>
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] leading-none mt-0.5">
              Official School Classrooms & Faculty Dispatches
            </p>
          </div>
        </div>

        {/* View Mode Toggle Pill (Clean subtle token borders) */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center p-0.5 rounded-full border"
            style={{
              borderColor: 'var(--line)',
              backgroundColor: 'var(--surface-sunken)',
            }}
          >
            <button
              onClick={() => setClientViewMode('student')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                clientViewMode === 'student'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Student View
            </button>
            <button
              onClick={() => setClientViewMode('teacher')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                clientViewMode === 'teacher'
                  ? 'bg-[var(--primary)] text-white shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Teacher View (Madam)
            </button>
          </div>

          {/* Madam Admin Assignment Action */}
          {isTeacherView && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-1.5"
            >
              <UserPlus size={13} />
              <span className="hidden sm:inline">Assign Faculty / Student</span>
            </button>
          )}

          {isTeacherView && (
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="w-8 h-8 rounded-full border border-[var(--line)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors"
              title="Create new classroom"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* PENDING ASSIGNMENT INVITATION BANNER (For Teachers & Students)       */}
      {/* ==================================================================== */}
      {myPendingInvites.length > 0 && (
        <div
          className="p-3 border-b shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn"
          style={{
            backgroundColor: 'var(--primary-tint)',
            borderColor: 'var(--line)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <Mail size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--text)] truncate">
                Official Classroom Assignment from Principal Madam
              </div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">
                Invited to join <span className="font-semibold text-[var(--text)]">{myPendingInvites[0].groupName}</span> as{' '}
                <span className="font-semibold text-[var(--primary)]">{myPendingInvites[0].subject || myPendingInvites[0].inviteeRole}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => handleRespondInvite(myPendingInvites[0], 'declined')}
              className="px-3 py-1 rounded-full text-xs font-medium border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--surface)] transition-colors"
            >
              Decline
            </button>
            <button
              onClick={() => handleRespondInvite(myPendingInvites[0], 'accepted')}
              className="px-3.5 py-1 rounded-full text-xs font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-1"
            >
              <Check size={13} />
              <span>Accept & Enter Classroom</span>
            </button>
          </div>
        </div>
      )}

      {/* Status Notice Toast */}
      {statusNotice && (
        <div
          className="px-4 py-2 text-xs border-b text-center font-medium flex items-center justify-center gap-2 animate-fadeIn"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            borderColor: 'var(--line)',
            color: 'var(--text)',
          }}
        >
          <AlertCircle size={13} className="text-[var(--primary)]" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MAIN TWO-PANE LAYOUT (Matching /chats structure)                     */}
      {/* ==================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Classrooms List */}
        <aside
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r shrink-0 transition-all ${
            isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
          }}
        >
          {/* Search Box */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--line)' }}>
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={isTeacherView ? 'Search all classrooms...' : 'Search your classroom...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-xs text-[var(--text-muted)]"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Room List Feed */}
          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--line)' }}>
            {filteredChannels.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                No classrooms found matching "{searchQuery}"
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
                    className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-[var(--surface-sunken)] border-l-2' : 'hover:bg-[var(--surface-sunken)]/60'
                    }`}
                    style={{
                      borderLeftColor: isSelected ? 'var(--primary)' : 'transparent',
                    }}
                  >
                    {/* Plain Minimal Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 border"
                      style={{
                        backgroundColor: isBroadcast ? 'var(--primary-tint)' : 'var(--surface-sunken)',
                        borderColor: 'var(--line)',
                        color: isBroadcast ? 'var(--primary)' : 'var(--text)',
                      }}
                    >
                      {isBroadcast ? <Megaphone size={16} /> : <Users size={16} />}
                    </div>

                    {/* Room Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text)] truncate flex items-center gap-1.5">
                          {channel.name}
                          {channel.isLocked && (
                            <Lock size={11} className="text-[var(--text-muted)]" />
                          )}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-1">
                          {channel.lastMessageTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">
                          {channel.lastMessage || 'No messages yet'}
                        </p>
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">
                          {channel.memberCount} members
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANE: Active Chat Screen */}
        <main
          className={`flex-1 flex flex-col relative ${
            isMobileChatOpen ? 'flex' : 'hidden md:flex'
          }`}
          style={{ backgroundColor: 'var(--bg)' }}
        >
          {/* Active Chat Header */}
          <div
            className="h-14 px-4 border-b flex items-center justify-between z-10 shrink-0"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setIsMobileChatOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] md:hidden shrink-0"
                aria-label="Back to classrooms"
              >
                <ChevronLeft size={20} />
              </button>

              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 border"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--primary)',
                }}
              >
                {activeChannel.id.includes('broadcast') ? <Megaphone size={15} /> : <Users size={15} />}
              </div>

              <div className="min-w-0">
                <h2 className="text-xs font-semibold text-[var(--text)] truncate flex items-center gap-1.5">
                  <span>{activeChannel.name}</span>
                  {activeChannel.isLocked ? (
                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-0.5">
                      <Lock size={10} /> Read-only
                    </span>
                  ) : null}
                </h2>
                <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                  {activeChannel.memberCount} members • Grade: {activeChannel.grade}
                </p>
              </div>
            </div>

            {/* Right Action Tools for Teacher */}
            {isTeacherView && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleLock}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--line)] text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors flex items-center gap-1"
                  title="Toggle student posting lock"
                >
                  {activeChannel.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  <span className="hidden sm:inline">{activeChannel.isLocked ? 'Locked' : 'Unlocked'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Chat Messages Feed (Clean Plain Background, No Cartoon Banners) */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ backgroundColor: 'var(--bg)' }}
          >
            {/* Minimal Notice */}
            <div className="flex justify-center my-1">
              <span
                className="px-3 py-1 rounded-full text-[10px] text-[var(--text-muted)] border"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                }}
              >
                Classroom dispatches & discussions • Synchronized with Cloudflare D1 SQL
              </span>
            </div>

            {/* Messages */}
            {channelMessages.map((msg) => {
              const isMe =
                currentUser?.username &&
                msg.senderUsername.toLowerCase() === currentUser.username.toLowerCase();
              const isPrincipal =
                msg.senderRole === 'admin' ||
                msg.senderUsername.toLowerCase() === 'madam_principal' ||
                msg.senderName.toLowerCase().includes('principal');
              const isSystem = msg.senderUsername === 'system';

              // System Notification (e.g. "@anita_english joined Class 8-G")
              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span
                      className="px-3 py-1 rounded-full text-[11px] text-[var(--text-muted)] border"
                      style={{
                        backgroundColor: 'var(--surface-sunken)',
                        borderColor: 'var(--line)',
                      }}
                    >
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] p-3 text-xs sm:text-[13px] leading-relaxed transition-all ${
                      isPrincipal
                        ? 'rounded-[14px] border-l-4 border'
                        : isMe
                        ? 'rounded-[14px] rounded-br-[2px] text-white'
                        : 'rounded-[14px] rounded-bl-[2px] border'
                    }`}
                    style={{
                      backgroundColor: isPrincipal
                        ? 'var(--surface-sunken)'
                        : isMe
                        ? 'var(--primary)'
                        : 'var(--surface)',
                      borderColor: isPrincipal ? 'var(--primary)' : 'var(--line)',
                      color: isMe ? '#FFFFFF' : 'var(--text)',
                    }}
                  >
                    {/* Header if Principal or Classmate */}
                    <div className="flex items-center justify-between gap-3 mb-1 text-[11px] font-semibold">
                      <span
                        style={{
                          color: isMe ? '#FFFFFF' : isPrincipal ? 'var(--primary)' : 'var(--text)',
                        }}
                      >
                        {msg.senderName}
                        {msg.senderClass && (
                          <span className="font-normal opacity-75 ml-1 text-[10px]">
                            ({msg.senderClass})
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Text */}
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                    {/* Footer */}
                    <div
                      className="flex items-center justify-end gap-1 mt-1 text-[10px]"
                      style={{
                        color: isMe ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)',
                      }}
                    >
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && <CheckCheck size={12} className="text-white" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ACTION FOOTER INPUT BOX (Plain & Minimalist) */}
          <div
            className="p-3 border-t shrink-0"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            {/* Madam Broadcast Checkbox */}
            {isTeacherView && (
              <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-[var(--text-muted)]">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={broadcastToAll || activeChannel.id === 'channel-school-broadcast'}
                    onChange={(e) => setBroadcastToAll(e.target.checked)}
                    disabled={activeChannel.id === 'channel-school-broadcast'}
                    className="w-3.5 h-3.5 accent-[var(--primary)] rounded cursor-pointer"
                  />
                  <span>Dispatch announcement to all classrooms simultaneously</span>
                </label>
              </div>
            )}

            {!canSendMessage ? (
              <div
                className="py-2 px-4 rounded-full border text-center text-xs text-[var(--text-muted)] font-medium"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                }}
              >
                Read-only: Channel is locked by Madam & Faculty.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={
                    isTeacherView
                      ? 'Type circular or class dispatch...'
                      : 'Message your classmates...'
                  }
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isSending}
                  className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-full border focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                />

                <button
                  type="submit"
                  disabled={isSending || !messageText.trim()}
                  className="w-9 h-9 rounded-full text-white flex items-center justify-center transition-all disabled:opacity-40 shadow-xs shrink-0"
                  style={{ backgroundColor: 'var(--primary)' }}
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </form>
            )}
          </div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: MADAM ASSIGNS FACULTY OR STUDENT TO A CLASSROOM            */}
      {/* ==================================================================== */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--line)' }}
            >
              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">Assign Faculty / Student</h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Sends an official invitation from Principal Madam
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendAssignment} className="p-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium text-[var(--text)] block mb-1">
                  Target Classroom
                </label>
                <select
                  value={assignTargetGroup}
                  onChange={(e) => setAssignTargetGroup(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border focus:outline-none"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
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
                <label className="text-xs font-medium text-[var(--text)] block mb-1">
                  Recipient Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. teacher_english or rohan728"
                  value={assignUsername}
                  onChange={(e) => setAssignUsername(e.target.value)}
                  required
                  className="w-full p-2 text-xs rounded-xl border focus:outline-none"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                    Role Type
                  </label>
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value as any)}
                    className="w-full p-2 text-xs rounded-xl border focus:outline-none"
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      borderColor: 'var(--line)',
                      color: 'var(--text)',
                    }}
                  >
                    <option value="teacher">Faculty / Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. English Faculty"
                    value={assignSubject}
                    onChange={(e) => setAssignSubject(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border focus:outline-none"
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      borderColor: 'var(--line)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl border text-[11px] text-[var(--text-muted)]" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-sunken)' }}>
                When submitted, the teacher or student will receive an official invitation banner from Principal Madam. Upon clicking "Accept", they gain immediate access to the classroom.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border hover:bg-[var(--surface-sunken)] transition-colors"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !assignUsername.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-full text-white transition-all shadow-xs disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {isAssigning ? 'Sending...' : 'Send Assignment Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: CREATE NEW CLASSROOM (Clean Minimalist Form)               */}
      {/* ==================================================================== */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--line)' }}
            >
              <h3 className="text-sm font-semibold text-[var(--text)]">Create Classroom</h3>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium text-[var(--text)] block mb-1">
                  Classroom Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Class 8-G Official Classroom"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  className="w-full p-2 text-xs rounded-xl border focus:outline-none"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Grade</label>
                  <select
                    value={newGroupGrade}
                    onChange={(e) => setNewGroupGrade(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border focus:outline-none"
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      borderColor: 'var(--line)',
                      color: 'var(--text)',
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
                  <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Section</label>
                  <input
                    type="text"
                    value={newGroupSection}
                    onChange={(e) => setNewGroupSection(e.target.value)}
                    placeholder="e.g. G"
                    className="w-full p-2 text-xs rounded-xl border focus:outline-none"
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      borderColor: 'var(--line)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
              </div>

              <div
                className="flex items-center justify-between p-3 rounded-xl border"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                }}
              >
                <div>
                  <div className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                    <Lock size={12} />
                    <span>Mute student posting permissions</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Only faculty and Principal Madam can send messages
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newGroupIsLocked}
                  onChange={(e) => setNewGroupIsLocked(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border hover:bg-[var(--surface-sunken)] transition-colors"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-full text-white transition-all shadow-xs disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary)' }}
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
