'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ArrowLeft,
  Trash2,
  Upload,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Users,
  EyeOff,
  UserX,
  AlertOctagon,
  FileSpreadsheet,
  FileText,
  Paperclip,
  RotateCcw,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Megaphone,
  Calendar as CalendarIcon,
  Plus,
  Pin,
  Lock,
  Unlock,
  VolumeX,
  Volume2,
  Send,
  Sliders,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
  Music,
} from 'lucide-react';
import { AdminMusicManager } from '@/components/admin/AdminMusicManager';
import {
  DataStore,
  type Profile,
  type RosterEntry,
  type Notice,
  type CalendarEvent,
  type Post,
  type Story,
  type BanAppeal,
} from '@/lib/dataStore';
import { schoolConfig } from '@/config/school';

interface ReportItem {
  id: string;
  type: 'post' | 'comment' | 'message';
  targetUser: string;
  reporterReason: string;
  contentSnippet: string;
  reportCount: number;
  urgency: 'urgent' | 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'pending' | 'hidden' | 'deleted' | 'warned' | 'banned';
}

interface ChatConversationItem {
  id: string;
  name: string;
  username: string;
  isGroup?: boolean;
  studentClass?: string;
  lastMessage: string;
  timeAgo: string;
}

interface ChatMessageItem {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    'users' | 'chats' | 'notices' | 'calendar' | 'moderation' | 'music' | 'system'
  >('users');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [inviteCode, setInviteCode] = useState('DPS71845');
  const [isWiping, setIsWiping] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(() => DataStore.isGlobalMaintenanceEnabled());
  const [maintenanceDates, setMaintenanceDates] = useState<string[]>(() => DataStore.getMaintenanceDates());
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date('2026-10-01T00:00:00'));

  useEffect(() => {
    setCalendarMonth(new Date());
  }, []);

  // Cloudflare R2 & Database Storage Analytics
  const [storageAnalytics, setStorageAnalytics] = useState<any>(null);
  const [storageSettings, setStorageSettings] = useState<any>({
    chatRetentionDays: 90,
    postPhotoRetentionMonths: 0,
    r2BucketName: 'dpsbuzz-media',
  });

  // Current session user
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    if (typeof window !== 'undefined') {
      return DataStore.getCurrentUser();
    }
    return null;
  });

  // Immediate client redirect away from admin console for unauthorized users
  useEffect(() => {
    if (!currentUser || currentUser.username?.toLowerCase().trim() !== 'shashwath71845') {
      router.replace('/admin/login');
    }
  }, [currentUser, router]);

  // Tab 1: Users & Student Activity
  const [students, setStudents] = useState<Profile[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [bannedUserList, setBannedUserList] = useState<string[]>([]);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Profile | null>(null);

  // Tab 2: Chats Oversight
  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('conv-class-8a');
  const [activeMessages, setActiveMessages] = useState<ChatMessageItem[]>([]);
  const [mutedUserList, setMutedUserList] = useState<string[]>([]);
  const [adminBroadcastText, setAdminBroadcastText] = useState('');

  // Tab 3: Notices Manager
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showNewNoticeModal, setShowNewNoticeModal] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<Notice['category']>('urgent');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeIsUrgent, setNewNoticeIsUrgent] = useState(true);
  const [newNoticePinned, setNewNoticePinned] = useState(true);
  const [newNoticeAttachment, setNewNoticeAttachment] = useState(false);
  const [newNoticePdfFile, setNewNoticePdfFile] = useState<File | null>(null);
  const [newNoticePdfDataUrl, setNewNoticePdfDataUrl] = useState<string>('');
  const [newNoticePdfName, setNewNoticePdfName] = useState<string>('');
  const [newNoticePdfSize, setNewNoticePdfSize] = useState<string>('');
  const [newNoticePdfExternalUrl, setNewNoticePdfExternalUrl] = useState<string>('');
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const [broadcastToHome, setBroadcastToHome] = useState(true);
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);

  // Warnings & Ban Modals
  const [warnModalStudent, setWarnModalStudent] = useState<Profile | null>(null);
  const [warnReason, setWarnReason] = useState('Violating school chat and community guidelines.');
  const [banModalStudent, setBanModalStudent] = useState<Profile | null>(null);
  const [banReasonText, setBanReasonText] = useState('Severe community guideline violations or repeated misconduct.');
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);

  // Tab 4: Calendar & Events Scheduler
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-10-25');
  const [newEventCategory, setNewEventCategory] = useState<CalendarEvent['category']>('Exam');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventImportant, setNewEventImportant] = useState(false);

  // Tab 5: Moderation Reports & Live Feed
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [actionModal, setActionModal] = useState<{
    report: ReportItem;
    action: 'Hide' | 'Delete' | 'Warn' | 'Ban';
  } | null>(null);
  const [livePosts, setLivePosts] = useState<Post[]>([]);
  const [liveStories, setLiveStories] = useState<Story[]>([]);

  // CSV Roster Upload State
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<
    Array<{ name: string; class: string; section: string; adm: string; error?: string }>
  >([]);

  const loadData = () => {
    setCounts(DataStore.getTableCounts());
    setInviteCode(DataStore.getInviteCode());
    const allProfiles = DataStore.getProfiles();
    setStudents(allProfiles.filter((p) => p.role === 'student'));
    setBannedUserList(DataStore.getBannedUsers());
    setMutedUserList(DataStore.getMutedUsers());
    setNotices(DataStore.getNotices());
    setCalendarEvents(DataStore.getCalendarEvents());
    setLivePosts(DataStore.getPosts());
    setLiveStories(DataStore.getStories());
    setActiveBroadcast(DataStore.getBroadcastAlert());
    setStorageAnalytics(DataStore.getStorageAnalytics());
    setStorageSettings(DataStore.getStorageSettings());
    setBanAppeals(DataStore.getBanAppeals());

    // Load safety reports from server
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reports)) {
          setReports(data.reports);
        }
      })
      .catch(() => {});

    // Load active session user
    const cur = DataStore.getCurrentUser();
    setCurrentUser(cur);

    // Load conversations from local storage & active chat stores
    if (typeof window !== 'undefined') {
      const convMap = new Map<string, any>();
      // 1. Check all v3 conversation stores
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('dpsbuzz_chat_conversations_') || key === 'dpsbuzz_conversations_v1')) {
          try {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(list)) {
              for (const c of list) {
                if (c && c.id && !convMap.has(c.id)) {
                  convMap.set(c.id, c);
                }
              }
            }
          } catch {}
        }
      }
      setConversations(Array.from(convMap.values()));
    }
  };

  const loadMessagesForConv = async (convId: string) => {
    setActiveConvId(convId);
    if (typeof window !== 'undefined') {
      // 1. Try server endpoint
      try {
        const res = await fetch(`/api/chats?conversationId=${encodeURIComponent(convId)}&username=shashwath71845`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            setActiveMessages(data.messages);
            return;
          }
        }
      } catch {}

      // 2. Try searching local v3 message maps
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('dpsbuzz_chat_messages_') || key === 'dpsbuzz_chat_messages_v1')) {
          try {
            const map = JSON.parse(localStorage.getItem(key) || '{}');
            if (map && map[convId] && Array.isArray(map[convId]) && map[convId].length > 0) {
              setActiveMessages(map[convId]);
              return;
            }
          } catch {}
        }
      }
    }
    // Default messages
    const defaultMsgs: ChatMessageItem[] = [
      { id: 'm-1', text: 'Important: Submit physics journal before period 3 tomorrow.', sender: 'them', time: '10:15 AM' },
      { id: 'm-2', text: 'Chart paper colors: White or light blue required.', sender: 'them', time: '11:00 AM' },
      { id: 'm-3', text: 'Understood, bringing supplies.', sender: 'me', time: '11:20 AM' },
    ];
    setActiveMessages(defaultMsgs);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
  }, []);

  // --- Handlers: Users & Bans ---
  const handleToggleBan = (username: string) => {
    const isNowBanned = DataStore.toggleBanUser(username);
    setBannedUserList(DataStore.getBannedUsers());
    setStatusMessage({
      type: 'success',
      text: isNowBanned
        ? `Account @${username} has been BANNED from DPS Buzz.`
        : `Account @${username} has been UNBANNED and restored.`,
    });
  };

  const handleResetClaim = (username: string) => {
    const roster = DataStore.getRoster();
    const match = roster.find((r) => r.claimedBy === username);
    if (match) {
      match.isClaimed = false;
      match.claimedBy = undefined;
    }
    setStatusMessage({
      type: 'success',
      text: `Reset roster claim for @${username}. Student can claim account again.`,
    });
  };

  const handleResetPassword = (username: string) => {
    setStatusMessage({
      type: 'success',
      text: `Temporary password reset token generated for @${username}: DPS-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setSelectedStudentForModal(null);
  };

  // --- Handlers: Cloudflare R2 Storage & Retention ---
  const handleUpdateChatRetention = (days: number) => {
    const updated = DataStore.updateStorageSettings({ chatRetentionDays: days });
    setStorageSettings(updated);
    setStatusMessage({
      type: 'success',
      text: `Chat message retention policy updated to ${days} days.`,
    });
  };

  const handleUpdatePostRetention = (months: number) => {
    const updated = DataStore.updateStorageSettings({ postPhotoRetentionMonths: months });
    setStorageSettings(updated);
    setStatusMessage({
      type: 'success',
      text: months === 0 ? 'Post photo retention set to indefinite.' : `Post photo retention set to ${months} months.`,
    });
  };

  const handleUpdateStorageLock = (gb: number) => {
    const updated = DataStore.updateStorageSettings({ storageLockGB: gb, r2StorageLockGB: gb });
    setStorageSettings(updated);
    setStorageAnalytics(DataStore.getStorageAnalytics());
    setStatusMessage({
      type: 'success',
      text: `Media upload safety lock updated to ${gb.toFixed(1)} GB (Cloudinary 25 GB free allowance).`,
    });
  };

  const handlePruneChatsNow = () => {
    const result = DataStore.pruneOldChatMessages();
    setStorageAnalytics(DataStore.getStorageAnalytics());
    setStatusMessage({
      type: 'success',
      text: result.message,
    });
  };

  const handlePurgeStoriesNow = () => {
    setStatusMessage({
      type: 'success',
      text: 'Expired story media older than 48h purged from Cloudflare R2.',
    });
  };

  const handleRunOrphanSweep = () => {
    setStatusMessage({
      type: 'success',
      text: 'Weekly orphan file sweep completed. All unreferenced R2 files cleaned.',
    });
  };

  // --- Handlers: Chats Oversight ---
  const handleDeleteChatMessage = (msgId: string) => {
    DataStore.deleteChatMessage(activeConvId, msgId);
    setActiveMessages((prev) => prev.filter((m) => m.id !== msgId));
    setStatusMessage({
      type: 'success',
      text: 'Message deleted immediately from conversation records.',
    });
  };

  const handleToggleMuteInChat = (username: string) => {
    const isMuted = DataStore.toggleMuteUserInChat(username);
    setMutedUserList(DataStore.getMutedUsers());
    setStatusMessage({
      type: 'success',
      text: isMuted
        ? `@${username} has been MUTED from sending messages in all chats.`
        : `@${username} has been UNMUTED and can send messages.`,
    });
  };

  const handleSendAdminBroadcast = () => {
    if (!adminBroadcastText.trim()) return;
    const newMsg: ChatMessageItem = {
      id: `admin-broadcast-${Date.now()}`,
      text: `[OFFICIAL ADMIN DIRECTIVE]: ${adminBroadcastText.trim()}`,
      sender: 'them',
      time: 'Just now',
    };
    const nextList = [...activeMessages, newMsg];
    setActiveMessages(nextList);
    if (typeof window !== 'undefined') {
      try {
        const storedMap = JSON.parse(localStorage.getItem('dpsbuzz_chat_messages_v1') || '{}');
        storedMap[activeConvId] = nextList;
        localStorage.setItem('dpsbuzz_chat_messages_v1', JSON.stringify(storedMap));
      } catch {}
    }
    setAdminBroadcastText('');
    setStatusMessage({
      type: 'success',
      text: 'Administrative broadcast sent into the conversation.',
    });
  };

  // --- Handlers: Warnings, Bans & Account Deletion ---
  const handleWarnUser = (username: string, reason: string) => {
    if (!reason.trim()) return;
    DataStore.warnUser(username, reason, currentUser?.fullName || 'Shashwath (Admin)');
    setWarnModalStudent(null);
    setWarnReason('Violating school chat and community guidelines.');
    setStatusMessage({
      type: 'success',
      text: `Official warning issued to @${username}. Delivered to their notifications & inbox.`,
    });
  };

  const handleConfirmBan = (username: string, reason: string) => {
    DataStore.banUser(username, reason);
    setBannedUserList(DataStore.getBannedUsers());
    setBanModalStudent(null);
    setStatusMessage({
      type: 'success',
      text: `Account @${username} has been COMPLETELY BANNED. Reason: "${reason}".`,
    });
  };

  const handleDeleteUser = (username: string) => {
    if (confirm(`Are you sure you want to completely delete @${username}'s account and all their content?`)) {
      DataStore.deleteUser(username);
      setStudents(DataStore.getProfiles().filter((p) => p.role === 'student'));
      setSelectedStudentForModal(null);
      setStatusMessage({
        type: 'success',
        text: `Account @${username} and all their posts/stories have been completely deleted.`,
      });
    }
  };

  const handleApproveAppeal = (appealId: string, username: string) => {
    DataStore.updateBanAppealStatus(appealId, 'approved', 'Reinstated by school administration.');
    setBannedUserList(DataStore.getBannedUsers());
    setBanAppeals(DataStore.getBanAppeals());
    setStatusMessage({
      type: 'success',
      text: `Appeal approved! Student @${username} has been UNBANNED and restored.`,
    });
  };

  const handleDismissAppeal = (appealId: string, username: string) => {
    DataStore.updateBanAppealStatus(appealId, 'rejected', 'Appeal dismissed after administrative review.');
    setBanAppeals(DataStore.getBanAppeals());
    setStatusMessage({
      type: 'success',
      text: `Appeal from @${username} was dismissed.`,
    });
  };

  // --- Handlers: Notices & Live Home Broadcast ---
  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
      setStatusMessage({ type: 'error', text: 'Title and content are required.' });
      return;
    }
    const hasAttachment = Boolean(newNoticePdfDataUrl || newNoticePdfExternalUrl.trim() || newNoticeAttachment);
    const pdfUrl = newNoticePdfExternalUrl.trim() || newNoticePdfDataUrl || undefined;
    const pdfName = newNoticePdfName.trim() || (newNoticePdfExternalUrl.trim() ? 'school_circular.pdf' : undefined);
    const pdfSize = newNoticePdfSize.trim() || undefined;

    const created = DataStore.addNotice({
      title: newNoticeTitle.trim(),
      content: newNoticeContent.trim(),
      category: newNoticeCategory,
      isUrgent: newNoticeIsUrgent,
      pinned: newNoticePinned,
      hasAttachment,
      pdfUrl,
      pdfName,
      pdfSize,
      date: 'Today, Admin Post',
      seenBy: 1,
    });
    if (broadcastToHome) {
      DataStore.setBroadcastAlert({
        title: newNoticeTitle.trim(),
        text: newNoticeContent.trim(),
        isUrgent: newNoticeIsUrgent,
      });
      setActiveBroadcast(DataStore.getBroadcastAlert());
    }
    setNotices(DataStore.getNotices());
    setShowNewNoticeModal(false);
    setNewNoticeTitle('');
    setNewNoticeContent('');
    setNewNoticePdfFile(null);
    setNewNoticePdfDataUrl('');
    setNewNoticePdfName('');
    setNewNoticePdfSize('');
    setNewNoticePdfExternalUrl('');
    setNewNoticeAttachment(false);
    if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
    setStatusMessage({
      type: 'success',
      text: `Published official notice: "${created.title}". ${
        hasAttachment ? `Attached PDF: ${pdfName || 'circular.pdf'}. ` : ''
      }${
        broadcastToHome ? 'Broadcasted to live Home feed for ALL students!' : 'Added to notice board.'
      }`,
    });
  };

  const handleClearBroadcast = () => {
    DataStore.setBroadcastAlert(null);
    setActiveBroadcast(null);
    setStatusMessage({
      type: 'success',
      text: 'Home feed broadcast banner cleared.',
    });
  };

  const handleDeleteNotice = (id: string) => {
    DataStore.deleteNotice(id);
    setNotices(DataStore.getNotices());
    setStatusMessage({ type: 'success', text: 'Notice deleted successfully.' });
  };

  // --- Handlers: Calendar ---
  const handleAddCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate.trim()) {
      setStatusMessage({ type: 'error', text: 'Title and date are required.' });
      return;
    }
    const created = DataStore.addCalendarEvent({
      title: newEventTitle.trim(),
      date: newEventDate,
      category: newEventCategory,
      description: newEventDescription.trim() || 'Official school event scheduled.',
      isImportant: newEventImportant,
    });
    setCalendarEvents(DataStore.getCalendarEvents());
    setShowNewEventModal(false);
    setNewEventTitle('');
    setNewEventDescription('');
    setStatusMessage({
      type: 'success',
      text: `Added event "${created.title}" to Academic Calendar.`,
    });
  };

  const handleDeleteCalendarEvent = (id: string) => {
    DataStore.deleteCalendarEvent(id);
    setCalendarEvents(DataStore.getCalendarEvents());
    setStatusMessage({ type: 'success', text: 'Calendar event removed.' });
  };

  // --- Handlers: Moderation & Live Feed ---
  const executeReportAction = () => {
    if (!actionModal) return;
    const { report, action } = actionModal;
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: action.toLowerCase() as any } : r))
    );
    if (action === 'Ban') {
      DataStore.toggleBanUser(report.targetUser);
      setBannedUserList(DataStore.getBannedUsers());
    }
    setStatusMessage({
      type: 'success',
      text: `Action applied: ${action} on @${report.targetUser}`,
    });
    setActionModal(null);
  };

  const handleDeleteLivePost = (postId: string) => {
    DataStore.deletePost(postId);
    setLivePosts(DataStore.getPosts());
    setStatusMessage({ type: 'success', text: 'Post permanently removed from school feed.' });
  };

  const handleDeleteLiveStory = (storyId: string) => {
    DataStore.deleteStory(storyId);
    setLiveStories(DataStore.getStories());
    setStatusMessage({ type: 'success', text: 'Story removed from school stories ring.' });
  };

  // --- Handlers: CSV & System ---
  const handleCsvChange = (text: string) => {
    setCsvText(text);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let startIdx = 0;
    if (lines[0] && (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('admission'))) {
      startIdx = 1;
    }
    const rows = lines.slice(startIdx).map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      const name = parts[0] || '';
      const className = parts[1] || '';
      const section = parts[2] || '';
      const adm = parts[3] || '';
      let error: string | undefined;
      if (!name) error = 'Missing name';
      else if (!className) error = 'Missing class';
      else if (!section) error = 'Missing section';
      else if (!adm) error = 'Missing admission number';
      return { name, class: className, section, adm, error };
    });
    setParsedRows(rows);
  };

  const handleUploadRoster = () => {
    if (!csvText.trim()) return;
    const res = DataStore.uploadRosterCSV(csvText);
    if (res.success) {
      loadData();
      setStatusMessage({
        type: 'success',
        text: `Uploaded ${res.count} students. Auto-created ${res.groupsCreated} class groups.`,
      });
      setCsvText('');
      setParsedRows([]);
    } else {
      setStatusMessage({ type: 'error', text: 'Failed to parse CSV. Check formatting.' });
    }
  };

  const handleSaveInviteCode = () => {
    DataStore.setInviteCode(inviteCode);
    setStatusMessage({
      type: 'success',
      text: `School invite code updated to: ${inviteCode.toUpperCase()}`,
    });
  };

  const handleWipeData = () => {
    setIsWiping(true);
    setTimeout(() => {
      const res = DataStore.wipeTestData();
      loadData();
      setIsWiping(false);
      setShowWipeModal(false);
      setStatusMessage({ type: 'success', text: res.message });
    }, 500);
  };

  const filteredStudents = students.filter((s) => {
    if (!searchUserQuery) return true;
    const q = searchUserQuery.toLowerCase();
    return (
      s.username.toLowerCase().includes(q) ||
      s.fullName.toLowerCase().includes(q) ||
      (s.class && s.class.toLowerCase().includes(q))
    );
  });

  // Strict Super Admin Access Lockout for non-shashwath71845 accounts
  if (!currentUser || currentUser.username?.toLowerCase() !== 'shashwath71845') {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 bg-red-950 border border-red-500/60 flex items-center justify-center mb-4 text-red-500 rounded-none">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-xl font-bold text-red-500 mb-2">Access Restricted 🔒</h1>
        <p className="text-xs text-[var(--text-muted)] max-w-sm mb-4 leading-relaxed">
          The School Administration Panel is restricted strictly to Admin ID: <span className="font-mono text-white font-bold">@shashwath71845</span>.
        </p>
        <Link
          href="/home"
          className="px-4 py-2 bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold rounded-none hover:bg-[var(--primary-hover)] transition-colors"
        >
          Return to Student Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-28 text-[var(--text)] select-none">
      {/* Sticky Operational Header (Zero Rounded Corners) */}
      <div className="sticky top-0 z-20 bg-[var(--surface)] border-b border-[var(--line)] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="px-3 h-9 bg-[var(--surface-sunken)] border border-[var(--line)] rounded-none text-xs font-semibold text-[var(--text)] hover:bg-[var(--line)] transition-colors flex items-center gap-1.5"
              aria-label="Back to school feed"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Student View</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Shield size={16} style={{ color: 'var(--primary)' }} />
                <h1 className="text-sm font-bold font-display uppercase tracking-wider text-[var(--text)]">
                  Super Admin Panel
                </h1>
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--primary)] font-bold">
                  @shashwath71845
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {schoolConfig.schoolName} • Central Control Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="px-3 h-9 bg-[var(--surface-sunken)] border border-[var(--line)] rounded-none text-xs font-semibold text-[var(--text)] hover:bg-[var(--line)] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Sync Hub</span>
            </button>
            <Link
              href="/home"
              className="px-3 h-9 bg-[var(--primary)] text-[var(--on-primary)] rounded-none text-xs font-semibold hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-1"
            >
              <ExternalLink size={13} />
              <span>Enter Feed</span>
            </Link>
          </div>
        </div>

        {/* 6 Comprehensive Tabs (Zero Rounded Corners) */}
        <div className="max-w-4xl mx-auto mt-3 flex overflow-x-auto no-scrollbar border-b border-[var(--line)] text-xs font-semibold">
          {[
            { id: 'users', label: `Users & Bans (${students.length})`, icon: Users },
            { id: 'chats', label: 'Chats Oversight', icon: MessageCircle },
            { id: 'notices', label: `Notices (${notices.length})`, icon: Megaphone },
            { id: 'calendar', label: `Calendar (${calendarEvents.length})`, icon: CalendarIcon },
            { id: 'moderation', label: `Reports (${reports.filter((r) => r.status === 'pending').length})`, icon: ShieldAlert },
            { id: 'music', label: 'Music & Audio', icon: Music },
            { id: 'system', label: 'System & Code', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3 border-b-2 font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 rounded-none ${
                  isActive
                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--surface-sunken)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Status Toast Notification */}
        {statusMessage && (
          <div
            className={`p-3 rounded-none border text-xs font-medium flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/40'
                : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="p-1 hover:opacity-75 cursor-pointer rounded-none"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: USERS & BAN CONTROLS */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    Student Activity & Account Moderation
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Manage student profiles, enforce suspensions/bans, or reset roster registrations.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by username or class..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="h-9 px-3 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Official Student Ban & Warning Appeals */}
              {banAppeals.length > 0 && (
                <div className="p-4 bg-[var(--surface-sunken)] border-2 border-pink-500/50 rounded-none space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                        Student Appeals for Reconsideration ({banAppeals.filter((a) => a.status === 'pending').length} Pending)
                      </h3>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      Total Appeals: {banAppeals.length}
                    </span>
                  </div>

                  <div className="divide-y divide-[var(--line)] border border-[var(--line)] bg-[var(--surface)]">
                    {banAppeals.map((appeal) => {
                      const isPending = appeal.status === 'pending';
                      return (
                        <div key={appeal.id} className="p-3 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--text)]">{appeal.fullName}</span>
                              <span className="font-mono text-pink-400">@{appeal.username}</span>
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-neutral-800 text-neutral-300">
                                {appeal.appealType}
                              </span>
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              Submitted {new Date(appeal.submittedAt).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs text-[var(--text)] bg-[var(--surface-sunken)] p-2.5 border border-[var(--line)] italic">
                            &ldquo;{appeal.reason}&rdquo;
                          </p>

                          {appeal.contactEmailOrPhone && (
                            <p className="text-[10px] text-[var(--text-muted)]">
                              Contact: <span className="font-mono text-[var(--text)]">{appeal.contactEmailOrPhone}</span>
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${
                              appeal.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : appeal.status === 'rejected'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}>
                              Status: {appeal.status}
                            </span>

                            {isPending && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApproveAppeal(appeal.id, appeal.username)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase cursor-pointer transition"
                                >
                                  Approve & Lift Ban ✅
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDismissAppeal(appeal.id, appeal.username)}
                                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase cursor-pointer transition"
                                >
                                  Dismiss ❌
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Student Accounts Table */}
              <div className="border border-[var(--line)] rounded-none overflow-x-auto divide-y divide-[var(--line)]">
                {filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                    No matching student profiles found.
                  </div>
                ) : (
                  filteredStudents.map((st) => {
                    const isBanned = bannedUserList.includes(st.username.toLowerCase());
                    const isMuted = mutedUserList.includes(st.username.toLowerCase());
                    return (
                      <div
                        key={st.id}
                        className="p-3 flex items-center justify-between gap-3 bg-[var(--surface)] hover:bg-[var(--surface-sunken)] transition-colors"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-none flex items-center justify-center font-bold text-xs shrink-0"
                            style={{
                              backgroundColor: isBanned ? 'var(--danger)' : 'var(--primary)',
                              color: '#FFFFFF',
                            }}
                          >
                            {st.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[var(--text)] truncate">
                                {st.fullName}
                              </span>
                              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                                @{st.username}
                              </span>
                              {isBanned && (
                                <span className="px-1.5 py-0.2 bg-[var(--danger)] text-white text-[9px] font-bold uppercase rounded-none">
                                  BANNED
                                </span>
                              )}
                              {isMuted && (
                                <span className="px-1.5 py-0.2 bg-[var(--warning)]/20 text-[var(--warning)] text-[9px] font-bold uppercase rounded-none border border-[var(--warning)]/30">
                                  MUTED IN CHAT
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              Class {st.class || '8'}-{st.section || 'A'} • {st.followerCount || 0} followers • {st.postCount || 0} posts
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* 1. Warn Student */}
                          <button
                            onClick={() => {
                              setWarnModalStudent(st);
                              setWarnReason('Violating school chat and community guidelines.');
                            }}
                            className="px-2.5 h-8 rounded-none bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-bold hover:bg-amber-500/25 cursor-pointer flex items-center gap-1"
                            title="Issue Official Disciplinary Warning"
                          >
                            <AlertTriangle size={12} />
                            <span className="hidden sm:inline">Warn</span>
                          </button>

                          {/* 2. Ban / Unban Student */}
                          <button
                            onClick={() => {
                              if (isBanned) {
                                handleToggleBan(st.username);
                              } else {
                                setBanModalStudent(st);
                                setBanReasonText('Severe community guideline violations or repeated misconduct.');
                              }
                            }}
                            className={`px-3 h-8 rounded-none text-xs font-semibold cursor-pointer transition-colors ${
                              isBanned
                                ? 'bg-[var(--success)] text-white hover:opacity-90'
                                : 'bg-[var(--danger)] text-white hover:opacity-90'
                            }`}
                          >
                            {isBanned ? 'Unban' : 'Ban'}
                          </button>

                          {/* 3. Mute in Chat */}
                          <button
                            onClick={() => handleToggleMuteInChat(st.username)}
                            className={`px-2.5 h-8 rounded-none border text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                              isMuted
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text)] hover:bg-[var(--line)]'
                            }`}
                            title={isMuted ? 'Unmute from chat' : 'Mute from chat'}
                          >
                            {isMuted ? <Volume2 size={13} /> : <VolumeX size={13} />}
                            <span className="hidden md:inline">{isMuted ? 'Muted' : 'Mute'}</span>
                          </button>

                          {/* 4. Options Modal */}
                          <button
                            onClick={() => setSelectedStudentForModal(st)}
                            className="px-2.5 h-8 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--line)] cursor-pointer"
                          >
                            Options
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CSV Roster Section */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                Batch Roster CSV Upload
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Format: Name, Class, Section, AdmissionNumber
              </p>
              <textarea
                value={csvText}
                onChange={(e) => handleCsvChange(e.target.value)}
                placeholder="Paste CSV rows here..."
                rows={4}
                className="w-full p-3 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-mono text-[var(--text)] focus:outline-none"
              />
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--text)]">
                    Parsed {parsedRows.length} students
                  </div>
                  <button
                    onClick={handleUploadRoster}
                    disabled={parsedRows.some((r) => r.error)}
                    className="w-full h-10 rounded-none bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold hover:bg-[var(--primary-hover)] cursor-pointer disabled:opacity-50"
                  >
                    Confirm & Enroll Roster
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CHATS & DIRECT MESSAGES OVERSIGHT */}
        {/* ========================================================================= */}
        {activeTab === 'chats' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conversation Selector List */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-3 space-y-2 md:col-span-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Active Student Circles
              </h2>
              <div className="space-y-1 overflow-y-auto max-h-[500px]">
                {conversations.map((conv) => {
                  const isSelected = activeConvId === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => loadMessagesForConv(conv.id)}
                      className={`w-full p-2.5 text-left border rounded-none transition-colors cursor-pointer flex flex-col gap-0.5 ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--surface-sunken)]'
                          : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-sunken)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text)] truncate">
                          {conv.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {conv.timeAgo}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {conv.lastMessage}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Message Inspector & Action Console */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-4 md:col-span-2 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)]">
                      {conversations.find((c) => c.id === activeConvId)?.name || 'Conversation Inspector'}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Real-time monitoring. You can delete improper messages or post administrative directives.
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 bg-[var(--surface-sunken)] border border-[var(--line)]">
                    {activeMessages.length} messages
                  </span>
                </div>

                {/* Messages Feed */}
                <div className="space-y-2 overflow-y-auto max-h-[380px] p-2 bg-[var(--surface-sunken)] border border-[var(--line)] rounded-none">
                  {activeMessages.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] text-center py-8">
                      No message history recorded for this circle.
                    </p>
                  ) : (
                    activeMessages.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 bg-[var(--surface)] border border-[var(--line)] rounded-none flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase text-[var(--primary)]">
                              {m.sender === 'me' ? 'Sender' : 'Participant'}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {m.time}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text)] break-words">
                            {m.text}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteChatMessage(m.id)}
                          className="px-2 py-1 bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30 rounded-none text-[10px] font-bold hover:bg-[var(--danger)] hover:text-white transition-colors cursor-pointer shrink-0"
                          title="Delete Improper Message"
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Admin Broadcast Bar */}
              <div className="pt-2 border-t border-[var(--line)] space-y-2">
                <span className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
                  Post Administrative Broadcast
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminBroadcastText}
                    onChange={(e) => setAdminBroadcastText(e.target.value)}
                    placeholder="Type official admin announcement into this chat..."
                    className="flex-1 h-10 px-3 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none"
                  />
                  <button
                    onClick={handleSendAdminBroadcast}
                    className="px-4 h-10 rounded-none bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={13} />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: NOTICES & CIRCULARS MANAGER */}
        {/* ========================================================================= */}
        {activeTab === 'notices' && (
          <div className="space-y-4">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    Official School Circulars & Notices
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Publish official notices instantly displayed across student TopBars and Notices page.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewNoticeModal(true)}
                  className="px-3 h-9 rounded-none bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create Notice</span>
                </button>
              </div>

              {/* Active Live Broadcast Banner Status */}
              {activeBroadcast && (
                <div className="p-3 bg-red-950/20 border border-red-500/40 rounded-none flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">📢</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-red-600 text-white rounded-none">
                          ACTIVE LIVE BROADCAST BANNER
                        </span>
                        <span className="font-bold text-xs truncate text-[var(--text)]">{activeBroadcast.title}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{activeBroadcast.text}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearBroadcast}
                    className="px-2.5 py-1 bg-[var(--surface-sunken)] border border-[var(--line)] text-[11px] font-bold text-red-400 hover:bg-red-900/30 cursor-pointer rounded-none shrink-0"
                  >
                    Clear Broadcast
                  </button>
                </div>
              )}

              {/* Notices List */}
              <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-none">
                {notices.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 bg-[var(--surface)] hover:bg-[var(--surface-sunken)] transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {n.pinned && <Pin size={12} className="text-[var(--primary)]" />}
                        <span
                          className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-none"
                          style={{
                            backgroundColor:
                              n.category === 'urgent'
                                ? 'var(--danger)'
                                : n.category === 'exams'
                                ? 'var(--warning)'
                                : 'var(--primary)',
                            color: '#FFFFFF',
                          }}
                        >
                          {n.category}
                        </span>
                        <h3 className="text-xs font-bold text-[var(--text)] truncate">
                          {n.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                        {n.content}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {n.date} • Seen by {n.seenBy || 140} students {n.hasAttachment && '• Includes PDF circular'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      className="px-3 h-8 rounded-none bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30 text-xs font-semibold hover:bg-[var(--danger)] hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CALENDAR & EXAM/HOLIDAY SCHEDULER */}
        {/* ========================================================================= */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    Academic Calendar & Event Scheduler
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Control scheduled exam timetables, sports days, science exhibitions, and school holidays.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewEventModal(true)}
                  className="px-3 h-9 rounded-none bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Event</span>
                </button>
              </div>

              {/* Events List */}
              <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-none">
                {calendarEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 bg-[var(--surface)] hover:bg-[var(--surface-sunken)] transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-none"
                          style={{
                            backgroundColor:
                              ev.category === 'Exam'
                                ? 'var(--danger)'
                                : ev.category === 'Holiday'
                                ? 'var(--success)'
                                : 'var(--primary)',
                            color: '#FFFFFF',
                          }}
                        >
                          {ev.category}
                        </span>
                        <h3 className="text-xs font-bold text-[var(--text)] truncate">
                          {ev.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {ev.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                        <span className="font-mono font-bold text-[var(--text)]">{ev.date}</span>
                        {ev.isImportant && (
                          <span className="text-[var(--danger)] font-semibold">• High Priority</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCalendarEvent(ev.id)}
                      className="px-3 h-8 rounded-none bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30 text-xs font-semibold hover:bg-[var(--danger)] hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: REPORTS & FEED MODERATION */}
        {/* ========================================================================= */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            {/* Reports Queue */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                Student Reports Queue
              </h2>
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`border rounded-none p-3.5 space-y-2.5 ${
                      report.urgency === 'urgent'
                        ? 'border-[var(--danger)]/60 bg-[var(--danger)]/5'
                        : 'border-[var(--line)] bg-[var(--surface)]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-[var(--danger)] text-white text-[9px] font-bold uppercase rounded-none">
                          {report.urgency}
                        </span>
                        <span className="font-bold text-[var(--text)]">
                          {report.type.toUpperCase()} by @{report.targetUser}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {report.reportCount} reports • {report.createdAt}
                      </span>
                    </div>

                    <p className="p-2.5 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs italic text-[var(--text)]">
                      "{report.contentSnippet}"
                    </p>

                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <button
                        onClick={() => setActionModal({ report, action: 'Hide' })}
                        className="h-8 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--line)] cursor-pointer"
                      >
                        Hide
                      </button>
                      <button
                        onClick={() => setActionModal({ report, action: 'Delete' })}
                        className="h-8 rounded-none bg-[var(--surface-sunken)] border border-[var(--danger)]/40 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10 cursor-pointer"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setActionModal({ report, action: 'Warn' })}
                        className="h-8 rounded-none bg-[var(--surface-sunken)] border border-[var(--warning)]/40 text-xs font-semibold text-[var(--warning)] hover:bg-[var(--warning)]/10 cursor-pointer"
                      >
                        Warn
                      </button>
                      <button
                        onClick={() => setActionModal({ report, action: 'Ban' })}
                        className="h-8 rounded-none bg-[var(--danger)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                      >
                        Ban Student
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Feed & Story Removal */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                Live School Feed Moderation
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Browse student posts and remove inappropriate content with 1 click.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {livePosts.slice(0, 4).map((post) => (
                  <div
                    key={post.id}
                    className="p-3 border border-[var(--line)] rounded-none bg-[var(--surface-sunken)] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text)]">
                        @{post.username} (Class {post.class})
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {post.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text)] line-clamp-2">
                      {post.caption}
                    </p>
                    <button
                      onClick={() => handleDeleteLivePost(post.id)}
                      className="w-full h-8 bg-[var(--danger)] text-white text-xs font-semibold rounded-none hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Delete Post From Feed
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SYSTEM SETTINGS & INVITE CODE */}
        {/* ========================================================================= */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            {/* Invite Code */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                School Registration Invite Code
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="flex-1 h-10 px-3 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-mono font-bold text-[var(--text)] uppercase focus:outline-none"
                />
                <button
                  onClick={handleSaveInviteCode}
                  className="px-4 h-10 rounded-none bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold hover:bg-[var(--primary-hover)] cursor-pointer"
                >
                  Save Code
                </button>
              </div>
            </div>

            {/* Maintenance Mode & Calendar Lock */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
                    <Lock size={14} className="text-amber-500" />
                    <span>Maintenance Mode & Calendar Lock 📅</span>
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Schedule and lock specific calendar days for examinations or system maintenance. While active, student chat messaging is disabled.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !maintenanceMode;
                    setMaintenanceMode(nextVal);
                    DataStore.setGlobalMaintenanceEnabled(nextVal);
                    setStatusMessage({
                      type: 'success',
                      text: nextVal ? 'Instant global maintenance mode enabled.' : 'Global maintenance mode disabled.',
                    });
                  }}
                  className={`px-4 h-9 rounded-none text-xs font-semibold cursor-pointer transition-colors ${
                    maintenanceMode ? 'bg-[var(--danger)] text-white' : 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)]'
                  }`}
                >
                  {maintenanceMode ? 'INSTANT LOCK ACTIVE' : 'INSTANT LOCK (OFF)'}
                </button>
              </div>

              {/* Maintenance Status Bar */}
              <div
                className={`p-3 rounded-none border text-xs flex items-center justify-between ${
                  DataStore.isMaintenanceActive()
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{DataStore.isMaintenanceActive() ? '🔒' : '✅'}</span>
                  <div>
                    <p className="font-bold">
                      {DataStore.isMaintenanceActive()
                        ? 'Maintenance Mode is currently ACTIVE today'
                        : 'System is NORMAL today'}
                    </p>
                    <p className="text-[11px] opacity-80">
                      {DataStore.isMaintenanceActive()
                        ? 'Student chat messaging is currently locked'
                        : `${maintenanceDates.length} scheduled maintenance day(s) locked on calendar`}
                    </p>
                  </div>
                </div>
                {maintenanceDates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      DataStore.setMaintenanceDates([]);
                      setMaintenanceDates([]);
                      setStatusMessage({
                        type: 'success',
                        text: 'Cleared all scheduled maintenance dates.',
                      });
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500 text-white hover:bg-rose-600 rounded cursor-pointer"
                  >
                    Clear All Locked Days
                  </button>
                )}
              </div>

              {/* Interactive Calendar Component */}
              <div className="bg-[var(--surface-sunken)] border border-[var(--line)] p-4 rounded-none space-y-3">
                {/* Calendar Header Month & Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      className="w-7 h-7 rounded border border-[var(--line)] flex items-center justify-center hover:bg-[var(--surface)] text-[var(--text)] cursor-pointer"
                      aria-label="Previous month"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                      {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      className="w-7 h-7 rounded border border-[var(--line)] flex items-center justify-center hover:bg-[var(--surface)] text-[var(--text)] cursor-pointer"
                      aria-label="Next month"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        if (!maintenanceDates.includes(todayStr)) {
                          DataStore.toggleMaintenanceDate(todayStr);
                          setMaintenanceDates(DataStore.getMaintenanceDates());
                          setStatusMessage({
                            type: 'success',
                            text: `Today (${todayStr}) is now locked for maintenance.`,
                          });
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded border border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 cursor-pointer"
                    >
                      + Lock Today 🔒
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const datesToAdd: string[] = [];
                        const now = new Date();
                        for (let i = 0; i < 5; i++) {
                          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
                          const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          if (!maintenanceDates.includes(str)) {
                            datesToAdd.push(str);
                          }
                        }
                        const merged = Array.from(new Set([...maintenanceDates, ...datesToAdd])).sort();
                        DataStore.setMaintenanceDates(merged);
                        setMaintenanceDates(merged);
                        setStatusMessage({
                          type: 'success',
                          text: 'Locked next 5 days for exam / system maintenance.',
                        });
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded border border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 cursor-pointer"
                    >
                      + Lock Exam Week (5 Days) 📅
                    </button>
                  </div>
                </div>

                {/* Weekday Labels */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {(() => {
                    const year = calendarMonth.getFullYear();
                    const month = calendarMonth.getMonth();
                    const firstDayIndex = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();

                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                    const cells = [];
                    for (let i = 0; i < firstDayIndex; i++) {
                      cells.push(<div key={`blank-${i}`} className="h-9" />);
                    }
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isLocked = maintenanceDates.includes(dateStr);
                      const isToday = dateStr === todayStr;

                      cells.push(
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            const isNowLocked = DataStore.toggleMaintenanceDate(dateStr);
                            setMaintenanceDates(DataStore.getMaintenanceDates());
                            setStatusMessage({
                              type: 'success',
                              text: isNowLocked ? `Locked ${dateStr} for maintenance.` : `Unlocked ${dateStr}.`,
                            });
                          }}
                          className={`h-9 rounded flex flex-col items-center justify-center text-xs font-semibold transition-all cursor-pointer relative ${
                            isLocked
                              ? 'bg-rose-600 text-white font-bold shadow-xs'
                              : isToday
                              ? 'border-2 border-amber-500 bg-[var(--surface)] text-[var(--text)] font-bold'
                              : 'hover:bg-[var(--surface)] text-[var(--text)]'
                          }`}
                          title={isLocked ? `${dateStr} is Locked` : `Click to lock ${dateStr}`}
                        >
                          <span>{day}</span>
                          {isLocked && <span className="text-[9px] leading-none">🔒</span>}
                        </button>
                      );
                    }
                    return cells;
                  })()}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] text-center pt-1">
                  💡 Tap any date on the calendar to toggle locking/unlocking maintenance mode for that specific day.
                </p>
              </div>

              {/* Locked Dates Summary List */}
              {maintenanceDates.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text)] block">
                    Scheduled Locked Days ({maintenanceDates.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {maintenanceDates.map((dStr) => (
                      <span
                        key={dStr}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono font-semibold"
                      >
                        <Lock size={11} />
                        <span>{dStr}</span>
                        <button
                          type="button"
                          onClick={() => {
                            DataStore.toggleMaintenanceDate(dStr);
                            setMaintenanceDates(DataStore.getMaintenanceDates());
                            setStatusMessage({
                              type: 'success',
                              text: `Unlocked ${dStr}.`,
                            });
                          }}
                          className="ml-1 text-rose-400 hover:text-white hover:bg-rose-500/30 rounded px-1 cursor-pointer"
                          aria-label={`Unlock ${dStr}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cloudflare R2 Storage & Database Analytics (Requirements #7 & #8) */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    Cloudinary Media & Database Analytics (25 GB Free - No Card)
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Cloudinary 25.0 GB free media quota & PostgreSQL storage. Warning triggers at 80% capacity.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStorageAnalytics(DataStore.getStorageAnalytics());
                    setStatusMessage({ type: 'success', text: 'Storage metrics refreshed.' });
                  }}
                  className="px-2.5 py-1 text-xs border border-[var(--line)] bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text)] cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Hard 20.0 GB Safety Lock Indicator Banner */}
              {storageAnalytics?.isStorageLocked || storageAnalytics?.isR2Locked ? (
                <div className="p-3 bg-red-500/15 border border-red-500/50 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="shrink-0 text-red-500" />
                    <div>
                      <span className="font-bold">🔒 20.0 GB HARD UPLOAD LOCK ACTIVE: </span>
                      <span>Cloudinary media usage has reached {storageAnalytics?.storageUsedGB} GB. New photo uploads are blocked school-wide to guarantee $0.00 free tier status. Run prune/purge below to unlock.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePruneChatsNow}
                    className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs shrink-0 cursor-pointer hover:bg-red-700"
                  >
                    Quick Prune
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>
                      <strong>🛡️ 20.0 GB Safety Lock Active:</strong> {storageAnalytics?.remainingToLockGB ?? (20.0 - (storageAnalytics?.storageUsedGB ?? 0)).toFixed(2)} GB buffer remaining before upload lock engages (5.0 GB reserved cushion under Cloudinary&apos;s 25.0 GB free allowance).
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/20 rounded-none shrink-0">
                    No Card • $0.00 Free
                  </span>
                </div>
              )}

              {/* Capacity Progress Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cloudinary Media Storage */}
                <div className="p-3 bg-[var(--surface-sunken)] border border-[var(--line)] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--text)]">Cloudinary Media</span>
                      {(storageAnalytics?.isStorageLocked || storageAnalytics?.isR2Locked) && (
                        <span className="px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-bold uppercase">
                          LOCKED
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[var(--primary)]">
                      {storageAnalytics?.storageUsedGB ?? 0} GB / {storageSettings?.storageLockGB ?? 20.0} GB Lock (25 GB Max)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        storageAnalytics?.isStorageLocked || storageAnalytics?.isR2Locked
                          ? 'bg-red-500'
                          : storageAnalytics?.isStorageWarning
                          ? 'bg-amber-500'
                          : 'bg-[var(--primary)]'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(2, ((storageAnalytics?.storageUsedGB ?? 0) / 25) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>{storageAnalytics?.totalPhotos ?? 0} active photos</span>
                    <span>{storageAnalytics?.remainingToLockGB ?? 0} GB until lock ceiling</span>
                  </div>
                </div>

                {/* Supabase Database Storage */}
                <div className="p-3 bg-[var(--surface-sunken)] border border-[var(--line)] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[var(--text)]">Supabase Database</span>
                    <span className="font-mono text-[11px] font-bold text-[var(--primary)]">
                      {storageAnalytics?.dbSizeMB ?? 0} MB / 500 MB (Free)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        storageAnalytics?.isDbWarning ? 'bg-red-500' : 'bg-[var(--primary)]'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(2, ((storageAnalytics?.dbSizeMB ?? 0) / 500) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>{storageAnalytics?.totalChatMessages ?? 0} chat messages</span>
                    <span>1,000 students quota safe</span>
                  </div>
                </div>
              </div>

              {/* Data Lifecycle & Retention Controls */}
              <div className="pt-2 border-t border-[var(--line)] space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text)]">
                  Data Lifecycle, Storage Lock & Auto-Pruning Settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Upload Lock Threshold */}
                  <div className="p-3 bg-[var(--surface-sunken)] border border-[var(--line)] space-y-2">
                    <label className="block text-xs font-semibold text-[var(--text)]">
                      Cloudinary Lock Ceiling
                    </label>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Hard stop on uploads to protect 25 GB free tier.
                    </p>
                    <div className="flex gap-2 items-center pt-1">
                      <select
                        value={storageSettings?.storageLockGB ?? 20.0}
                        onChange={(e) => handleUpdateStorageLock(Number(e.target.value))}
                        className="w-full h-8 px-2 bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--text)] font-semibold cursor-pointer"
                      >
                        <option value={18.0}>18.0 GB (7 GB Buffer)</option>
                        <option value={20.0}>20.0 GB (Recommended)</option>
                        <option value={22.0}>22.0 GB (3 GB Buffer)</option>
                      </select>
                    </div>
                  </div>

                  {/* Chat Retention (Requirement #8) */}
                  <div className="p-3 bg-[var(--surface-sunken)] border border-[var(--line)] space-y-2">
                    <label className="block text-xs font-semibold text-[var(--text)]">
                      Chat Auto-Delete Policy
                    </label>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Purges older chat rows to stay under the 500MB free quota.
                    </p>
                    <div className="flex gap-2 items-center pt-1">
                      <select
                        value={storageSettings?.chatRetentionDays ?? 90}
                        onChange={(e) => handleUpdateChatRetention(Number(e.target.value))}
                        className="h-8 px-2 bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--text)] font-semibold cursor-pointer"
                      >
                        <option value={30}>30 Days</option>
                        <option value={60}>60 Days</option>
                        <option value={90}>90 Days</option>
                        <option value={180}>180 Days</option>
                      </select>
                      <button
                        type="button"
                        onClick={handlePruneChatsNow}
                        className="h-8 px-2.5 bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer shrink-0"
                      >
                        Prune Now
                      </button>
                    </div>
                  </div>

                  {/* Post Photo Retention (Requirement #5) */}
                  <div className="p-3 bg-[var(--surface-sunken)] border border-[var(--line)] space-y-2">
                    <label className="block text-xs font-semibold text-[var(--text)]">
                      Post Photos Retention in R2
                    </label>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Purges high-res photos older than N months to reclaim space.
                    </p>
                    <div className="flex gap-2 items-center pt-1">
                      <select
                        value={storageSettings?.postPhotoRetentionMonths ?? 0}
                        onChange={(e) => handleUpdatePostRetention(Number(e.target.value))}
                        className="w-full h-8 px-2 bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--text)] font-semibold cursor-pointer"
                      >
                        <option value={0}>Disabled (Keep All)</option>
                        <option value={6}>Delete after 6 Mo</option>
                        <option value={12}>Delete after 12 Mo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Free Scheduler Maintenance Actions (Requirement #5) */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePurgeStoriesNow}
                    className="px-3 py-1.5 bg-[var(--surface-sunken)] border border-[var(--line)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <Clock size={13} />
                    <span>Purge Expired Story Media (48h Lifetime)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRunOrphanSweep}
                    className="px-3 py-1.5 bg-[var(--surface-sunken)] border border-[var(--line)] hover:bg-[var(--surface)] text-[var(--text)] text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles size={13} />
                    <span>Run Weekly Orphan File Sweep</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Entity Audit */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                System Database Audit
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(counts).map(([name, count]) => (
                  <div
                    key={name}
                    className="p-3 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-left"
                  >
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{name}</p>
                    <p className="font-mono text-base font-bold text-[var(--text)]">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Wipe Test Data */}
            <div className="bg-[var(--surface)] border border-[var(--danger)]/50 rounded-none p-4 space-y-3">
              <div className="flex items-center gap-2 text-[var(--danger)]">
                <AlertTriangle size={18} />
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  Danger Zone: Reset Database
                </h2>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Wipes all mock posts, stories, messages, and claims. Preserves Shashwath Super Admin account.
              </p>
              <button
                onClick={() => setShowWipeModal(true)}
                className="w-full h-10 rounded-none bg-[var(--danger)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                <span>Wipe Test Data & Reset</span>
              </button>
            </div>
          </div>
        )}

        {/* Music Management Tab Panel */}
        {activeTab === 'music' && <AdminMusicManager />}
      </div>

      {/* MODAL: CREATE NEW NOTICE */}
      {showNewNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-[var(--text)]">
                Publish School Circular
              </h3>
              <button
                onClick={() => setShowNewNoticeModal(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePublishNotice} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Title</label>
                <input
                  type="text"
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  placeholder="e.g. Unit Test II Timing Adjustment"
                  className="w-full h-10 px-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Category</label>
                <select
                  value={newNoticeCategory}
                  onChange={(e) => setNewNoticeCategory(e.target.value as any)}
                  className="w-full h-10 px-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none"
                >
                  <option value="urgent">Urgent</option>
                  <option value="exams">Exams</option>
                  <option value="holidays">Holidays</option>
                  <option value="sports">Sports</option>
                  <option value="events">Events</option>
                  <option value="fees">Fees</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Content</label>
                <textarea
                  value={newNoticeContent}
                  onChange={(e) => setNewNoticeContent(e.target.value)}
                  placeholder="Official instructions for students and teachers..."
                  rows={4}
                  className="w-full p-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none"
                  required
                />
              </div>

              {/* PDF Document Attachment Section */}
              <div className="space-y-2 p-3 bg-[var(--surface-sunken)] border border-[var(--line)] rounded-none">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[var(--text)] uppercase flex items-center gap-1.5">
                    <FileText size={14} className="text-red-500" />
                    Attach Official PDF Circular
                  </label>
                  {newNoticePdfName && (
                    <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                      <Check size={12} /> Ready
                    </span>
                  )}
                </div>

                <input
                  ref={pdfFileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                      setStatusMessage({ type: 'error', text: 'Please select a valid PDF file (.pdf)' });
                      return;
                    }

                    if (file.size > 8 * 1024 * 1024) {
                      setStatusMessage({ type: 'error', text: 'PDF is too large (max 8MB). Please choose a smaller file.' });
                      return;
                    }

                    const sizeKb = Math.round(file.size / 1024);
                    const formattedSize = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

                    setNewNoticePdfFile(file);
                    setNewNoticePdfName(file.name);
                    setNewNoticePdfSize(formattedSize);
                    setNewNoticeAttachment(true);

                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        setNewNoticePdfDataUrl(reader.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />

                {newNoticePdfName ? (
                  <div className="flex items-center justify-between p-2.5 bg-[var(--surface)] border border-[var(--line)]">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div className="w-8 h-8 bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text)] truncate">{newNoticePdfName}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{newNoticePdfSize || 'Official PDF Attachment'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {newNoticePdfDataUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            window.open(newNoticePdfDataUrl, '_blank');
                          }}
                          className="px-2.5 h-7 text-[11px] font-semibold bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)] hover:bg-[var(--line)] cursor-pointer"
                        >
                          Preview
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setNewNoticePdfFile(null);
                          setNewNoticePdfDataUrl('');
                          setNewNoticePdfName('');
                          setNewNoticePdfSize('');
                          setNewNoticeAttachment(false);
                          if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
                        }}
                        className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                        title="Remove attached PDF"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => pdfFileInputRef.current?.click()}
                    className="p-3 border border-dashed text-center cursor-pointer hover:border-[var(--primary)] transition-colors group bg-[var(--surface)]"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Upload size={18} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                      <p className="text-xs font-semibold text-[var(--text)]">
                        Click to upload official school PDF circular
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Exam timetables, date sheets, holiday letters, rules & guidelines (PDF up to 8MB)
                      </p>
                    </div>
                  </div>
                )}

                {/* Optional online link */}
                <input
                  type="url"
                  value={newNoticePdfExternalUrl}
                  onChange={(e) => {
                    setNewNoticePdfExternalUrl(e.target.value);
                    if (e.target.value.trim()) {
                      setNewNoticeAttachment(true);
                      if (!newNoticePdfName) setNewNoticePdfName('Official_Notice_Circular.pdf');
                    }
                  }}
                  placeholder="Or paste external PDF URL (Google Drive / web link)..."
                  className="w-full h-8 px-2.5 bg-[var(--surface)] border border-[var(--line)] text-[11px] text-[var(--text)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newNoticePinned}
                    onChange={(e) => setNewNoticePinned(e.target.checked)}
                  />
                  <span>Pin to top</span>
                </label>

                {/* Option: Urgent Notice */}
                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-red-500/10 border border-red-500/40 rounded-xl">
                  <input
                    type="checkbox"
                    checked={newNoticeIsUrgent}
                    onChange={(e) => {
                      setNewNoticeIsUrgent(e.target.checked);
                      if (e.target.checked) setNewNoticeCategory('urgent');
                    }}
                    className="accent-red-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-red-500 block flex items-center gap-1.5">
                      🚨 Option: Urgent Notice
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block">
                      Sends high-priority alert &ldquo;Notice Urgent: [Title]&rdquo; to all students and chat feeds
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 bg-[var(--surface-sunken)] border border-[var(--line)] rounded-none">
                  <input
                    type="checkbox"
                    checked={broadcastToHome}
                    onChange={(e) => setBroadcastToHome(e.target.checked)}
                    className="accent-[var(--primary)] w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-xs text-[var(--text)] block">
                      📢 Broadcast Banner to Home Feed (All Users)
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Immediately pins a bold broadcast banner at the top of the feed for every student
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewNoticeModal(false)}
                  className="flex-1 h-10 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-none bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold hover:bg-[var(--primary-hover)] cursor-pointer"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CALENDAR EVENT */}
      {showNewEventModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-[var(--text)]">
                Add Academic Calendar Event
              </h3>
              <button
                onClick={() => setShowNewEventModal(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCalendarEvent} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Event Title</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Maths Pre-Board Exam"
                  className="w-full h-10 px-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Date</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Category</label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
                  className="w-full h-10 px-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none"
                >
                  <option value="Exam">Exam</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Sports">Sports</option>
                  <option value="Assembly">Assembly</option>
                  <option value="Festival">Festival</option>
                  <option value="Academic">Academic</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Description</label>
                <textarea
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="Details for student syllabus, timings, venue..."
                  rows={3}
                  className="w-full p-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewEventModal(false)}
                  className="flex-1 h-10 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-none bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold hover:bg-[var(--primary-hover)] cursor-pointer"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION SHEET: ACTION MODAL FOR REPORTS */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--line)] rounded-none p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text)]">
              Confirm {actionModal.action}: @{actionModal.report.targetUser}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Content: "{actionModal.report.contentSnippet}"
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 h-9 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeReportAction}
                className="flex-1 h-9 rounded-none bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold hover:bg-[var(--primary-hover)] cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WARN STUDENT */}
      {warnModalStudent && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border-2 border-amber-500 rounded-none p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500/20 text-amber-500 flex items-center justify-center rounded-none font-bold">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">
                    Issue Disciplinary Warning
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Target: @{warnModalStudent.username} ({warnModalStudent.fullName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWarnModalStudent(null)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase block">
                Warning Directive / Reason
              </label>
              <textarea
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                rows={3}
                className="w-full p-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none"
                placeholder="State the violation..."
              />

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Inappropriate language or harassment in chat',
                    'Spamming messages / disrespectful conduct',
                    'Sharing unauthorized exam or paper materials',
                    'Bullying or unkind remarks on school posts',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWarnReason(preset)}
                      className="px-2 py-1 text-[10px] bg-[var(--surface-sunken)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--text)] rounded-none cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWarnModalStudent(null)}
                className="flex-1 h-10 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleWarnUser(warnModalStudent.username, warnReason)}
                className="flex-1 h-10 rounded-none bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Send Warning</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BAN STUDENT WITH REASON */}
      {banModalStudent && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border-2 border-red-500 rounded-none p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-950 text-red-500 flex items-center justify-center rounded-none font-bold">
                  🚫
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">
                    Suspend / Ban Account
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Target: @{banModalStudent.username} ({banModalStudent.fullName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBanModalStudent(null)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Completely banning this student will lock them out of the feed, hide their posts/stories, and prevent them from sending or receiving messages.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase block">
                Administrative Suspension Reason
              </label>
              <textarea
                value={banReasonText}
                onChange={(e) => setBanReasonText(e.target.value)}
                rows={3}
                className="w-full p-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none"
                placeholder="Specify suspension reason shown to student upon login..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBanModalStudent(null)}
                className="flex-1 h-10 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmBan(banModalStudent.username, banReasonText)}
                className="flex-1 h-10 rounded-none bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs cursor-pointer"
              >
                Confirm Complete Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: STUDENT OPTIONS */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--line)] rounded-none p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text)]">
              Manage @{selectedStudentForModal.username}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {selectedStudentForModal.fullName} • Class {selectedStudentForModal.class}-{selectedStudentForModal.section}
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setWarnModalStudent(selectedStudentForModal);
                  setWarnReason('Violating school chat and community guidelines.');
                  setSelectedStudentForModal(null);
                }}
                className="w-full h-9 rounded-none bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 cursor-pointer flex items-center justify-center gap-1.5"
              >
                ⚠️ Issue Disciplinary Warning
              </button>
              <button
                onClick={() => {
                  handleToggleMuteInChat(selectedStudentForModal.username);
                  setSelectedStudentForModal(null);
                }}
                className="w-full h-9 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--line)] cursor-pointer"
              >
                {mutedUserList.includes(selectedStudentForModal.username.toLowerCase())
                  ? '🔊 Unmute from Chat'
                  : '🔇 Mute from Chat'}
              </button>
              <button
                onClick={() => {
                  if (bannedUserList.includes(selectedStudentForModal.username.toLowerCase())) {
                    handleToggleBan(selectedStudentForModal.username);
                    setSelectedStudentForModal(null);
                  } else {
                    setBanModalStudent(selectedStudentForModal);
                    setBanReasonText('Severe community guideline violations or repeated misconduct.');
                    setSelectedStudentForModal(null);
                  }
                }}
                className="w-full h-9 rounded-none bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-900/40 cursor-pointer"
              >
                {bannedUserList.includes(selectedStudentForModal.username.toLowerCase())
                  ? '✓ Unban Account'
                  : '🚫 Completely Ban Account'}
              </button>
              <button
                onClick={() => handleResetPassword(selectedStudentForModal.username)}
                className="w-full h-9 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--line)] cursor-pointer"
              >
                Reset Password Code
              </button>
              <button
                onClick={() => handleResetClaim(selectedStudentForModal.username)}
                className="w-full h-9 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--line)] cursor-pointer"
              >
                Clear Roster Claim
              </button>
              <button
                onClick={() => handleDeleteUser(selectedStudentForModal.username)}
                className="w-full h-9 rounded-none bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                🗑️ Permanently Delete Account
              </button>
              <button
                onClick={() => setSelectedStudentForModal(null)}
                className="w-full h-9 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text-muted)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: WIPE DATA */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--danger)]/60 rounded-none p-5 max-w-sm w-full space-y-4">
            <div className="text-[var(--danger)]">
              <AlertOctagon size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">
                Confirm Database Reset
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                This will wipe test posts, stories, messages, and claims while preserving Shashwath Super Admin.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWipeModal(false)}
                className="flex-1 h-9 rounded-none bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleWipeData}
                disabled={isWiping}
                className="flex-1 h-9 rounded-none bg-[var(--danger)] text-white text-xs font-semibold cursor-pointer"
              >
                {isWiping ? 'Wiping...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
