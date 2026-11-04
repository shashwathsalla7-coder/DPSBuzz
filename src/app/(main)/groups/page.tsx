'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Send,
  Lock,
  Unlock,
  FileText,
  Users,
  CheckCheck,
  Search,
  Sparkles,
  Plus,
  X,
  ChevronLeft,
  Terminal,
  Calendar,
  AlertCircle,
  Clock,
  BookOpen,
  Award,
  Shield,
  UploadCloud,
  RefreshCw,
  Bell,
  GraduationCap,
  Megaphone,
  UserCheck,
  Check,
  UserPlus,
  Radio,
  Eye,
  MessageCircle,
} from 'lucide-react';
import {
  schoolSystem,
  WhatsAppChannel,
  WhatsAppMessage,
  RosterStudent,
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
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'official' | 'classes' | 'clubs'>('all');
  const [isSending, setIsSending] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [broadcastToAllClassrooms, setBroadcastToAllClassrooms] = useState(false);

  // Responsive mobile navigation (list view vs chat view)
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // --------------------------------------------------------------------------
  // Role & View Hierarchy: Teacher View (Madam) vs Student View
  // --------------------------------------------------------------------------
  const [clientViewMode, setClientViewMode] = useState<'teacher' | 'student'>('teacher');
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  // Add Student State
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Roster Ingestion State
  const [rawRosterInput, setRawRosterInput] = useState('');
  const [rosterTargetRoom, setRosterTargetRoom] = useState('channel-class-10a');
  const [isIngestingRoster, setIsIngestingRoster] = useState(false);
  const [operationsLogs, setOperationsLogs] = useState<string[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<RosterStudent[]>([]);

  // New Group State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupGrade, setNewGroupGrade] = useState('Class 10');
  const [newGroupSection, setNewGroupSection] = useState('A');
  const [newGroupIsLocked, setNewGroupIsLocked] = useState(false);
  const [autoEnrollGradeStudents, setAutoEnrollGradeStudents] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSyncTimestampRef = useRef<number>(0);

  // --------------------------------------------------------------------------
  // Initialize Data & Setup Real-Time Simultaneous Sync
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

    // Load available student profiles for direct enrollment
    try {
      const allP = DataStore.getProfiles();
      setAvailableProfiles(allP);
    } catch {}

    // Initial full fetch
    refreshChannelsAndMessages();

    // Fast 1.2s polling for SIMULTANEOUS chatting across phones & computers
    const fastPollInterval = setInterval(() => {
      syncIncrementalMessages();
    }, 1200);

    const handleUpdate = () => {
      refreshChannelsAndMessages();
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);

    return () => {
      clearInterval(fastPollInterval);
      window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
    };
  }, []);

  // --------------------------------------------------------------------------
  // Fast Incremental Message Sync (1.2s interval)
  // --------------------------------------------------------------------------
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

  const refreshChannelsAndMessages = async () => {
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
      }
    } catch (e) {
      console.warn('Could not sync WhatsApp Hub:', e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChannelId]);

  // --------------------------------------------------------------------------
  // Student Personalization: "they just need their own group not others"
  // --------------------------------------------------------------------------
  const userClassGrade = useMemo(() => {
    const raw = (currentUser as any)?.classGrade || (currentUser as any)?.grade || (currentUser as any)?.class || '10';
    return String(raw).trim();
  }, [currentUser]);

  const isTeacherView = clientViewMode === 'teacher';

  const visibleChannels = useMemo(() => {
    return channels.filter((c) => {
      // Teachers and Admins in Teacher View see ALL groups
      if (isTeacherView) {
        if (categoryFilter === 'official') return c.id.includes('broadcast') || c.isLocked;
        if (categoryFilter === 'classes') return c.grade.includes('Class') || c.grade.includes('Nursery');
        if (categoryFilter === 'clubs') return c.name.toLowerCase().includes('club') || c.section === 'Club';
        return true;
      }

      // STUDENTS ONLY SEE THEIR OWN ROOMS:
      // 1. DPS Official Principal Dispatches (Madam's Channel - required for all students)
      if (c.id === 'channel-school-broadcast' || c.grade === 'All') return true;

      // 2. Direct enrollment match (student was added directly by faculty)
      if (c.enrolledUsernames && currentUser?.username) {
        if (c.enrolledUsernames.map((u) => u.toLowerCase()).includes(currentUser.username.toLowerCase())) {
          return true;
        }
      }

      // 3. Match their own class grade (e.g. 10 matches Class 10 or 10-A)
      const cleanUserGrade = userClassGrade.toLowerCase().replace(/[^0-9a-z]/g, '');
      const cleanChannelGrade = c.grade.toLowerCase().replace(/[^0-9a-z]/g, '');
      const cleanChannelName = c.name.toLowerCase().replace(/[^0-9a-z]/g, '');

      if (cleanChannelGrade.includes(cleanUserGrade) || cleanChannelName.includes(cleanUserGrade)) {
        return true;
      }

      // Hide all other classes for students
      return false;
    });
  }, [channels, isTeacherView, categoryFilter, userClassGrade, currentUser]);

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

  // Permission Logic
  const canSendMessage = isTeacherView || !activeChannel.isLocked;

  // --------------------------------------------------------------------------
  // Message Dispatch Handler (Simultaneous & Multi-Channel Propagation)
  // --------------------------------------------------------------------------
  const handleSendMessage = async (
    customText?: string,
    templateType: 'none' | 'attendance' | 'homework' | 'exam' = 'none'
  ) => {
    const textToSend = (customText || messageText).trim();
    if (!textToSend || isSending) return;

    if (!canSendMessage) {
      setStatusNotice('🔒 Read-Only: Only Admins and Faculty can post when channel is locked.');
      setTimeout(() => setStatusNotice(null), 3500);
      return;
    }

    setIsSending(true);
    setStatusNotice(null);

    const senderUsername = currentUser?.username || (isTeacherView ? 'madam_principal' : 'student');
    const senderName = isTeacherView
      ? 'Principal Madam (Office)'
      : currentUser?.fullName || currentUser?.username || 'DPS Student';
    const senderRole = isTeacherView ? 'admin' : (currentUser?.role || 'student');
    const senderClass = isTeacherView ? 'Office of Principal' : `Class ${userClassGrade}`;

    // Instant Optimistic render (0ms feedback)
    const optimisticId = `wmsg-opt-${Date.now()}`;
    const optimisticMsg: WhatsAppMessage = {
      id: optimisticId,
      channelId: activeChannel.id,
      senderUsername,
      senderName,
      senderRole: senderRole as any,
      senderClass,
      text: textToSend,
      templateType,
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
          templateType,
          broadcastToAll: isTeacherView && (broadcastToAllClassrooms || activeChannel.id === 'channel-school-broadcast'),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Revert optimistic message if rejected
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setStatusNotice(data.error || 'Failed to send message.');
        setTimeout(() => setStatusNotice(null), 4000);
      } else {
        refreshChannelsAndMessages();
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setStatusNotice(err.message || 'Network error.');
    } finally {
      setIsSending(false);
    }
  };

  // --------------------------------------------------------------------------
  // Channel Lock Toggle (Madam / Teacher Action)
  // --------------------------------------------------------------------------
  const handleToggleLock = async () => {
    if (!isTeacherView) {
      alert('Only Principal Madam or Faculty can alter channel permissions.');
      return;
    }

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
      refreshChannelsAndMessages();
    } else {
      alert(res.error || 'Failed to update channel lock.');
    }
  };

  // --------------------------------------------------------------------------
  // Automated Template Dispatcher
  // --------------------------------------------------------------------------
  const handleDispatchTemplate = async (type: 'attendance' | 'homework' | 'exam') => {
    setShowTemplateMenu(false);
    let sampleContent = '';
    if (type === 'attendance') {
      sampleContent = `Roll call completed for ${activeChannel.name}. 42/44 students present. Absentee slips dispatched to registered parent contacts.`;
    } else if (type === 'homework') {
      sampleContent = `Mathematics: NCERT Exercise 8.4 (Trigonometric Identities) Q1 to Q5 fair notebook derivations due tomorrow 08:30 AM before morning assembly.`;
    } else if (type === 'exam') {
      sampleContent = `Half-Yearly Examination Timetable: Science practical exam on Monday at 09:00 AM. Admit card & school ID card are strictly mandatory.`;
    }

    await handleSendMessage(sampleContent, type);
  };

  // --------------------------------------------------------------------------
  // Direct Add Student to Group (Teacher Faculty Tool)
  // --------------------------------------------------------------------------
  const handleAddStudentDirectly = async (student: Profile) => {
    setIsAddingStudent(true);
    const res = await schoolSystem.addStudentToChannel({
      channelId: activeChannel.id,
      usernameToAdd: student.username,
      studentName: student.fullName,
    });

    if (res.success) {
      setStatusNotice(`✅ Directly enrolled @${student.username} into ${activeChannel.name}!`);
      setTimeout(() => setStatusNotice(null), 3500);
      setShowAddStudentModal(false);
      refreshChannelsAndMessages();
    } else {
      alert(res.error || 'Failed to add student to group');
    }
    setIsAddingStudent(false);
  };

  // --------------------------------------------------------------------------
  // Raw Student Roster Extraction & Auto-Registration Pipeline
  // --------------------------------------------------------------------------
  const handleRunRosterIngestion = async () => {
    if (!rawRosterInput.trim()) {
      alert('Please paste raw school enrollment roster text first.');
      return;
    }

    setIsIngestingRoster(true);
    setOperationsLogs([
      '[PARSING REQUEST] Initializing pattern extraction pipeline...',
      `[PARSING REQUEST] Target structural room -> [${rosterTargetRoom}]`,
    ]);

    const res = await schoolSystem.ingestStudentRoster({
      rawRosterText: rawRosterInput,
      targetChannelId: rosterTargetRoom,
    });

    if (res.logs && res.logs.length > 0) {
      setOperationsLogs(res.logs);
    }
    if (res.students) {
      setEnrolledStudents(res.students);
    }

    if (res.success) {
      refreshChannelsAndMessages();
    } else {
      alert(res.error || 'Roster ingestion failed.');
    }
    setIsIngestingRoster(false);
  };

  const prefillSampleRoster = () => {
    const sample = `Student Name,Assigned Class Section,Parent Registration Key,Enrollment ID
Aarav Sharma,10-A,PRK-901824,DPS-2024-1044
Diya Patel,10-A,PRK-901825,DPS-2024-1045
Kavya Reddy,10-A,PRK-892110,DPS-2024-0982
Ananya Verma,10-A,PRK-774921,DPS-2024-1102
Rohan Deshmukh,10-A,PRK-663812,DPS-2024-1088`;
    setRawRosterInput(sample);
  };

  // --------------------------------------------------------------------------
  // Custom Group Creation with Auto-Enrollment
  // --------------------------------------------------------------------------
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    // Get all students matching this grade for direct auto-enrollment
    let enrolledList: string[] = [];
    if (autoEnrollGradeStudents) {
      enrolledList = availableProfiles
        .filter((p) => {
          const pGrade = String((p as any).classGrade || (p as any).grade || p.class || '').toLowerCase();
          return pGrade.includes(newGroupGrade.toLowerCase().replace(/[^0-9]/g, ''));
        })
        .map((p) => p.username);
    }

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
      setStatusNotice(`✅ Group "${newGroupName}" created in Cloudflare D1 SQL!`);
      setTimeout(() => setStatusNotice(null), 3500);
      refreshChannelsAndMessages();
    } else {
      alert(res.error || 'Failed to create group');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)] max-w-7xl mx-auto overflow-hidden bg-[var(--surface)] text-[var(--text)] border-x border-[var(--line)] shadow-2xl">
      {/* ==================================================================== */}
      {/* TOP CONTROL BANNER: Client Mode Switcher (Teacher View vs Student View) */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between px-3 md:px-5 py-2.5 bg-[#005c4b] text-white border-b border-[#004d3e] z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-100/10 flex items-center justify-center border border-white/20">
            <GraduationCap className="text-emerald-300" size={20} />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold flex items-center gap-2">
              <span>DPS Class Groups</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-300/40 text-emerald-200">
                WhatsApp Edition
              </span>
            </h1>
            <p className="text-[11px] text-emerald-100/80 leading-tight">
              Cloudflare D1 SQL • Zero LocalStorage • Real-Time Simultaneous Sync
            </p>
          </div>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <div className="flex items-center bg-[#004d3e] p-1 rounded-xl border border-emerald-400/30 text-xs">
            <button
              onClick={() => setClientViewMode('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                clientViewMode === 'teacher'
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
              title="Madam Principal / Faculty Administrator Controls"
            >
              <Shield size={14} />
              <span>Teacher View (Madam)</span>
            </button>
            <button
              onClick={() => setClientViewMode('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                clientViewMode === 'student'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
              title="Personalized Student Classroom View"
            >
              <UserCheck size={14} />
              <span>Student View</span>
            </button>
          </div>

          {/* Teacher Quick Tools */}
          {isTeacherView && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowRosterModal(true)}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs border border-emerald-300/30"
              >
                <Terminal size={14} />
                <span>Roster Engine</span>
              </button>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
                title="Create Classroom Group"
              >
                <Plus size={15} />
                <span className="hidden md:inline">New Group</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MAIN CHAT PLATFORM: Split Screen Layout (Left Panel vs Right Panel)   */}
      {/* ==================================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ================================================================== */}
        {/* LEFT PANEL: Chat Rooms List (Personalized for Students)             */}
        {/* ================================================================== */}
        <aside
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-[var(--line)] bg-[var(--surface)] transition-all ${
            isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Left Header */}
          <div className="p-3 bg-[var(--surface-sunken)] border-b border-[var(--line)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#008069] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser?.fullName?.slice(0, 2).toUpperCase() || 'DP'}
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-[var(--text)] block truncate max-w-[130px]">
                  {isTeacherView ? 'Madam Principal' : currentUser?.fullName || 'Student'}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  {isTeacherView ? 'Admin Privilege' : `Class ${userClassGrade} Enrolled`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => refreshChannelsAndMessages()}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                title="Sync database from Cloudflare D1"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Student Filter Notice */}
          {!isTeacherView && (
            <div className="px-3 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span>Showing your assigned classroom</span>
              <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20">Class {userClassGrade}</span>
            </div>
          )}

          {/* Search Box */}
          <div className="p-2.5 border-b border-[var(--line)] bg-[var(--surface)]">
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={isTeacherView ? "Search all school classrooms..." : "Search your classroom..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] focus:outline-none focus:border-[#008069] transition-colors"
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

            {/* Category Filter Chips (Teacher View Only) */}
            {isTeacherView && (
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
                {(['all', 'official', 'classes', 'clubs'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-0.5 rounded-full capitalize font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#008069] text-white font-bold'
                        : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {cat === 'all'
                      ? 'All Chats'
                      : cat === 'official'
                      ? 'Dispatches 📢'
                      : cat === 'classes'
                      ? 'Classes 🎓'
                      : 'Clubs 🔬'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Rooms Feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--line)]">
            {filteredChannels.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                No classrooms found matching "{searchQuery}"
              </div>
            ) : (
              filteredChannels.map((channel) => {
                const isSelected = channel.id === activeChannel.id;
                const isMyClass = !isTeacherView && channel.id !== 'channel-school-broadcast';

                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setSelectedChannelId(channel.id);
                      setIsMobileChatOpen(true);
                    }}
                    className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${
                      isSelected
                        ? 'bg-[var(--surface-sunken)] border-l-4 border-l-[#008069]'
                        : 'hover:bg-[var(--surface-sunken)]/60'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-xs ${
                        channel.id.includes('broadcast')
                          ? 'bg-rose-600'
                          : channel.name.toLowerCase().includes('club')
                          ? 'bg-purple-600'
                          : 'bg-[#008069]'
                      }`}
                    >
                      {channel.id.includes('broadcast') ? (
                        <Megaphone size={19} />
                      ) : channel.name.toLowerCase().includes('club') ? (
                        <Sparkles size={19} />
                      ) : (
                        <Users size={19} />
                      )}
                    </div>

                    {/* Room Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text)] truncate flex items-center gap-1">
                          {channel.name}
                          {channel.isLocked && (
                            <span title="Only Admins Can Post">
                              <Lock size={11} className="text-amber-500 shrink-0" />
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-1">
                          {channel.lastMessageTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[190px]">
                          {channel.lastMessage || 'No messages yet'}
                        </p>
                        {isMyClass ? (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Your Class
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)]">
                            {channel.memberCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ================================================================== */}
        {/* RIGHT PANEL: Active Chat Area & Message Feed                        */}
        {/* ================================================================== */}
        <main
          className={`flex-1 flex flex-col bg-[var(--surface)] relative ${
            isMobileChatOpen ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Active Chat Header */}
          <div className="p-3 bg-[var(--surface-sunken)] border-b border-[var(--line)] flex items-center justify-between z-10 shadow-xs">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsMobileChatOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] md:hidden"
                aria-label="Back to rooms list"
              >
                <ChevronLeft size={22} />
              </button>

              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                  activeChannel.id.includes('broadcast') ? 'bg-rose-600' : 'bg-[#008069]'
                }`}
              >
                {activeChannel.id.includes('broadcast') ? <Megaphone size={16} /> : <Users size={16} />}
              </div>

              <div>
                <h2 className="text-xs md:text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
                  <span>{activeChannel.name}</span>
                  {activeChannel.isLocked ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center gap-1">
                      <Lock size={10} />
                      <span>Admin Only</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center gap-1">
                      <Unlock size={10} />
                      <span>Open Discussion</span>
                    </span>
                  )}
                </h2>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {activeChannel.memberCount} participants • Grade: {activeChannel.grade}
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              {/* Teacher Add Student to Group Button */}
              {isTeacherView && (
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#008069] hover:bg-[#00705c] text-white transition-all shadow-xs"
                  title="Directly enroll student into this classroom"
                >
                  <UserPlus size={13} />
                  <span className="hidden sm:inline">Add Student</span>
                </button>
              )}

              {/* Teacher Toggle Channel Lock Button */}
              {isTeacherView && (
                <button
                  onClick={handleToggleLock}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                    activeChannel.isLocked
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                  title={activeChannel.isLocked ? 'Click to Unlock Channel for Students' : 'Click to Lock Channel (Mute Students)'}
                >
                  {activeChannel.isLocked ? (
                    <>
                      <Lock size={13} />
                      <span className="hidden sm:inline">Channel Locked</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={13} />
                      <span className="hidden sm:inline">Lock Channel</span>
                    </>
                  )}
                </button>
              )}

              {/* Template Dispatch Trigger */}
              {isTeacherView && (
                <div className="relative">
                  <button
                    onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 border border-[var(--line)] text-[var(--text)] transition-all shadow-xs"
                  >
                    <Sparkles size={13} className="text-amber-500" />
                    <span className="hidden sm:inline">Templates</span>
                  </button>

                  {/* Template Dropdown */}
                  {showTemplateMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl p-2 z-50 text-xs">
                      <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Automated Schemas
                      </div>
                      <button
                        onClick={() => handleDispatchTemplate('attendance')}
                        className="w-full text-left p-2 rounded-lg hover:bg-[var(--surface-sunken)] flex items-center gap-2 font-medium"
                      >
                        <UserCheck size={14} className="text-blue-500" />
                        <span>Daily Attendance Alert</span>
                      </button>
                      <button
                        onClick={() => handleDispatchTemplate('homework')}
                        className="w-full text-left p-2 rounded-lg hover:bg-[var(--surface-sunken)] flex items-center gap-2 font-medium"
                      >
                        <FileText size={14} className="text-amber-500" />
                        <span>Homework Reminder</span>
                      </button>
                      <button
                        onClick={() => handleDispatchTemplate('exam')}
                        className="w-full text-left p-2 rounded-lg hover:bg-[var(--surface-sunken)] flex items-center gap-2 font-medium"
                      >
                        <AlertCircle size={14} className="text-rose-500" />
                        <span>Exam Deadline Bulletin</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Alert Banner */}
          {statusNotice && (
            <div className="p-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs text-center flex items-center justify-center gap-2 font-medium animate-fadeIn">
              <AlertCircle size={14} />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Chat Wallpaper Message Feed */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]/30 dark:bg-[#0b141a]/40 relative"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(0, 128, 105, 0.03) 0%, rgba(0, 0, 0, 0) 100%)',
            }}
          >
            {/* Encryption & Security Notice */}
            <div className="flex justify-center my-2">
              <div className="max-w-md px-3 py-1.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300/40 text-amber-900 dark:text-amber-200 text-[11px] text-center shadow-2xs flex items-center justify-center gap-1.5">
                <Lock size={12} className="text-amber-600 shrink-0" />
                <span>
                  Official DPS Campus Channel. Managed by Principal Madam. Live Edge Sync in Cloudflare D1.
                </span>
              </div>
            </div>

            {/* Messages Log */}
            {channelMessages.map((msg) => {
              const isMe =
                currentUser?.username &&
                msg.senderUsername.toLowerCase() === currentUser.username.toLowerCase();
              const isPrincipal =
                msg.senderRole === 'admin' ||
                msg.senderUsername.toLowerCase() === 'madam_principal' ||
                msg.senderName.toLowerCase().includes('principal');
              const isFaculty = isPrincipal || msg.senderRole === 'teacher';
              const isTemplate = msg.templateType && msg.templateType !== 'none';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1.5`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs border transition-all ${
                      isPrincipal
                        ? 'bg-amber-50/95 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600 shadow-sm'
                        : isFaculty
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300/50'
                        : isMe
                        ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white border-emerald-300/40'
                        : 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)]'
                    }`}
                  >
                    {/* Special Principal Madam Circular Banner */}
                    {isPrincipal && (
                      <div className="mb-2 pb-1 border-b border-amber-300/60 dark:border-amber-700/60 flex items-center justify-between text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
                        <span className="flex items-center gap-1">
                          <Award size={13} className="text-amber-600" />
                          <span>OFFICIAL PRINCIPAL CIRCULAR</span>
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20">All Classrooms</span>
                      </div>
                    )}

                    {/* Sender Identity Header */}
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span
                        className={`text-[11px] font-bold flex items-center gap-1 truncate ${
                          isPrincipal
                            ? 'text-amber-800 dark:text-amber-300'
                            : isFaculty
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : isMe
                            ? 'text-emerald-800 dark:text-emerald-200'
                            : 'text-[#008069]'
                        }`}
                      >
                        {isFaculty && <Shield size={12} className="shrink-0" />}
                        <span>{msg.senderName}</span>
                        {msg.senderClass && (
                          <span className="text-[10px] font-normal opacity-75">
                            ({msg.senderClass})
                          </span>
                        )}
                      </span>

                      {/* Direct Message Peer Shortcut */}
                      {!isMe && msg.senderUsername !== 'system' && (
                        <button
                          onClick={() => router.push(`/chats?user=${encodeURIComponent(msg.senderUsername)}`)}
                          className="text-[10px] text-[var(--text-muted)] hover:text-emerald-600 flex items-center gap-0.5"
                          title={`Direct message @${msg.senderUsername}`}
                        >
                          <MessageCircle size={11} />
                          <span className="hidden sm:inline">Message</span>
                        </button>
                      )}
                    </div>

                    {/* Template Badge */}
                    {isTemplate && (
                      <div className="mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            msg.templateType === 'attendance'
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-400/30'
                              : msg.templateType === 'homework'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30'
                              : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30'
                          }`}
                        >
                          {msg.templateType === 'attendance' && <UserCheck size={11} />}
                          {msg.templateType === 'homework' && <FileText size={11} />}
                          {msg.templateType === 'exam' && <AlertCircle size={11} />}
                          <span>{String(msg.templateType).toUpperCase()} ALERT</span>
                        </span>
                      </div>
                    )}

                    {/* Message Text */}
                    <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>

                    {/* Message Footer: Time + Checkmarks */}
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[var(--text-muted)]">
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <CheckCheck size={13} className="text-[#53bdeb]" />
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ================================================================ */}
          {/* ACTION FOOTER INPUT BOX (Conditional UI Rendering)                */}
          {/* ================================================================ */}
          <div className="p-3 bg-[var(--surface-sunken)] border-t border-[var(--line)]">
            {/* Madam Broadcast-to-All toggle */}
            {isTeacherView && (
              <div className="mb-2 flex items-center justify-between px-2 text-[11px] text-[var(--text-muted)]">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={broadcastToAllClassrooms || activeChannel.id === 'channel-school-broadcast'}
                    onChange={(e) => setBroadcastToAllClassrooms(e.target.checked)}
                    disabled={activeChannel.id === 'channel-school-broadcast'}
                    className="w-3.5 h-3.5 accent-[#008069] rounded cursor-pointer"
                  />
                  <span className="font-semibold text-[var(--text)]">
                    📢 Post this dispatch to ALL school classrooms simultaneously
                  </span>
                </label>
                <span className="text-[10px] text-emerald-600 font-bold">Madam Privilege</span>
              </div>
            )}

            {!canSendMessage ? (
              /* Conditional Locked Banner: Student View & Channel Locked */
              <div className="py-2.5 px-4 rounded-xl bg-[var(--surface)] border border-amber-500/40 text-center flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-muted)] shadow-xs animate-fadeIn">
                <Lock size={15} className="text-amber-500" />
                <span>Read-Only: Only Admins and Faculty can send messages in this channel.</span>
              </div>
            ) : (
              /* Full Action Input Box (Teacher View OR Unlocked Channel) */
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
                      ? 'Type faculty circular or classroom announcement...'
                      : 'Type a message to your classmates...'
                  }
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isSending}
                  className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-2xl bg-[var(--surface)] border border-[var(--line)] focus:outline-none focus:border-[#008069] transition-all disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={isSending || !messageText.trim()}
                  className="w-10 h-10 rounded-full bg-[#008069] hover:bg-[#00705c] active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-[#008069] shadow-md shrink-0"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: ADD STUDENT DIRECTLY TO CLASSROOM GROUP                     */}
      {/* ==================================================================== */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 bg-[#005c4b] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UserPlus size={18} />
                <span>Enroll Student Into {activeChannel.name}</span>
              </h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              <p className="text-xs text-[var(--text-muted)]">
                Select a registered student to directly enroll them into this group. They will immediately see this classroom without needing to accept requests.
              </p>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search students by name or username..."
                  value={studentSearchInput}
                  onChange={(e) => setStudentSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] focus:outline-none focus:border-[#008069]"
                />
              </div>

              <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-xl max-h-60 overflow-y-auto">
                {availableProfiles
                  .filter((p) => {
                    const q = studentSearchInput.toLowerCase();
                    return (
                      p.username.toLowerCase().includes(q) ||
                      p.fullName.toLowerCase().includes(q)
                    );
                  })
                  .map((student) => (
                    <div
                      key={student.username}
                      className="p-2.5 flex items-center justify-between hover:bg-[var(--surface-sunken)] transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="text-xs font-bold text-[var(--text)] truncate">{student.fullName}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">@{student.username} • Class {(student as any).classGrade || student.class || '10'}</div>
                      </div>
                      <button
                        onClick={() => handleAddStudentDirectly(student)}
                        disabled={isAddingStudent}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[#008069] hover:bg-[#00705c] text-white transition-all shadow-xs shrink-0"
                      >
                        Enroll Now
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: STUDENT ROSTER INGESTION & AUTO-ENROLLMENT PIPELINE         */}
      {/* ==================================================================== */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-[#005c4b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={20} className="text-emerald-300" />
                <div>
                  <h3 className="text-sm font-bold">Raw Roster Ingestion & Auto-Enrollment Pipeline</h3>
                  <p className="text-[11px] text-emerald-100/80">
                    Pattern Extraction Layer: Name • Section • Parent Key • Enrollment ID
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRosterModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[var(--text)]">
                    Paste Raw School Registration Grid or Text Dump:
                  </label>
                  <button
                    type="button"
                    onClick={prefillSampleRoster}
                    className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    <span>Paste Sample Office Grid</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={rawRosterInput}
                  onChange={(e) => setRawRosterInput(e.target.value)}
                  placeholder={`Paste unstructured CSV, TSV or free text here:\nExample:\nAarav Sharma, 10-A, PRK-901824, DPS-2024-1044\nDiya Patel, 10-A, PRK-901825, DPS-2024-1045`}
                  className="w-full p-3 font-mono text-xs rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] focus:outline-none focus:border-[#008069]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">
                    Auto-Map Extracted Students To Channel:
                  </label>
                  <select
                    value={rosterTargetRoom}
                    onChange={(e) => setRosterTargetRoom(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] font-medium"
                  >
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleRunRosterIngestion}
                    disabled={isIngestingRoster || !rawRosterInput.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#008069] hover:bg-[#00705c] text-white flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                  >
                    {isIngestingRoster ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                    <span>Parse & Auto-Enroll Instantly</span>
                  </button>
                </div>
              </div>

              {operationsLogs.length > 0 && (
                <div className="rounded-xl bg-slate-950 text-emerald-400 p-3 font-mono text-[11px] border border-emerald-900 shadow-inner">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1 mb-2 text-[10px] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Terminal size={12} className="text-emerald-400" />
                      Operations Data Feed Window
                    </span>
                    <span className="text-emerald-500 font-bold">ONLINE</span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {operationsLogs.map((log, idx) => (
                      <div key={idx} className="leading-tight">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {enrolledStudents.length > 0 && (
                <div className="rounded-xl border border-[var(--line)] overflow-hidden">
                  <div className="p-2 bg-[var(--surface-sunken)] text-xs font-bold text-[var(--text)] border-b border-[var(--line)] flex items-center justify-between">
                    <span>Enrolled Students ({enrolledStudents.length})</span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check size={12} /> Cloudflare D1 SQL Synced
                    </span>
                  </div>
                  <div className="divide-y divide-[var(--line)] text-xs max-h-40 overflow-y-auto">
                    {enrolledStudents.map((s, i) => (
                      <div key={i} className="p-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[var(--text)]">{s.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)] ml-2">({s.classSection})</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          ID: {s.enrollmentId} • Key: {s.parentKey}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: CUSTOM GROUP CREATION (Teacher / Madam Exclusive)           */}
      {/* ==================================================================== */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#005c4b] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Users size={18} />
                <span>Create School Classroom Group</span>
              </h3>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Class 10-B Mathematics Discussion"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] focus:outline-none focus:border-[#008069]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Grade</label>
                  <select
                    value={newGroupGrade}
                    onChange={(e) => setNewGroupGrade(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]"
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
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Section</label>
                  <input
                    type="text"
                    value={newGroupSection}
                    onChange={(e) => setNewGroupSection(e.target.value)}
                    placeholder="e.g. A, B, C or All"
                    className="w-full p-2 text-xs rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]"
                  />
                </div>
              </div>

              {/* Direct auto-enroll option */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoEnrollGradeStudents}
                    onChange={(e) => setAutoEnrollGradeStudents(e.target.checked)}
                    className="w-4 h-4 accent-[#008069] mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Directly Auto-Enroll All {newGroupGrade} Students
                    </div>
                    <div className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                      Students in {newGroupGrade} immediately see this classroom without needing join requests.
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
                <div>
                  <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                    <Lock size={13} className="text-amber-500" />
                    <span>Mute Student Permissions</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Only Principal Madam and Teachers can post
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newGroupIsLocked}
                  onChange={(e) => setNewGroupIsLocked(e.target.checked)}
                  className="w-4 h-4 accent-[#008069] cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl border border-[var(--line)] hover:bg-[var(--surface-sunken)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#008069] hover:bg-[#00705c] text-white shadow-md disabled:opacity-50"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
