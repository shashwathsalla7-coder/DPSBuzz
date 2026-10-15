'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  HelpCircle,
  X,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  Plus,
  Zap,
  Crown,
  Medal,
  Camera,
} from 'lucide-react';
import { getAvatarColorPair } from '@/config/tokens';
import { DataStore, HabitStreak, STARTER_HABIT_STREAKS, DUMMY_TEST_USERNAMES } from '@/lib/dataStore';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'streaks' | 'leaders'>('leaders');
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<string>('all');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showQuickPostModal, setShowQuickPostModal] = useState(false);

  // Quick Post modal state
  const [quickCategory, setQuickCategory] = useState<
    'studies' | 'sports' | 'reading' | 'stem' | 'arts' | 'routine'
  >('studies');
  const [quickCaption, setQuickCaption] = useState('');
  const [quickPhoto, setQuickPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80'
  );
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const quickPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleQuickPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setQuickPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Live data from DataStore
  const [streaks, setStreaks] = useState<HabitStreak[]>(() => {
    if (typeof window !== 'undefined') {
      return DataStore.getHabitStreaks();
    }
    return STARTER_HABIT_STREAKS;
  });
  const [profiles, setProfiles] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      return DataStore.getProfiles();
    }
    return [];
  });
  const [posts, setPosts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      return DataStore.getPosts(true);
    }
    return [];
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      return DataStore.getCurrentUser();
    }
    return null;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    const loadData = () => {
      setStreaks(DataStore.getHabitStreaks());
      setCurrentUser(DataStore.getCurrentUser());
      setProfiles(DataStore.getProfiles());
      setPosts(DataStore.getPosts(true));
    };

    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filtered streaks based on habit category filter (deduplicated by username)
  const filteredStreaks = useMemo(() => {
    const deletedUsers = DataStore.getDeletedUsernames();
    const activeProfiles = new Set(profiles.map((p) => p.username.toLowerCase().trim()));
    const map = new Map<string, HabitStreak>();
    for (const s of streaks) {
      if (!s || !s.username) continue;
      const key = s.username.toLowerCase().trim();
      if (DUMMY_TEST_USERNAMES.has(key) || deletedUsers.has(key) || !activeProfiles.has(key)) continue;
      if (!map.has(key)) {
        map.set(key, s);
      }
    }
    const unique = Array.from(map.values()).sort((a, b) => {
      if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
      return b.habitPoints - a.habitPoints;
    });

    if (selectedHabitFilter === 'all') return unique;
    return unique.filter(
      (s) => s.primaryHabit.toLowerCase() === selectedHabitFilter.toLowerCase()
    );
  }, [streaks, profiles, selectedHabitFilter]);

  // Current logged in user streak details
  const myStreak = useMemo(() => {
    if (!currentUser) return null;
    const cleanCur = (currentUser.username || '').toLowerCase().trim();
    if (!cleanCur || cleanCur === 'guest' || DataStore.getDeletedUsernames().has(cleanCur)) return null;
    return (
      streaks.find((s) => s.username.toLowerCase().trim() === cleanCur) || {
        id: 'streak-' + currentUser.username,
        username: currentUser.username,
        fullName: currentUser.fullName,
        class: `Class ${currentUser.class || '8'}-${currentUser.section || 'A'}`,
        streakDays: 0,
        habitPoints: 0,
        primaryHabit: 'Studies',
        habitTag: '#Studies',
        lastPostedDate: new Date().toISOString(),
        postedToday: false,
        recentPostsCount: 0,
        bestStreak: 0,
      }
    );
  }, [streaks, currentUser]);

  // Habit category chips
  const habitCategories = [
    { id: 'all', label: 'All Habits', icon: '🔥' },
    { id: 'studies', label: 'Studies & Prep', icon: '📚' },
    { id: 'sports', label: 'Sports & Play', icon: '⚽' },
    { id: 'reading', label: 'Book Reading', icon: '📖' },
    { id: 'stem', label: 'Science & Lab', icon: '🔬' },
    { id: 'arts', label: 'Arts & Creative', icon: '🎨' },
    { id: 'routine', label: 'Good Habits', icon: '🌱' },
  ];

  // Leaderboard rankings dynamically computed with 100% genuine fairness
  // 1. Primary Sort: Highest followers gets Rank #1 (highest followers gets the gold podium)
  // 2. Secondary Sort (Tie-Breaker): Genuine engagement (Views + Likes + Comments + Posts)
  const studentLeaders = useMemo(() => {
    const deletedUsers = DataStore.getDeletedUsernames();
    const realUsers = profiles.filter(
      (p) =>
        p &&
        p.username &&
        p.username.toLowerCase() !== 'admin' &&
        p.username.toLowerCase() !== 'principal' &&
        !DUMMY_TEST_USERNAMES.has(p.username.toLowerCase().trim()) &&
        !deletedUsers.has(p.username.toLowerCase().trim())
    );

    return realUsers
      .map((p) => {
        const u = p.username.toLowerCase().trim();
        const userPosts = posts.filter(
          (post) => post && post.username && post.username.toLowerCase().trim() === u
        );
        const realPostCount = userPosts.length;
        const totalViews = userPosts.reduce((acc, post) => acc + (post.views || 0), 0);
        const totalLikes = userPosts.reduce((acc, post) => acc + (post.likes || 0), 0);
        const totalComments = userPosts.reduce((acc, post) => acc + (post.comments || 0), 0);
        const realFollowers = p.followerCount || 0;
        const realFollowing = p.followingCount || 0;

        // Total engagement: views + likes*2 + comments*3 + posts
        const engagementScore = totalViews + (totalLikes * 2) + (totalComments * 3) + realPostCount;

        return {
          id: p.id,
          username: p.username,
          name: p.fullName || p.username,
          avatar: p.avatar || null,
          class: p.class ? `Class ${p.class}${p.section ? '-' + p.section : ''}` : 'DPS Student',
          followers: realFollowers,
          following: realFollowing,
          posts: realPostCount,
          views: totalViews,
          likes: totalLikes,
          comments: totalComments,
          engagementScore,
          createdAt: p.createdAt || '',
        };
      })
      .sort((a, b) => {
        // Strict fairness - no fake bias:
        // 1. Highest followers gets Rank #1
        if (b.followers !== a.followers) {
          return b.followers - a.followers;
        }
        // 2. Tie-breaker: Highest total engagement (views, likes, comments, posts)
        if (b.engagementScore !== a.engagementScore) {
          return b.engagementScore - a.engagementScore;
        }
        // 3. Tie-breaker: Total views
        if (b.views !== a.views) {
          return b.views - a.views;
        }
        // 4. Tie-breaker: Account creation date
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .map((p, idx) => ({
        ...p,
        rank: idx + 1,
      }));
  }, [profiles, posts]);

  // Inappropriate words filter
  const checkModeration = (text: string) => {
    const bad = ['idiot', 'stupid', 'fool', 'shut up', 'hate', 'dumb', 'loser', 'die', 'kill', 'crap'];
    const lower = text.toLowerCase();
    for (const word of bad) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
        setModerationWarning(`⚠️ School Warning: Inappropriate language ("${word}"). Please keep posts clean and respectful.`);
        return false;
      }
    }
    setModerationWarning(null);
    return true;
  };

  // Submit quick habit post
  const handleQuickHabitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCaption.trim() || !currentUser) return;

    if (!checkModeration(quickCaption)) {
      return;
    }

    const evalResult = DataStore.recordHabitPost(
      currentUser.username,
      quickCaption.trim(),
      quickCategory
    );

    DataStore.addPost({
      userId: currentUser.id || 'user-me',
      username: currentUser.username,
      fullName: currentUser.fullName,
      class: currentUser.class ? `Class ${currentUser.class}-${currentUser.section || 'A'}` : 'Class 8-A',
      avatar: currentUser.avatar || null,
      caption: quickCaption.trim(),
      images: [quickPhoto],
      imageUrl: quickPhoto,
      habitCategory: quickCategory,
    });

    setStreaks(DataStore.getHabitStreaks());
    setShowQuickPostModal(false);
    setQuickCaption('');
    setModerationWarning(null);
    showToast(`Habit recorded! Streak is now ${evalResult.streakDays} days 🔥 (+${evalResult.points} pts)`);
  };

  return (
    <div className="min-h-screen pb-28 select-none bg-[var(--bg)] text-[var(--text)] animate-fade-in">
      {/* 1. Header (56px) */}
      <div className="sticky top-0 z-20 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--line)] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="btn-apple w-9 h-9 rounded-full flex items-center justify-center text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <h1 className="text-base font-extrabold tracking-tight text-[var(--text)]">
              Leaderboard & Streaks
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHowItWorks(true)}
          className="btn-apple w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
          aria-label="How it works"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* 2. Current Student Streak Hero Card */}
        <div className="p-5 rounded-[26px] border bg-[var(--surface)] border-[var(--line)] shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-13 h-13 rounded-full flex items-center justify-center font-bold text-base shrink-0 border border-black/5 dark:border-white/10 shadow-xs"
                style={{
                  backgroundColor: getAvatarColorPair(currentUser?.username || 'student').bg,
                  color: getAvatarColorPair(currentUser?.username || 'student').text,
                }}
              >
                {(currentUser?.fullName || currentUser?.username || 'ST').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[var(--text)] truncate">
                  {currentUser?.fullName || (currentUser?.username ? `@${currentUser.username}` : 'Student')}
                </h2>
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  {currentUser?.class ? `Class ${currentUser.class}-${currentUser.section || 'A'}` : 'DPS Student'} · {myStreak?.primaryHabit || 'Studies'}
                </p>
              </div>
            </div>

            {/* Streak Flame Badge */}
            <div className="px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-500 font-black text-xs flex items-center gap-1.5 shrink-0 shadow-xs">
              <Flame size={16} className="text-orange-500 animate-pulse" />
              <span className="tabular-nums font-mono text-sm">{myStreak?.streakDays ?? 0}d Streak</span>
            </div>
          </div>

          {/* Points & Daily Status Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-[18px] bg-[var(--surface-sunken)] border border-[var(--line)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                Habit Points
              </span>
              <span className="text-base font-extrabold text-[var(--primary)] tabular-nums font-mono mt-0.5 block">
                ⭐ {myStreak?.habitPoints ?? 0} pts
              </span>
            </div>

            <div className="p-3 rounded-[18px] bg-[var(--surface-sunken)] border border-[var(--line)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                Today&apos;s Status
              </span>
              <div className="text-xs font-bold mt-0.5 flex items-center gap-1">
                {myStreak?.postedToday ? (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Secured
                  </span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-1">
                    <Clock size={13} /> Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => setShowQuickPostModal(true)}
            className="btn-apple w-full py-3 px-4 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #833AB4, #C13584, #F77737)',
            }}
          >
            <Zap size={15} />
            <span>Post Habit & Save Streak (+25 Pts)</span>
          </button>
        </div>

        {/* 3. Segmented Switcher (2 Tabs Only: Streaks & Star Board - No Spirit) */}
        <div className="flex p-1 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('streaks')}
            className={`btn-apple flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'streaks'
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm font-extrabold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Flame size={15} className={activeTab === 'streaks' ? 'text-orange-500' : ''} />
            <span>Habit Streaks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaders')}
            className={`btn-apple flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'leaders'
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm font-extrabold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Crown size={15} className={activeTab === 'leaders' ? 'text-amber-500' : ''} />
            <span>Star Board</span>
          </button>
        </div>

        {/* 4. Habit Category Filter Chips (if Streaks tab) */}
        {activeTab === 'streaks' && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
              Filter by Habit:
            </span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {habitCategories.map((cat) => {
                const isSelected = selectedHabitFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedHabitFilter(cat.id)}
                    className={`btn-apple px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. AESTHETIC PREMIUM 1-2-3 PODIUM SHOWCASE */}
        {activeTab === 'streaks' ? (
          <HabitStreakPodium streaks={filteredStreaks} onOpenPost={() => setShowQuickPostModal(true)} />
        ) : (
          <StudentLeaderPodium leaders={studentLeaders} />
        )}

        {/* 6. Rankings List (#4 and below) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <span>{activeTab === 'streaks' ? 'All Habit Streaks' : 'All Student Ranks'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-pink-500/15 text-pink-500">
                Live
              </span>
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Updated in real-time
            </span>
          </div>

          <div className="space-y-2">
            {activeTab === 'streaks' ? (
              filteredStreaks.length > 3 ? (
                filteredStreaks.slice(3).map((s, idx) => {
                  const rankNumber = idx + 4;
                  const isMe = currentUser && s.username.toLowerCase() === currentUser.username.toLowerCase();
                  const pair = getAvatarColorPair(s.username);
                  return (
                    <Link
                      key={s.id}
                      href={`/u/${s.username}`}
                      className={`btn-apple p-3.5 rounded-[20px] border flex items-center justify-between gap-3 transition-colors ${
                        isMe
                          ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30'
                          : 'bg-[var(--surface)] border-[var(--line)] hover:bg-[var(--surface-sunken)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-7 h-7 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-center font-mono font-bold text-xs text-[var(--text-muted)] shrink-0">
                          #{rankNumber}
                        </div>

                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                          style={{ backgroundColor: pair.bg, color: pair.text }}
                        >
                          {s.fullName.slice(0, 2).toUpperCase()}
                        </div>

                        {/* Name & Habit */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-[var(--text)] truncate">
                              {s.fullName}
                            </p>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded-full bg-[var(--primary)] text-white text-[9px] font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">
                            {s.class} · {s.primaryHabit}
                          </p>
                        </div>
                      </div>

                      {/* Streak & Points */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end font-bold text-xs text-orange-500 tabular-nums font-mono">
                          <Flame size={13} className="text-orange-500" />
                          <span>{s.streakDays}d streak</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] tabular-nums font-medium">
                          ⭐ {s.habitPoints} pts
                        </span>
                      </div>
                    </Link>
                  );
                })
              ) : filteredStreaks.length <= 3 && filteredStreaks.length > 0 ? (
                <div className="p-4 rounded-[20px] border text-center bg-[var(--surface)] border-[var(--line)]">
                  <p className="text-xs font-bold text-[var(--text)]">You are viewing all active streaks!</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Post today to climb to the top of the podium.
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded-[22px] border text-center bg-[var(--surface)] border-[var(--line)] space-y-2">
                  <Flame size={24} className="mx-auto text-orange-500" />
                  <p className="text-xs font-bold text-[var(--text)]">No habit streaks recorded yet!</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Be the very first student to post with #studies or #sports and claim rank #1!
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowQuickPostModal(true)}
                    className="btn-apple px-4 py-2 rounded-xl text-xs font-bold text-white gradient-bg shadow-xs mt-2"
                  >
                    Start First Streak (+25 Pts)
                  </button>
                </div>
              )
            ) : studentLeaders.length > 3 ? (
              studentLeaders.slice(3).map((u) => {
                const isMe = currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase();
                const pair = getAvatarColorPair(u.username);
                return (
                  <Link
                    key={u.username}
                    href={`/u/${u.username}`}
                    className={`btn-apple p-3.5 rounded-[20px] border flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                      isMe
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30'
                        : 'bg-[var(--surface)] border-[var(--line)] hover:bg-[var(--surface-sunken)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-center font-mono font-bold text-xs text-[var(--text-muted)] shrink-0">
                        #{u.rank}
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                        style={{ backgroundColor: pair.bg, color: pair.text }}
                      >
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-[var(--text)] truncate group-hover:underline">
                            {u.name}
                          </p>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[var(--primary)] text-white text-[9px] font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)]">{u.class}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[var(--text)] tabular-nums block">
                        👥 {u.followers} {u.followers === 1 ? 'follower' : 'followers'}
                      </span>
                      <span className="text-[10px] text-pink-500 font-bold block">
                        👁️ {u.views} views · ❤️ {u.likes} · 📸 {u.posts}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : studentLeaders.length > 0 ? (
              <div className="p-4 rounded-[20px] border text-center bg-[var(--surface)] border-[var(--line)]">
                <p className="text-xs font-bold text-[var(--text)]">Top students displayed on the podium above!</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Follow classmates and share posts to climb the ranks.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-[22px] border text-center bg-[var(--surface)] border-[var(--line)] space-y-2">
                <Trophy size={24} className="mx-auto text-amber-500" />
                <p className="text-xs font-bold text-[var(--text)]">No student rankings recorded yet!</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Connect with classmates to claim Rank #1 on the Star Board!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Habit Post Modal */}
      {showQuickPostModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowQuickPostModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-t-[28px] sm:rounded-[28px] border p-5 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-full bg-orange-500/20 text-orange-500">
                  <Flame size={16} />
                </span>
                <h3 className="font-bold text-sm text-[var(--text)]">Post Today&apos;s Habit</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickPostModal(false)}
                className="btn-apple p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {moderationWarning && (
              <div className="p-3 rounded-[16px] bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs leading-relaxed">
                {moderationWarning}
              </div>
            )}

            {/* Habit Category Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Select Habit:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'studies', label: '📚 Studies & Prep' },
                  { id: 'sports', label: '⚽ Sports & Playing' },
                  { id: 'reading', label: '📖 Reading Book' },
                  { id: 'stem', label: '🔬 Science & Lab' },
                  { id: 'arts', label: '🎨 Art & Creative' },
                  { id: 'routine', label: '🌱 Good Habit' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setQuickCategory(cat.id as any)}
                    className={`btn-apple px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      quickCategory === cat.id
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Attachment (Custom Upload or Preview) */}
            <div className="space-y-1.5">
              <input
                type="file"
                ref={quickPhotoInputRef}
                accept="image/*"
                onChange={handleQuickPhotoChange}
                className="hidden"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Habit Photo:
                </span>
                <button
                  type="button"
                  onClick={() => quickPhotoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  <Camera size={13} />
                  <span>Upload / Change Photo</span>
                </button>
              </div>
              <div
                onClick={() => quickPhotoInputRef.current?.click()}
                className="relative aspect-video rounded-[18px] overflow-hidden border border-[var(--line)] cursor-pointer group hover:opacity-95 transition-opacity"
              >
                <img
                  src={quickPhoto}
                  alt="Habit photo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-2">
                  <Camera size={18} />
                  <span>Tap to choose your own photo</span>
                </div>
              </div>
            </div>

            {/* Caption Textarea */}
            <form onSubmit={handleQuickHabitPost} className="space-y-3">
              <textarea
                value={quickCaption}
                onChange={(e) => {
                  setQuickCaption(e.target.value);
                  checkModeration(e.target.value);
                }}
                placeholder="What did you study or do today? E.g. Finished chapter 4 math revision..."
                rows={3}
                className="w-full p-3.5 rounded-[18px] bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] outline-none resize-none focus:border-[var(--primary)]"
              />

              <button
                type="submit"
                disabled={!quickCaption.trim()}
                className="btn-apple w-full py-3 rounded-full text-xs font-bold text-white bg-[var(--primary)] hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs disabled:opacity-40"
              >
                Post to Feed & Save Streak (+25 Pts)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rules / How It Works Sheet */}
      {showHowItWorks && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowHowItWorks(false)}
        >
          <div
            className="relative w-full max-w-md rounded-t-[28px] sm:rounded-[28px] border p-5 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--text)]">Leaderboard & Streak Rules</h3>
              <button
                type="button"
                onClick={() => setShowHowItWorks(false)}
                className="btn-apple p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-[var(--text)]">
              <div className="p-3 rounded-[18px] bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1">
                <strong className="text-[var(--primary)] block">1. Daily Streak Rule</strong>
                <p className="text-[var(--text-muted)]">
                  Post once every single day about your studies, sports, or good habits. If you miss a day, your streak resets.
                </p>
              </div>

              <div className="p-3 rounded-[18px] bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1">
                <strong className="text-amber-500 block">2. Earning Points</strong>
                <p className="text-[var(--text-muted)]">
                  Each valid habit post awards +25 habit points. Highest streak days take the top 1, 2, 3 podium spots!
                </p>
              </div>

              <div className="p-3 rounded-[18px] bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1">
                <strong className="text-emerald-500 block">3. Safety & Respect</strong>
                <p className="text-[var(--text-muted)]">
                  Keep posts clean, inspiring, and respectful for all school classmates.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowItWorks(false)}
              className="btn-apple w-full py-2.5 rounded-full text-xs font-bold text-white bg-[var(--primary)] cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[var(--text)] shadow-lg animate-fade-in pointer-events-none select-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ULTRA-AESTHETIC 1-2-3 PODIUM FOR HABIT STREAKS
// Displays rank 2 on left, rank 1 in center (elevated with crown), rank 3 on right
// ============================================================================
function HabitStreakPodium({
  streaks,
  onOpenPost,
}: {
  streaks: HabitStreak[];
  onOpenPost: () => void;
}) {
  const first = streaks[0] || null;
  const second = streaks[1] || null;
  const third = streaks[2] || null;

  return (
    <div
      className="p-5 rounded-[28px] border shadow-md relative overflow-hidden"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--line)',
      }}
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/10 blur-2xl pointer-events-none" />

      <div className="text-center pb-2 relative z-10">
        <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-center gap-1.5">
          <Trophy size={14} className="text-amber-500" />
          <span>Top Streak Champions</span>
        </span>
      </div>

      {/* Podium Grid (2 - 1 - 3 layout) */}
      <div className="grid grid-cols-3 gap-2.5 items-end pt-5 text-center relative z-10">
        {/* RANK 2 - SILVER (LEFT) */}
        {second ? (
          <Link
            href={`/u/${second.username}`}
            className="btn-apple flex flex-col items-center group cursor-pointer"
          >
            <div className="relative mb-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-slate-300 dark:ring-slate-500 shadow-md group-hover:scale-105 transition-transform"
                style={{
                  backgroundColor: getAvatarColorPair(second.username).bg,
                  color: getAvatarColorPair(second.username).text,
                }}
              >
                {second.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-500 text-slate-900 dark:text-slate-100 text-[10px] font-black flex items-center justify-center ring-2 ring-[var(--surface)] shadow-xs">
                2
              </div>
            </div>
            <p className="text-xs font-bold text-[var(--text)] truncate max-w-[95px]">
              {second.fullName.split(' ')[0]}
            </p>
            <span className="text-[11px] font-extrabold text-orange-500 tabular-nums">
              🔥 {second.streakDays}d
            </span>

            {/* Silver Pedestal Column */}
            <div className="w-full mt-2 h-20 rounded-t-2xl border-t-2 border-x border-slate-300/40 dark:border-slate-500/40 bg-gradient-to-t from-slate-400/25 via-slate-300/10 to-transparent flex flex-col items-center justify-center p-2 shadow-sm">
              <span className="text-xl font-black text-slate-400/80 dark:text-slate-300/70">2</span>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Silver</span>
            </div>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onOpenPost}
            className="btn-apple flex flex-col items-center group cursor-pointer opacity-70 hover:opacity-100"
          >
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-slate-400 mb-2">
              <Plus size={20} />
            </div>
            <p className="text-xs font-bold text-[var(--text-muted)]">Be #2</p>
            <span className="text-[10px] text-[var(--text-muted)]">Post Habit</span>
            <div className="w-full mt-2 h-20 rounded-t-2xl border-t-2 border-x border-dashed border-slate-400/30 flex items-center justify-center">
              <span className="text-xl font-black text-slate-400/40">2</span>
            </div>
          </button>
        )}

        {/* RANK 1 - GOLD (CENTER, ELEVATED) */}
        {first ? (
          <Link
            href={`/u/${first.username}`}
            className="btn-apple flex flex-col items-center group cursor-pointer -translate-y-3"
          >
            {/* Crown */}
            <div className="text-2xl animate-bounce mb-0.5 filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.5)]">
              👑
            </div>
            <div className="relative mb-2">
              <div
                className="w-17 h-17 rounded-full flex items-center justify-center font-black text-base ring-4 ring-amber-400 shadow-xl group-hover:scale-105 transition-transform"
                style={{
                  backgroundColor: getAvatarColorPair(first.username).bg,
                  color: getAvatarColorPair(first.username).text,
                }}
              >
                {first.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 text-xs font-black flex items-center justify-center ring-2 ring-[var(--surface)] shadow-md">
                1
              </div>
            </div>
            <p className="text-xs font-black text-[var(--text)] truncate max-w-[105px]">
              {first.fullName.split(' ')[0]}
            </p>
            <span className="text-xs font-black text-orange-500 tabular-nums">
              🔥 {first.streakDays}d streak
            </span>
            <span className="text-[10px] font-bold text-[var(--text-muted)] tabular-nums">
              ⭐ {first.habitPoints} pts
            </span>

            {/* Gold Pedestal Column */}
            <div className="w-full mt-2 h-28 rounded-t-2xl border-t-2 border-x border-amber-400/60 bg-gradient-to-t from-amber-500/30 via-amber-400/15 to-transparent flex flex-col items-center justify-center p-2 shadow-md">
              <span className="text-2xl font-black text-amber-400">1</span>
              <span className="text-[9px] uppercase tracking-widest font-black text-amber-500">Gold</span>
            </div>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onOpenPost}
            className="btn-apple flex flex-col items-center group cursor-pointer -translate-y-3"
          >
            <div className="text-2xl mb-0.5">👑</div>
            <div className="w-17 h-17 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center text-amber-400 mb-2">
              <Plus size={24} />
            </div>
            <p className="text-xs font-bold text-amber-500">Claim #1</p>
            <span className="text-[10px] text-[var(--text-muted)]">Post First Streak</span>
            <div className="w-full mt-2 h-28 rounded-t-2xl border-t-2 border-x border-dashed border-amber-400/40 flex items-center justify-center">
              <span className="text-2xl font-black text-amber-400/50">1</span>
            </div>
          </button>
        )}

        {/* RANK 3 - BRONZE (RIGHT) */}
        {third ? (
          <Link
            href={`/u/${third.username}`}
            className="btn-apple flex flex-col items-center group cursor-pointer"
          >
            <div className="relative mb-2">
              <div
                className="w-13 h-13 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-orange-600/70 shadow-md group-hover:scale-105 transition-transform"
                style={{
                  backgroundColor: getAvatarColorPair(third.username).bg,
                  color: getAvatarColorPair(third.username).text,
                }}
              >
                {third.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-700 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[var(--surface)] shadow-xs">
                3
              </div>
            </div>
            <p className="text-xs font-bold text-[var(--text)] truncate max-w-[95px]">
              {third.fullName.split(' ')[0]}
            </p>
            <span className="text-[11px] font-extrabold text-orange-500 tabular-nums">
              🔥 {third.streakDays}d
            </span>

            {/* Bronze Pedestal Column */}
            <div className="w-full mt-2 h-16 rounded-t-2xl border-t-2 border-x border-orange-600/40 bg-gradient-to-t from-orange-600/25 via-orange-500/10 to-transparent flex flex-col items-center justify-center p-2 shadow-sm">
              <span className="text-lg font-black text-orange-600/80">3</span>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-orange-600">Bronze</span>
            </div>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onOpenPost}
            className="btn-apple flex flex-col items-center group cursor-pointer opacity-70 hover:opacity-100"
          >
            <div className="w-13 h-13 rounded-full border-2 border-dashed border-orange-500 flex items-center justify-center text-orange-500 mb-2">
              <Plus size={18} />
            </div>
            <p className="text-xs font-bold text-[var(--text-muted)]">Be #3</p>
            <span className="text-[10px] text-[var(--text-muted)]">Post Habit</span>
            <div className="w-full mt-2 h-16 rounded-t-2xl border-t-2 border-x border-dashed border-orange-500/30 flex items-center justify-center">
              <span className="text-lg font-black text-orange-500/40">3</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ULTRA-AESTHETIC 1-2-3 PODIUM FOR STAR BOARD LEADERS
// ============================================================================
function StudentLeaderPodium({
  leaders,
}: {
  leaders: Array<{
    rank: number;
    username: string;
    name: string;
    avatar: string | null;
    class: string;
    followers: number;
    posts: number;
    views: number;
    likes: number;
    comments: number;
    engagementScore: number;
  }>;
}) {
  const first = leaders[0] || null;
  const second = leaders[1] || null;
  const third = leaders[2] || null;

  return (
    <div
      className="p-5 rounded-[28px] border shadow-md relative overflow-hidden"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--line)',
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/10 blur-2xl pointer-events-none" />

      <div className="text-center pb-2 relative z-10">
        <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-center gap-1.5">
          <Crown size={14} className="text-amber-500" />
          <span>Star Board Leaders</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 items-end pt-5 text-center relative z-10">
        {/* RANK 2 - SILVER (LEFT) */}
        {second ? (
          <Link
            href={`/u/${second.username}`}
            className="btn-apple flex flex-col items-center group cursor-pointer"
          >
            <div className="relative mb-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-slate-300 dark:ring-slate-500 shadow-md group-hover:scale-105 transition-transform"
                style={{
                  backgroundColor: getAvatarColorPair(second.username).bg,
                  color: getAvatarColorPair(second.username).text,
                }}
              >
                {second.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-500 text-slate-900 dark:text-slate-100 text-[10px] font-black flex items-center justify-center ring-2 ring-[var(--surface)] shadow-xs">
                2
              </div>
            </div>
            <p className="text-xs font-bold text-[var(--text)] truncate max-w-[95px]">
              {second.name.split(' ')[0]}
            </p>
            <span className="text-[11px] font-extrabold text-pink-500 tabular-nums">
              👥 {second.followers} {second.followers === 1 ? 'follower' : 'followers'}
            </span>
            <span className="text-[10px] font-bold text-[var(--text-muted)] tabular-nums truncate max-w-[95px] block">
              👁️ {second.views}v · ❤️ {second.likes} · 📸 {second.posts}
            </span>

            {/* Silver Pedestal Column */}
            <div className="w-full mt-2 h-20 rounded-t-2xl border-t-2 border-x border-slate-300/40 dark:border-slate-500/40 bg-gradient-to-t from-slate-400/25 via-slate-300/10 to-transparent flex flex-col items-center justify-center p-2 shadow-sm">
              <span className="text-xl font-black text-slate-400/80 dark:text-slate-300/70">2</span>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Silver</span>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col items-center opacity-60">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-slate-400 mb-2">
              2
            </div>
            <p className="text-xs font-bold text-[var(--text-muted)]">Spot #2 Open</p>
            <p className="text-[10px] text-[var(--text-muted)]">Gain followers</p>
            <div className="w-full mt-2 h-20 rounded-t-2xl border-t-2 border-x border-dashed border-slate-400/30 flex items-center justify-center">
              <span className="text-xl font-black text-slate-400/30">2</span>
            </div>
          </div>
        )}

        {/* RANK 1 - GOLD (CENTER, ELEVATED) */}
        {first ? (
          <Link
            href={`/u/${first.username}`}
            className="btn-apple flex flex-col items-center group cursor-pointer -translate-y-3"
          >
            <div className="text-2xl animate-bounce mb-0.5 filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.5)]">
              👑
            </div>
            <div className="relative mb-2">
              <div
                className="w-17 h-17 rounded-full flex items-center justify-center font-black text-base ring-4 ring-amber-400 shadow-xl group-hover:scale-105 transition-transform"
                style={{
                  backgroundColor: getAvatarColorPair(first.username).bg,
                  color: getAvatarColorPair(first.username).text,
                }}
              >
                {first.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 text-xs font-black flex items-center justify-center ring-2 ring-[var(--surface)] shadow-md">
                1
              </div>
            </div>
            <p className="text-xs font-black text-[var(--text)] truncate max-w-[105px]">
              {first.name.split(' ')[0]}
            </p>
            <span className="text-xs font-black text-pink-500 tabular-nums">
              👥 {first.followers} {first.followers === 1 ? 'follower' : 'followers'}
            </span>
            <span className="text-[10px] font-bold text-[var(--text-muted)] tabular-nums block">
              👁️ {first.views} views · ❤️ {first.likes} · 📸 {first.posts}
            </span>

            {/* Gold Pedestal Column */}
            <div className="w-full mt-2 h-28 rounded-t-2xl border-t-2 border-x border-amber-400/60 bg-gradient-to-t from-amber-500/30 via-amber-400/15 to-transparent flex flex-col items-center justify-center p-2 shadow-md">
              <span className="text-2xl font-black text-amber-400">1</span>
              <span className="text-[9px] uppercase tracking-widest font-black text-amber-500">Gold</span>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col items-center -translate-y-3 opacity-60">
            <div className="text-2xl mb-0.5">👑</div>
            <div className="w-17 h-17 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center text-amber-400 mb-2">
              1
            </div>
            <p className="text-xs font-bold text-amber-500">Spot #1 Open</p>
            <p className="text-[10px] text-[var(--text-muted)]">Top student spot</p>
            <div className="w-full mt-2 h-28 rounded-t-2xl border-t-2 border-x border-dashed border-amber-400/30 flex items-center justify-center">
              <span className="text-2xl font-black text-amber-400/40">1</span>
            </div>
          </div>
        )}

        {/* RANK 3 - BRONZE (RIGHT) */}
        {third ? (
          <Link
            href={`/u/${third.username}`}
            className="btn-apple flex flex-col items-center group cursor-pointer"
          >
            <div className="relative mb-2">
              <div
                className="w-13 h-13 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-orange-600/70 shadow-md group-hover:scale-105 transition-transform"
                style={{
                  backgroundColor: getAvatarColorPair(third.username).bg,
                  color: getAvatarColorPair(third.username).text,
                }}
              >
                {third.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-700 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[var(--surface)] shadow-xs">
                3
              </div>
            </div>
            <p className="text-xs font-bold text-[var(--text)] truncate max-w-[95px]">
              {third.name.split(' ')[0]}
            </p>
            <span className="text-[11px] font-extrabold text-pink-500 tabular-nums">
              👥 {third.followers} {third.followers === 1 ? 'follower' : 'followers'}
            </span>
            <span className="text-[10px] font-bold text-[var(--text-muted)] tabular-nums truncate max-w-[95px] block">
              👁️ {third.views}v · ❤️ {third.likes} · 📸 {third.posts}
            </span>

            {/* Bronze Pedestal Column */}
            <div className="w-full mt-2 h-16 rounded-t-2xl border-t-2 border-x border-orange-600/40 bg-gradient-to-t from-orange-600/25 via-orange-500/10 to-transparent flex flex-col items-center justify-center p-2 shadow-sm">
              <span className="text-lg font-black text-orange-600/80">3</span>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-orange-600">Bronze</span>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col items-center opacity-60">
            <div className="w-13 h-13 rounded-full border-2 border-dashed border-orange-500 flex items-center justify-center text-orange-500 mb-2">
              3
            </div>
            <p className="text-xs font-bold text-[var(--text-muted)]">Spot #3 Open</p>
            <p className="text-[10px] text-[var(--text-muted)]">Gain followers</p>
            <div className="w-full mt-2 h-16 rounded-t-2xl border-t-2 border-x border-dashed border-orange-500/30 flex items-center justify-center">
              <span className="text-lg font-black text-orange-500/30">3</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
