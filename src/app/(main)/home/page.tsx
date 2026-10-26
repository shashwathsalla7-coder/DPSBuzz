'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
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
import { HomeStreakWidget } from '@/components/home/HomeStreakWidget';
import { AdVideoCard } from '@/components/home/AdVideoCard';
import dynamic from 'next/dynamic';

const SharePostModal = dynamic(
  () => import('@/components/home/SharePostModal').then((m) => m.SharePostModal),
  { ssr: false }
);

const SoloGame2048Modal = dynamic(
  () => import('@/components/games').then((m) => m.SoloGame2048Modal),
  { ssr: false }
);

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFeedSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [posts, setPosts] = useState<Post[]>(() => (typeof window !== 'undefined' ? DataStore.getPosts() : []));
  const [notices, setNotices] = useState<Notice[]>(() => (typeof window !== 'undefined' ? DataStore.getNotices() : []));
  const [broadcastAlert, setBroadcastAlert] = useState<BroadcastAlert | null>(() => (typeof window !== 'undefined' ? DataStore.getBroadcastAlert() : null));
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    const cur = DataStore.getCurrentUser();
    const map: Record<string, boolean> = {};
    if (cur?.username) {
      DataStore.getUserLikedPostIds(cur.username).forEach((id) => { map[id] = true; });
    }
    return map;
  });
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    const cur = DataStore.getCurrentUser();
    const map: Record<string, boolean> = {};
    if (cur?.username) {
      DataStore.getSavedPostIds(cur.username).forEach((id) => { map[id] = true; });
    }
    return map;
  });
  const [activeTab, setActiveTab] = useState<'following' | 'all'>('following');
  const [visibleCount, setVisibleCount] = useState(12);
  const feedSentinelRef = useRef<HTMLDivElement | null>(null);
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
  const [isSolo2048Open, setIsSolo2048Open] = useState<boolean>(false);

  // Notice Read Suppression
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>(() => DataStore.getReadNoticeIds());
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<string[]>([]);
  const [followsVersion, setFollowsVersion] = useState(0);

  // Comments map with localStorage persistence
  const [commentsMap, setCommentsMap] = useState<Record<string, Array<{ id: string; username: string; text: string; timeAgo: string; image?: string; avatar?: string | null }>>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dpsbuzz_comments_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {};
  });
  const [newCommentText, setNewCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  const handleCommentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid photo file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          setCommentImage(compressed);
        } else {
          setCommentImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const currentUser = DataStore.getCurrentUser();

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const cur = DataStore.getCurrentUser();
      if (!cur || !cur.username || cur.username.toLowerCase() === 'guest') {
        router.replace('/login');
        return;
      }
    }

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

      // Load persistent liked posts
      const likedIds = DataStore.getUserLikedPostIds(cur.username);
      const likedMap: Record<string, boolean> = {};
      likedIds.forEach((id) => {
        likedMap[id] = true;
      });
      setLikedPosts(likedMap);

      // Reload comments map
      try {
        const savedComments = localStorage.getItem('dpsbuzz_comments_v1');
        if (savedComments) setCommentsMap(JSON.parse(savedComments));
      } catch {}

      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('game') === '2048' || searchParams.get('solo') === '2048') {
          setIsSolo2048Open(true);
        }
      }
    };

    loadData();
    // Synchronize with server so posts and stories uploaded on other devices appear immediately
    DataStore.syncWithServer().catch(() => {});
    fetch('/api/posts')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.posts)) {
          DataStore.mergePosts(data.posts);
          setPosts(DataStore.getPosts());
        }
      })
      .catch(() => {});

    // Smart polling sync every 25 seconds when visible to pull fresh posts and stories across devices
    const syncInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      DataStore.syncWithServer().catch(() => {});
      fetch('/api/posts')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.posts)) {
            DataStore.mergePosts(data.posts);
            setPosts(DataStore.getPosts());
          }
        })
        .catch(() => {});
    }, 25000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        DataStore.syncWithServer().then(() => loadData()).catch(() => {});
      }
    };

    const handleContentUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      // Skip heavy feed reload if it was an optimistic action already handled locally
      if (detail?.type === 'like_post' || detail?.type === 'save_post' || detail?.type === 'follow') {
        return;
      }
      loadData();
    };

    window.addEventListener('dpsbuzz:content_updated', handleContentUpdated);
    window.addEventListener('storage', loadData);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleContentUpdated);
      window.removeEventListener('storage', loadData);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(syncInterval);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLikeToggle = (postId: string) => {
    const res = DataStore.toggleLikePost(postId, currentUser.username);
    setLikedPosts((prev) => ({ ...prev, [postId]: res.liked }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes: res.likesCount } : p
      )
    );
  };

  const handleSaveToggle = (postId: string) => {
    const isNowSaved = DataStore.toggleSavePost(postId, currentUser.username);
    setSavedPosts((prev) => ({ ...prev, [postId]: isNowSaved }));
    showToast(isNowSaved ? 'Saved to bookmarks 🔖' : 'Removed from saved (unsaved) ❌');
  };

  const handleAddComment = (postId: string) => {
    const trimmed = newCommentText.trim();
    if (!trimmed && !commentImage) return;
    const cur = currentUser || DataStore.getCurrentUser();
    const newComment = {
      id: 'c-' + Date.now(),
      username: cur?.username || 'student',
      avatar: cur?.avatar || DataStore.getProfileByUsername(cur?.username || '')?.avatar || null,
      text: trimmed,
      image: commentImage || undefined,
      timeAgo: 'Just now',
      createdAt: new Date().toISOString(),
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
    setCommentImage(null);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p))
    );
    showToast(newComment.image ? 'Photo comment posted! 📸' : 'Comment posted');

    // Notify other components & tabs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
    }

    // Sync comment to server
    fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: newComment }),
    }).catch(() => {});
  };

  const triggerPullToRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [syncRes, postsRes] = await Promise.all([
        DataStore.syncWithServer(true),
        fetch('/api/posts').then((r) => r.json()).catch(() => null),
      ]);
      if (postsRes && postsRes.success && Array.isArray(postsRes.posts)) {
        DataStore.mergePosts(postsRes.posts);
      }
    } catch {}
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

      // New posts / reposts from classmates marked "Just now" or newly shared
      const isARecent = a.timeAgo === 'Just now' || a.id.startsWith('post-repost-');
      const isBRecent = b.timeAgo === 'Just now' || b.id.startsWith('post-repost-');
      if (isARecent && !isBRecent) return -1;
      if (!isARecent && isBRecent) return 1;

      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      // Posts from the last 24 hours: newest first so followers see new posts & shares immediately
      const isAFresh = timeA > 0 && now - timeA < ONE_DAY_MS;
      const isBFresh = timeB > 0 && now - timeB < ONE_DAY_MS;

      if (isAFresh && isBFresh) {
        return timeB - timeA;
      }
      if (isAFresh && !isBFresh) return -1;
      if (!isAFresh && isBFresh) return 1;

      // Older posts: sort by likes/engagement combined with time
      return (b.likes || 0) - (a.likes || 0) || timeB - timeA;
    };

    if (activeTab === 'following') {
      const filtered = posts.filter((p) => {
        const u = (p.username || '').toLowerCase().trim();
        return u === myUsername || followedUsernames.includes(u);
      });
      const sorted = [...filtered].sort(sortFn);
      const seenOriginalPostIds = new Set<string>();
      const deduplicated: Post[] = [];
      for (const p of sorted) {
        const canonicalPostId = p.isRepost && p.repostedFrom?.postId ? p.repostedFrom.postId : p.id;
        if (!seenOriginalPostIds.has(canonicalPostId)) {
          seenOriginalPostIds.add(canonicalPostId);
          deduplicated.push(p);
        }
      }
      return deduplicated;
    }

    // Whole school: all public posts + private posts only if followed by viewer
    const allProfiles = DataStore.getProfiles();
    const profileMap = new Map(allProfiles.map((p) => [p.username.toLowerCase(), p]));

    const isPostVisible = (p: Post) => {
      const u = (p.username || '').toLowerCase().trim();
      if (!u || u === myUsername || u === 'dpsbuzz' || u === 'dps_official') return true;
      const authorProfile = profileMap.get(u);
      const isPrivate = Boolean(authorProfile?.isPrivate);
      if (isPrivate) {
        if (!followedUsernames.includes(u)) return false;
      }

      // Check repost origin: if original post author is private, non-followers cannot see it
      if (p.isRepost && p.repostedFrom?.username) {
        const origAuthor = p.repostedFrom.username.toLowerCase().trim();
        const origAuthorProf = profileMap.get(origAuthor);
        if (origAuthorProf?.isPrivate && !followedUsernames.includes(origAuthor) && origAuthor !== myUsername) {
          return false;
        }
      }

      // Check audience: if restricted to a specific class group
      if (p.audience === 'class-group' || p.targetClass) {
        const targetCls = (p.targetClass || p.class || '').replace(/[^0-9]/g, '');
        const viewerCls = (currentUser?.class || '').toString().replace(/[^0-9]/g, '');
        if (targetCls && viewerCls && targetCls !== viewerCls) {
          return false;
        }
      }
      return true; // Public posts are visible to all students
    };

    const publicAndFollowedPosts = posts.filter(isPostVisible);
    const sorted = [...publicAndFollowedPosts].sort(sortFn);
    const seenOriginalPostIds = new Set<string>();
    const deduplicated: Post[] = [];
    for (const p of sorted) {
      const canonicalPostId = p.isRepost && p.repostedFrom?.postId ? p.repostedFrom.postId : p.id;
      if (!seenOriginalPostIds.has(canonicalPostId)) {
        seenOriginalPostIds.add(canonicalPostId);
        deduplicated.push(p);
      }
    }
    return deduplicated;
  }, [activeTab, posts, followedUsernames, currentUser.username, demoState]);

  // Reset pagination slice when switching tabs
  useEffect(() => {
    setVisibleCount(12);
  }, [activeTab]);

  // Infinite scroll observer: load next batch of 12 posts when scrolling near bottom
  useEffect(() => {
    if (!feedSentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 12, displayedPosts.length));
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(feedSentinelRef.current);
    return () => observer.disconnect();
  }, [displayedPosts.length]);

  // Paginated posts subset for ultra-lightweight mobile DOM rendering
  const visiblePosts = useMemo(() => {
    return displayedPosts.slice(0, visibleCount);
  }, [displayedPosts, visibleCount]);

  // Filter comments obeying public vs private account privacy rules:
  // Public people will NOT see comments made by private accounts (unless they follow them)
  const activeComments = useMemo(() => {
    if (!selectedCommentsPost) return [];
    const rawList = commentsMap[selectedCommentsPost.id] || [];
    const myUser = (currentUser?.username || '').toLowerCase().trim();
    const profiles = DataStore.getProfiles();
    const profileMap = new Map(profiles.map((p) => [p.username.toLowerCase(), p]));

    return rawList.filter((c) => {
      if (!c || !c.username) return false;
      const author = (c.username || '').toLowerCase().trim();
      if (myUser && author === myUser) return true;
      if (myUser && (selectedCommentsPost.username || '').toLowerCase().trim() === myUser) return true;
      if (myUser === 'shashwath71845') return true;

      const authorProf = profileMap.get(author) || DataStore.getProfileByUsername(author);
      if (authorProf && authorProf.isPrivate) {
        const viewerFollowsAuthor =
          followedUsernames.includes(author) || (myUser ? DataStore.isFollowing(myUser, author) : false);
        if (!viewerFollowsAuthor) {
          return false; // Private user's comments are hidden from public non-followers!
        }
      }
      return true;
    });
  }, [selectedCommentsPost, commentsMap, currentUser, followedUsernames]);

  if (!isMounted || !currentUser || !currentUser.username || currentUser.username.toLowerCase() === 'guest') {
    return <HomeFeedSkeleton />;
  }

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

      {/* Mini Streak & Strike Points Top Pill Bar */}
      <HomeStreakWidget compact={true} />

      {/* Mini 2048 Solo Game Card / Banner */}
      <div
        className="mx-3 my-2.5 p-3 rounded-[18px] border flex items-center justify-between gap-3 shadow-xs transition-all hover:border-amber-500/40"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center text-lg shadow-sm shrink-0">
            🐝
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-extrabold text-[var(--text)] tracking-tight">
                2048 Buzz Solo
              </h4>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30">
                5 Levels
              </span>
            </div>
            <p className="text-[10.5px] text-[var(--text-muted)] truncate">
              Swipe tiles, climb levels 1-5 &amp; win Star Points!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsSolo2048Open(true)}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:opacity-90 active:scale-95 text-white font-extrabold text-xs shadow-sm transition-all shrink-0 cursor-pointer flex items-center gap-1"
        >
          <span>Play 🚀</span>
        </button>
      </div>

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
          {/* Daily Habit Streaks, Strike Points & Star Board Widget */}
          <HomeStreakWidget />

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
          {visiblePosts.map((post, postIdx) => (
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

              {/* In-feed Daily Habit Streak & Strike Points Widget */}
              {postIdx === 2 && <HomeStreakWidget />}

              {/* In-feed Sponsored Ad Video Card */}
              {(postIdx === 3 || (visiblePosts.length <= 3 && postIdx === visiblePosts.length - 1)) && (
                <AdVideoCard />
              )}
            </div>
          ))}

          {/* Infinite Scroll Sentinel: triggers loading the next batch of 12 posts */}
          {visibleCount < displayedPosts.length && (
            <div ref={feedSentinelRef} className="py-6 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

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
                  Comments ({activeComments.length})
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
              {activeComments.length === 0 ? (
                <p className="text-xs text-center py-6 text-[var(--text-muted)]">
                  No comments yet. Be the first to comment! 💬
                </p>
              ) : (
                activeComments.map((c) => (
                <div key={c.id} className="text-xs flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-center font-bold text-[10px] shrink-0 text-[var(--text)] overflow-hidden">
                    {c.avatar || DataStore.getProfileByUsername(c.username)?.avatar ? (
                      <img
                        src={c.avatar || DataStore.getProfileByUsername(c.username)?.avatar || ''}
                        alt={c.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      c.username.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-[var(--text)] mr-1.5">@{c.username}</span>
                    {c.text && <span className="text-[var(--text)] leading-relaxed">{c.text}</span>}
                    {c.image && (
                      <div className="mt-2 max-w-[200px] rounded-2xl overflow-hidden border border-[var(--line)] shadow-xs bg-black/5">
                        <img
                          src={c.image}
                          alt="Photo attachment in comment"
                          className="w-full max-h-48 object-cover rounded-2xl cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => window.open(c.image, '_blank')}
                          loading="lazy"
                        />
                      </div>
                    )}
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{c.timeAgo}</p>
                  </div>
                </div>
              )))}
            </div>

            {/* Photo Attached Preview Bar */}
            {commentImage && (
              <div className="px-4 py-2 border-t border-[var(--line)] flex items-center justify-between bg-[var(--surface-sunken)] animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <img
                    src={commentImage}
                    alt="Comment upload preview"
                    className="w-10 h-10 rounded-xl object-cover border border-[var(--line)] shadow-xs"
                  />
                  <div className="text-[11px]">
                    <span className="font-bold text-[var(--text)] block">Photo attached 📸</span>
                    <span className="text-[var(--text-muted)] text-[10px]">Direct photo reply (no heavy GIFs)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCommentImage(null)}
                  className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-colors text-xs cursor-pointer"
                  title="Remove photo"
                  aria-label="Remove photo"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddComment(selectedCommentsPost.id);
              }}
              className="p-3 px-4 border-t border-[var(--line)] flex items-center gap-2 bg-[var(--surface)]"
            >
              <input
                ref={commentFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCommentImageUpload}
              />
              <button
                type="button"
                onClick={() => commentFileInputRef.current?.click()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 border ${
                  commentImage
                    ? 'bg-pink-500/10 text-pink-500 border-pink-500/30'
                    : 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-muted)] hover:text-pink-500 hover:border-pink-500/30'
                }`}
                title="Add photo to comment 📸"
                aria-label="Add photo to comment"
              >
                <ImageIcon size={18} />
              </button>
              <input
                type="text"
                autoFocus
                placeholder="Add a comment or photo..."
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
                disabled={!newCommentText.trim() && !commentImage}
                className="h-11 px-5 rounded-full text-xs font-bold text-white transition-opacity disabled:opacity-40 shadow-xs cursor-pointer flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Post Sheet (loaded on demand) */}
      {selectedSharePost && (
        <SharePostModal
          isOpen={Boolean(selectedSharePost)}
          onClose={() => setSelectedSharePost(null)}
          post={selectedSharePost}
        />
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
                const postUrl = `${window.location.origin}/u/${selectedOptionsPost.username}?post=${selectedOptionsPost.id}`;
                navigator.clipboard?.writeText(postUrl);
                showToast('Post link copied to clipboard 📋');
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

      {/* Solo 2048 Game Modal (loaded on demand) */}
      {isSolo2048Open && (
        <SoloGame2048Modal
          isOpen={isSolo2048Open}
          onClose={() => setIsSolo2048Open(false)}
          currentUsername={currentUser.username}
        />
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
