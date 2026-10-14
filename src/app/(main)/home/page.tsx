'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RotateCw,
  X,
  Share2,
  Copy,
  Flag,
  Check,
  Sparkles,
  Users,
  Send,
  Image as ImageIcon,
  Trash2,
  Bookmark,
  Repeat2,
  Search as SearchIcon,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import { DataStore, type Post, type Notice, type BroadcastAlert, DUMMY_TEST_USERNAMES } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import { StoriesRow } from '@/components/story/StoriesRow';
import { NoticeStrip } from '@/components/home/NoticeStrip';
import { FeedTabs } from '@/components/home/FeedTabs';
import { PostCard } from '@/components/home/PostCard';
import { StarBoardTeaser } from '@/components/home/StarBoardTeaser';
import { GetAppWidget } from '@/components/home/GetAppWidget';
import { HomeFeedSkeleton } from '@/components/home/HomeFeedSkeleton';
import { SuggestedAccountsList } from '@/components/suggestions';

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFeedSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [broadcastAlert, setBroadcastAlert] = useState<BroadcastAlert | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'following' | 'all'>('following');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Demo states for screenshot & testing (?state=loading | ?state=empty)
  const [demoState, setDemoState] = useState<'normal' | 'loading' | 'empty'>('normal');

  // Simulated upload-in-progress state
  const [uploadInProgress, setUploadInProgress] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(65);

  // Modals & Interactive Button States
  const [selectedOptionsPost, setSelectedOptionsPost] = useState<Post | null>(null);
  const [selectedCommentsPost, setSelectedCommentsPost] = useState<Post | null>(null);
  const [selectedSharePost, setSelectedSharePost] = useState<Post | null>(null);
  const [selectedShareRecipients, setSelectedShareRecipients] = useState<string[]>([]);
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  // Notice Read Suppression
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>(() => DataStore.getReadNoticeIds());
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<string[]>([]);
  const [followsVersion, setFollowsVersion] = useState(0);

  // Comments map with localStorage persistence
  const [commentsMap, setCommentsMap] = useState<Record<string, Array<{ id: string; username: string; text: string; timeAgo: string }>>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dpsbuzz_comments_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {};
  });
  const [newCommentText, setNewCommentText] = useState('');

  const currentUser = DataStore.getCurrentUser();

  useEffect(() => {
    // Check URL parameters for demo states (?state=loading or ?state=empty)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stateParam = params.get('state');
      if (stateParam === 'loading') setDemoState('loading');
      else if (stateParam === 'empty') setDemoState('empty');
      else setDemoState('normal');

      if (params.get('uploading') === 'true') {
        setUploadInProgress(true);
      }
    }

    const loadData = () => {
      setPosts(DataStore.getPosts());
      setNotices(DataStore.getNotices());
      setBroadcastAlert(DataStore.getBroadcastAlert());

      // Load persistent saved posts
      const cur = DataStore.getCurrentUser();
      const savedIds = DataStore.getSavedPostIds(cur.username);
      const savedMap: Record<string, boolean> = {};
      savedIds.forEach((id) => {
        savedMap[id] = true;
      });
      setSavedPosts(savedMap);
    };

    loadData();
    // Synchronize with server so posts and stories uploaded on other devices appear immediately
    DataStore.syncWithServer().catch(() => {});

    // Polling sync every 4 seconds to pull fresh posts and stories across devices
    const syncInterval = setInterval(() => {
      DataStore.syncWithServer().catch(() => {});
    }, 4000);

    window.addEventListener('dpsbuzz:content_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', loadData);
      window.removeEventListener('storage', loadData);
      clearInterval(syncInterval);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLikeToggle = (postId: string) => {
    const isCurrentlyLiked = !!likedPosts[postId];
    setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + (isCurrentlyLiked ? -1 : 1) } : p
      )
    );

    // Sync like to server
    fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username }),
    }).catch(() => {});
  };

  const handleSaveToggle = (postId: string) => {
    const isNowSaved = DataStore.toggleSavePost(postId, currentUser.username);
    setSavedPosts((prev) => ({ ...prev, [postId]: isNowSaved }));
    showToast(isNowSaved ? 'Saved to bookmarks 🔖' : 'Removed from saved (unsaved) ❌');
  };

  const handleAddComment = (postId: string) => {
    const trimmed = newCommentText.trim();
    if (!trimmed) return;
    const newComment = {
      id: 'c-' + Date.now(),
      username: currentUser.username || 'student',
      text: trimmed,
      timeAgo: 'Just now',
    };
    setCommentsMap((prev) => {
      const updated = {
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      };
      try {
        localStorage.setItem('dpsbuzz_comments_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setNewCommentText('');
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p))
    );
    showToast('Comment posted');

    // Sync comment to server
    fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: newComment }),
    }).catch(() => {});
  };

  const triggerPullToRefresh = async () => {
    setIsRefreshing(true);
    await DataStore.syncWithServer();
    setPosts(DataStore.getPosts());
    setNotices(DataStore.getNotices());
    setBroadcastAlert(DataStore.getBroadcastAlert());
    setIsRefreshing(false);
    showToast('Feed refreshed');
  };

  // Followed list for filtering
  const followedUsernames = useMemo(() => {
    const follows = DataStore.getFollows();
    return follows
      .filter((f) => f.follower.toLowerCase() === currentUser.username.toLowerCase())
      .map((f) => f.following.toLowerCase());
  }, [currentUser.username, followsVersion]);

  // Classmates and friends they are following for share sheet
  const friendsToShare = useMemo(() => {
    const isShashwath = currentUser.username.toLowerCase() === 'shashwath71845';
    const allProfiles = DataStore.getProfiles().filter(
      (p) =>
        p &&
        p.username &&
        p.username.toLowerCase() !== currentUser.username.toLowerCase() &&
        p.username.toLowerCase() !== 'admin' &&
        (p.username.toLowerCase() === 'shashwath71845' || p.role !== 'admin' || isShashwath) &&
        !DUMMY_TEST_USERNAMES.has(p.username.toLowerCase())
    );
    const following = allProfiles.filter((p) => followedUsernames.includes(p.username.toLowerCase()));
    const others = allProfiles.filter((p) => !followedUsernames.includes(p.username.toLowerCase()));

    const list = [...following, ...others];
    if (shareSearchQuery.trim()) {
      const q = shareSearchQuery.toLowerCase().trim();
      return list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          (p.class && p.class.toLowerCase().includes(q))
      );
    }
    return list;
  }, [currentUser.username, followedUsernames, shareSearchQuery]);

  // Suggested classmate accounts for new and existing users
  const suggestedAccounts = useMemo(() => {
    const isShashwath = currentUser.username.toLowerCase() === 'shashwath71845';
    const all = DataStore.getProfiles().filter(
      (p) =>
        p &&
        p.username &&
        p.username.toLowerCase() !== currentUser.username.toLowerCase() &&
        p.username.toLowerCase() !== 'admin' &&
        (p.username.toLowerCase() === 'shashwath71845' || p.role !== 'admin' || isShashwath) &&
        !DUMMY_TEST_USERNAMES.has(p.username.toLowerCase())
    );

    const unfollowed = all.filter((p) => !followedUsernames.includes(p.username.toLowerCase()));

    unfollowed.sort((a, b) => {
      if (a.username.toLowerCase() === 'shashwath71845') return -1;
      if (b.username.toLowerCase() === 'shashwath71845') return 1;
      if (a.class === currentUser.class && b.class !== currentUser.class) return -1;
      if (b.class === currentUser.class && a.class !== currentUser.class) return 1;
      return (b.followerCount || 0) - (a.followerCount || 0);
    });

    return unfollowed;
  }, [currentUser, followedUsernames]);

  const handleToggleFollow = (targetUsername: string) => {
    if (!currentUser || !targetUsername) return;
    if (currentUser.username.toLowerCase() === targetUsername.toLowerCase()) {
      showToast('You cannot follow yourself! 🙅');
      return;
    }
    const isNow = DataStore.toggleFollow(currentUser.username, targetUsername);
    setFollowsVersion((v) => v + 1);
    showToast(isNow ? `Following @${targetUsername}! 🤝` : `Unfollowed @${targetUsername}`);
  };

  // Notice selection
  const displayNotice = useMemo(() => {
    if (DataStore.isMaintenanceActive()) {
      return {
        id: 'notice-maint-active',
        title: '🔒 School Maintenance Active Today',
        content: 'Chat is locked for scheduled school maintenance / examinations.',
        category: 'urgent',
        isUrgent: true,
        pinned: true,
        date: 'Today',
        seenBy: 1,
      } as Notice;
    }

    if (
      broadcastAlert &&
      broadcastAlert.active &&
      !DataStore.isNoticeRead(broadcastAlert.id) &&
      !readNoticeIds.includes(broadcastAlert.id) &&
      !dismissedNoticeIds.includes(broadcastAlert.id)
    ) {
      return {
        id: broadcastAlert.id,
        title: broadcastAlert.title,
        content: broadcastAlert.text,
        category: 'urgent',
        isUrgent: true,
        pinned: true,
        date: 'Today',
        seenBy: 120,
      } as Notice;
    }
    const unread = notices.filter(
      (n) =>
        !DataStore.isNoticeRead(n.id) &&
        !readNoticeIds.includes(n.id) &&
        !dismissedNoticeIds.includes(n.id)
    );
    return unread.find((n) => n.isUrgent || n.pinned) || unread[0] || null;
  }, [broadcastAlert, notices, readNoticeIds, dismissedNoticeIds]);

  // Filter posts based on activeTab (new posts by current user come first, followed by engagement algorithm)
  const displayedPosts = useMemo(() => {
    if (demoState === 'empty') return [];

    const myUsername = currentUser.username.toLowerCase();

    const sortFn = (a: Post, b: Post) => {
      // If user just posted in this session, put their newest post at the very top
      const isAMine = a.username.toLowerCase() === myUsername && (a.timeAgo === 'Just now' || a.id.startsWith('post-'));
      const isBMine = b.username.toLowerCase() === myUsername && (b.timeAgo === 'Just now' || b.id.startsWith('post-'));
      if (isAMine && !isBMine) return -1;
      if (!isAMine && isBMine) return 1;

      // Otherwise sort by likes/engagement
      return (b.likes || 0) - (a.likes || 0);
    };

    if (activeTab === 'following') {
      const filtered = posts.filter((p) => {
        const u = p.username.toLowerCase();
        return (
          u === myUsername ||
          u === 'dpsbuzz' ||
          u === 'dps_official' ||
          followedUsernames.includes(u)
        );
      });
      return [...filtered].sort(sortFn);
    }

    // Whole school: all public posts
    return [...posts].sort(sortFn);
  }, [activeTab, posts, followedUsernames, currentUser.username, demoState]);

  return (
    <div className="space-y-0 min-h-dvh">
      {/* 2. Notice Strip (40px) under header with three states: none, normal, urgent */}
      <NoticeStrip
        notice={displayNotice}
        onDismiss={(id) => {
          DataStore.markNoticeAsRead(id);
          setReadNoticeIds((prev) => [...prev, id]);
          setDismissedNoticeIds((prev) => [...prev, id]);
        }}
        onMarkRead={(id) => {
          DataStore.markNoticeAsRead(id);
          setReadNoticeIds((prev) => [...prev, id]);
        }}
      />

      {/* 3. Story row: horizontal snap scroll, hidden scrollbar, 64px avatars with neon ring */}
      <StoriesRow />

      {/* Small Get App Widget */}
      <GetAppWidget />

      {/* 4. Feed tabs "Following" and "Whole School" as segmented control */}
      <FeedTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* 5. Upload-in-progress card at the top of the feed */}
      {uploadInProgress && (
        <div
          className="mx-3 my-3 p-3.5 rounded-[16px] border flex items-center gap-3 animate-fade-in"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
          }}
        >
          <div className="w-12 h-12 rounded-[12px] bg-[var(--surface-sunken)] flex items-center justify-center shrink-0 overflow-hidden">
            <ImageIcon size={20} className="text-[var(--text-muted)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span style={{ color: 'var(--text)' }}>Posting...</span>
              <span className="tabular-nums text-[var(--primary)]">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--surface-sunken)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${uploadProgress}%`,
                  backgroundColor: 'var(--primary)',
                }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUploadInProgress(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Cancel upload"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 6. Feed Content or Skeletons / Empty States */}
      {demoState === 'loading' ? (
        <HomeFeedSkeleton />
      ) : displayedPosts.length === 0 ? (
        /* QUIET FEED / NEW USER STATE: Prompt them to search & display suggested accounts */
        <div className="space-y-4 px-3 py-4 max-w-[480px] mx-auto">
          {/* 1. Prompt to Search & Discover Classmates */}
          <div
            className="p-5 rounded-[22px] border text-center space-y-3 shadow-xs"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)] text-xl shadow-xs">
              🔍
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">
                Find Your School Classmates
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed mt-1">
                Search by class grade like <span className="font-bold text-[var(--text)]">&quot;6&quot;, &quot;7&quot;, &quot;8&quot;, &quot;10&quot;</span> or your friends&apos; names to follow them and see their moments!
              </p>
            </div>

            {/* Quick search bar trigger */}
            <Link
              href="/search"
              className="w-full h-11 px-4 rounded-full border flex items-center gap-2.5 text-xs text-[var(--text-muted)] bg-[var(--surface-sunken)] hover:border-[var(--primary)] transition-all shadow-xs"
              style={{ borderColor: 'var(--line)' }}
            >
              <SearchIcon size={16} className="text-[var(--primary)]" />
              <span>Search class 6, 7, 8, 10 or classmate name...</span>
            </Link>

            {/* Quick Class Shortcut Pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mr-1">Quick Class:</span>
              {['6', '7', '8', '9', '10'].map((cls) => (
                <Link
                  key={cls}
                  href={`/search?q=${cls}&chip=Accounts`}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--surface-sunken)] hover:bg-[var(--primary)] hover:text-white text-[var(--text)] border transition-all"
                  style={{ borderColor: 'var(--line)' }}
                >
                  Class {cls}
                </Link>
              ))}
            </div>
          </div>

          {/* 2. Suggested Classmates List (Instagram Style) */}
          <div
            className="p-4 rounded-[22px] border shadow-xs"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <SuggestedAccountsList
              limit={5}
              showHeader={true}
              onFollowToggled={(target, isNow) => {
                setFollowsVersion((v) => v + 1);
                showToast(isNow ? `Following @${target}! 🤝` : `Unfollowed @${target}`);
              }}
            />
          </div>

          {/* Action button to create a post */}
          <div className="text-center pt-2">
            <Link
              href="/post/new"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <span>+ Share first post</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Posts Feed */
        <div className="space-y-4 pt-1 max-w-[480px] mx-auto">
          {displayedPosts.map((post, postIdx) => (
            <div key={post.id}>
              {/* Photo-First Post Card */}
              <PostCard
                post={post}
                isLiked={!!likedPosts[post.id]}
                isSaved={!!savedPosts[post.id]}
                onLikeToggle={handleLikeToggle}
                onSaveToggle={handleSaveToggle}
                onCommentClick={setSelectedCommentsPost}
                onShareClick={setSelectedSharePost}
                onOptionsClick={setSelectedOptionsPost}
              />

              {/* Instagram-style "Suggested for you" Section between posts */}
              {postIdx === 0 && (
                <div
                  className="my-3 p-4 rounded-[22px] border shadow-xs"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--line)',
                  }}
                >
                  <SuggestedAccountsList
                    limit={5}
                    showHeader={true}
                    onFollowToggled={(target, isNow) => {
                      setFollowsVersion((v) => v + 1);
                      showToast(isNow ? `Following @${target}! 🤝` : `Unfollowed @${target}`);
                    }}
                  />
                </div>
              )}

              {/* Compact Star Board & Streak Board Teaser between posts */}
              {postIdx === 1 && <StarBoardTeaser />}
            </div>
          ))}

          {/* Left-aligned 'That's everything for now.' with small pencil doodle */}
          <div className="px-5 py-10 text-left border-t" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2 mb-1">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--primary)' }}
              >
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
              <h3
                className="text-base font-extrabold tracking-[-0.02em]"
                style={{
                  fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
                  color: 'var(--text)',
                }}
              >
                That&apos;s everything for now.
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
              You&apos;re caught up with all classmates and campus announcements.
            </p>
          </div>
        </div>
      )}

      {/* Post Comments Bottom Sheet */}
      {selectedCommentsPost && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center select-none"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setSelectedCommentsPost(null)}
          />
          <div
            className="relative w-full max-w-md rounded-t-[28px] border shadow-2xl z-10 flex flex-col transition-all animate-slide-up"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
              maxHeight: '82vh',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)',
            }}
          >
            <div className="p-4 pb-2 border-b border-[var(--line)]">
              <div className="w-10 h-1.5 rounded-full bg-[var(--line-strong)] mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--text)]">
                  Comments ({Math.max((commentsMap[selectedCommentsPost.id] || []).length, 8)})
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedCommentsPost(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] cursor-pointer"
                  aria-label="Close comments"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3.5 p-4 flex-1 overflow-y-auto no-scrollbar max-h-72">
              {(commentsMap[selectedCommentsPost.id] || []).map((c) => (
                <div key={c.id} className="text-xs flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-center font-bold text-[10px] shrink-0 text-[var(--text)]">
                    {c.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-[var(--text)] mr-1.5">@{c.username}</span>
                    <span className="text-[var(--text)] leading-relaxed">{c.text}</span>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{c.timeAgo}</p>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddComment(selectedCommentsPost.id);
              }}
              className="p-3 px-4 border-t border-[var(--line)] flex items-center gap-2 bg-[var(--surface)]"
            >
              <input
                type="text"
                autoFocus
                placeholder="Add a comment as a classmate..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 h-11 px-4 rounded-full text-xs border outline-none font-medium transition-all"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="h-11 px-5 rounded-full text-xs font-bold text-white transition-opacity disabled:opacity-40 shadow-xs cursor-pointer flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Post Sheet */}
      {selectedSharePost && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center select-none"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSelectedSharePost(null)}
          />
          <div
            className="relative w-full max-w-md rounded-t-[28px] sm:rounded-[28px] border p-4 shadow-2xl z-10 space-y-3"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
              maxHeight: '85vh',
            }}
          >
            <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto" />
            <div className="flex items-center justify-between pb-1 border-b border-[var(--line)]">
              <div>
                <h3 className="font-bold text-sm text-[var(--text)]">Share Post</h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Copy link, share via apps, or send directly into chat
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSharePost(null);
                  setSelectedShareRecipients([]);
                  setShareSearchQuery('');
                }}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                aria-label="Close share sheet"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick External Share Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const postUrl = `${window.location.origin}/home#post-${selectedSharePost.id}`;
                    await navigator.clipboard.writeText(postUrl);
                    showToast('Direct link copied to clipboard! 📋');
                  } catch {
                    showToast('Failed to copy link');
                  }
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer hover:bg-[var(--surface-sunken)] active:scale-95 transition-all text-[var(--text)]"
                style={{ borderColor: 'var(--line)' }}
              >
                <Copy size={14} className="text-pink-500" />
                <span>Copy Link</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const postUrl = `${window.location.origin}/home#post-${selectedSharePost.id}`;
                  const shareTitle = `DPS Buzz • @${selectedSharePost.username}'s post`;
                  const shareText = selectedSharePost.caption
                    ? `"${selectedSharePost.caption}"`
                    : `Check out @${selectedSharePost.username}'s post on DPS Buzz!`;

                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: shareTitle,
                        text: shareText,
                        url: postUrl,
                      });
                      showToast('Shared successfully! 🚀');
                    } catch (err: any) {
                      if (err.name !== 'AbortError') {
                        await navigator.clipboard.writeText(postUrl);
                        showToast('Direct link copied to clipboard! 📋');
                      }
                    }
                  } else {
                    await navigator.clipboard.writeText(postUrl);
                    showToast('Direct link copied to clipboard! 📋');
                  }
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer hover:bg-[var(--surface-sunken)] active:scale-95 transition-all text-[var(--text)]"
                style={{ borderColor: 'var(--line)' }}
              >
                <Share2 size={14} className="text-pink-500" />
                <span>Share via Apps</span>
              </button>
            </div>

            <div className="flex items-center gap-2 py-0.5">
              <div className="h-px flex-1 bg-[var(--line)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                or send into chat
              </span>
              <div className="h-px flex-1 bg-[var(--line)]" />
            </div>

            {/* Search filter for friends */}
            <div>
              <input
                type="text"
                placeholder="Search friends or classmates..."
                value={shareSearchQuery}
                onChange={(e) => setShareSearchQuery(e.target.value)}
                className="w-full h-9 px-3 rounded-xl text-xs border outline-none bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text)]"
              />
            </div>

            {/* Friends list (following shown first with priority) */}
            <div className="grid grid-cols-4 gap-2 py-2 max-h-56 overflow-y-auto no-scrollbar">
              {friendsToShare.length === 0 ? (
                <div className="col-span-4 py-6 text-center text-xs text-[var(--text-muted)]">
                  No friends found matching &ldquo;{shareSearchQuery}&rdquo;
                </div>
              ) : (
                friendsToShare.map((friend) => {
                  const isSelected = selectedShareRecipients.includes(friend.username);
                  return (
                    <button
                      key={friend.username}
                      type="button"
                      onClick={() => {
                        setSelectedShareRecipients((prev) =>
                          prev.includes(friend.username)
                            ? prev.filter((u) => u !== friend.username)
                            : [...prev, friend.username]
                        );
                      }}
                      className={`flex flex-col items-center gap-1.5 p-1.5 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-pink-500/10 border border-pink-500/50'
                          : 'hover:bg-[var(--surface-sunken)] border border-transparent'
                      }`}
                    >
                      <div className="relative">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.fullName}
                            className={`w-12 h-12 rounded-full object-cover border-2 ${
                              isSelected ? 'border-pink-500' : 'border-[var(--line)]'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                              isSelected
                                ? 'border-pink-500 bg-pink-500/20 text-pink-500'
                                : 'border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--text)]'
                            }`}
                          >
                            {friend.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-xs">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span className="truncate w-full text-[11px] font-semibold text-center text-[var(--text)]">
                        {friend.fullName.split(' ')[0]}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] truncate w-full text-center">
                        @{friend.username}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Share action button - post is shared only when clicking Share */}
            <div className="pt-2 border-t border-[var(--line)] flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSharePost(null);
                  setSelectedShareRecipients([]);
                  setShareSearchQuery('');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedShareRecipients.length === 0}
                onClick={() => {
                  if (selectedSharePost) {
                    DataStore.sharePostToChat(selectedSharePost, selectedShareRecipients);
                    showToast(
                      `Shared post with ${selectedShareRecipients.length} friend${
                        selectedShareRecipients.length > 1 ? 's' : ''
                      } in chat! 🚀`
                    );
                  }
                  setSelectedSharePost(null);
                  setSelectedShareRecipients([]);
                  setShareSearchQuery('');
                }}
                className="flex-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white gradient-bg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send size={14} className="-rotate-12" />
                <span>
                  {selectedShareRecipients.length === 0
                    ? 'Select Friends to Share'
                    : `Share with (${selectedShareRecipients.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post More Options Sheet */}
      {selectedOptionsPost && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center select-none"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSelectedOptionsPost(null)}
          />
          <div
            className="relative w-full max-w-md rounded-t-[24px] border p-4 shadow-2xl z-10 space-y-2"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto mb-2" />

            {/* 1. Delete Post Option (if author or admin) */}
            {(selectedOptionsPost.username.toLowerCase() === currentUser.username.toLowerCase() ||
              currentUser.username.toLowerCase() === 'shashwath71845' ||
              currentUser.role === 'admin') && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
                    DataStore.deletePost(selectedOptionsPost.id, currentUser.username);
                    showToast('Post deleted successfully 🗑️');
                    setSelectedOptionsPost(null);
                    setPosts(DataStore.getPosts());
                  }
                }}
                className="w-full py-3 px-3 rounded-[12px] flex items-center gap-3 text-xs font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete post</span>
              </button>
            )}

            {/* 2. Unsave / Save Post Option */}
            <button
              type="button"
              onClick={() => {
                const isNowSaved = DataStore.toggleSavePost(selectedOptionsPost.id, currentUser.username);
                setSavedPosts((prev) => ({ ...prev, [selectedOptionsPost.id]: isNowSaved }));
                showToast(isNowSaved ? 'Saved to bookmarks 🔖' : 'Post removed from saved (unsaved) ❌');
                setSelectedOptionsPost(null);
              }}
              className="w-full py-3 px-3 rounded-[12px] flex items-center gap-3 text-xs font-semibold hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text)] transition-colors"
            >
              <Bookmark
                size={16}
                className={savedPosts[selectedOptionsPost.id] ? 'fill-[var(--primary)] text-[var(--primary)]' : ''}
              />
              <span>{savedPosts[selectedOptionsPost.id] ? 'Unsave post (Remove bookmark)' : 'Save post to bookmarks'}</span>
            </button>

            {/* 3. Undo Repost / Unrepost Option (if post is a repost by user or user has reposted it) */}
            {((selectedOptionsPost.isRepost && selectedOptionsPost.username.toLowerCase() === currentUser.username.toLowerCase()) ||
              DataStore.hasUserReposted(selectedOptionsPost.id, currentUser.username)) && (
              <button
                type="button"
                onClick={() => {
                  const success = DataStore.unrepostPost(selectedOptionsPost.id, currentUser.username);
                  if (success) {
                    showToast('Repost removed (unreposted) 🔄');
                    setPosts(DataStore.getPosts());
                  } else {
                    showToast('Could not remove repost');
                  }
                  setSelectedOptionsPost(null);
                }}
                className="w-full py-3 px-3 rounded-[12px] flex items-center gap-3 text-xs font-semibold text-pink-500 hover:bg-pink-500/10 cursor-pointer transition-colors"
              >
                <Repeat2 size={16} />
                <span>Undo Repost / Unrepost</span>
              </button>
            )}

            {/* 4. Copy Link to Post */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.origin + `/u/${selectedOptionsPost.username}`);
                showToast('Link copied to clipboard 📋');
                setSelectedOptionsPost(null);
              }}
              className="w-full py-3 px-3 rounded-[12px] flex items-center gap-3 text-xs font-semibold hover:bg-[var(--surface-sunken)] cursor-pointer text-[var(--text)] transition-colors"
            >
              <Copy size={16} />
              <span>Copy link to post</span>
            </button>

            {/* 5. Report Post */}
            <button
              type="button"
              onClick={() => {
                showToast('Post reported to school admin for review 🛡️');
                setSelectedOptionsPost(null);
              }}
              className="w-full py-3 px-3 rounded-[12px] flex items-center gap-3 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--surface-sunken)] cursor-pointer transition-colors"
            >
              <Flag size={16} />
              <span>Report post</span>
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-lg animate-fade-in pointer-events-none select-none"
          style={{ backgroundColor: 'var(--text)' }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
