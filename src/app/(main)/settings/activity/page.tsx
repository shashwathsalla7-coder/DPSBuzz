'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  Image as ImageIcon,
  Calendar,
  ShieldAlert,
  Heart,
  MessageCircle,
  CornerUpLeft,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  Layers,
  Music,
  User,
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
  KeyRound,
} from 'lucide-react';
import {
  DataStore,
  type Post,
  type Story,
  type UserActivityComment,
  type StoryReply,
  type AccountHistoryEvent,
  type BanAppeal,
  type UserWarning,
  type Profile,
} from '@/lib/dataStore';
import { MusicTrackPill } from '@/components/music/MusicTrackPill';

type ActivityCategory = 'interactions' | 'photos' | 'history' | 'appeals';
type InteractionSubTab = 'likes' | 'comments' | 'replies';
type LikesSubFilter = 'posts' | 'stories';
type SortOrder = 'newest' | 'oldest';

function YourActivityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Category & Subtabs
  const initialTab = searchParams.get('tab') as ActivityCategory | null;
  const [activeCategory, setActiveCategory] = useState<ActivityCategory>(initialTab || 'interactions');
  const [interactionSubTab, setInteractionSubTab] = useState<InteractionSubTab>('likes');
  const [likesSubFilter, setLikesSubFilter] = useState<LikesSubFilter>('posts');

  // Sorting & Filtering
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  // Multi-Select Mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Data States
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [likedStories, setLikedStories] = useState<Story[]>([]);
  const [userComments, setUserComments] = useState<UserActivityComment[]>([]);
  const [storyReplies, setStoryReplies] = useState<StoryReply[]>([]);
  const [userPhotos, setUserPhotos] = useState<Post[]>([]);
  const [accountHistory, setAccountHistory] = useState<AccountHistoryEvent[]>([]);
  const [userWarnings, setUserWarnings] = useState<UserWarning[]>([]);
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');

  // Post Detail Modal Preview
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  // Appeal Submission Form State
  const [appealType, setAppealType] = useState<BanAppeal['appealType']>('suspension');
  const [appealReason, setAppealReason] = useState('');
  const [appealContact, setAppealContact] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadAllData = () => {
    const cur = DataStore.getCurrentUser();
    if (!cur || !cur.username || cur.username.toLowerCase() === 'guest') {
      router.replace('/login');
      return;
    }
    setCurrentUser(cur);

    const username = cur.username;
    setLikedPosts(DataStore.getUserLikedPosts(username));
    setLikedStories(DataStore.getUserLikedStories(username));
    setUserComments(DataStore.getUserComments(username));
    setStoryReplies(DataStore.getUserStoryReplies(username));
    setUserPhotos(DataStore.getPosts(true).filter((p) => p.username.toLowerCase() === username.toLowerCase()));
    setAccountHistory(DataStore.getAccountHistory(username));
    setUserWarnings(DataStore.getUserWarnings(username));
    setBanAppeals(DataStore.getUserBanAppeals(username));
    setIsBanned(DataStore.isUserBanned(username));
    setBanReason(DataStore.getBanReason(username));
  };

  useEffect(() => {
    loadAllData();

    const handleUpdate = () => loadAllData();
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Reset multi-select when switching tabs
  useEffect(() => {
    setIsSelectMode(false);
    setSelectedItemIds(new Set());
  }, [activeCategory, interactionSubTab, likesSubFilter]);

  // Toggle selection for an item
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all or clear selection
  const handleSelectAll = (allIds: string[]) => {
    if (selectedItemIds.size === allIds.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(allIds));
    }
  };

  // Perform bulk action
  const handleBulkAction = () => {
    const count = selectedItemIds.size;
    if (count === 0) return;

    if (activeCategory === 'interactions') {
      if (interactionSubTab === 'likes') {
        if (likesSubFilter === 'posts') {
          DataStore.bulkUnlikePosts(Array.from(selectedItemIds), currentUser?.username);
          showToast(`Unliked ${count} post${count > 1 ? 's' : ''}`);
        } else {
          // Unliking stories
          Array.from(selectedItemIds).forEach((id) => {
            DataStore.toggleLikeStory(id, currentUser?.username);
          });
          showToast(`Unliked ${count} ${count > 1 ? 'stories' : 'story'}`);
        }
      } else if (interactionSubTab === 'comments') {
        const toDelete: Array<{ postId: string; commentId: string }> = [];
        userComments.forEach((c) => {
          if (selectedItemIds.has(c.commentId)) {
            toDelete.push({ postId: c.postId, commentId: c.commentId });
          }
        });
        DataStore.bulkDeleteUserComments(toDelete);
        showToast(`Deleted ${count} comment${count > 1 ? 's' : ''}`);
      } else if (interactionSubTab === 'replies') {
        DataStore.bulkDeleteStoryReplies(Array.from(selectedItemIds));
        showToast(`Deleted ${count} story repl${count > 1 ? 'ies' : 'y'}`);
      }
    }
    setSelectedItemIds(new Set());
    setIsSelectMode(false);
    loadAllData();
  };

  // Handle single unlike
  const handleUnlikeSingle = (postId: string) => {
    DataStore.toggleLikePost(postId, currentUser?.username);
    showToast('Post removed from Likes ❤️');
    loadAllData();
    if (previewPost?.id === postId) {
      setPreviewPost(null);
    }
  };

  // Handle single comment deletion
  const handleDeleteComment = (postId: string, commentId: string) => {
    DataStore.deleteUserComment(postId, commentId);
    showToast('Comment deleted 🗑️');
    loadAllData();
  };

  // Handle single story reply deletion
  const handleDeleteReply = (replyId: string) => {
    DataStore.deleteStoryReply(replyId);
    showToast('Story reply record removed');
    loadAllData();
  };

  // Handle appeal submission
  const handleSubmitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.username) return;
    if (!appealReason.trim() || appealReason.trim().length < 10) {
      showToast('Please provide a detailed explanation (at least 10 characters)');
      return;
    }

    setIsSubmittingAppeal(true);
    setTimeout(() => {
      DataStore.submitBanAppeal({
        username: currentUser.username,
        fullName: currentUser.fullName,
        appealType,
        reason: appealReason.trim(),
        admissionNumber: currentUser.admissionNumber,
        contactEmailOrPhone: appealContact.trim() || undefined,
      });

      setIsSubmittingAppeal(false);
      setAppealReason('');
      setAppealContact('');
      showToast('Official Appeal submitted to School Administration! 📨');
      loadAllData();
    }, 600);
  };

  // Filtered and sorted data
  const filteredLikedPosts = useMemo(() => {
    let list = [...likedPosts];
    if (dateRangeFilter !== 'all') {
      const now = Date.now();
      const limitsMap = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000,
      };
      const maxAge = limitsMap[dateRangeFilter];
      list = list.filter((p) => {
        const time = p.createdAt ? new Date(p.createdAt).getTime() : 0;
        return now - time <= maxAge;
      });
    }
    return list.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'newest' ? tB - tA : tA - tB;
    });
  }, [likedPosts, sortOrder, dateRangeFilter]);

  const filteredComments = useMemo(() => {
    let list = [...userComments];
    return list.sort((a, b) => {
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? tB - tA : tA - tB;
    });
  }, [userComments, sortOrder]);

  const filteredPhotos = useMemo(() => {
    let list = [...userPhotos];
    return list.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'newest' ? tB - tA : tA - tB;
    });
  }, [userPhotos, sortOrder]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold shadow-2xl rounded-none animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container - Desktop 2-column layout matching Instagram's screenshot */}
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row border-x border-[var(--line)] min-h-[calc(100dvh-64px)] bg-[var(--surface)]">
        
        {/* ======================================================== */}
        {/* LEFT SIDEBAR (Desktop) / TOP TABS (Mobile)              */}
        {/* ======================================================== */}
        <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[var(--line)] p-4 md:p-6 shrink-0 bg-[var(--surface)]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/settings"
              className="p-1.5 rounded-full hover:bg-[var(--surface-sunken)] transition text-[var(--text)]"
              aria-label="Back to settings"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold font-display tracking-tight text-[var(--text)]">
              Your activity
            </h1>
          </div>

          {/* Navigation Categories */}
          <nav className="space-y-1.5 flex flex-row md:flex-col overflow-x-auto no-scrollbar pb-2 md:pb-0">
            {/* 1. Interactions */}
            <button
              type="button"
              onClick={() => setActiveCategory('interactions')}
              className={`w-full text-left p-3.5 rounded-none flex items-start gap-3.5 transition-colors cursor-pointer shrink-0 md:shrink ${
                activeCategory === 'interactions'
                  ? 'bg-[var(--surface-sunken)] border-l-2 border-pink-500'
                  : 'hover:bg-[var(--surface-sunken)]/60 border-l-2 border-transparent'
              }`}
            >
              <ArrowLeftRight
                size={22}
                className={`shrink-0 mt-0.5 ${
                  activeCategory === 'interactions' ? 'text-pink-500' : 'text-[var(--text-muted)]'
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text)] flex items-center justify-between">
                  <span>Interactions</span>
                  <span className="text-[11px] font-bold text-[var(--text-muted)] hidden md:inline">
                    {likedPosts.length + userComments.length}
                  </span>
                </p>
                <p className="text-xs text-[var(--text-muted)] hidden md:block leading-snug mt-0.5">
                  Review and delete likes, comments, and your other interactions.
                </p>
              </div>
            </button>

            {/* 2. Photos and Videos (NO REELS) */}
            <button
              type="button"
              onClick={() => setActiveCategory('photos')}
              className={`w-full text-left p-3.5 rounded-none flex items-start gap-3.5 transition-colors cursor-pointer shrink-0 md:shrink ${
                activeCategory === 'photos'
                  ? 'bg-[var(--surface-sunken)] border-l-2 border-pink-500'
                  : 'hover:bg-[var(--surface-sunken)]/60 border-l-2 border-transparent'
              }`}
            >
              <ImageIcon
                size={22}
                className={`shrink-0 mt-0.5 ${
                  activeCategory === 'photos' ? 'text-pink-500' : 'text-[var(--text-muted)]'
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text)] flex items-center justify-between">
                  <span>Photos and videos</span>
                  <span className="text-[11px] font-bold text-[var(--text-muted)] hidden md:inline">
                    {userPhotos.length}
                  </span>
                </p>
                <p className="text-xs text-[var(--text-muted)] hidden md:block leading-snug mt-0.5">
                  View, archive or delete photos and videos you&apos;ve shared.
                </p>
              </div>
            </button>

            {/* 3. Account History */}
            <button
              type="button"
              onClick={() => setActiveCategory('history')}
              className={`w-full text-left p-3.5 rounded-none flex items-start gap-3.5 transition-colors cursor-pointer shrink-0 md:shrink ${
                activeCategory === 'history'
                  ? 'bg-[var(--surface-sunken)] border-l-2 border-pink-500'
                  : 'hover:bg-[var(--surface-sunken)]/60 border-l-2 border-transparent'
              }`}
            >
              <Calendar
                size={22}
                className={`shrink-0 mt-0.5 ${
                  activeCategory === 'history' ? 'text-pink-500' : 'text-[var(--text-muted)]'
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text)]">
                  Account history
                </p>
                <p className="text-xs text-[var(--text-muted)] hidden md:block leading-snug mt-0.5">
                  Review changes you&apos;ve made to your account since you created it.
                </p>
              </div>
            </button>

            {/* 4. Account Status & Ban/Warning Appeals */}
            <button
              type="button"
              onClick={() => setActiveCategory('appeals')}
              className={`w-full text-left p-3.5 rounded-none flex items-start gap-3.5 transition-colors cursor-pointer shrink-0 md:shrink ${
                activeCategory === 'appeals'
                  ? 'bg-[var(--surface-sunken)] border-l-2 border-pink-500'
                  : 'hover:bg-[var(--surface-sunken)]/60 border-l-2 border-transparent'
              }`}
            >
              <ShieldAlert
                size={22}
                className={`shrink-0 mt-0.5 ${
                  isBanned
                    ? 'text-red-500'
                    : userWarnings.length > 0
                    ? 'text-amber-500'
                    : activeCategory === 'appeals'
                    ? 'text-pink-500'
                    : 'text-[var(--text-muted)]'
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-1.5">
                  <span>Status & Appeals</span>
                  {isBanned && (
                    <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-bold uppercase">
                      Banned
                    </span>
                  )}
                  {!isBanned && userWarnings.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[9px] font-bold uppercase">
                      Warning
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--text-muted)] hidden md:block leading-snug mt-0.5">
                  Check warnings, suspensions, and submit official disciplinary appeals.
                </p>
              </div>
            </button>
          </nav>
        </aside>

        {/* ======================================================== */}
        {/* RIGHT CONTENT AREA                                      */}
        {/* ======================================================== */}
        <main className="flex-1 min-w-0 flex flex-col bg-[var(--surface)]">

          {/* ------------------------------------------------------ */}
          {/* TAB 1: INTERACTIONS (Likes, Comments, Story Replies)   */}
          {/* ------------------------------------------------------ */}
          {activeCategory === 'interactions' && (
            <div className="flex-1 flex flex-col">
              {/* Header Subtabs matching Instagram Web (♡ LIKES | 💬 COMMENTS | ↩ STORY REPLIES) */}
              <div className="flex items-center border-b border-[var(--line)] px-4 md:px-6">
                <button
                  type="button"
                  onClick={() => setInteractionSubTab('likes')}
                  className={`py-4 px-4 text-xs font-bold tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
                    interactionSubTab === 'likes'
                      ? 'border-[var(--text)] text-[var(--text)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Heart size={14} className={interactionSubTab === 'likes' ? 'fill-current' : ''} />
                  <span>LIKES ({likedPosts.length + likedStories.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInteractionSubTab('comments')}
                  className={`py-4 px-4 text-xs font-bold tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
                    interactionSubTab === 'comments'
                      ? 'border-[var(--text)] text-[var(--text)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <MessageCircle size={14} />
                  <span>COMMENTS ({userComments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInteractionSubTab('replies')}
                  className={`py-4 px-4 text-xs font-bold tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
                    interactionSubTab === 'replies'
                      ? 'border-[var(--text)] text-[var(--text)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <CornerUpLeft size={14} />
                  <span>STORY REPLIES ({storyReplies.length})</span>
                </button>
              </div>

              {/* Sub-bar: Sort & filter | Select */}
              <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--line)] bg-[var(--surface-sunken)]/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--text)] capitalize">
                    {sortOrder === 'newest' ? 'Newest to oldest' : 'Oldest to newest'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowFilterModal(true)}
                    className="px-3 py-1 bg-black/40 border border-[var(--line)] hover:border-neutral-500 rounded-full text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Filter size={12} />
                    <span>Sort & filter</span>
                    {dateRangeFilter !== 'all' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    )}
                  </button>

                  {/* Toggle between Posts and Stories when on Likes tab */}
                  {interactionSubTab === 'likes' && (
                    <div className="hidden sm:flex items-center gap-1 bg-neutral-900 border border-[var(--line)] p-0.5 rounded-full text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setLikesSubFilter('posts')}
                        className={`px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                          likesSubFilter === 'posts' ? 'bg-pink-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Posts ({likedPosts.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLikesSubFilter('stories')}
                        className={`px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                          likesSubFilter === 'stories' ? 'bg-pink-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Stories ({likedStories.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Right side: Select button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    setSelectedItemIds(new Set());
                  }}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                >
                  {isSelectMode ? 'Cancel' : 'Select'}
                </button>
              </div>

              {/* Mobile filter toggle for posts/stories */}
              {interactionSubTab === 'likes' && (
                <div className="flex sm:hidden border-b border-[var(--line)] p-2 bg-[var(--surface)] justify-around text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLikesSubFilter('posts')}
                    className={`py-1 px-3 rounded-full cursor-pointer ${
                      likesSubFilter === 'posts' ? 'bg-pink-600 text-white' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Liked Posts ({likedPosts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLikesSubFilter('stories')}
                    className={`py-1 px-3 rounded-full cursor-pointer ${
                      likesSubFilter === 'stories' ? 'bg-pink-600 text-white' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Liked Stories ({likedStories.length})
                  </button>
                </div>
              )}

              {/* -------------------------------------------------- */}
              {/* CONTENT: LIKES SUBTAB                              */}
              {/* -------------------------------------------------- */}
              {interactionSubTab === 'likes' && (
                <div className="flex-1 p-1 md:p-3">
                  {likesSubFilter === 'posts' ? (
                    filteredLikedPosts.length > 0 ? (
                      /* 3-COLUMN INSTAGRAM GRID (Exact match from screenshot) */
                      <div className="grid grid-cols-3 gap-1 md:gap-1.5">
                        {filteredLikedPosts.map((post) => {
                          const isSelected = selectedItemIds.has(post.id);
                          const hasMultiImages = (post.images && post.images.length > 1) || (post.postImages && post.postImages.length > 1);
                          const coverImage = post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : null);

                          return (
                            <div
                              key={post.id}
                              onClick={() => {
                                if (isSelectMode) {
                                  toggleSelectItem(post.id);
                                } else {
                                  setPreviewPost(post);
                                }
                              }}
                              className={`relative aspect-square bg-neutral-900 overflow-hidden cursor-pointer group select-none ${
                                isSelected ? 'ring-2 ring-blue-500' : ''
                              }`}
                            >
                              {/* Post Thumbnail Image */}
                              {coverImage ? (
                                <img
                                  src={coverImage}
                                  alt={post.caption || 'Liked post'}
                                  className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-gradient-to-tr from-purple-900/40 to-pink-900/40 text-center">
                                  <ImageIcon size={24} className="text-white/40 mb-1" />
                                  <span className="text-[10px] text-white/70 line-clamp-2 px-1">
                                    {post.caption || `@${post.username}`}
                                  </span>
                                </div>
                              )}

                              {/* Multi-photo indicator icon in top right (carousel) */}
                              {hasMultiImages && (
                                <div className="absolute top-2 right-2 text-white drop-shadow-md pointer-events-none">
                                  <Layers size={16} />
                                </div>
                              )}

                              {/* Music note indicator */}
                              {post.song && (
                                <div className="absolute bottom-2 left-2 text-white/90 drop-shadow-md pointer-events-none">
                                  <Music size={13} />
                                </div>
                              )}

                              {/* Select checkbox in select mode */}
                              {isSelectMode ? (
                                <div className="absolute top-2 left-2 z-10">
                                  {isSelected ? (
                                    <CheckSquare size={20} className="text-blue-500 fill-white" />
                                  ) : (
                                    <Square size={20} className="text-white/80 drop-shadow" />
                                  )}
                                </div>
                              ) : (
                                /* Normal Hover Overlay with Likes & Comments */
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white text-xs font-bold transition-opacity">
                                  <span className="flex items-center gap-1">
                                    <Heart size={14} className="fill-white" />
                                    <span>{post.likes || 1}</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageCircle size={14} className="fill-white" />
                                    <span>{post.comments || 0}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Empty state for liked posts */
                      <div className="py-24 text-center px-4 space-y-3">
                        <div className="w-16 h-16 rounded-full border border-[var(--line)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                          <Heart size={28} />
                        </div>
                        <h3 className="text-base font-bold text-[var(--text)]">No liked posts yet</h3>
                        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                          When you like posts from classmates and friends on the home feed, they will appear here.
                        </p>
                      </div>
                    )
                  ) : (
                    /* Liked Stories Grid */
                    filteredLikedPosts.length > 0 || likedStories.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-2">
                        {likedStories.map((story) => {
                          const isSelected = selectedItemIds.has(story.id);
                          return (
                            <div
                              key={story.id}
                              onClick={() => isSelectMode && toggleSelectItem(story.id)}
                              className={`p-3 bg-[var(--surface-sunken)] border border-[var(--line)] rounded-none flex items-center justify-between gap-3 ${
                                isSelected ? 'ring-2 ring-blue-500' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-full border border-pink-500/50 p-0.5 shrink-0">
                                  <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                                    {story.avatar ? (
                                      <img src={story.avatar} alt={story.username} className="w-full h-full object-cover" />
                                    ) : (
                                      <User size={16} className="text-neutral-400" />
                                    )}
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--text)] truncate">@{story.username}</p>
                                  <p className="text-[10px] text-[var(--text-muted)]">Story liked ❤️</p>
                                </div>
                              </div>

                              {isSelectMode ? (
                                isSelected ? (
                                  <CheckSquare size={18} className="text-blue-500" />
                                ) : (
                                  <Square size={18} className="text-neutral-400" />
                                )
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    DataStore.toggleLikeStory(story.id, currentUser?.username);
                                    showToast('Unliked story');
                                    loadAllData();
                                  }}
                                  className="text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                                >
                                  Unlike
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-24 text-center px-4 space-y-3">
                        <div className="w-16 h-16 rounded-full border border-[var(--line)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                          <Heart size={28} />
                        </div>
                        <h3 className="text-base font-bold text-[var(--text)]">No liked stories</h3>
                        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                          Stories you like with a heart will show up here while active.
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* -------------------------------------------------- */}
              {/* CONTENT: COMMENTS SUBTAB                           */}
              {/* -------------------------------------------------- */}
              {interactionSubTab === 'comments' && (
                <div className="flex-1 divide-y divide-[var(--line)]">
                  {filteredComments.length > 0 ? (
                    filteredComments.map((comment) => {
                      const isSelected = selectedItemIds.has(comment.commentId);
                      const postCover = comment.post?.imageUrl || (comment.post?.images && comment.post.images[0]);

                      return (
                        <div
                          key={comment.commentId}
                          className={`p-4 flex items-start gap-4 transition-colors hover:bg-[var(--surface-sunken)]/40 ${
                            isSelected ? 'bg-blue-950/20' : ''
                          }`}
                        >
                          {/* Checkbox in select mode */}
                          {isSelectMode && (
                            <button
                              type="button"
                              onClick={() => toggleSelectItem(comment.commentId)}
                              className="mt-1 cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare size={18} className="text-blue-500" />
                              ) : (
                                <Square size={18} className="text-[var(--text-muted)]" />
                              )}
                            </button>
                          )}

                          {/* Post thumbnail */}
                          <div
                            onClick={() => comment.post && setPreviewPost(comment.post)}
                            className="w-14 h-14 bg-neutral-900 border border-[var(--line)] shrink-0 overflow-hidden cursor-pointer hover:opacity-85"
                          >
                            {postCover ? (
                              <img src={postCover} alt="Post" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                <ImageIcon size={18} />
                              </div>
                            )}
                          </div>

                          {/* Comment Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-[var(--text-muted)]">
                                Commented on{' '}
                                <Link
                                  href={`/u/${comment.post?.username || 'post'}`}
                                  className="font-bold text-[var(--text)] hover:underline"
                                >
                                  @{comment.post?.username || 'user'}
                                </Link>
                                &apos;s post
                              </p>
                              <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                                {comment.timeAgo}
                              </span>
                            </div>

                            <p className="text-xs text-[var(--text)] font-medium leading-relaxed break-words">
                              &ldquo;{comment.commentText}&rdquo;
                            </p>

                            {/* Attached Comment Photo */}
                            {comment.image && (
                              <div className="mt-2 inline-block rounded-none border border-[var(--line)] overflow-hidden max-w-[120px]">
                                <img
                                  src={comment.image}
                                  alt="Comment attachment"
                                  className="w-full h-20 object-cover"
                                />
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-2 flex items-center gap-4 text-xs font-semibold">
                              {comment.post && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewPost(comment.post)}
                                  className="text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1"
                                >
                                  <ExternalLink size={12} />
                                  <span>View post</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.postId, comment.commentId)}
                                className="text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 size={12} />
                                <span>Delete comment</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-24 text-center px-4 space-y-3">
                      <div className="w-16 h-16 rounded-full border border-[var(--line)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                        <MessageCircle size={28} />
                      </div>
                      <h3 className="text-base font-bold text-[var(--text)]">No comments yet</h3>
                      <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                        Comments you post on classmates&apos; photos and announcements will be organized here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* -------------------------------------------------- */}
              {/* CONTENT: STORY REPLIES SUBTAB                      */}
              {/* -------------------------------------------------- */}
              {interactionSubTab === 'replies' && (
                <div className="flex-1 divide-y divide-[var(--line)]">
                  {storyReplies.length > 0 ? (
                    storyReplies.map((reply) => {
                      const isSelected = selectedItemIds.has(reply.id);
                      return (
                        <div
                          key={reply.id}
                          className={`p-4 flex items-center justify-between gap-4 transition-colors hover:bg-[var(--surface-sunken)]/40 ${
                            isSelected ? 'bg-blue-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isSelectMode && (
                              <button
                                type="button"
                                onClick={() => toggleSelectItem(reply.id)}
                                className="cursor-pointer shrink-0"
                              >
                                {isSelected ? (
                                  <CheckSquare size={18} className="text-blue-500" />
                                ) : (
                                  <Square size={18} className="text-[var(--text-muted)]" />
                                )}
                              </button>
                            )}

                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
                              <CornerUpLeft size={16} />
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs text-[var(--text)] font-semibold truncate">
                                Replied to <span className="text-pink-400">@{reply.targetUsername}</span>&apos;s story
                              </p>
                              <p className="text-xs text-[var(--text-muted)] truncate font-normal mt-0.5">
                                &ldquo;{reply.replyText}&rdquo;
                              </p>
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{reply.timeAgo}</p>
                            </div>
                          </div>

                          {!isSelectMode && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReply(reply.id)}
                              className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer shrink-0"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-24 text-center px-4 space-y-3">
                      <div className="w-16 h-16 rounded-full border border-[var(--line)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                        <CornerUpLeft size={28} />
                      </div>
                      <h3 className="text-base font-bold text-[var(--text)]">No story replies</h3>
                      <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                        Replies and reactions you send to classmates&apos; 24-hour stories will appear here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------ */}
          {/* TAB 2: PHOTOS AND VIDEOS (NO REELS)                    */}
          {/* ------------------------------------------------------ */}
          {activeCategory === 'photos' && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[var(--line)]">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text)]">Posts & Photos</h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {filteredPhotos.length} photo{filteredPhotos.length === 1 ? '' : 's'} shared on DPS Buzz
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                    className="px-3 py-1 bg-black/40 border border-[var(--line)] rounded-full text-xs font-semibold text-[var(--text)] transition cursor-pointer"
                  >
                    {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  </button>
                </div>
              </div>

              {filteredPhotos.length > 0 ? (
                <div className="p-1 md:p-3 grid grid-cols-3 gap-1 md:gap-1.5">
                  {filteredPhotos.map((post) => {
                    const cover = post.imageUrl || (post.images && post.images[0]);
                    const hasMultiImages = (post.images && post.images.length > 1) || (post.postImages && post.postImages.length > 1);

                    return (
                      <div
                        key={post.id}
                        onClick={() => setPreviewPost(post)}
                        className="relative aspect-square bg-neutral-900 overflow-hidden cursor-pointer group"
                      >
                        {cover ? (
                          <img src={cover} alt="Post" className="w-full h-full object-cover transition group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-400">
                            <ImageIcon size={24} />
                          </div>
                        )}
                        {hasMultiImages && (
                          <div className="absolute top-2 right-2 text-white drop-shadow">
                            <Layers size={16} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white text-xs font-bold transition-opacity">
                          <span className="flex items-center gap-1">
                            <Heart size={14} className="fill-white" />
                            <span>{post.likes || 0}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={14} className="fill-white" />
                            <span>{post.comments || 0}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-24 text-center px-4 space-y-3">
                  <div className="w-16 h-16 rounded-full border border-[var(--line)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                    <ImageIcon size={28} />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text)]">No photos shared yet</h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    Photos you publish to the school feed or add to your grid will be listed here.
                  </p>
                  <Link
                    href="/post/new"
                    className="inline-block px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-none transition"
                  >
                    + Create Post
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------ */}
          {/* TAB 3: ACCOUNT HISTORY (Timeline Audit Log)            */}
          {/* ------------------------------------------------------ */}
          {activeCategory === 'history' && (
            <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
              <div>
                <h2 className="text-base font-bold text-[var(--text)]">Account History</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  An audit trail of milestones and changes made to your DPS Buzz profile.
                </p>
              </div>

              {/* Vertical Timeline */}
              <div className="relative border-l-2 border-[var(--line)] ml-4 pl-6 space-y-8">
                {accountHistory.map((event) => {
                  let IconComponent = Sparkles;
                  if (event.eventType === 'created') IconComponent = User;
                  if (event.eventType === 'class_assigned') IconComponent = CheckCircle2;
                  if (event.eventType === 'avatar_update') IconComponent = ImageIcon;
                  if (event.eventType === 'password_update') IconComponent = KeyRound;
                  if (event.eventType === 'bio_update') IconComponent = FileText;

                  return (
                    <div key={event.id} className="relative group">
                      {/* Milestone Dot */}
                      <div className="absolute -left-[31px] top-0 w-8 h-8 rounded-full bg-[var(--surface)] border-2 border-pink-500 flex items-center justify-center text-pink-500 shadow-md">
                        <IconComponent size={14} />
                      </div>

                      {/* Content Card */}
                      <div className="bg-[var(--surface-sunken)] border border-[var(--line)] p-4 rounded-none space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-bold text-[var(--text)]">{event.title}</h3>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">{event.date}</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------ */}
          {/* TAB 4: ACCOUNT STATUS & BAN / WARNING APPEALS          */}
          {/* ------------------------------------------------------ */}
          {activeCategory === 'appeals' && (
            <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
              <div>
                <h2 className="text-base font-bold text-[var(--text)]">
                  Account Standing & Disciplinary Appeals
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Check your account safety status, review admin directives, and file official reconsideration appeals.
                </p>
              </div>

              {/* CURRENT STANDING CARD */}
              {isBanned ? (
                <div className="p-4 bg-red-950/40 border-2 border-red-500 rounded-none space-y-2">
                  <div className="flex items-center gap-2.5 text-red-400">
                    <ShieldAlert size={20} />
                    <span className="text-sm font-black uppercase tracking-wider">
                      Account Suspended 🚫
                    </span>
                  </div>
                  <p className="text-xs text-red-200 leading-relaxed">
                    Your account has been suspended by school administration.
                  </p>
                  <div className="p-2.5 bg-black/50 border border-red-500/30 text-xs">
                    <span className="font-bold text-red-400 block text-[10px] uppercase">Official Reason:</span>
                    <span className="text-neutral-200 font-medium">
                      {banReason || 'Violation of school conduct policy.'}
                    </span>
                  </div>
                </div>
              ) : userWarnings.length > 0 ? (
                <div className="p-4 bg-amber-950/30 border-2 border-amber-500 rounded-none space-y-3">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <AlertTriangle size={20} />
                    <span className="text-sm font-black uppercase tracking-wider">
                      Active Disciplinary Warning ({userWarnings.length}) ⚠️
                    </span>
                  </div>
                  {userWarnings.map((warn) => (
                    <div key={warn.id} className="p-3 bg-black/40 border border-amber-500/30 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold uppercase">
                        <span>Issued by {warn.adminName}</span>
                        <span>{warn.date}</span>
                      </div>
                      <p className="text-neutral-200 font-medium">&ldquo;{warn.reason}&rdquo;</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-none flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-400">Good Standing ✓</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Your account has 0 active warnings or restrictions. Thank you for keeping DPS Buzz safe!
                    </p>
                  </div>
                </div>
              )}

              {/* APPEAL SUBMISSION FORM */}
              <div className="p-5 bg-[var(--surface-sunken)] border border-[var(--line)] rounded-none space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                    <Send size={15} className="text-pink-500" />
                    <span>Submit Appeal to School Administration</span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    If you believe your account restriction, ban, or warning was a misunderstanding, submit your official statement for review by the School Moderation Board.
                  </p>
                </div>

                <form onSubmit={handleSubmitAppeal} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
                      Appeal Category
                    </label>
                    <select
                      value={appealType}
                      onChange={(e) => setAppealType(e.target.value as any)}
                      className="w-full p-2.5 bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none focus:border-pink-500"
                    >
                      <option value="suspension">Account Suspension Appeal</option>
                      <option value="warning">Disciplinary Warning Dispute</option>
                      <option value="restriction">Chat or Content Restriction</option>
                      <option value="other">Other Administrative Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
                      Statement & Justification <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      rows={4}
                      placeholder="Clearly explain the situation, why you believe the action should be reconsidered, and your commitment to school standards..."
                      className="w-full p-3 bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none focus:border-pink-500 placeholder:text-neutral-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
                      Contact Phone / Email (Optional for followup)
                    </label>
                    <input
                      type="text"
                      value={appealContact}
                      onChange={(e) => setAppealContact(e.target.value)}
                      placeholder="e.g. 9876543210 or parent@email.com"
                      className="w-full p-2.5 bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none focus:border-pink-500 placeholder:text-neutral-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAppeal || !appealReason.trim()}
                    className="w-full py-2.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-none transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmittingAppeal ? (
                      <span>Submitting Appeal...</span>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Submit Official Appeal</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* APPEAL SUBMISSION HISTORY */}
              {banAppeals.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Submitted Appeals History ({banAppeals.length})
                  </h3>
                  <div className="divide-y divide-[var(--line)] border border-[var(--line)] bg-[var(--surface-sunken)]">
                    {banAppeals.map((appeal) => {
                      const statusBadges = {
                        pending: { text: 'Pending Review ⏳', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
                        under_review: { text: 'Under Review 🔍', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
                        approved: { text: 'Approved & Lifted ✅', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
                        rejected: { text: 'Dismissed ❌', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
                      };
                      const badge = statusBadges[appeal.status] || statusBadges.pending;

                      return (
                        <div key={appeal.id} className="p-3.5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[var(--text)] capitalize">
                              {appeal.appealType} Appeal
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-none uppercase ${badge.color}`}>
                              {badge.text}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">
                            &ldquo;{appeal.reason}&rdquo;
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1">
                            <span>Submitted: {new Date(appeal.submittedAt).toLocaleDateString()}</span>
                            {appeal.reviewedAt && (
                              <span>Reviewed: {new Date(appeal.reviewedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                          {appeal.adminNotes && (
                            <div className="p-2 bg-black/40 border-l-2 border-pink-500 text-[11px] text-pink-300">
                              <span className="font-bold">Admin note:</span> {appeal.adminNotes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* FLOATING MULTI-SELECT ACTION BAR                         */}
      {/* ======================================================== */}
      {isSelectMode && selectedItemIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-900 border-t border-neutral-700 p-3 flex items-center justify-between px-6 shadow-2xl animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white">
              {selectedItemIds.size} selected
            </span>
            <button
              type="button"
              onClick={() => {
                const allIds =
                  activeCategory === 'interactions' && interactionSubTab === 'likes'
                    ? (likesSubFilter === 'posts' ? filteredLikedPosts.map((p) => p.id) : likedStories.map((s) => s.id))
                    : interactionSubTab === 'comments'
                    ? filteredComments.map((c) => c.commentId)
                    : storyReplies.map((r) => r.id);
                handleSelectAll(allIds);
              }}
              className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
            >
              Select all
            </button>
          </div>

          <button
            type="button"
            onClick={handleBulkAction}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold uppercase rounded-none transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span>
              {interactionSubTab === 'likes'
                ? `Unlike (${selectedItemIds.size})`
                : `Delete (${selectedItemIds.size})`}
            </span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SORT & FILTER MODAL                                      */}
      {/* ======================================================== */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--line)] p-5 rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text)]">Sort & filter</h3>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase">
                Sort by
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSortOrder('newest')}
                  className={`w-full p-2.5 text-left text-xs font-semibold flex items-center justify-between border cursor-pointer ${
                    sortOrder === 'newest'
                      ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                      : 'border-[var(--line)] text-[var(--text)]'
                  }`}
                >
                  <span>Newest to oldest</span>
                  {sortOrder === 'newest' && <CheckCircle2 size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder('oldest')}
                  className={`w-full p-2.5 text-left text-xs font-semibold flex items-center justify-between border cursor-pointer ${
                    sortOrder === 'oldest'
                      ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                      : 'border-[var(--line)] text-[var(--text)]'
                  }`}
                >
                  <span>Oldest to newest</span>
                  {sortOrder === 'oldest' && <CheckCircle2 size={14} />}
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'All time' },
                  { id: 'week', label: 'Past week' },
                  { id: 'month', label: 'Past month' },
                  { id: 'year', label: 'Past year' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDateRangeFilter(item.id as any)}
                    className={`p-2 text-center text-xs font-semibold border cursor-pointer ${
                      dateRangeFilter === item.id
                        ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                        : 'border-[var(--line)] text-[var(--text)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFilterModal(false)}
              className="w-full py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase rounded-none transition cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* POST PREVIEW MODAL (Instagram Style)                     */}
      {/* ======================================================== */}
      {previewPost && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--line)] rounded-none overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-3.5 border-b border-[var(--line)] flex items-center justify-between">
              <Link
                href={`/u/${previewPost.username}`}
                className="flex items-center gap-2.5 hover:opacity-80"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-800 border overflow-hidden flex items-center justify-center text-xs font-bold">
                  {previewPost.avatar ? (
                    <img src={previewPost.avatar} alt={previewPost.username} className="w-full h-full object-cover" />
                  ) : (
                    previewPost.username.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text)]">@{previewPost.username}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{previewPost.timeAgo}</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Post Image */}
            <div className="relative aspect-square bg-black overflow-hidden flex items-center justify-center">
              {previewPost.imageUrl || (previewPost.images && previewPost.images[0]) ? (
                <img
                  src={previewPost.imageUrl || previewPost.images[0]}
                  alt="Post preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-neutral-500 flex flex-col items-center">
                  <ImageIcon size={36} />
                  <span className="text-xs mt-2">No photo</span>
                </div>
              )}
            </div>

            {/* Post Info & Actions */}
            <div className="p-4 space-y-3 overflow-y-auto">
              {/* Music Pill if present */}
              {previewPost.song && (
                <MusicTrackPill song={previewPost.song} />
              )}

              {/* Caption */}
              {previewPost.caption && (
                <p className="text-xs text-[var(--text)] leading-relaxed">
                  <span className="font-bold mr-1.5">@{previewPost.username}</span>
                  {previewPost.caption}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => handleUnlikeSingle(previewPost.id)}
                  className="px-3 py-1.5 bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Heart size={14} className="fill-current" />
                  <span>Unlike post</span>
                </button>

                <Link
                  href={`/u/${previewPost.username}`}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  <span>View profile</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function YourActivityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
          <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <YourActivityContent />
    </Suspense>
  );
}
